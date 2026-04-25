const express = require("express");
const router = express.Router();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const {
  createEmployee,
  uploadProfile,
  getTeamMembers,
  getMe,
  getAllEmployees,
  getUserById,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { managerOnly } = require("../middleware/roleMiddleware");

// ================= CLOUDINARY STORAGE =================
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "virtual-office",
      allowed_formats: ["jpg", "jpeg", "png"],
      public_id: `user_${Date.now()}`, // 🔥 unique name
    };
  },
});

// ================= MULTER =================
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG allowed"), false);
    }
  },
});

// ================= ROUTES =================

// 🔥 CREATE EMPLOYEE
router.post("/create-employee", protect, managerOnly, createEmployee);

// 🔥 TEAM
router.get("/team", protect, getTeamMembers);

// 🔥 GET CURRENT USER
router.get("/me", protect, getMe);

// 🔥 ALL EMPLOYEES (MANAGER)
router.get("/employees", protect, managerOnly, getAllEmployees);

// 🔥 GET USER BY ID
router.get("/:id", protect, getUserById);

// 🔥 PROFILE UPLOAD (CLOUDINARY 🚀)
router.put(
  "/upload-profile",
  protect,
  (req, res, next) => {
    console.log("🔥 Upload route hit");
    next();
  },
  upload.single("profile"),
  uploadProfile,
);

// ================= ERROR HANDLER (FOR MULTER) =================
router.use((err, req, res, next) => {
  console.error("❌ Multer Error:", err.message);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: "File upload error: " + err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      message: err.message || "Upload failed",
    });
  }

  next();
});

module.exports = router;
