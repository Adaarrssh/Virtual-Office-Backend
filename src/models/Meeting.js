const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    time: {
      type: Date,
      required: true,
      index: true,
    },

    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    meetingLink: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "live", "completed"],
      default: "upcoming",
    },
  },
  { timestamps: true },
);

/* 🔥 AUTO STATUS UPDATE (SMART LOGIC) */
meetingSchema.methods.updateStatus = function () {
  const now = new Date();

  const start = new Date(this.time);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour meeting

  if (now >= start && now <= end) {
    this.status = "live";
  } else if (now > end) {
    this.status = "completed";
  } else {
    this.status = "upcoming";
  }
};

/* 🔥 AUTO DELETE INDEX (OPTIONAL ADVANCED) */
meetingSchema.index(
  { time: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24, // 24 hours
  },
);

module.exports = mongoose.model("Meeting", meetingSchema);
