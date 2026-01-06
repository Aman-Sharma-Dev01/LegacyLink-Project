const express = require('express');
const router = express.Router();
const {
  getAlumniDirectory,
  getUsersDirectory,
  getDirectoryStats,
} = require('../controllers/directoryController');
const { protect } = require('../middleware/authMiddleware');
const { validatePagination } = require('../middleware/validators');

// All routes require authentication
router.use(protect);

router.get('/alumni', validatePagination, getAlumniDirectory);
router.get('/users', validatePagination, getUsersDirectory);
router.get('/stats', getDirectoryStats);

module.exports = router;
