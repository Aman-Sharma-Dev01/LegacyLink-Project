const MentorshipRequest = require('../models/mentorshipRequestModel');
const User = require('../models/userModel');
const { findBestMatches } = require('../utils/mentorMatcher');
const { sendEmail } = require('../utils/emailService');

// @desc    Send a mentorship request
// @route   POST /api/mentorship/request
// @access  Private/Student
const sendMentorshipRequest = async (req, res) => {
  try {
    const { alumniId, message } = req.body;

    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== 'Alumni') {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    // Check if request already exists
    const existingRequest = await MentorshipRequest.findOne({
      student: req.user._id,
      alumni: alumniId,
      status: { $in: ['Pending', 'Accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: existingRequest.status === 'Pending' 
          ? 'You already have a pending request with this mentor' 
          : 'You are already connected with this mentor'
      });
    }

    const request = new MentorshipRequest({
      student: req.user._id,
      alumni: alumniId,
      message,
    });

    const createdRequest = await request.save();
    await createdRequest.populate(['student', 'alumni']);

    // Send email notification to alumni
    try {
      await sendEmail(alumni.email, 'mentorshipRequest', {
        alumni,
        student: req.user,
        message
      });
    } catch (emailError) {
      console.error('Failed to send mentorship request email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json(createdRequest);
  } catch (error) {
    console.error('Error sending mentorship request:', error);
    res.status(500).json({ message: 'Error sending mentorship request' });
  }
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
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'

    const request = await MentorshipRequest.findById(req.params.id)
      .populate('student', 'name email')
      .populate('alumni', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the target Alumni can respond
    if (request.alumni._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    // Send email notification to student
    if (status === 'Accepted') {
      try {
        await sendEmail(request.student.email, 'mentorshipAccepted', {
          student: request.student,
          alumni: request.alumni
        });
      } catch (emailError) {
        console.error('Failed to send mentorship accepted email:', emailError);
      }
    }

    res.json({ message: `Request ${status}`, request });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ message: 'Error responding to request' });
  }
};

// @desc    Get AI-recommended mentors for a student
// @route   GET /api/mentorship/recommendations
// @access  Private/Student
const getMentorRecommendations = async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Only students can get mentor recommendations' });
    }

    // Get all verified alumni
    const alumni = await User.find({ 
      role: 'Alumni', 
      isVerified: true 
    }).select('name email profile isVerified');

    // Get AI-powered recommendations
    const recommendations = findBestMatches(req.user, alumni, {
      limit: parseInt(req.query.limit) || 10,
      minScore: parseInt(req.query.minScore) || 20,
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting mentor recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
};

module.exports = { 
  sendMentorshipRequest, 
  getMentorshipRequests, 
  respondToRequest,
  getMentorRecommendations
};
