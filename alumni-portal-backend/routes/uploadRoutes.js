const express = require('express');
const router = express.Router();
const {
  uploadProfilePictureHandler,
  uploadPostImageHandler,
  deleteImageHandler,
} = require('../controllers/uploadController');
const { protect, isAlumni } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { postLimiter } = require('../middleware/rateLimiter');

// Profile picture upload (any authenticated user)
router.post(
  '/profile-picture',
  protect,
  upload.single('image'),
  uploadProfilePictureHandler
);

// Post image upload (alumni only)
router.post(
  '/post-image',
  protect,
  isAlumni,
  postLimiter,
  upload.single('image'),
  uploadPostImageHandler
);

// Delete image
router.delete('/image', protect, deleteImageHandler);

module.exports = router;
