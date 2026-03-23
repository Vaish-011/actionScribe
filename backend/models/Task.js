const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meeting",
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  owner: String,

  deadline: Date,

  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },

  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "blocked"],
    default: "pending"
  },

  completed: {
    type: Boolean,
    default: false
  },

  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);