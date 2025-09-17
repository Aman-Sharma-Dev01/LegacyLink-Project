import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
// --- CHANGED: Import both userAPI and mentorshipAPI ---
import { mentorshipAPI, userAPI } from '../services/api' 
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Clock, 
  Check, 
  X, 
  Send,
  Star,
  Search,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

const Mentorship = () => {
  const [mentorshipRequests, setMentorshipRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const { user, isAlumni, isStudent } = useAuth()

  useEffect(() => {
    fetchMentorshipRequests()
  }, [])

  const fetchMentorshipRequests = async () => {
    try {
      const response = await mentorshipAPI.getRequests()
      setMentorshipRequests(response.data)
    } catch (error) {
      console.error('Error fetching mentorship requests:', error)
      // Toast notifications are now handled by your api.js interceptor
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToRequest = async (requestId, status) => {
    try {
      await mentorshipAPI.respondToRequest(requestId, { status })
      setMentorshipRequests(prev =>
        prev.map(req =>
          req._id === requestId ? { ...req, status } : req
        )
      )
      toast.success(`Request ${status.toLowerCase()} successfully!`)
    } catch (error) {
      console.error('Error responding to request:', error)
    }
  }

  const filteredRequests = mentorshipRequests.filter(request => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      request.student?.name?.toLowerCase().includes(searchLower) ||
      request.alumni?.name?.toLowerCase().includes(searchLower) ||
      request.message?.toLowerCase().includes(searchLower)
    const matchesFilter = filterStatus === 'All' || request.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow-sm animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="h-8 bg-gray-300 rounded w-24"></div>
            </div>
            <div className="h-16 bg-gray-300 rounded mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-300 rounded w-20"></div>
              <div className="h-8 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-600">
            {isStudent 
              ? "Connect with experienced alumni for guidance and career advice"
              : "Share your knowledge and help the next generation of professionals"}
          </p>
        </div>
        
        {isStudent && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Request Mentor</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{mentorshipRequests.length}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
          </div>
        </div>
        
        {/* Pending */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{mentorshipRequests.filter(r => r.status === 'Pending').length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
        
        {/* Accepted */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{mentorshipRequests.filter(r => r.status === 'Accepted').length}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
          </div>
        </div>
        
        {/* Rejected */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{mentorshipRequests.filter(r => r.status === 'Rejected').length}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Mentorship Requests List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredRequests.map((request) => (
            <MentorshipCard
              key={request._id}
              request={request}
              currentUser={user}
              onRespond={handleRespondToRequest}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredRequests.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Mentorship Requests Found</h3>
          <p className="text-gray-500 text-sm">
            {searchTerm || filterStatus !== 'All'
              ? "No requests match your current search or filter."
              : isStudent 
                ? "You haven't sent any requests yet. Find a mentor to get started!"
                : "No students have requested your mentorship yet."}
          </p>
        </div>
      )}

      {/* Request Mentorship Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <RequestMentorshipModal
            onClose={() => setShowRequestModal(false)}
            onSuccess={(newRequest) => {
              setMentorshipRequests([newRequest, ...mentorshipRequests]);
              setShowRequestModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const MentorshipCard = ({ request, currentUser, onRespond }) => {
  const getStatusClasses = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const timeAgo = (date) => {
    // A more robust time-ago function can be used here
    return new Date(date).toLocaleDateString();
  }

const alumniId = typeof request.alumni === 'string' ? request.alumni : request.alumni?._id;
const isAlumniRecipient = currentUser?._id === alumniId;
const canRespond = isAlumniRecipient && request.status === 'Pending';


  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-sm transition-shadow hover:shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
            {isAlumniRecipient 
              ? request.student?.name?.charAt(0)?.toUpperCase() 
              : request.alumni?.name?.charAt(0)?.toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">
                {isAlumniRecipient ? request.student?.name : `To: ${request.alumni?.name}`}
              </h3>
            </div>
            <div className="text-sm text-gray-500 mb-3">Requested {timeAgo(request.createdAt)}</div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-700 italic">"{request.message}"</p>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(request.status)}`}>
          {request.status}
        </span>
      </div>

      {canRespond && (
        <div className="flex space-x-3 border-t pt-4 mt-4">
          <button
            onClick={() => onRespond(request._id, 'Accepted')}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Accept</span>
          </button>
          <button
            onClick={() => onRespond(request._id, 'Rejected')}
            className="btn-danger flex-1 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>
      )}

      {request.status === 'Accepted' && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-700">
              <strong>Mentorship Active!</strong> You can now connect directly.
            </p>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Message</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

const RequestMentorshipModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ alumniId: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alumni, setAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // --- ADDED: State to manage the fetching of the alumni list ---
  const [isFetchingAlumni, setIsFetchingAlumni] = useState(true);

  // --- CHANGED: This now fetches real alumni data from your API ---
  useEffect(() => {
    const fetchAlumni = async () => {
      setIsFetchingAlumni(true);
      try {
        const response = await userAPI.getAlumni();
        // Add placeholder expertise for UI richness, as the backend doesn't provide it.
        const alumniWithDetails = response.data.map(a => ({
          ...a,
          expertise: ['Leadership', 'Software', 'Product Management'].slice(0, Math.floor(Math.random() * 2) + 1),
        }));
        setAlumni(alumniWithDetails);
      } catch (error) {
        console.error("Failed to fetch alumni:", error);
      } finally {
        setIsFetchingAlumni(false);
      }
    };
    fetchAlumni();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.alumniId || !formData.message.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await mentorshipAPI.sendRequest(formData);
      toast.success('Mentorship request sent successfully!');
      onSuccess(response.data);
    } catch (error) {
      console.error('Error sending mentorship request:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- CHANGED: Filter logic updated for the real data structure from your backend ---
  const filteredAlumni = alumni.filter(person => {
    const searchLower = searchTerm.toLowerCase();
    return (
      person.name.toLowerCase().includes(searchLower) ||
      person.profile?.company?.toLowerCase().includes(searchLower) ||
      person.profile?.jobTitle?.toLowerCase().includes(searchLower) ||
      person.expertise.some(skill => skill.toLowerCase().includes(searchLower))
    );
  });

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Request Mentorship</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Alumni Search & Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose a Mentor</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, company, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
              {isFetchingAlumni ? (
                <p className="text-center py-4 text-gray-500">Loading Alumni...</p>
              ) : filteredAlumni.length > 0 ? (
                filteredAlumni.map((person) => (
                  <label key={person._id} className={`flex p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.alumniId === person._id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-transparent hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="alumniId"
                      value={person._id}
                      checked={formData.alumniId === person._id}
                      onChange={(e) => setFormData(prev => ({ ...prev, alumniId: e.target.value }))}
                      className="mt-1"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-gray-900">{person.name}</div>
                      {/* --- CHANGED: Using person.profile for job details --- */}
                      <div className="text-sm text-gray-600">{person.profile.jobTitle} at {person.profile.company}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {person.expertise.map((skill, index) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">No alumni found matching your search.</p>
              )}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Introduce Yourself</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              maxLength={500}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell them about your goals and why you'd like them as a mentor..."
              required
            />
            <p className="text-right text-xs text-gray-500 mt-1">{formData.message.length} / 500</p>
          </div>
        </form>
        
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.alumniId || !formData.message.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Mentorship