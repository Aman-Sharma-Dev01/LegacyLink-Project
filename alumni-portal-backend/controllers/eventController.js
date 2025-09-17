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


// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Institute_Admin
const updateEvent = async (req, res) => {
    const { title, description, date, location, visibility } = req.body;
    const event = await Event.findById(req.params.id);

    if (event) {
        // Ensure the user updating the event is the one who created it
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        event.title = title || event.title;
        event.description = description || event.description;
        event.date = date || event.date;
        event.location = location || event.location;
        event.visibility = visibility || event.visibility;

        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Institute_Admin
const deleteEvent = async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (event) {
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        await event.deleteOne();
        res.json({ message: 'Event removed' });
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
};

// @desc    Unregister from an event
// @route   PUT /api/events/:id/unregister
// @access  Private
const unregisterForEvent = async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (event) {
        if (!event.attendees.some(id => id.toString() === req.user._id.toString())) {
            return res.status(400).json({ message: 'You are not registered for this event' });
        }
        event.attendees = event.attendees.filter(
            (id) => id.toString() !== req.user._id.toString()
        );
        await event.save();
        res.json({ message: 'Unregistered from event successfully' });
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
};


module.exports = { 
    createEvent, 
    getEvents, 
    registerForEvent, 
     unregisterForEvent,
    updateEvent, // ➕ ADD
    deleteEvent  // ➕ ADD
};
