const express = require('express');
const router = express.Router();
const { getUnverifiedUsers, verifyUser } = require('../controllers/adminController');
const { protect, isInstituteAdmin } = require('../middleware/authMiddleware');

router.route('/verify').get(protect, isInstituteAdmin, getUnverifiedUsers);
router.route('/verify/:id').put(protect, isInstituteAdmin, verifyUser);

module.exports = router;