const MentorshipRequest = require('../models/mentorshipRequestModel');
const User = require('../models/userModel');

// @desc    Send a mentorship request
// @route   POST /api/mentorship/request
// @access  Private/Student
const sendMentorshipRequest = async (req, res) => {
  const { alumniId, message } = req.body;

  const alumni = await User.findById(alumniId);
  if (!alumni || alumni.role !== 'Alumni') {
    return res.status(404).json({ message: 'Alumni not found' });
  }

  const request = new MentorshipRequest({
    student: req.user._id,
    alumni: alumniId,
    message,
  });

  const createdRequest = await request.save();
  res.status(201).json(createdRequest);
};

// @desc    Get mentorship requests (Student sees their own, Alumni sees theirs)
// @route   GET /api/mentorship/requests
// @access  Private
const getMentorshipRequests = async (req, res) => {
  let filter = {};

  if (req.user.role === 'Alumni') {
    filter.alumni = req.user._id;
  } else if (req.user.role === 'Student') {
    filter.student = req.user._id;
  } else {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const requests = await MentorshipRequest.find(filter)
    .populate('student', 'name profile')
    .populate('alumni', 'name profile');

  res.json(requests);
};

// @desc    Respond to a mentorship request
// @route   PUT /api/mentorship/respond/:id
// @access  Private/Alumni
const respondToRequest = async (req, res) => {
  const { status } = req.body; // 'Accepted' or 'Rejected'

  const request = await MentorshipRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }

  // Only the target Alumni can respond
  if (request.alumni.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  request.status = status;
  await request.save();
  res.json({ message: `Request ${status}`, request });
};

module.exports = { sendMentorshipRequest, getMentorshipRequests, respondToRequest };
