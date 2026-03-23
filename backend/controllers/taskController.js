const Task = require("../models/Task");
const { ensureUserOrganizationById } = require("../services/organizationBootstrapService");

const getUserOrg = async (userId) => {
  const user = await ensureUserOrganizationById(userId);
  return user?.organization || null;
};

exports.getAllTasks = async (req, res) => {
  try {
    const organization = await getUserOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const tasks = await Task.find({ organization })
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
    const organization = await getUserOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, organization },
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

    const organization = await getUserOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, organization },
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

exports.getTasksByMeeting = async (req, res) => {
  try {
    const organization = await getUserOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const tasks = await Task.find({
      meetingId: req.params.meetingId,
      organization
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { assignedTo, owner } = req.body;
    const organization = await getUserOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, organization },
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