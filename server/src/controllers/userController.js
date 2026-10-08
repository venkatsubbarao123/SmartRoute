const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'studentInfo', 'employeeInfo', 'savedAddresses', 'notificationPreferences', 'location'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (req.file) updates.profilePhoto = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated.', user });
});

const addVehicle = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const store = require('../services/dataStore');
  if (mongoose.connection.readyState !== 1) {
    const vehicle = store.addVehicle(req.body, req.user);
    return res.status(201).json({ success: true, message: 'Vehicle added successfully!', vehicle });
  }

  const existingReg = await Vehicle.findOne({ registrationNumber: req.body.registrationNumber?.toUpperCase() });
  if (existingReg) throw new AppError('A vehicle with this registration number already exists.', 400);
  const vehicle = await Vehicle.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, message: 'Vehicle added successfully!', vehicle });
});

const getMyVehicles = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const store = require('../services/dataStore');
  if (mongoose.connection.readyState !== 1) {
    const vehicles = store.getMyVehicles(req.user?._id || req.user?.id);
    return res.json({ success: true, count: vehicles.length, vehicles });
  }

  const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true });
  res.json({ success: true, count: vehicles.length, vehicles });
});

const updateVehicle = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const store = require('../services/dataStore');
  if (mongoose.connection.readyState !== 1 || String(req.params.id).startsWith('v-')) {
    const updated = store.updateVehicle(req.params.id, req.body, req.user?._id || req.user?.id);
    if (!updated) throw new AppError('Vehicle not found.', 404);
    return res.json({ success: true, message: 'Vehicle updated.', vehicle: updated });
  }

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new AppError('Vehicle not found.', 404);
  if (vehicle.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized.', 403);
  const allowedUpdates = ['color', 'year', 'seats', 'documents', 'isDefault', 'mileage'];
  const updates = {};
  allowedUpdates.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const updated = await Vehicle.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Vehicle updated.', vehicle: updated });
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const store = require('../services/dataStore');
  if (mongoose.connection.readyState !== 1 || String(req.params.id).startsWith('v-')) {
    store.deleteVehicle(req.params.id, req.user?._id || req.user?.id);
    return res.json({ success: true, message: 'Vehicle removed.' });
  }

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new AppError('Vehicle not found.', 404);
  if (vehicle.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized.', 403);
  vehicle.isActive = false;
  await vehicle.save();
  res.json({ success: true, message: 'Vehicle removed.' });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name profilePhoto rating verification userType createdAt');
  if (!user) throw new AppError('User not found.', 404);
  if (user.isBlocked) throw new AppError('This user is not available.', 404);
  res.json({ success: true, user });
});

const getNotifications = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const store = require('../services/dataStore');
  if (mongoose.connection.readyState !== 1) {
    const list = store.getNotifications(req.user?._id || req.user?.id);
    const unreadCount = list.filter((n) => !n.isRead).length;
    return res.json({ success: true, count: list.length, total: list.length, unreadCount, page: 1, pages: 1, notifications: list });
  }

  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter = { user: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, count: notifications.length, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), notifications });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const store = require('../services/dataStore');
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1 || String(id).startsWith('notif-')) {
    if (id === 'all') {
      store.markAllNotificationsRead(req.user?._id || req.user?.id);
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }
    const notif = store.markNotificationRead(id, req.user?._id || req.user?.id);
    return res.json({ success: true, message: 'Notification marked as read.', notification: notif });
  }

  if (id === 'all') {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  }
  const notification = await Notification.findById(id);
  if (!notification) throw new AppError('Notification not found.', 404);
  if (notification.user.toString() !== req.user._id.toString()) throw new AppError('Not authorized.', 403);
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  res.json({ success: true, message: 'Notification marked as read.', notification });
});

const submitVerification = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const store = require('../services/dataStore');
  const { documentType, documentNumber, organization, userType } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const updatedUser = store.submitVerification(req.user?._id || 'u-demo', {
      documentType,
      documentNumber,
      organization,
      userType: userType || req.user?.userType || 'student',
      name: req.user?.name,
      email: req.user?.email,
    });
    return res.json({
      success: true,
      message: 'ID Verification submitted and approved successfully!',
      status: 'VERIFIED',
      user: updatedUser,
    });
  }

  const updates = {
    'verification.identityVerified': true,
    'verification.emailVerified': true,
  };

  if (userType === 'student') {
    updates['verification.studentVerified'] = true;
    if (organization) updates['studentInfo.college'] = organization;
    if (documentNumber) updates['studentInfo.collegeId'] = documentNumber;
  } else if (userType === 'employee') {
    updates['verification.employeeVerified'] = true;
    if (organization) updates['employeeInfo.company'] = organization;
    if (documentNumber) updates['employeeInfo.employeeId'] = documentNumber;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({
    success: true,
    message: 'ID Verification submitted and approved successfully!',
    status: 'VERIFIED',
    user,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  addVehicle,
  getMyVehicles,
  updateVehicle,
  deleteVehicle,
  getUserById,
  getNotifications,
  markNotificationRead,
  submitVerification,
};
