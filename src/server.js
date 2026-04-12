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

// 🔥 ALLOW ALL (DEV + DEPLOY SAFE)
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL, // later use this
].filter(Boolean);

// 🔥 SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*", // keep open for now
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
io.use(socketAuth);

// 🔥 CORS (IMPORTANT FIX)
app.use(
  cors({
    origin: "*", // open for now (deployment friendly)
    credentials: true,
  }),
);

// 🔥 BODY PARSER
app.use(express.json());

// 🔥 SERVE UPLOADS
app.use("/uploads", express.static("uploads"));

// 🔥 ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/messages", messageRoutes);

// 🔥 SOCKET CONNECTION
io.on("connection", (socket) => {
  const userId = String(socket.user.id);

  console.log("🔥 User connected:", userId);

  socket.join(userId);

  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
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

      const roomId = [userId, String(data.receiver)].sort().join("_");

      const newMessage = await Message.create({
        sender: userId,
        receiver: data.receiver,
        message: data.message.trim(),
        roomId,
      });

      const populatedMsg = await Message.findById(newMessage._id)
        .populate("sender", "name")
        .populate("receiver", "name");

      io.to(roomId).emit("receiveMessage", populatedMsg);
      io.to(String(data.receiver)).emit("receiveMessage", populatedMsg);
    } catch (err) {
      console.error("❌ Socket error:", err);
      socket.emit("errorMessage", "Message failed");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", userId);
  });
});

// 🔥 HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Virtual Office API Running 🚀",
  });
});

// 🔥 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// 🔥 ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// 🔥 AUTO CLEANUP
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
  console.log(`🚀 Server Running on PORT ${PORT}`);
  console.log("🔥 Socket.IO + Chat + Meetings Ready");
  console.log("=================================");
});
