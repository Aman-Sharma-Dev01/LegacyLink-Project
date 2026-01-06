const express = require('express');
const router = express.Router();
const {
  sendMentorshipRequest,
  getMentorshipRequests,
  respondToRequest,
  getMentorRecommendations,
} = require('../controllers/mentorshipController');
const { protect, isAlumni, isStudent } = require('../middleware/authMiddleware');
const { validateMentorshipRequest, validateMentorshipResponse, validateMongoId, validatePagination } = require('../middleware/validators');

// AI-powered mentor recommendations (Student only)
router.route('/recommendations').get(protect, isStudent, getMentorRecommendations);

// Student route - only students can send mentorship requests
router.route('/request').post(protect, isStudent, validateMentorshipRequest, sendMentorshipRequest);

// Requests route accessible by both Student and Alumni
router.route('/requests').get(protect, validatePagination, getMentorshipRequests);

// Respond route (Alumni only)
router.route('/respond/:id').put(protect, isAlumni, validateMongoId, validateMentorshipResponse, respondToRequest);

module.exports = router;
