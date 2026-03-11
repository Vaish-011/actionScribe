const express = require("express");
const router = express.Router();

const {
  getAllTasks,
  markTaskCompleted,
  getTasksByMeeting
} = require("../controllers/taskController");

router.get("/", getAllTasks);

router.patch("/:id/complete", markTaskCompleted);

router.get("/meeting/:meetingId", getTasksByMeeting);

module.exports = router;