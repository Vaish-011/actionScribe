const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateFollowUp,
  chatWithMeeting,
  chatWithOrgMemory,
  getKnowledgeGraph,
  searchMeetings,
  getInsights,
  exportTasksCsv
} = require("../controllers/aiFeaturesController");

router.get("/search", authMiddleware, searchMeetings);
router.get("/insights", authMiddleware, getInsights);
router.get("/knowledge-graph", authMiddleware, getKnowledgeGraph);
router.post("/follow-up/:taskId", authMiddleware, generateFollowUp);
router.post("/chat/:meetingId", authMiddleware, chatWithMeeting);
router.post("/memory-chat", authMiddleware, chatWithOrgMemory);
router.get("/export/tasks.csv", authMiddleware, exportTasksCsv);

module.exports = router;