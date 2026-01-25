const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initializeSocket } = require('./config/socket');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const eventRoutes = require('./routes/eventRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const jobRoutes = require('./routes/jobRoutes');
const chatRoutes = require('./routes/chatRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const directoryRoutes = require('./routes/directoryRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

dotenv.config();
connectDB();

const app = express();

// Configure Express 'trust proxy' when running behind a reverse proxy/load balancer.
// This is required so middleware like express-rate-limit can correctly read
// the client IP from the X-Forwarded-For header.
if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY === 'true' ? 1 : Number(process.env.TRUST_PROXY);
  app.set('trust proxy', value);
  console.log(`ℹ️  Express trust proxy set to: ${value}`);
}

// Create HTTP server for Socket.io
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://legacy-link-project.vercel.app',
    'https://legacy-link-project-git-main.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
};

// Initialize Socket.io with ping settings for production
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// CORS must come BEFORE other middleware
app.use(cors(corsOptions));

// ✅ Security: Helmet for HTTP headers (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ✅ Security: Rate limiting for all API routes
app.use('/api', apiLimiter);

app.use(express.json()); // Parse JSON with size limit

// Base route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);

// Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;
server.listen(
  PORT,
  () => console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT} with Socket.io`)
);
