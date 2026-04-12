const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

const {
  createEmployee,
  uploadProfile, // 🔥 ADD
  getTeamMembers,
  getMe,
  getAllEmployees,
  getUserById,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { managerOnly } = require("../middleware/roleMiddleware");

// 🔥 MULTER SETUP
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// 🔥 ROUTES

router.post("/create-employee", protect, managerOnly, createEmployee);

router.get("/team", protect, getTeamMembers);

router.get("/me", protect, getMe);

router.get("/employees", protect, managerOnly, getAllEmployees);

router.get("/:id", protect, getUserById);

// 🔥 PROFILE UPLOAD ROUTE (MAIN FEATURE 🚀)
router.put("/upload-profile", protect, upload.single("profile"), uploadProfile);

module.exports = router;
