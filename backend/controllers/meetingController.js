const { generateSummary } = require("../services/aiService");
const Meeting = require("../models/Meeting");

exports.createMeeting = async (req, res) => {
  try {

    const { title, transcript } = req.body;
    const summary = await generateSummary(transcript);

    const meeting = new Meeting({
      title,
      transcript,
      summary,
      createdBy: req.userId
    });

    await meeting.save();

    res.status(201).json({
      message: "Meeting created with AI summary",
      meeting
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getMeetings = async (req, res) => {
  try {

    const meetings = await Meeting.find({
      createdBy: req.userId
    }).sort({ createdAt: -1 });

    res.json(meetings);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMeetingById = async (req, res) => {
  try {

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found"
      });
    }

    res.json(meeting);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};