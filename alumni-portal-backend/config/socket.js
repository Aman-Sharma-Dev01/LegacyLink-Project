const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Store online users
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Track online status
    onlineUsers.set(userId, {
      socketId: socket.id,
      user: {
        _id: userId,
        name: socket.user.name,
        profilePicture: socket.user.profile?.profilePicture,
      },
    });

    // Broadcast online status to connections
    socket.broadcast.emit('userOnline', { userId });

    // Join conversation rooms
    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`${socket.user.name} joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('userTyping', {
        conversationId,
        userId,
        userName: socket.user.name,
        isTyping,
      });
    });

    // Handle real-time message
    socket.on('sendMessage', ({ conversationId, message }) => {
      socket.to(`conversation:${conversationId}`).emit('newMessage', {
        conversationId,
        message: {
          ...message,
          sender: {
            _id: userId,
            name: socket.user.name,
            profilePicture: socket.user.profile?.profilePicture,
          },
        },
      });
    });

    // Handle message read receipt
    socket.on('messageRead', ({ conversationId, messageId }) => {
      socket.to(`conversation:${conversationId}`).emit('messageRead', {
        conversationId,
        messageId,
        readBy: userId,
      });
    });

    // Get online status of users
    socket.on('getOnlineUsers', (userIds, callback) => {
      const onlineStatus = {};
      userIds.forEach(id => {
        onlineStatus[id] = onlineUsers.has(id);
      });
      callback(onlineStatus);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);
      socket.broadcast.emit('userOffline', { userId });
    });
  });

  // Helper function to emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Helper function to check if user is online
  io.isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  return io;
};

module.exports = { initializeSocket };
