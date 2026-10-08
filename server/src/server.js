const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: env.SOCKET_CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

const rateLimit = require('express-rate-limit');

// Rate limiting security middleware
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(morgan('dev'));
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Healthcheck & Welcome API
app.get('/', (req, res) => {
  res.json({
    name: 'SmartRoute API',
    tagline: 'Smart Route & Cost Sharing Platform',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartRoute API',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Error Handler Middleware
app.use(errorHandler);

// Realtime Socket.IO Events
io.on('connection', (socket) => {
  console.log('⚡ Socket client connected:', socket.id);

  // Join a specific ride room
  socket.on('join_ride', (rideId) => {
    socket.join(String(rideId));
    console.log(`Socket ${socket.id} joined ride room: ${rideId}`);
  });

  // Driver GPS broadcast
  socket.on('driver_location', (data) => {
    // data: { rideId, lat, lng, speed, heading }
    socket.to(String(data.rideId)).emit('location_update', data);
  });

  // Live in-ride chat
  socket.on('send_message', (data) => {
    // data: { rideId, sender, text, timestamp }
    io.to(String(data.rideId)).emit('new_message', data);
  });

  // SOS Emergency trigger broadcast
  socket.on('trigger_sos', (data) => {
    io.to(String(data.rideId)).emit('emergency_alert', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartroute';

mongoose.set('bufferCommands', false);

const startServer = (mode = 'Online') => {
  if (!server.listening) {
    server.listen(PORT, () => {
      console.log(`🚀 SmartRoute Server running on http://localhost:${PORT} (${mode})`);
    });
  }
};

mongoose.connection.on('error', (err) => {
  console.warn('⚠️ Mongoose connection note:', err.message);
});

// Connect to MongoDB with graceful fallback
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 2000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    startServer('MongoDB Connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    if (env.IS_PRODUCTION) {
      console.error('🛑 Fatal: MongoDB connection is required in production mode. Process exiting safely.');
      process.exit(1);
    }
    console.log('ℹ️ Starting SmartRoute server in Demo/Offline DB Mode on port', PORT);
    startServer('Demo/Offline DB Mode');
  });

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception thrown:', err);
});

module.exports = { app, server, io };
