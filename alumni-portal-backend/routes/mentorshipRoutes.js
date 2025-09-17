const express = require('express');
const router = express.Router();
const {
  sendMentorshipRequest,
  getMentorshipRequests,
  respondToRequest,
} = require('../controllers/mentorshipController');
const { protect, isAlumni } = require('../middleware/authMiddleware');

// Student route
router.route('/request').post(protect, sendMentorshipRequest);

// Requests route accessible by both Student and Alumni
router.route('/requests').get(protect, getMentorshipRequests);

// Respond route (Alumni only)
router.route('/respond/:id').put(protect, isAlumni, respondToRequest);

module.exports = router;
