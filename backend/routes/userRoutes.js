const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    userId: req.userId
  });
});

module.exports = router;