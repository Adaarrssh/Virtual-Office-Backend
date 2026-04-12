const express = require("express");
const router = express.Router();

const {
  createMeeting,
  getMeetings,
  deleteMeeting,
} = require("../controllers/meetingController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createMeeting);
router.get("/", protect, getMeetings);
router.delete("/:id", protect, deleteMeeting);

module.exports = router;
