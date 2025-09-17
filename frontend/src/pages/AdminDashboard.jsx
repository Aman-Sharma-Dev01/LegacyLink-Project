import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI, eventAPI } from '../services/api'
import {
  Users, UserCheck, UserX, Clock, Search, Filter,
  Mail, Calendar, ArrowLeft, PlusCircle, Trash2, Edit3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ------------------ EVENT MODAL ------------------
const EventModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [visibility, setVisibility] = useState('Alumni_Only')
  const [image, setImage] = useState(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setDate(initialData.date ? initialData.date.split('T')[0] : '')
      setLocation(initialData.location || '')
      setVisibility(initialData.visibility || 'Alumni_Only')
      setImage(null)
    } else {
      setTitle('')
      setDescription('')
      setDate('')
      setLocation('')
      setVisibility('Alumni_Only')
      setImage(null)
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('date', date)
    formData.append('location', location)
    formData.append('visibility', visibility)
    if (image) formData.append('image', image)
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? 'Edit Event' : 'Create Event'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <textarea
            placeholder="Event Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="Alumni_Only">Alumni Only</option>
            <option value="All">All</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full border p-2 rounded"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ------------------ MAIN DASHBOARD ------------------
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('verification')
  const [unverifiedUsers, setUnverifiedUsers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [processingUsers, setProcessingUsers] = useState(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (activeTab === 'verification') {
      fetchUnverifiedUsers()
    } else if (activeTab === 'events') {
      fetchEvents()
    }
  }, [activeTab])

  // -------- USER VERIFICATION --------
  const fetchUnverifiedUsers = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getUnverifiedUsers()
      setUnverifiedUsers(response.data)
    } catch (error) {
      console.error('Error fetching unverified users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyUser = async (userId) => {
    setProcessingUsers(prev => new Set([...prev, userId]))
    try {
      await adminAPI.verifyUser(userId)
      setUnverifiedUsers(prev => prev.filter(u => u._id !== userId))
      toast.success('User verified successfully!')
    } catch (error) {
      console.error('Error verifying user:', error)
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const filteredUsers = unverifiedUsers.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterRole === 'All' || u.role === filterRole
    return matchesSearch && matchesFilter
  })

  const stats = [
    { title: 'Pending Verification', value: unverifiedUsers.length, icon: <Clock className="w-6 h-6" />, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Students', value: unverifiedUsers.filter(u => u.role === 'Student').length, icon: <Users className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600' },
    { title: 'Alumni', value: unverifiedUsers.filter(u => u.role === 'Alumni').length, icon: <UserCheck className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
    { title: 'Admins', value: unverifiedUsers.filter(u => u.role === 'Institute_Admin').length, icon: <UserX className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
  ]

  // -------- EVENTS MANAGEMENT --------
  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await eventAPI.getAll()
      setEvents(response.data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEvent = async (formData) => {
    try {
      if (editEvent) {
        await eventAPI.update(editEvent._id, formData)
        toast.success('Event updated successfully!')
      } else {
        await eventAPI.create(formData)
        toast.success('Event created successfully!')
      }
      setIsModalOpen(false)
      setEditEvent(null)
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    try {
      await eventAPI.delete(eventId)
      setEvents(prev => prev.filter(ev => ev._id !== eventId))
      toast.success('Event deleted successfully!')
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  // -------- LOADING STATE --------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-linkedin-blue rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{user?.name}</div>
              <div className="text-sm text-gray-500">Administrator</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'verification' ? 'bg-linkedin-blue text-white' : 'bg-white border'}`}
          >
            User Verification
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'events' ? 'bg-linkedin-blue text-white' : 'bg-white border'}`}
          >
            Events
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'verification' ? (
          <>
            {/* Stats */}
            <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {stats.map((stat, index) => (
                <div key={index} className="card p-6 hover-lift">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Search & Filter */}
            <motion.div className="card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="pl-10 pr-8 py-3 border rounded-lg bg-white"
                  >
                    <option value="All">All Roles</option>
                    <option value="Student">Students</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Institute_Admin">Admins</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* User List */}
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {filteredUsers.length === 0 ? (
                <div className="card p-12 text-center text-gray-500">No users pending verification.</div>
              ) : (
                filteredUsers.map((user) => (
                  <UserVerificationCard key={user._id} user={user} onVerify={handleVerifyUser} isProcessing={processingUsers.has(user._id)} />
                ))
              )}
            </motion.div>
          </>
        ) : (
          <>
            {/* Events Section */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Events</h2>
              <button
                onClick={() => { setIsModalOpen(true); setEditEvent(null) }}
                className="btn-primary flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            </div>

            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="card p-12 text-center text-gray-500">No events found.</div>
              ) : (
                events.map((ev) => (
                  <motion.div key={ev._id} className="card p-6 flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                      <h3 className="text-lg font-semibold">{ev.title}</h3>
                      <p className="text-sm text-gray-600">{new Date(ev.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => { setIsModalOpen(true); setEditEvent(ev) }}
                        className="btn-secondary flex items-center space-x-1"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev._id)}
                        className="btn-danger flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Event Modal */}
            <EventModal
              isOpen={isModalOpen}
              onClose={() => { setIsModalOpen(false); setEditEvent(null) }}
              onSubmit={handleSaveEvent}
              initialData={editEvent}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ------------------ USER CARD ------------------
const UserVerificationCard = ({ user, onVerify, isProcessing }) => {
  const [showDetails, setShowDetails] = useState(false)
  const getRoleColor = (role) => {
    const colors = {
      Student: 'bg-blue-100 text-blue-800',
      Alumni: 'bg-green-100 text-green-800',
      Institute_Admin: 'bg-purple-100 text-purple-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <motion.div className="card p-6 hover-lift" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} layout>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 bg-linkedin-blue rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">{user.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 truncate">{user.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>{user.role.replace('_', ' ')}</span>
            </div>
            <div className="space-y-1 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Registered {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
            {showDetails && (
              <motion.div className="mt-4 pt-4 border-t text-sm text-gray-700" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div>User ID: {user._id}</div>
                <div>Status: Pending Verification</div>
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          <button onClick={() => setShowDetails(!showDetails)} className="btn-secondary">
            {showDetails ? 'Hide' : 'Details'}
          </button>
          <button onClick={() => onVerify(user._id)} disabled={isProcessing} className="btn-primary disabled:opacity-50">
            {isProcessing ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminDashboard
