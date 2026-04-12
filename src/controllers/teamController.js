const Team = require("../models/Team");

exports.createTeam = async (req, res) => {
  const team = await Team.create({
    name: req.body.name,
    manager: req.user.id
  });
  res.status(201).json(team);
};

exports.getTeams = async (req, res) => {
  const teams = await Team.find().populate("manager", "name email");
  res.json(teams);
};