const Meeting = require("../models/Meeting");
const User = require("../models/User");
const Message = require("../models/Message");

exports.createMeeting = async (req, res) => {
  try {
    const { title, time, inviteType, selectedUsers } = req.body;

    if (!title || !time) {
      return res.status(400).json({ message: "Title and time required" });
    }

    // 🔥 ALWAYS treat time as LOCAL (no ISO issues)
    const meetingTime = new Date(time);

    const roomId = `meet-${Date.now()}`;
    const meetingLink = `http://localhost:3000/meet/${roomId}`;

    let participantIds = [];

    if (inviteType === "all" && req.user.role === "manager") {
      const users = await User.find({
        role: "employee",
        manager: req.user.id,
      }).select("_id");

      participantIds = users.map((u) => String(u._id));
    } else {
      participantIds = (selectedUsers || []).map(String);
    }

    // 🔥 ALWAYS include creator
    participantIds = [...new Set([...participantIds, String(req.user.id)])];

    const meeting = await Meeting.create({
      title,
      time: meetingTime,
      createdBy: req.user.id,
      participants: participantIds,
      roomId,
      meetingLink,
      status: "upcoming",
    });

    const io = req.app.get("io");

    // 🔥 SEND CHAT INVITES
    for (const userId of participantIds) {
      if (String(userId) === String(req.user.id)) continue;

      const chatRoomId = [String(req.user.id), String(userId)].sort().join("_");

      const msg = await Message.create({
        sender: req.user.id,
        receiver: userId,
        message: `📅 ${title} | Join: ${meetingLink}`,
        roomId: chatRoomId,
      });

      const populated = await Message.findById(msg._id)
        .populate("sender", "name")
        .populate("receiver", "name");

      if (io) {
        io.to(String(userId)).emit("receiveMessage", populated);
      }
    }

    // 🔥 REALTIME MEETING POPUP
    if (io) {
      participantIds.forEach((id) => {
        io.to(String(id)).emit("meetingCreated", {
          _id: meeting._id,
          title,
          time: meetingTime,
          meetingLink,
          createdBy: req.user.id,
        });
      });
    }

    const populatedMeeting = await meeting.populate("participants", "name");

    return res.status(201).json(populatedMeeting);
  } catch (err) {
    console.error("Create Meeting Error:", err);
    return res.status(500).json({ message: "Create failed" });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const now = new Date();

    // 🔥 AUTO DELETE (24 HOURS OLD)
    await Meeting.deleteMany({
      time: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    });

    // 🔥 BOTH CREATOR + PARTICIPANT SEE
    const meetings = await Meeting.find({
      $or: [{ createdBy: req.user.id }, { participants: req.user.id }],
    }).sort({ time: -1 });

    const updatedMeetings = meetings.map((m) => {
      const obj = m.toObject();

      const start = new Date(obj.time);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      // 🔥 BUFFER (2 min early live)
      if (now >= new Date(start.getTime() - 2 * 60 * 1000) && now <= end) {
        obj.status = "live";
      } else if (now > end) {
        obj.status = "completed";
      } else {
        obj.status = "upcoming";
      }

      return obj;
    });

    return res.json(updatedMeetings);
  } catch (err) {
    console.error("Get Meetings Error:", err);
    return res.status(500).json({ message: "Fetch failed" });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // 🔥 ONLY CREATOR CAN DELETE
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await meeting.deleteOne();

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete Meeting Error:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};
