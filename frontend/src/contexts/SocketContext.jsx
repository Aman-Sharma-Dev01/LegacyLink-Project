import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Use the same base URL as the API
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://legacylink-06oy.onrender.com';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    const token = Cookies.get('token');
    if (!token) return;

    // Connect to socket server
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    // Receive initial list of online users upon connection
    socketInstance.on('onlineUsersList', ({ users }) => {
      console.log('Received online users list:', users);
      setOnlineUsers(new Set(users));
    });

    // Track online users
    socketInstance.on('userOnline', ({ userId }) => {
      console.log('User came online:', userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socketInstance.on('userOffline', ({ userId }) => {
      console.log('User went offline:', userId);
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user?._id]);

  // Join a conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      socket.emit('joinConversation', conversationId);
    }
  }, [socket, isConnected]);

  // Leave a conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      socket.emit('leaveConversation', conversationId);
    }
  }, [socket, isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId, isTyping });
    }
  }, [socket, isConnected]);

  // Send real-time message notification
  const emitMessage = useCallback((conversationId, message) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', { conversationId, message });
    }
  }, [socket, isConnected]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get online status for multiple users
  const getOnlineStatus = useCallback((userIds) => {
    return new Promise((resolve) => {
      if (socket && isConnected) {
        socket.emit('getOnlineUsers', userIds, (status) => {
          // Update local state with fetched status
          const online = Object.entries(status).filter(([_, isOnline]) => isOnline).map(([id]) => id);
          setOnlineUsers(prev => new Set([...prev, ...online]));
          resolve(status);
        });
      } else {
        resolve({});
      }
    });
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendTyping,
    emitMessage,
    isUserOnline,
    getOnlineStatus,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
