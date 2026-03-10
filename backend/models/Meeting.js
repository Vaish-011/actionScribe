const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  transcript: {
    type: String,
    required: true
  },

  summary: {
    type: String,
    default: ""
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Meeting", MeetingSchema);