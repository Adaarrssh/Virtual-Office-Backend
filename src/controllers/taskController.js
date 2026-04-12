const Task = require("../models/Task");
const User = require("../models/User");

exports.createTask = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res
        .status(403)
        .json({ message: "Only managers can create tasks" });
    }

    const { title, description, assignedTo } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: "Title and employee required" });
    }

    const employee = await User.findById(assignedTo);

    if (!employee || employee.role !== "employee") {
      return res.status(400).json({ message: "Invalid employee" });
    }

    if (employee.team?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your team member" });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating task" });
  }
};

exports.getTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "manager") {
      tasks = await Task.find({ assignedBy: req.user.id })
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({ assignedTo: req.user.id })
        .populate("assignedBy", "name email")
        .sort({ createdAt: -1 });
    }

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching my tasks" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user.role === "employee") {
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not your task" });
      }

      if (status) task.status = status;
      if (notes !== undefined) task.notes = notes;
    }

    if (req.user.role === "manager") {
      if (task.assignedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not your task" });
      }

      Object.assign(task, req.body);
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating task" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user.role !== "manager") {
      return res
        .status(403)
        .json({ message: "Only managers can delete tasks" });
    }

    if (task.assignedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Cannot delete others' tasks" });
    }

    await task.deleteOne();

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting task" });
  }
};
