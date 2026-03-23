const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  generateSummary,
  extractTasks,
  extractDecisions,
  extractTopics
} = require("../services/aiService");
const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const { ensureUserOrganizationById } = require("../services/organizationBootstrapService");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
});

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

    const isAudio = req.file.mimetype.startsWith("audio/");
    const isPlainText = req.file.mimetype === "text/plain";
    const rawText = isAudio
      ? `Transcription placeholder for uploaded file ${req.file.originalname}`
      : isPlainText
        ? fs.readFileSync(req.file.path, "utf8")
        : `Document extraction placeholder for uploaded file ${req.file.originalname}`;

    const aiOutput = await runAiMeetingPipeline(rawText);

    const meeting = await Meeting.create({
      title: req.body.title || path.parse(req.file.originalname).name,
      transcript: rawText,
      summary: aiOutput.summary,
      decisions: aiOutput.decisions,
      topics: aiOutput.topics,
      organization: user.organization,
      createdBy: req.userId,
      audioFile: isAudio ? req.file.path : null
    });

    const createdTasks = await createTasksFromAi({
      tasks: aiOutput.tasks,
      meetingId: meeting._id,
      organization: user.organization
    });

    // Keep audio file path for later playback. Cleanup only text-like uploads.
    if (!isAudio) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      message: "Meeting uploaded and processed",
      meeting,
      tasks: createdTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const user = await getCurrentUserWithOrg(req.userId);
    if (!user) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meetings = await Meeting.find({ organization: user.organization })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const user = await getCurrentUserWithOrg(req.userId);
    if (!user) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      organization: user.organization
    }).populate("createdBy", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const tasks = await Task.find({ meetingId: meeting._id }).sort({ createdAt: -1 });
    res.json({ ...meeting.toObject(), tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};