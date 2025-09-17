const Event = require('../models/eventModel');

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Institute_Admin
const createEvent = async (req, res) => {
    const { title, description, date, location, visibility } = req.body;

    const event = new Event({
        title,
        description,
        date,
        location,
        visibility,
        createdBy: req.user._id,
    });

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
};

// @desc    Get all events visible to the user
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
    let query = {};
    if (req.user.role === 'Student') {
        // Students can only see 'All' events
        query = { visibility: 'All' };
    }
    // Alumni and Admins can see all events
    const events = await Event.find(query).populate('createdBy', 'name').sort({ date: 1 });
    res.json(events);
};


// @desc    Register for an event
// @route   PUT /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (event) {
        if (event.attendees.some(id => id.toString() === req.user._id.toString())) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }
        event.attendees.push(req.user._id);
        await event.save();
        res.json({ message: 'Registered for event successfully' });
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
}

module.exports = { createEvent, getEvents, registerForEvent };