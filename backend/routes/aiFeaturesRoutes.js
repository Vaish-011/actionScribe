const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateFollowUp,
  chatWithMeeting,
  searchMeetings,
  getInsights,
  exportTasksCsv
} = require("../controllers/aiFeaturesController");

router.get("/search", authMiddleware, searchMeetings);
router.get("/insights", authMiddleware, getInsights);
router.post("/follow-up/:taskId", authMiddleware, generateFollowUp);
router.post("/chat/:meetingId", authMiddleware, chatWithMeeting);
router.get("/export/tasks.csv", authMiddleware, exportTasksCsv);

module.exports = router;