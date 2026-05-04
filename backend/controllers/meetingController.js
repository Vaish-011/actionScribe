const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  generateSummary,
  extractTasks,
  extractDecisions,
  extractTopics,
  transcribeAudio
} = require("../services/aiService");
const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const { ensureUserOrganizationById } = require("../services/organizationBootstrapService");
const {
  getAccessContext,
  buildMeetingFilter,
  buildTaskFilter
} = require("../services/accessScopeService");

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav"
]);

exports.uploadMeeting = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Unsupported file type"));
  }
});

const parseArrayFromAi = (raw) => {
  try {
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const getCurrentUserWithOrg = async (userId) => {
  const user = await ensureUserOrganizationById(userId);
  if (!user || !user.organization) {
    return null;
  }
  return user;
};

const createTasksFromAi = async ({ tasks, meetingId, organization }) => {
  const created = [];
  for (const t of tasks) {
    const title = t.title || t.task || "Action Item";
    const deadline = t.deadline ? new Date(t.deadline) : null;
    const savedTask = await Task.create({
      meetingId,
      title,
      description: t.description || title,
      owner: t.owner || "Unassigned",
      deadline: Number.isNaN(deadline?.getTime()) ? null : deadline,
      organization
    });
    created.push(savedTask);
  }
  return created;
};

const cleanupUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const runAiMeetingPipeline = async (transcript) => {
  const [summary, tasksRaw, decisionsRaw, topicsRaw] = await Promise.all([
    generateSummary(transcript),
    extractTasks(transcript),
    extractDecisions(transcript),
    extractTopics(transcript)
  ]);

  return {
    summary,
    tasks: parseArrayFromAi(tasksRaw),
    decisions: parseArrayFromAi(decisionsRaw),
    topics: parseArrayFromAi(topicsRaw)
  };
};

exports.createMeeting = async (req, res) => {
  try {
    const { title, transcript, participants = [] } = req.body;
    if (!title || !transcript) {
      return res.status(400).json({ error: "Title and transcript are required" });
    }

    const user = await getCurrentUserWithOrg(req.userId);
    if (!user) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const aiOutput = await runAiMeetingPipeline(transcript);

    const meeting = await Meeting.create({
      title,
      transcript,
      summary: aiOutput.summary,
      decisions: aiOutput.decisions,
      topics: aiOutput.topics,
      participants,
      organization: user.organization,
      createdBy: req.userId
    });

    const createdTasks = await createTasksFromAi({
      tasks: aiOutput.tasks,
      meetingId: meeting._id,
      organization: user.organization
    });

    res.status(201).json({
      message: "Meeting created and processed",
      meeting,
      tasks: createdTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadMeetingFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await getCurrentUserWithOrg(req.userId);
    if (!user) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const mimetype = req.file.mimetype || "";
    const fileExt = path.extname(req.file.originalname || "").toLowerCase();
    const isWhitelistedMpeg = mimetype === "video/mpeg" && [".mpeg", ".mpg"].includes(fileExt);
    const isAudio = mimetype.startsWith("audio/") || isWhitelistedMpeg;
    const isPlainText = mimetype === "text/plain" || fileExt === ".txt";

    if (mimetype.startsWith("video/") && !isWhitelistedMpeg) {
      return res.status(400).json({
        error: "Video files are not processed yet. Upload an audio file (MP3, WAV, M4A, or WhatsApp .mpeg audio) or a .txt transcript instead."
      });
    }

    if (isAudio) {
      const audioFile = new File(
        [req.file.buffer],
        req.file.originalname,
        { type: mimetype || "application/octet-stream" }
      );
      const transcript = await transcribeAudio(audioFile);
      const aiOutput = await runAiMeetingPipeline(transcript);

      const meeting = await Meeting.create({
        title: req.body.title || path.parse(req.file.originalname).name,
        transcript,
        summary: aiOutput.summary,
        decisions: aiOutput.decisions,
        topics: aiOutput.topics,
        organization: user.organization,
        createdBy: req.userId,
        audioFile: null
      });

      const createdTasks = await createTasksFromAi({
        tasks: aiOutput.tasks,
        meetingId: meeting._id,
        organization: user.organization
      });

      return res.status(201).json({
        message: "Audio uploaded and processed",
        meeting,
        tasks: createdTasks
      });
    }

    if (!isPlainText) {
      const meeting = await Meeting.create({
        title: req.body.title || path.parse(req.file.originalname).name,
        transcript: "Document uploaded. Text extraction pending parser integration.",
        summary: "Document uploaded successfully. Text extraction is pending configuration.",
        decisions: [],
        topics: [],
        organization: user.organization,
        createdBy: req.userId,
        audioFile: null
      });

      return res.status(202).json({
        message: "Document uploaded. Text extraction is not configured yet, so no tasks were extracted.",
        meeting,
        tasks: []
      });
    }

    const rawText = req.file.buffer.toString("utf8");
    const aiOutput = await runAiMeetingPipeline(rawText);

    const meeting = await Meeting.create({
      title: req.body.title || path.parse(req.file.originalname).name,
      transcript: rawText,
      summary: aiOutput.summary,
      decisions: aiOutput.decisions,
      topics: aiOutput.topics,
      organization: user.organization,
      createdBy: req.userId,
      audioFile: null
    });

    const createdTasks = await createTasksFromAi({
      tasks: aiOutput.tasks,
      meetingId: meeting._id,
      organization: user.organization
    });

    // Keep audio file path for later playback. Cleanup only text-like uploads.
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      message: "Meeting uploaded and processed",
      meeting,
      tasks: createdTasks
    });
  } catch (error) {
    const message = error?.message || "Internal server error";
    const statusCode = /unsupported|invalid|failed to fetch|transcription/i.test(message) ? 400 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meetings = await Meeting.find(buildMeetingFilter(context))
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meeting = await Meeting.findOne(
      buildMeetingFilter(context, { _id: req.params.id })
    ).populate("createdBy", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const tasks = await Task.find(
      buildTaskFilter(context, [meeting._id], { meetingId: meeting._id })
    ).sort({ createdAt: -1 });

    res.json({ ...meeting.toObject(), tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meeting = await Meeting.findOne(
      buildMeetingFilter(context, { _id: req.params.id })
    );

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Delete audio file if it exists
    if (meeting.audioFile && fs.existsSync(meeting.audioFile)) {
      try {
        fs.unlinkSync(meeting.audioFile);
      } catch (unlinkError) {
        console.warn(`Warning: Could not delete audio file ${meeting.audioFile}`, unlinkError.message);
      }
    }

    // Delete all tasks associated with this meeting
    await Task.deleteMany({ meetingId: meeting._id });

    // Delete the meeting
    await Meeting.deleteOne({ _id: meeting._id });

    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};