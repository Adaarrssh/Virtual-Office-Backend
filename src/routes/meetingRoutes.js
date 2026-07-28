const express = require("express");
const router = express.Router();

const {
  createMeeting,
  getMeetings,
  deleteMeeting,
  endMeeting,
} = require("../controllers/meetingController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createMeeting);
router.get("/", protect, getMeetings);
router.delete("/:id", protect, deleteMeeting);
router.patch("/:id/end", protect, endMeeting);

module.exports = router;
