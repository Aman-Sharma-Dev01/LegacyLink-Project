const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    attachmentUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const conversationSchema = mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    messages: [messageSchema],
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: Date,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
    },
    groupAvatar: {
      type: String,
    },
    // Track unread count per participant
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient participant queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Static method to find or create a conversation between two users
conversationSchema.statics.findOrCreateDM = async function (userId1, userId2) {
  // Find existing conversation
  let conversation = await this.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
    isGroup: false,
  }).populate('participants', 'name profile.profilePicture');

  // Create new conversation if doesn't exist
  if (!conversation) {
    conversation = await this.create({
      participants: [userId1, userId2],
      isGroup: false,
      messages: [],
      unreadCounts: new Map(),
    });
    await conversation.populate('participants', 'name profile.profilePicture');
  }

  return conversation;
};

// Method to add a message to conversation
conversationSchema.methods.addMessage = async function (senderId, content, messageType = 'text', attachmentUrl = null) {
  const message = {
    sender: senderId,
    content,
    messageType,
    attachmentUrl,
    readBy: [senderId],
  };

  this.messages.push(message);
  this.lastMessage = {
    content: content.substring(0, 100),
    sender: senderId,
    timestamp: new Date(),
  };

  // Increment unread count for all participants except sender
  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCounts.get(participantId.toString()) || 0;
      this.unreadCounts.set(participantId.toString(), currentCount + 1);
    }
  });

  await this.save();
  return this.messages[this.messages.length - 1];
};

// Method to mark messages as read
conversationSchema.methods.markAsRead = async function (userId) {
  // Mark all messages as read by this user
  this.messages.forEach(message => {
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
    }
  });

  // Reset unread count for this user
  this.unreadCounts.set(userId.toString(), 0);

  await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
