const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createMeeting,
  getMeetings,
  getMeetingById
} = require("../controllers/meetingController");

router.post("/create", authMiddleware, createMeeting);

router.get("/", authMiddleware, getMeetings);

router.get("/:id", authMiddleware, getMeetingById);

module.exports = router;