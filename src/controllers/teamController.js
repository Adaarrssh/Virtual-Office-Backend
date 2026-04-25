const Team = require("../models/Team");
const User = require("../models/User"); // ✅ ADD

exports.createTeam = async (req, res) => {
  try {
    const existingTeam = await Team.findOne({ manager: req.user.id });

    if (existingTeam) {
      return res.status(400).json({
        message: "Team already exists",
      });
    }

    const team = await Team.create({
      name: req.body.name,
      manager: req.user.id,
      members: [], // ✅ IMPORTANT
    });

    // ✅ LINK TEAM TO MANAGER
    await User.findByIdAndUpdate(req.user.id, {
      team: team._id,
    });

    res.status(201).json(team);
  } catch (err) {
    console.error("❌ Create Team Error:", err);
    res.status(500).json({
      message: "Error creating team",
    });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ manager: req.user.id }) // ✅ FILTER FIX
      .populate("manager", "name email")
      .populate("members", "name email"); // ✅ ADD

    res.json(teams);
  } catch (err) {
    console.error("❌ Get Teams Error:", err);
    res.status(500).json({
      message: "Error fetching teams",
    });
  }
};
