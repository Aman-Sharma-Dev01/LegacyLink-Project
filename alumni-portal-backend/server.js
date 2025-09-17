const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const cors = require('cors');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const eventRoutes = require('./routes/eventRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const jobRoutes = require('./routes/jobRoutes');
const chatRoutes = require('./routes/chatRoutes'); // 👈 added chatbot route

dotenv.config();
connectDB();

const app = express();

// ✅ Allow frontend access (React / Vite)
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://legacylink-project-glow.vercel.app'],
    credentials: true,
  })
);

app.use(express.json()); // Parse JSON

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
app.use('/api/chat', chatRoutes); // 👈 new chatbot route

// Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(
  PORT,
  () => console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
