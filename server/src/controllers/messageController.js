const mongoose = require('mongoose');
const Message = require('../models/Message');
const Booking = require('../models/Booking');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { notify } = require('../services/notificationService');
const store = require('../services/dataStore');

const getMessages = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = String(req.user?._id || req.user?.id || '');

  const isMock = mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(bookingId) || String(bookingId).startsWith('bk-');
  if (isMock) {
    const list = store.getMessages(bookingId);
    return res.json({ success: true, count: list.length, messages: list });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const list = store.getMessages(bookingId);
    return res.json({ success: true, count: list.length, messages: list });
  }

  const isDriver = String(booking.driver) === userId || String(booking.driver?._id) === userId;
  const isPassenger = String(booking.passenger) === userId || String(booking.passenger?._id) === userId;
  if (!isDriver && !isPassenger && !req.user?.isAdmin) {
    throw new AppError('Not authorized to access messages for this booking.', 403);
  }

  const messages = await Message.find({ booking: bookingId })
    .populate('sender', 'name profilePhoto userType')
    .sort('createdAt');

  res.json({ success: true, count: messages.length, messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { content, locationData } = req.body;
  const userId = String(req.user?._id || req.user?.id || '');
  const io = req.app.get('io');

  if (!content || !content.trim()) {
    throw new AppError('Message content cannot be empty.', 400);
  }

  const isMock = mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(bookingId) || String(bookingId).startsWith('bk-');
  if (isMock) {
    const booking = (store.bookings || []).find((b) => String(b._id || b.id) === String(bookingId));
    let receiverId = 'u-host';
    if (booking) {
      const driverId = String(booking.driver?._id || booking.driver?.id || booking.driver);
      const passId = String(booking.passenger?._id || booking.passenger?.id || booking.passenger);
      receiverId = userId === driverId ? passId : driverId;
    }

    const newMsg = store.addMessage({
      bookingId,
      sender: { _id: userId, name: req.user?.name || 'Commuter' },
      receiver: receiverId,
      content: content.trim(),
      locationData,
    });

    if (io) {
      io.emit(`new_message_${bookingId}`, newMsg);
      io.to(String(bookingId)).emit('new_message', newMsg);
    }

    return res.status(201).json({ success: true, message: 'Message sent.', data: newMsg });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const newMsg = store.addMessage({
      bookingId,
      sender: { _id: userId, name: req.user?.name || 'Commuter' },
      receiver: 'u-peer',
      content: content.trim(),
      locationData,
    });
    return res.status(201).json({ success: true, message: 'Message sent.', data: newMsg });
  }

  const isDriver = String(booking.driver) === userId || String(booking.driver?._id) === userId;
  const isPassenger = String(booking.passenger) === userId || String(booking.passenger?._id) === userId;
  if (!isDriver && !isPassenger && !req.user?.isAdmin) {
    throw new AppError('Not authorized to message on this booking.', 403);
  }

  const receiverId = isDriver ? booking.passenger : booking.driver;

  const msg = await Message.create({
    booking: booking._id,
    sender: req.user._id,
    receiver: receiverId,
    content: content.trim(),
    locationData,
  });

  const populated = await Message.findById(msg._id).populate('sender', 'name profilePhoto');

  // Send real-time notification
  await notify(
    io,
    receiverId,
    'new_message',
    `Message from ${req.user.name}`,
    content.slice(0, 100),
    { bookingId: booking._id, messageId: msg._id }
  );

  if (io) {
    io.to(String(booking._id)).emit('new_message', populated);
    io.emit(`new_message_${bookingId}`, populated);
  }

  res.status(201).json({ success: true, message: 'Message sent.', data: populated });
});

module.exports = { getMessages, sendMessage };
