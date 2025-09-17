const MentorshipRequest = require('../models/mentorshipRequestModel');
const User = require('../models/userModel');

// @desc    Send a mentorship request
// @route   POST /api/mentorship/request
// @access  Private/Student
const sendMentorshipRequest = async (req, res) => {
    const { alumniId, message } = req.body;

    // Ensure target user is an Alumni
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

// @desc    Get mentorship requests for an alumni
// @route   GET /api/mentorship/requests
// @access  Private/Alumni
const getMentorshipRequests = async (req, res) => {
    const requests = await MentorshipRequest.find({ alumni: req.user._id, status: 'Pending' })
        .populate('student', 'name profile');
    res.json(requests);
};

// @desc    Respond to a mentorship request
// @route   PUT /api/mentorship/respond/:id
// @access  Private/Alumni
const respondToRequest = async (req, res) => {
    const { status } = req.body; // 'Accepted' or 'Rejected'

    const request = await MentorshipRequest.findById(req.params.id);

    if (request && request.alumni.toString() === req.user._id.toString()) {
        request.status = status;
        await request.save();
        res.json({ message: `Request ${status}` });
    } else {
        res.status(404).json({ message: 'Request not found or not authorized' });
    }
};

module.exports = { sendMentorshipRequest, getMentorshipRequests, respondToRequest };