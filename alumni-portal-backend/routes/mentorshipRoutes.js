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

// Alumni routes
router.route('/requests').get(protect, isAlumni, getMentorshipRequests);
router.route('/respond/:id').put(protect, isAlumni, respondToRequest);

module.exports = router;