const express = require('express');
const router = express.Router();
const { globalSearch, searchUsers } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');
const { validateSearch, validatePagination } = require('../middleware/validators');
const { searchLimiter } = require('../middleware/rateLimiter');

// Global search across all content
router.get('/', protect, searchLimiter, validateSearch, validatePagination, globalSearch);

// Search users with filters
router.get('/users', protect, searchLimiter, validateSearch, validatePagination, searchUsers);

module.exports = router;
