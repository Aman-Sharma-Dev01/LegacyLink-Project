import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  MoreVertical,
  Loader2,
  Check,
  CheckCheck,
  Circle,
} from 'lucide-react';
import { messageAPI, connectionAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user } = useAuth();
  const { socket, isConnected, joinConversation, leaveConversation, sendTyping, isUserOnline } = useSocket();

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle URL param for opening chat with specific user
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId) {
      openConversationWithUser(userId);
    }
  }, [searchParams]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ conversationId, message }) => {
      // Update messages if this is the active conversation
      if (activeConversation?._id === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }

      // Update conversation list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: message.content,
                  sender: message.sender,
                  timestamp: message.createdAt,
                },
                unreadCount: activeConversation?._id === conversationId
                  ? 0
                  : (conv.unreadCount || 0) + 1,
              }
            : conv
        ).sort((a, b) => 
          new Date(b.lastMessage?.timestamp || b.updatedAt) - 
          new Date(a.lastMessage?.timestamp || a.updatedAt)
        )
      );
    };

    const handleTyping = ({ conversationId, userId, userName, isTyping }) => {
      if (userId === user._id) return;
      
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: isTyping ? userName : null,
      }));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleTyping);
    };
  }, [socket, activeConversation, user._id]);

  // Join conversation room when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      joinConversation(activeConversation._id);
      return () => leaveConversation(activeConversation._id);
    }
  }, [activeConversation, joinConversation, leaveConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data } = await messageAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversationWithUser = async (userId) => {
    try {
      setLoadingMessages(true);
      const { data: conversation } = await messageAPI.getOrCreateConversation(userId);
      setActiveConversation(conversation);
      await fetchMessages(conversation._id);
    } catch (error) {
      if (error.response?.data?.needsConnection) {
        toast.error('You need to be connected to message this user');
        navigate('/alumni-directory');
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const { data } = await messageAPI.getMessages(conversationId);
      setMessages(data.messages);
      setActiveConversation(data.conversation);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
    await fetchMessages(conversation._id);
    
    // Mark as read
    try {
      await messageAPI.markAsRead(conversation._id);
      setConversations(prev =>
        prev.map(c =>
          c._id === conversation._id ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistically add message
    const optimisticMessage = {
      _id: Date.now().toString(),
      sender: user._id,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const { data } = await messageAPI.sendMessage(activeConversation._id, content);
      
      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(m => (m._id === optimisticMessage._id ? data.message : m))
      );

      // Update conversation list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === activeConversation._id
            ? {
                ...conv,
                lastMessage: {
                  content,
                  sender: { _id: user._id },
                  timestamp: new Date().toISOString(),
                },
              }
            : conv
        ).sort((a, b) => 
          new Date(b.lastMessage?.timestamp || b.updatedAt) - 
          new Date(a.lastMessage?.timestamp || a.updatedAt)
        )
      );
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      setNewMessage(content);
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!activeConversation) return;

    // Send typing indicator
    sendTyping(activeConversation._id, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(activeConversation._id, false);
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getOtherParticipant = (conversation) => {
    if (conversation.otherParticipant) return conversation.otherParticipant;
    return conversation.participants?.find(p => p._id !== user._id);
  };

  const formatMessageTime = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col transition-colors">
      <Navbar />
      <div className="flex-1 flex">
        {/* Conversations List */}
        <div
          className={`w-full md:w-96 bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b dark:border-slate-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
          </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-slate-400">No messages yet</h3>
              <p className="text-gray-400 dark:text-slate-500 mt-1">
                Connect with alumni to start messaging
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const other = getOtherParticipant(conversation);
              const isActive = activeConversation?._id === conversation._id;
              const isOnline = isUserOnline(other?._id);

              return (
                <button
                  key={conversation._id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${
                    isActive ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    {other?.profile?.profilePicture && other.profile.profilePicture !== 'default_avatar.png' ? (
                      <img
                        src={other.profile.profilePicture}
                        alt={other.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {other?.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {other?.name}
                      </h3>
                      {conversation.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-400">
                          {formatMessageTime(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">
                        {typingUsers[conversation._id] ? (
                          <span className="text-blue-500 italic">typing...</span>
                        ) : conversation.lastMessage ? (
                          <>
                            {conversation.lastMessage.sender?._id === user._id && 'You: '}
                            {conversation.lastMessage.content}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {(() => {
                const other = getOtherParticipant(activeConversation);
                const isOnline = isUserOnline(other?._id);
                return (
                  <>
                    <div className="relative">
                      {other?.profile?.profilePicture && other.profile.profilePicture !== 'default_avatar.png' ? (
                        <img
                          src={other.profile.profilePicture}
                          alt={other.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {other?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-medium text-gray-900">{other?.name}</h2>
                      <p className="text-xs text-gray-500">
                        {typingUsers[activeConversation._id] ? (
                          <span className="text-blue-500">typing...</span>
                        ) : isOnline ? (
                          <span className="text-green-500">Online</span>
                        ) : (
                          'Offline'
                        )}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.sender === user._id || message.sender?._id === user._id;
                  const showDate =
                    index === 0 ||
                    new Date(message.createdAt).toDateString() !==
                      new Date(messages[index - 1].createdAt).toDateString();

                  return (
                    <div key={message._id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="px-3 py-1 bg-gray-200 text-gray-500 text-xs rounded-full">
                            {isToday(new Date(message.createdAt))
                              ? 'Today'
                              : isYesterday(new Date(message.createdAt))
                              ? 'Yesterday'
                              : format(new Date(message.createdAt), 'MMMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                          } ${message.pending ? 'opacity-70' : ''}`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 ${
                              isOwn ? 'text-blue-200' : 'text-gray-400'
                            }`}
                          >
                            <span className="text-xs">
                              {format(new Date(message.createdAt), 'HH:mm')}
                            </span>
                            {isOwn && (
                              message.pending ? (
                                <Circle className="w-3 h-3" />
                              ) : (
                                <CheckCheck className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="bg-white border-t px-4 py-3 flex items-center gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">
                Select a conversation
              </h3>
              <p className="text-gray-400 mt-1">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default MessagesPage;
