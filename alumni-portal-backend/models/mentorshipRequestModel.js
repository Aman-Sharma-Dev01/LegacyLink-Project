const mongoose = require('mongoose');

const mentorshipRequestSchema = mongoose.Schema(
  {
    student: { // The student requesting mentorship
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    alumni: { // The alumni being requested
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    message: { // Student's introductory message
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const MentorshipRequest = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
module.exports = MentorshipRequest;