import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { eventAPI } from '../services/api'
import { Calendar, MapPin, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Events = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await eventAPI.getAll()
      setEvents(response.data)
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId, isRegistered) => {
    try {
      if (isRegistered) {
        await eventAPI.unregister(eventId)
      } else {
        await eventAPI.register(eventId)
      }
      fetchEvents() // refresh events after action
    } catch (err) {
      console.error('Error updating registration:', err)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500">Loading events...</div>
  }

  if (events.length === 0) {
    return <div className="text-center text-gray-500">No upcoming events.</div>
  }

  return (
    <div className="space-y-6">
      {events.map((ev) => {
        const isRegistered = ev.attendees?.includes(user._id)

        return (
          <motion.div
            key={ev._id}
            className="card p-6 hover-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start space-x-4">
              {ev.image && (
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="w-28 h-28 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{ev.title}</h3>
                <p className="text-gray-600 mt-1">{ev.description}</p>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(ev.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {ev.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {ev.attendees?.length || 0} Attendees
                  </div>
                </div>

                {/* Register / Unregister Button */}
                <button
                  onClick={() => handleRegister(ev._id, isRegistered)}
                  className={`mt-4 px-4 py-2 rounded font-medium transition ${
                    isRegistered
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isRegistered ? 'Unregister' : 'Register'}
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default Events
