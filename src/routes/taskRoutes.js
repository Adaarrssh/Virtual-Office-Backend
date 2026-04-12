const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");
const { managerOnly } = require("../middleware/roleMiddleware");

router.post("/", protect, managerOnly, createTask);

router.get("/", protect, getTasks);

router.patch("/:id", protect, updateTask);

router.delete("/:id", protect, managerOnly, deleteTask);

module.exports = router;
