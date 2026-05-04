const mongoose = require("mongoose");

const ChangeHistorySchema = new mongoose.Schema({
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reason: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed
});

const ParticipantSchema = new mongoose.Schema({
  name: String,
  email: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

const DecisionSchema = new mongoose.Schema({
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meeting",
    required: true
  },
  decision: {
    type: String,
    required: true
  },
  context: String,
  status: {
    type: String,
    enum: ["proposed", "accepted", "rejected", "deferred"],
    default: "accepted"
  },
  participants: [ParticipantSchema],
  relatedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  changeHistory: [ChangeHistorySchema]
});

module.exports = mongoose.model("Decision", DecisionSchema);
