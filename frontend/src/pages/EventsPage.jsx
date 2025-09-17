// src/pages/EventsPage.jsx
import { useState } from "react";
import axios from "axios";
import EventModal from "../components/events/EventModal";

const EventsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  const handleCreate = async (formData) => {
    try {
      if (editEvent) {
        await axios.put(`/api/events/${editEvent._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("/api/events", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setIsModalOpen(false);
      setEditEvent(null);
      // refresh events list here
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        + Create Event
      </button>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditEvent(null);
        }}
        onSubmit={handleCreate}
        initialData={editEvent}
      />
    </div>
  );
};

export default EventsPage;
