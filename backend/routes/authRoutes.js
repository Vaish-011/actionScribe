const express = require("express");
const router = express.Router();

const {
	signup,
	login,
	googleAuth,
	googleAuthCallback
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

module.exports = router;