const Conversation = require('../models/conversationModel');
const Connection = require('../models/connectionModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name profile.profilePicture')
      .populate('lastMessage.sender', 'name')
      .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 });

    // Format response with unread counts
    const formattedConversations = conversations.map(conv => {
      const otherParticipants = conv.participants.filter(
        p => p._id.toString() !== req.user._id.toString()
      );
      
      return {
        _id: conv._id,
        participants: conv.participants,
        otherParticipant: conv.isGroup ? null : otherParticipants[0],
        isGroup: conv.isGroup,
        groupName: conv.groupName,
        groupAvatar: conv.groupAvatar,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCounts?.get(req.user._id.toString()) || 0,
        updatedAt: conv.updatedAt,
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

// @desc    Get or create conversation with a user
// @route   POST /api/messages/conversation
// @access  Private
const getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    // Check if users are connected (optional - can remove for open messaging)
    const areConnected = await Connection.areConnected(req.user._id, recipientId);
    if (!areConnected) {
      return res.status(403).json({ 
        message: 'You must be connected to send messages',
        needsConnection: true 
      });
    }

    const conversation = await Conversation.findOrCreateDM(req.user._id, recipientId);

    res.json(conversation);
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ message: 'Error accessing conversation' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    }).populate('participants', 'name profile.profilePicture');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get paginated messages (newest first, then reverse for display)
    const totalMessages = conversation.messages.length;
    const startIndex = Math.max(0, totalMessages - page * limit);
    const endIndex = totalMessages - (page - 1) * limit;
    
    const messages = conversation.messages
      .slice(startIndex, endIndex)
      .map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        content: msg.content,
        messageType: msg.messageType,
        attachmentUrl: msg.attachmentUrl,
        readBy: msg.readBy,
        createdAt: msg.createdAt,
      }));

    // Mark as read
    await conversation.markAsRead(req.user._id);

    res.json({
      conversation: {
        _id: conversation._id,
        participants: conversation.participants,
        isGroup: conversation.isGroup,
        groupName: conversation.groupName,
      },
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        hasMore: startIndex > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType = 'text', attachmentUrl } = req.body;

    if (!content && !attachmentUrl) {
      return res.status(400).json({ message: 'Message content required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = await conversation.addMessage(
      req.user._id,
      content,
      messageType,
      attachmentUrl
    );

    // Create notifications for other participants
    const otherParticipants = conversation.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    for (const participantId of otherParticipants) {
      await Notification.createNotification({
        recipient: participantId,
        sender: req.user._id,
        type: 'message',
        title: 'New Message',
        message: `${req.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        link: `/messages/${conversationId}`,
      });
    }

    // Emit socket event (will be handled by socket.io)
    const io = req.app.get('io');
    if (io) {
      otherParticipants.forEach(participantId => {
        io.to(`user:${participantId}`).emit('newMessage', {
          conversationId,
          message: {
            _id: message._id,
            sender: {
              _id: req.user._id,
              name: req.user.name,
              profilePicture: req.user.profile?.profilePicture,
            },
            content: message.content,
            messageType: message.messageType,
            createdAt: message.createdAt,
          },
        });
      });
    }

    res.status(201).json({
      message: {
        _id: message._id,
        sender: req.user._id,
        content: message.content,
        messageType: message.messageType,
        attachmentUrl: message.attachmentUrl,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/conversation/:conversationId/read
// @access  Private
const markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await conversation.markAsRead(req.user._id);

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ message: 'Error marking as read' });
  }
};

// @desc    Get total unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.unreadCounts?.get(req.user._id.toString()) || 0;
    });

    res.json({ count: totalUnread });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count' });
  }
};

// @desc    Delete a message (soft delete - mark as deleted)
// @route   DELETE /api/messages/:conversationId/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = conversation.messages.id(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.content = 'This message was deleted';
    message.messageType = 'system';
    await conversation.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
  deleteMessage,
};
