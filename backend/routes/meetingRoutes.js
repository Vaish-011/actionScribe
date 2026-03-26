const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createMeeting,
  getMeetings,
  getMeetingById,
  uploadMeeting,
  uploadMeetingFile,
  deleteMeeting
} = require("../controllers/meetingController");

router.post("/create", authMiddleware, createMeeting);

router.get("/", authMiddleware, getMeetings);
router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    uploadMeeting.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "File upload failed" });
      }
      next();
    });
  },
  uploadMeetingFile
);

router.get("/:id", authMiddleware, getMeetingById);

router.delete("/:id", authMiddleware, deleteMeeting);

module.exports = router;