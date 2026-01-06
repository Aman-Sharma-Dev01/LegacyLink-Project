import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

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
      }
      return;
    }

    const token = Cookies.get('token');
    if (!token) return;

    // Connect to socket server
    const socketInstance = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    // Track online users
    socketInstance.on('userOnline', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socketInstance.on('userOffline', ({ userId }) => {
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
  }, [isAuthenticated, user]);

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

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get online status for multiple users
  const getOnlineStatus = useCallback((userIds) => {
    return new Promise((resolve) => {
      if (socket && isConnected) {
        socket.emit('getOnlineUsers', userIds, (status) => {
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
