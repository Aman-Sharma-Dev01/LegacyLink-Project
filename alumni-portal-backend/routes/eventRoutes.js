const express = require('express');
const router = express.Router();
const { createEvent, getEvents, registerForEvent } = require('../controllers/eventController');
const { protect, isInstituteAdmin } = require('../middleware/authMiddleware');

router.route('/').post(protect, isInstituteAdmin, createEvent).get(protect, getEvents);
router.route('/:id/register').put(protect, registerForEvent);

module.exports = router;