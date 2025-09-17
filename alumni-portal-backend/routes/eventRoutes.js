const express = require('express');
const router = express.Router();
// ➕ ADD updateEvent and deleteEvent
const { createEvent, getEvents, registerForEvent, updateEvent, deleteEvent, unregisterForEvent, } = require('../controllers/eventController');
const { protect, isInstituteAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, isInstituteAdmin, createEvent)
    .get(protect, getEvents);

// ➕ ADD a route for updating and deleting a specific event
router.route('/:id')
    .put(protect, isInstituteAdmin, updateEvent)
    .delete(protect, isInstituteAdmin, deleteEvent);

router.route('/:id/register').put(protect, registerForEvent);
router.route('/:id/unregister').put(protect, unregisterForEvent); 

module.exports = router;