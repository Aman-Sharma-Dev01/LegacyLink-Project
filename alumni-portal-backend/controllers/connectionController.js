const Connection = require('../models/connectionModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

// @desc    Send connection request
// @route   POST /api/connections/request
// @access  Private
const sendConnectionRequest = async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check existing connection
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected' });
      }
      if (existingConnection.status === 'pending') {
        return res.status(400).json({ message: 'Connection request already pending' });
      }
      if (existingConnection.status === 'blocked') {
        return res.status(400).json({ message: 'Cannot send request' });
      }
    }

    // Create connection request
    const connection = await Connection.create({
      requester: req.user._id,
      recipient: recipientId,
      message,
      status: 'pending',
    });

    // Create notification
    await Notification.createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: 'follow',
      title: 'New Connection Request',
      message: `${req.user.name} wants to connect with you${message ? `: "${message.substring(0, 50)}..."` : ''}`,
      link: '/connections',
    });

    res.status(201).json({
      message: 'Connection request sent',
      connection,
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Error sending connection request' });
  }
};

// @desc    Respond to connection request (accept/reject)
// @route   PUT /api/connections/respond/:connectionId
// @access  Private
const respondToRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Only recipient can respond
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    connection.status = action === 'accept' ? 'accepted' : 'rejected';
    await connection.save();

    // Notify requester if accepted
    if (action === 'accept') {
      await Notification.createNotification({
        recipient: connection.requester,
        sender: req.user._id,
        type: 'follow',
        title: 'Connection Accepted',
        message: `${req.user.name} accepted your connection request`,
        link: `/profile/${req.user._id}`,
      });
    }

    res.json({
      message: action === 'accept' ? 'Connection accepted' : 'Connection rejected',
      connection,
    });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ message: 'Error responding to request' });
  }
};

// @desc    Get pending connection requests (received)
// @route   GET /api/connections/requests
// @access  Private
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: 'pending',
    })
      .populate('requester', 'name email profile role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// @desc    Get sent connection requests
// @route   GET /api/connections/sent
// @access  Private
const getSentRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      requester: req.user._id,
      status: 'pending',
    })
      .populate('recipient', 'name email profile role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ message: 'Error fetching sent requests' });
  }
};

// @desc    Get user's connections (accepted)
// @route   GET /api/connections
// @access  Private
const getConnections = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const connections = await Connection.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' },
      ],
    })
      .populate('requester', 'name email profile role')
      .populate('recipient', 'name email profile role')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Connection.countDocuments({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' },
      ],
    });

    // Transform to return the "other" user
    const formattedConnections = connections.map(conn => {
      const otherUser = conn.requester._id.toString() === req.user._id.toString()
        ? conn.recipient
        : conn.requester;
      return {
        _id: conn._id,
        user: otherUser,
        connectedAt: conn.updatedAt,
      };
    });

    res.json({
      connections: formattedConnections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Error fetching connections' });
  }
};

// @desc    Get connection status with a user
// @route   GET /api/connections/status/:userId
// @access  Private
const getConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Connection.getConnectionStatus(req.user._id, userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ message: 'Error getting connection status' });
  }
};

// @desc    Remove a connection
// @route   DELETE /api/connections/:connectionId
// @access  Private
const removeConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Only participants can remove
    if (
      connection.requester.toString() !== req.user._id.toString() &&
      connection.recipient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await connection.deleteOne();

    res.json({ message: 'Connection removed' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ message: 'Error removing connection' });
  }
};

// @desc    Cancel sent connection request
// @route   DELETE /api/connections/cancel/:connectionId
// @access  Private
const cancelRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findOne({
      _id: connectionId,
      requester: req.user._id,
      status: 'pending',
    });

    if (!connection) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await connection.deleteOne();

    res.json({ message: 'Request cancelled' });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ message: 'Error cancelling request' });
  }
};

module.exports = {
  sendConnectionRequest,
  respondToRequest,
  getPendingRequests,
  getSentRequests,
  getConnections,
  getConnectionStatus,
  removeConnection,
  cancelRequest,
};
