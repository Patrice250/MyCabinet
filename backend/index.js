import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Import from config directory
import pool, { verifyConnection, closePool } from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import fingerprintRoutes from './routes/fingerprint.js';
import servoRoutes from './routes/servo.js';
import gpsRoutes from './routes/gps.js';
import denialRoutes from './routes/denialRoutes.js';
import userRoutes from './routes/userRoutes.js';
import phoneRoutes from './routes/phoneRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import resetRoutes from './routes/resetRoutes.js';

// Import controllers
import { insertGPS } from './controllers/gpsController.js';
import { validateFingerprint, logFingerprintEvent } from './controllers/fingerprintController.js';

// Initialize
dotenv.config();
const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

// GPS-specific rate limiting
const gpsLimiter = rateLimit({
  windowMs: 5 * 1000,       // 5 seconds
  max: 1,                   // limit each IP to 1 request per windowMs
  message: 'Too many GPS updates, please slow down'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(` Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// Apply rate limiting to API routes
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/fingerprint', fingerprintRoutes);
app.use('/api/servo', servoRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/denials', denialRoutes);
app.use('/api/user', userRoutes);
app.use('/api', phoneRoutes);
app.use('/api', historyRoutes);
app.use('/api/chart', chartRoutes);

// Special rate-limited GPS endpoint
app.post('/api/gps/location', gpsLimiter, insertGPS);

// Fingerprint endpoints
app.get('/api/fingerprint/validate', validateFingerprint);
app.post('/api/fingerprint-event', logFingerprintEvent);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await verifyConnection();
  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'healthy' : 'degraded',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server] Error:', {
    error: err.stack || err.message || err,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    suggestion: 'Check the API documentation for available endpoints'
  });
});

// Database connection monitoring
let dbCheckInterval;
const startDbMonitoring = () => {
  dbCheckInterval = setInterval(async () => {
    try {
      const isConnected = await verifyConnection();
      if (!isConnected) {
        console.warn(' Database connection lost - attempting to reconnect...');
      }
    } catch (err) {
      console.error(' Database monitoring error:', err);
    }
  }, 30000); // 30 seconds
};

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Clear intervals first
    clearInterval(dbCheckInterval);
    
    // Close server
    server.close(async () => {
      console.log(' HTTP server closed');
      
      // Close database pool
      await closePool();
      console.log(' Database connections closed');
      
      console.log(' Shutdown completed successfully');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error(' Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 10000); // 10 seconds
    
  } catch (err) {
    console.error(' Shutdown error:', err);
    process.exit(1);
  }
}

// Initialize server with connection verification
async function startServer() {
  try {
    // Initial database connection check
    const isConnected = await verifyConnection();
    if (!isConnected) {
      console.warn(' Initial database connection failed - retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await verifyConnection();
    }

    // Start monitoring
    startDbMonitoring();

    // Start server
    const PORT = process.env.PORT || 5002;
    server.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Started at: ${new Date().toISOString()}`);
    });
  } catch (err) {
    console.error(' Failed to start server:', err);
    process.exit(1);
  }
}

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection/exception handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error(' Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Start the server
startServer();