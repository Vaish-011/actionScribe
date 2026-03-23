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

  decisions: [{
    decision: String,
    context: String
  }],

  topics: [{
    title: String,
    content: String,
    startTime: String,
    endTime: String
  }],

  participants: [{
    name: String,
    email: String
  }],

  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  audioFile: {
    type: String
  },

  duration: {
    type: Number
  },

  meetingDate: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Meeting", MeetingSchema);