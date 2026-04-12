const express = require("express");
const router = express.Router();

const { createTeam, getTeams } = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");
const { managerOnly } = require("../middleware/roleMiddleware");

router.post("/", protect, managerOnly, createTeam);
router.get("/", protect, getTeams);

module.exports = router;