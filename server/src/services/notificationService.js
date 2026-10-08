const Notification = require('../models/Notification');

/**
 * Notification Service
 * Creates in-app notifications and dispatches real-time socket events
 */

/**
 * Create a notification record in the database
 * @param {string} userId - Target user's ID
 * @param {string} type - Notification type
 * @param {string} title - Short title
 * @param {string} message - Notification body
 * @param {Object} data - Extra payload (rideId, bookingId, etc.)
 * @returns {Promise<Object>} Created notification document
 */
async function createNotification(userId, type, title, message, data = {}) {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
}

/**
 * Send a real-time socket notification to a specific user
 * @param {Object} io - Socket.IO server instance
 * @param {string} userId - Target user's ID (string)
 * @param {Object} notification - Notification object to emit
 */
function sendSocketNotification(io, userId, notification) {
  if (!io || !userId || !notification) return;
  try {
    // Emit to user's personal room (userId is used as room name)
    io.to(`user:${userId.toString()}`).emit('notification:new', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    console.error('Failed to send socket notification:', error.message);
  }
}

/**
 * Create notification and send socket event in one call
 * @param {Object} io - Socket.IO server instance (can be null for DB-only)
 * @param {string} userId
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {Object} data
 * @returns {Promise<Object>} notification
 */
async function notify(io, userId, type, title, message, data = {}) {
  const notification = await createNotification(userId, type, title, message, data);
  if (notification && io) {
    sendSocketNotification(io, userId, notification);
  }
  return notification;
}

/**
 * Notification message templates
 */
const templates = {
  ride_request: (passengerName) => ({
    title: 'New Ride Request',
    message: `${passengerName} has requested to join your ride.`,
  }),
  ride_accepted: (driverName) => ({
    title: 'Ride Accepted! 🎉',
    message: `${driverName} has accepted your ride request.`,
  }),
  ride_rejected: (driverName) => ({
    title: 'Ride Request Declined',
    message: `${driverName} has declined your ride request.`,
  }),
  ride_started: (driverName) => ({
    title: 'Ride Started 🚗',
    message: `${driverName} has started the ride. Enjoy your trip!`,
  }),
  ride_completed: () => ({
    title: 'Ride Completed ✅',
    message: 'Your ride has been completed. Please rate your experience.',
  }),
  ride_cancelled: (cancellerName) => ({
    title: 'Ride Cancelled',
    message: `${cancellerName} has cancelled the ride.`,
  }),
  new_message: (senderName) => ({
    title: 'New Message 💬',
    message: `You have a new message from ${senderName}.`,
  }),
  rating_received: () => ({
    title: 'New Rating Received ⭐',
    message: 'Someone has rated you. Check your profile!',
  }),
};

module.exports = {
  createNotification,
  sendSocketNotification,
  notify,
  templates,
};
