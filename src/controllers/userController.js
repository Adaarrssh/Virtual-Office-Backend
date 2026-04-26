const User = require("../models/User");
const Team = require("../models/Team");
const bcrypt = require("bcryptjs");

// ================= CREATE EMPLOYEE =================
const createEmployee = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        message: "Name and password are required",
      });
    }

    const cleanName = name.toLowerCase().replace(/\s+/g, "");
    const random = Math.floor(100 + Math.random() * 900);
    const email = `${cleanName}${random}@company.com`;

    const manager = await User.findById(req.user.id);

    if (!manager || manager.role !== "manager") {
      return res.status(403).json({
        message: "Only manager can create employees",
      });
    }

    // 🔥 FIX: agar manager ke paas team nahi hai to auto create kar
    let team = null;

    if (!manager.team) {
      team = await Team.create({
        name: `${manager.name}'s Team`,
        manager: manager._id,
        members: [],
      });

      manager.team = team._id;
      await manager.save();
    } else {
      team = await Team.findById(manager.team);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "employee",
      team: team._id,
    });

    // 🔥 SAFE PUSH (duplicate avoid)
    if (!team.members.includes(newEmployee._id)) {
      team.members.push(newEmployee._id);
      await team.save();
    }

    return res.status(201).json({
      message: "Employee created successfully",
      email: newEmployee.email,
    });
  } catch (error) {
    console.error("❌ Create Employee Error:", error);
    return res.status(500).json({
      message: "Server error while creating employee",
    });
  }
};

// ================= PROFILE UPLOAD =================
const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file.path) {
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }

    user.profileUrl = req.file.path;
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      profileUrl: user.profileUrl,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

// ================= GET TEAM =================
const getTeamMembers = async (req, res) => {
  try {
    let manager;

    if (req.user.role === "manager") {
      manager = await User.findById(req.user.id);
    } else {
      const user = await User.findById(req.user.id);
      manager = await User.findById(user.team);
    }

    if (!manager || !manager.team) {
      return res.status(200).json([]);
    }

    const employees = await User.find({
      team: manager.team,
      role: "employee",
    }).select("-password");

    const managerData = await User.findById(manager._id).select("-password");

    const teamMembers = managerData ? [managerData, ...employees] : employees;

    return res.status(200).json(teamMembers);
  } catch (error) {
    console.error("❌ Get Team Error:", error);
    return res.status(500).json({
      message: "Error fetching team members",
    });
  }
};

// ================= GET ME =================
const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Get Me Error:", error);
    return res.status(500).json({
      message: "Error fetching user",
    });
  }
};

// ================= GET ALL EMPLOYEES =================
const getAllEmployees = async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);

    if (!manager || !manager.team) {
      return res.status(200).json([]);
    }

    const employees = await User.find({
      team: manager.team,
      role: "employee",
    }).select("-password");

    return res.status(200).json(employees);
  } catch (error) {
    console.error("❌ Get Employees Error:", error);
    return res.status(500).json({
      message: "Error fetching employees",
    });
  }
};

// ================= GET USER BY ID =================
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Get User By ID Error:", error);
    return res.status(500).json({
      message: "Error fetching user",
    });
  }
};

module.exports = {
  createEmployee,
  uploadProfile,
  getTeamMembers,
  getMe,
  getAllEmployees,
  getUserById,
};
