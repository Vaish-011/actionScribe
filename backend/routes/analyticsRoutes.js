const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getTeamDashboard } = require("../controllers/analyticsController");

router.get("/dashboard", authMiddleware, getTeamDashboard);

module.exports = router;