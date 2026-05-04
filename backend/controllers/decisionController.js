const Decision = require("../models/Decision");
const Meeting = require("../models/Meeting");
const Task = require("../models/Task");

exports.createDecision = async (req, res) => {
  try {
    const { meetingId, decision, context, participants } = req.body;
    if (!meetingId || !decision) return res.status(400).json({ message: "meetingId and decision required" });

    const dec = await Decision.create({
      meeting: meetingId,
      decision,
      context,
      participants,
      createdBy: req.userId
    });

    await Meeting.findByIdAndUpdate(meetingId, { $push: { decisions: dec._id } });

    res.json(dec);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDecisionsByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const decisions = await Decision.find({ meeting: meetingId })
      .populate("createdBy", "name email")
      .populate("relatedTasks");
    res.json(decisions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { updates, changedBy, reason } = req.body;
    const decision = await Decision.findById(id);
    if (!decision) return res.status(404).json({ message: "Decision not found" });

    const oldValue = decision.toObject();
    Object.keys(updates || {}).forEach(k => {
      decision[k] = updates[k];
    });

    decision.changeHistory.push({
      changedAt: new Date(),
      changedBy: changedBy || req.userId,
      reason,
      oldValue,
      newValue: updates
    });

    await decision.save();
    res.json(decision);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDecisionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const decision = await Decision.findById(id).populate("changeHistory.changedBy", "name email");
    if (!decision) return res.status(404).json({ message: "Decision not found" });
    res.json(decision.changeHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.linkTask = async (req, res) => {
  try {
    const { id } = req.params; // decision id
    const { taskId } = req.body;
    const decision = await Decision.findById(id);
    if (!decision) return res.status(404).json({ message: "Decision not found" });

    if (taskId) {
      decision.relatedTasks.push(taskId);
      await decision.save();
      // optionally update the Task to reference the decision (if such field exists)
      res.json(decision);
    } else {
      res.status(400).json({ message: "taskId required" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.findPotentialConflicts = async (req, res) => {
  try {
    const { meetingId } = req.params;
    // For now, return other decisions in the same meeting for manual inspection.
    const decisions = await Decision.find({ meeting: meetingId }).sort({ createdAt: 1 });
    res.json({ decisions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
