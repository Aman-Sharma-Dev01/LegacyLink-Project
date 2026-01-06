const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'like',           // Someone liked your post
        'comment',        // Someone commented on your post
        'follow',         // Someone followed you
        'mention',        // Someone mentioned you
        'mentorship',     // Mentorship request/update
        'event',          // Event invitation/reminder
        'job',            // New job posting
        'message',        // New message
        'verification',   // Account verified
        'system',         // System notification
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String, // URL to navigate to when clicked
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    relatedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function ({
  recipient,
  sender,
  type,
  title,
  message,
  link,
  relatedPost,
  relatedEvent,
  relatedJob,
}) {
  // Don't create notification if sender and recipient are the same
  if (sender && sender.toString() === recipient.toString()) {
    return null;
  }

  const notification = await this.create({
    recipient,
    sender,
    type,
    title,
    message,
    link,
    relatedPost,
    relatedEvent,
    relatedJob,
  });

  return notification;
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
