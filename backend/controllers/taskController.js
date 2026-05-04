const Task = require("../models/Task");
const Meeting = require("../models/Meeting");
const {
  getAccessContext,
  buildMeetingFilter,
  buildTaskFilter
} = require("../services/accessScopeService");

exports.getAllTasks = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const memberMeetingIds = (await Meeting.find(buildMeetingFilter(context)).select("_id"))
      .map((m) => m._id);

    const tasks = await Task.find(buildTaskFilter(context, memberMeetingIds))
      .populate("meetingId", "title meetingDate")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markTaskCompleted = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const memberMeetingIds = (await Meeting.find(buildMeetingFilter(context)).select("_id"))
      .map((m) => m._id);

    const task = await Task.findOneAndUpdate(
      buildTaskFilter(context, memberMeetingIds, { _id: req.params.id }),
      { completed: true, status: "completed" },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "in-progress", "completed", "blocked"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const memberMeetingIds = (await Meeting.find(buildMeetingFilter(context)).select("_id"))
      .map((m) => m._id);

    const task = await Task.findOneAndUpdate(
      buildTaskFilter(context, memberMeetingIds, { _id: req.params.id }),
      { status, completed: status === "completed" },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaskDetails = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const memberMeetingIds = (await Meeting.find(buildMeetingFilter(context)).select("_id"))
      .map((m) => m._id);

    const validStatuses = ["pending", "in-progress", "completed", "blocked"];
    const validPriorities = ["low", "medium", "high", "urgent"];

    const updates = {};
    const { title, description, owner, priority, status, deadline } = req.body;

    if (typeof title === "string") {
      updates.title = title.trim();
    }

    if (typeof description === "string") {
      updates.description = description.trim();
    }

    if (typeof owner === "string") {
      updates.owner = owner.trim();
    }

    if (typeof priority === "string") {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }
      updates.priority = priority;
    }

    if (typeof status === "string") {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      updates.status = status;
      updates.completed = status === "completed";
    }

    if (deadline !== undefined) {
      const parsedDeadline = deadline ? new Date(deadline) : null;
      if (parsedDeadline && Number.isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ error: "Invalid deadline" });
      }
      updates.deadline = parsedDeadline;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No task fields provided" });
    }

    const task = await Task.findOneAndUpdate(
      buildTaskFilter(context, memberMeetingIds, { _id: req.params.id }),
      updates,
      { returnDocument: "after" }
    ).populate("meetingId", "title meetingDate").populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTasksByMeeting = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meeting = await Meeting.findOne(
      buildMeetingFilter(context, { _id: req.params.meetingId })
    );

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const tasks = await Task.find(
      buildTaskFilter(context, [meeting._id], { meetingId: req.params.meetingId })
    ).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { assignedTo, owner } = req.body;
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const memberMeetingIds = (await Meeting.find(buildMeetingFilter(context)).select("_id"))
      .map((m) => m._id);

    const task = await Task.findOneAndUpdate(
      buildTaskFilter(context, memberMeetingIds, { _id: req.params.id }),
      { assignedTo: assignedTo || null, owner: owner || "Unassigned" },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};