const express = require('express');
const router = express.Router();
const { getUserProfile, getPublicProfile, updateUserProfile, getAlumniProfiles } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateProfileUpdate, validatePagination, validateMongoId } = require('../middleware/validators');

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validateProfileUpdate, updateUserProfile);

router.route('/alumni').get(protect, validatePagination, getAlumniProfiles);
router.route('/:id').get(protect, validateMongoId, getPublicProfile);

module.exports = router;