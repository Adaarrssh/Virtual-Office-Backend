const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const roomId = [String(currentUserId), String(otherUserId)]
      .sort()
      .join("_");

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name")
      .populate("receiver", "name");

    return res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({
      message: "Error fetching messages",
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver, message } = req.body;

    if (!receiver || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Receiver and valid message are required",
      });
    }

    const roomId = [String(senderId), String(receiver)].sort().join("_");

    const newMessage = await Message.create({
      sender: senderId,
      receiver,
      message: message.trim(),
      roomId,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name")
      .populate("receiver", "name");

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({
      message: "Error sending message",
    });
  }
};
