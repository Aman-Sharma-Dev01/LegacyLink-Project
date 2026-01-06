const Event = require('../models/eventModel');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/uploadMiddleware');

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Institute_Admin
const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, visibility } = req.body;

    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'legacylink/events');
      imageUrl = result.secure_url;
    }

    const event = new Event({
      title,
      description,
      date,
      location,
      visibility,
      image: imageUrl,
      createdBy: req.user._id,
    });

    const createdEvent = await event.save();
    await createdEvent.populate('createdBy', 'name');
    
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

// @desc    Get all events visible to the user (with pagination)
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (req.user.role === 'Student') {
      // Students can only see 'All' events
      query = { visibility: 'All' };
    }

    // Filter by upcoming events only if requested
    if (req.query.upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort({ date: 1 })
      .limit(limit)
      .skip(skip);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching events' });
  }
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
  try {
    const { title, description, date, location, visibility } = req.body;
    const event = await Event.findById(req.params.id);

    if (event) {
        // Ensure the user updating the event is the one who created it
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        // Handle image update
        if (req.file) {
          // Delete old image if exists
          if (event.image) {
            await deleteFromCloudinary(event.image);
          }
          const result = await uploadToCloudinary(req.file.buffer, 'legacylink/events');
          event.image = result.secure_url;
        }
        
        event.title = title || event.title;
        event.description = description || event.description;
        event.date = date || event.date;
        event.location = location || event.location;
        event.visibility = visibility || event.visibility;

        const updatedEvent = await event.save();
        await updatedEvent.populate('createdBy', 'name');
        res.json(updatedEvent);
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating event' });
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
