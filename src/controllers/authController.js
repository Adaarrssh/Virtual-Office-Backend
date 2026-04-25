const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔥 CHECK USER
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔥 CHECK PASSWORD
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔥 GENERATE TOKEN
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 🔥 SEND CLEAN STRUCTURE (IMPORTANT FIX)
    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileUrl: user.profileUrl || "",
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return res.status(500).json({
      message: "Server error during login",
    });
  }
};
