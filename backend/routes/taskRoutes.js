const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const {
  getAllTasks,
  markTaskCompleted,
  getTasksByMeeting,
  updateTaskStatus,
  assignTask
} = require("../controllers/taskController");

router.get("/", authMiddleware, getAllTasks);

router.patch("/:id/complete", authMiddleware, markTaskCompleted);
router.patch("/:id/status", authMiddleware, updateTaskStatus);
router.patch("/:id/assign", authMiddleware, allowRoles("admin", "manager"), assignTask);

router.get("/meeting/:meetingId", authMiddleware, getTasksByMeeting);

module.exports = router;