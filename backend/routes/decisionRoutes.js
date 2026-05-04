const express = require("express");
const router = express.Router();
const decisionController = require("../controllers/decisionController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", decisionController.createDecision);
router.get("/meeting/:meetingId", decisionController.getDecisionsByMeeting);
router.get("/meeting/:meetingId/conflicts", decisionController.findPotentialConflicts);
router.patch("/:id", decisionController.updateDecision);
router.get("/:id/history", decisionController.getDecisionHistory);
router.post("/:id/link-task", decisionController.linkTask);

module.exports = router;
