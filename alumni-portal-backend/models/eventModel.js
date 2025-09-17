const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    createdBy: { // Institute Admin
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    image: { type: String },
    visibility: {
        type: String,
        enum: ['Alumni_Only', 'All'], // Control who can see the event
        default: 'Alumni_Only',
    },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;