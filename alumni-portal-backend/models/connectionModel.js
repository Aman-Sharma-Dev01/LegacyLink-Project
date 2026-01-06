const mongoose = require('mongoose');

const connectionSchema = mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending',
    },
    message: {
      type: String, // Optional message with connection request
      maxlength: 300,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique connections between users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for efficient queries
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

// Static method to check if two users are connected
connectionSchema.statics.areConnected = async function (userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' },
    ],
  });
  return !!connection;
};

// Static method to get connection status between two users
connectionSchema.statics.getConnectionStatus = async function (userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  });
  
  if (!connection) return { status: 'none', connection: null };
  
  return {
    status: connection.status,
    connection,
    isRequester: connection.requester.toString() === userId1.toString(),
  };
};

const Connection = mongoose.model('Connection', connectionSchema);
module.exports = Connection;
