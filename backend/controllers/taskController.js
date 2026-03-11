const Task = require("../models/Task");

exports.getAllTasks = async (req, res) => {
  try {

    const tasks = await Task.find().populate("meetingId");

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.markTaskCompleted = async (req, res) => {
  try {

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    );

    res.json(task);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getTasksByMeeting = async (req, res) => {
  try {

    const tasks = await Task.find({
      meetingId: req.params.meetingId
    });

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};