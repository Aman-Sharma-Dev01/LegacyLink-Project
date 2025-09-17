const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getAlumniProfiles } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/alumni').get(protect, getAlumniProfiles);

module.exports = router;