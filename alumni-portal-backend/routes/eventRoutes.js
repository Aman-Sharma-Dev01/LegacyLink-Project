const express = require('express');
const router = express.Router();
const { createEvent, getEvents, registerForEvent, updateEvent, deleteEvent, unregisterForEvent } = require('../controllers/eventController');
const { protect, isInstituteAdmin } = require('../middleware/authMiddleware');
const { validateEvent, validatePagination, validateMongoId } = require('../middleware/validators');
const { upload } = require('../middleware/uploadMiddleware');

router.route('/')
    .post(protect, isInstituteAdmin, upload.single('image'), validateEvent, createEvent)
    .get(protect, validatePagination, getEvents);

router.route('/:id')
    .put(protect, isInstituteAdmin, upload.single('image'), validateMongoId, validateEvent, updateEvent)
    .delete(protect, isInstituteAdmin, validateMongoId, deleteEvent);

router.route('/:id/register').put(protect, validateMongoId, registerForEvent);
router.route('/:id/unregister').put(protect, validateMongoId, unregisterForEvent); 

module.exports = router;