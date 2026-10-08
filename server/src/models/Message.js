const mongoose = require('mongoose');

/**
 * Message Schema
 * In-app chat messages between driver and passenger for a booking
 * Supports text, location sharing, and system messages
 */
const messageSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text', 'location', 'system'],
      default: 'text',
    },
    // For location messages: { latitude, longitude, address }
    locationData: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index({ booking: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
