// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',

  // Rides
  RIDES: '/rides',
  RIDE_BY_ID: (id) => `/rides/${id}`,
  SEARCH_RIDES: '/rides/search',
  MY_RIDES: '/rides/my-rides',
  OFFER_RIDE: '/rides',
  UPDATE_RIDE: (id) => `/rides/${id}`,
  DELETE_RIDE: (id) => `/rides/${id}`,
  RIDE_STATUS: (id) => `/rides/${id}/status`,

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_BY_ID: (id) => `/bookings/${id}`,
  MY_BOOKINGS: '/bookings/my-bookings',
  ACCEPT_BOOKING: (id) => `/bookings/${id}/accept`,
  REJECT_BOOKING: (id) => `/bookings/${id}/reject`,
  CANCEL_BOOKING: (id) => `/bookings/${id}/cancel`,

  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  UPDATE_PROFILE: '/users/profile',
  UPLOAD_AVATAR: '/users/avatar',

  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE_BY_ID: (id) => `/vehicles/${id}`,
  MY_VEHICLES: '/vehicles/my-vehicles',

  // Messages
  CONVERSATIONS: '/messages/conversations',
  MESSAGES: (conversationId) => `/messages/${conversationId}`,
  SEND_MESSAGE: '/messages',

  // Notifications
  NOTIFICATIONS: '/notifications',
  MARK_NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/mark-all-read',

  // Ratings
  RATINGS: '/ratings',
  RATE_RIDE: (id) => `/ratings/ride/${id}`,
  USER_RATINGS: (id) => `/ratings/user/${id}`,

  // Admin
  ADMIN_STATS: '/admin/stats',
  ADMIN_USERS: '/admin/users',
  ADMIN_RIDES: '/admin/rides',
  ADMIN_REPORTS: '/admin/reports',
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Ride
  RIDE_REQUESTED: 'ride:requested',
  RIDE_ACCEPTED: 'ride:accepted',
  RIDE_REJECTED: 'ride:rejected',
  RIDE_STARTED: 'ride:started',
  RIDE_COMPLETED: 'ride:completed',
  RIDE_CANCELLED: 'ride:cancelled',

  // Location
  LOCATION_UPDATE: 'location:update',
  DRIVER_LOCATION: 'driver:location',

  // Messages
  NEW_MESSAGE: 'message:new',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Notifications
  NEW_NOTIFICATION: 'notification:new',

  // Join/Leave rooms
  JOIN_RIDE: 'join:ride',
  LEAVE_RIDE: 'leave:ride',
  JOIN_CHAT: 'join:chat',
  LEAVE_CHAT: 'leave:chat',
};

// Ride Status
export const RIDE_STATUS = {
  ACTIVE: 'ACTIVE',
  STARTED: 'STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const RIDE_STATUS_LABELS = {
  ACTIVE: 'Looking for Passengers',
  STARTED: 'Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const RIDE_STATUS_COLORS = {
  ACTIVE: 'text-green-400 bg-green-400/10',
  STARTED: 'text-blue-400 bg-blue-400/10',
  IN_PROGRESS: 'text-orange-400 bg-orange-400/10',
  COMPLETED: 'text-gray-400 bg-gray-400/10',
  CANCELLED: 'text-red-400 bg-red-400/10',
};

// Booking Status
export const BOOKING_STATUS = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
};

export const BOOKING_STATUS_COLORS = {
  REQUESTED: 'text-yellow-400 bg-yellow-400/10',
  ACCEPTED: 'text-green-400 bg-green-400/10',
  REJECTED: 'text-red-400 bg-red-400/10',
  CANCELLED: 'text-gray-400 bg-gray-400/10',
  COMPLETED: 'text-blue-400 bg-blue-400/10',
};

// Vehicle Types
export const VEHICLE_TYPES = {
  CAR: 'CAR',
  BIKE: 'BIKE',
  AUTO: 'AUTO',
};

export const VEHICLE_TYPE_ICONS = {
  CAR: '🚗',
  BIKE: '🏍️',
  AUTO: '🛺',
};

// User Types
export const USER_TYPES = {
  STUDENT: 'STUDENT',
  EMPLOYEE: 'EMPLOYEE',
  GENERAL: 'GENERAL',
};

export const USER_TYPE_LABELS = {
  STUDENT: 'Student',
  EMPLOYEE: 'Employee',
  GENERAL: 'General User',
};

// Gender Preferences
export const GENDER_PREF = {
  ANY: 'ANY',
  MALE: 'MALE',
  FEMALE: 'FEMALE',
};

// Match Score Thresholds
export const MATCH_SCORE = {
  POOR: 60,
  GOOD: 80,
};

export const getMatchLabel = (score) => {
  if (score >= MATCH_SCORE.GOOD) return 'Excellent';
  if (score >= MATCH_SCORE.POOR) return 'Good';
  return 'Poor';
};

export const getMatchColor = (score) => {
  if (score >= MATCH_SCORE.GOOD) return 'text-green-400';
  if (score >= MATCH_SCORE.POOR) return 'text-orange-400';
  return 'text-red-400';
};

export const getMatchBg = (score) => {
  if (score >= MATCH_SCORE.GOOD) return '#10b981';
  if (score >= MATCH_SCORE.POOR) return '#f59e0b';
  return '#ef4444';
};

// Days of week
export const DAYS_OF_WEEK = [
  { value: 'MON', label: 'Mon' },
  { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' },
  { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' },
  { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' },
];

// App config
export const APP_CONFIG = {
  APP_NAME: 'SmartRoute',
  TAGLINE: 'Smart Route & Cost Sharing Platform',
  MAX_WAYPOINTS: 3,
  MAX_IMAGES: 3,
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
  DEFAULT_MAP_CENTER: [17.385, 78.4867], // Hyderabad
  DEFAULT_MAP_ZOOM: 12,
};
