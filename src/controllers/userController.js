const User = require("../models/User");
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "employee",
      team: req.user.id,
    });

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

// ================= PROFILE UPLOAD (CLOUDINARY FINAL FIX) =================
const uploadProfile = async (req, res) => {
  try {
    console.log("🔥 CLOUDINARY UPLOAD HIT");

    // ❌ file check
    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    // ❌ auth check
    if (!req.user || !req.user.id) {
      console.log("❌ Auth failed");
      return res.status(401).json({
        message: "User not authorized",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ✅ VERY IMPORTANT (Cloudinary URL)
    if (!req.file || !req.file.path) {
      console.log("❌ Cloudinary path missing:", req.file);
      return res.status(500).json({
        message: "Cloudinary upload failed",
      });
    }

    user.profileUrl = req.file.path;

    await user.save();

    console.log("✅ Profile Updated:", user.profileUrl);

    return res.status(200).json({
      message: "Profile updated successfully",
      profileUrl: user.profileUrl,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    return res.status(500).json({
      message: "Upload failed",
    });
  }
};

// ================= GET TEAM =================
const getTeamMembers = async (req, res) => {
  try {
    let managerId;

    if (req.user.role === "manager") {
      managerId = req.user.id;
    } else {
      const user = await User.findById(req.user.id);
      managerId = user.team;
    }

    const employees = await User.find({
      team: managerId,
    }).select("-password");

    const manager = await User.findById(managerId).select("-password");

    const teamMembers = manager
      ? [
          manager,
          ...employees.filter(
            (e) => e._id.toString() !== manager._id.toString(),
          ),
        ]
      : employees;

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
    const employees = await User.find({
      team: req.user.id,
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
