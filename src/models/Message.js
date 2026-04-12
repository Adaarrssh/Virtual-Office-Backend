const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    isSeen: {
      type: Boolean,
      default: false,
    },

    roomId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

messageSchema.index({ roomId: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, isSeen: 1 });

module.exports = mongoose.model("Message", messageSchema);
