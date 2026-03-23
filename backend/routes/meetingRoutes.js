const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createMeeting,
  getMeetings,
  getMeetingById,
  uploadMeeting,
  uploadMeetingFile
} = require("../controllers/meetingController");

router.post("/create", authMiddleware, createMeeting);

router.get("/", authMiddleware, getMeetings);
router.post("/upload", authMiddleware, uploadMeeting.single("file"), uploadMeetingFile);

router.get("/:id", authMiddleware, getMeetingById);

module.exports = router;