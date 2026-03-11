const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meeting"
  },
  task: {
    type: String,
    required: true
  },
  owner: String,
  deadline: String,
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);