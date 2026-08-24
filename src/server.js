require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const { socketAuth } = require("./middleware/authMiddleware");
const Message = require("./models/Message");
const Meeting = require("./models/Meeting");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const messageRoutes = require("./routes/messageRoutes");

connectDB();

const app = express();
const server = http.createServer(app);
const corsOptions = {
  origin: [
    "https://virtual-office-frontend-bu6x.vercel.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 🔥 SAME CONFIG

// 🔥 SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});
app.set("io", io);
io.use(socketAuth);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/messages", messageRoutes);
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = String(socket.user.id);

  console.log("🔥 User connected:", userId, socket.id);

  socket.join(userId);

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId).add(socket.id);

  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(String(roomId));
  });

  socket.on("sendMessage", async (data) => {
    try {
      if (
        !data?.receiver ||
        typeof data.message !== "string" ||
        !data.message.trim()
      ) {
        socket.emit("errorMessage", "Invalid message");
        return;
      }

      const receiverId = String(data.receiver);

      const roomId = [userId, receiverId].sort().join("_");

      const newMessage = await Message.create({
        sender: userId,
        receiver: receiverId,
        message: data.message.trim(),
        roomId,
      });

      const populatedMsg = await Message.findById(newMessage._id)
        .populate("sender", "name profileUrl")
        .populate("receiver", "name profileUrl");

      io.to(userId).emit("receiveMessage", populatedMsg);
      io.to(receiverId).emit("receiveMessage", populatedMsg);
    } catch (err) {
      console.error("❌ Send Message Error:", err);
      socket.emit("errorMessage", "Message failed");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", userId, socket.id);

    const userSockets = onlineUsers.get(userId);

    if (userSockets) {
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Virtual Office API Running 🚀",
  });
});
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});
setInterval(
  async () => {
    try {
      const now = new Date();

      const result = await Meeting.deleteMany({
        time: {
          $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      });

      console.log("🗑 Old meetings deleted:", result.deletedCount);
    } catch (err) {
      console.error("❌ Cleanup error:", err);
    }
  },
  60 * 60 * 1000,
);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("=================================");
  console.log(` Server Running on PORT ${PORT}`);
  console.log(" Socket.IO + Chat + Meetings Ready");
  console.log("=================================");
});
