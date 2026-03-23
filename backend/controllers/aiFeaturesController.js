const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const { ensureUserOrganizationById } = require("../services/organizationBootstrapService");
const {
  generateFollowUpMessage,
  answerMeetingQuestion
} = require("../services/aiService");

const getOrg = async (userId) => {
  const user = await ensureUserOrganizationById(userId);
  return user?.organization || null;
};

exports.generateFollowUp = async (req, res) => {
  try {
    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const task = await Task.findOne({ _id: req.params.taskId, organization }).populate("meetingId", "summary");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const message = await generateFollowUpMessage({
      assignee: task.owner || "Team member",
      taskTitle: task.title,
      deadline: task.deadline,
      meetingSummary: task.meetingId?.summary || ""
    });

    res.json({ taskId: task._id, followUpMessage: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.chatWithMeeting = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meeting = await Meeting.findOne({ _id: req.params.meetingId, organization });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const answer = await answerMeetingQuestion({
      transcript: meeting.transcript,
      summary: meeting.summary,
      question
    });

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchMeetings = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query is required" });
    }

    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const regex = new RegExp(q, "i");
    const meetings = await Meeting.find({
      organization,
      $or: [
        { title: regex },
        { transcript: regex },
        { summary: regex }
      ]
    }).select("title meetingDate participants summary topics").limit(20);

    res.json({ results: meetings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const tasks = await Task.find({ organization });
    const overdueTasks = tasks.filter(
      (task) => task.deadline && task.status !== "completed" && new Date(task.deadline) < new Date()
    );

    const assigneeCounts = {};
    for (const task of tasks) {
      const person = task.owner || "Unassigned";
      assigneeCounts[person] = (assigneeCounts[person] || 0) + 1;
    }

    const mostAssigned = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1])[0] || ["None", 0];
    const completionRate = tasks.length ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100) : 0;

    res.json({
      frequentTasks: { mostAssignedPerson: mostAssigned[0], totalAssigned: mostAssigned[1] },
      delayedTasks: overdueTasks.map((task) => ({ id: task._id, title: task.title, owner: task.owner })),
      productivityScore: completionRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportTasksCsv = async (req, res) => {
  try {
    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const tasks = await Task.find({ organization }).populate("meetingId", "title");
    const rows = ["Task Title,Owner,Deadline,Priority,Status,Meeting"];
    for (const task of tasks) {
      rows.push([
        `"${(task.title || "").replace(/"/g, '""')}"`,
        `"${(task.owner || "").replace(/"/g, '""')}"`,
        `"${task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""}"`,
        `"${task.priority || ""}"`,
        `"${task.status || ""}"`,
        `"${(task.meetingId?.title || "").replace(/"/g, '""')}"`
      ].join(","));
    }

    const csv = rows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=tasks-export.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};