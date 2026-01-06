import axios from 'axios'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

// const BASE_URL = 'http://localhost:5000/api';
const BASE_URL = 'https://legacylink-06oy.onrender.com/api'
export const API_URL = "https://legacylink-06oy.onrender.com/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors by logging the user out
    if (error.response?.status === 401) {
      Cookies.remove('token')
      Cookies.remove('user')
      // Redirect to login page, ensuring this code only runs on the client-side
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    // Handle validation errors (array of errors from express-validator)
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const validationErrors = error.response.data.errors
      validationErrors.forEach(err => {
        toast.error(`${err.field}: ${err.message}`)
      })
    } else {
      const message = error.response?.data?.message || 'An unexpected error occurred'
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

// --- Auth API ---
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

// --- User API ---
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAlumni: (params = {}) => api.get('/users/alumni', { params }),
  getPublicProfile: (userId) => api.get(`/users/${userId}`),
};

// --- Search API ---
export const searchAPI = {
  global: (params) => api.get('/search', { params }),
  users: (params) => api.get('/search/users', { params }),
};

// --- Admin API ---
export const adminAPI = {
  getUnverifiedUsers: () => api.get('/admin/verify'),
  verifyUser: (userId) => api.put(`/admin/verify/${userId}`),
}

// --- Posts API ---
export const postsAPI = {
  create: (data) => api.post('/posts', data),
  getAll: (params = {}) => api.get('/posts', { params }),
  getById: (postId) => api.get(`/posts/${postId}`),
  like: (postId) => api.put(`/posts/${postId}/like`),
  comment: (postId, data) => api.post(`/posts/${postId}/comment`, data),
  update: (postId, data) => api.put(`/posts/${postId}`, data),
  delete: (postId) => api.delete(`/posts/${postId}`),
  getPostsByUser: (userId) => api.get(`/posts/user/${userId}`),
}

// --- Jobs API ---
export const jobsAPI = {
  create: (data) => api.post('/jobs', data),
  getAll: (params = {}) => api.get('/jobs', { params }),
  delete: (jobId) => api.delete(`/jobs/${jobId}`),
}

// --- Mentorship API ---
export const mentorshipAPI = {
  sendRequest: (data) => api.post('/mentorship/request', data),
  getRequests: (params = {}) => api.get('/mentorship/requests', { params }),
  respondToRequest: (requestId, data) => api.put(`/mentorship/respond/${requestId}`, data),
}

// --- Events API ---
export const eventAPI = {
  create: (data) => api.post('/events', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params = {}) => api.get('/events', { params }),
  register: (eventId) => api.put(`/events/${eventId}/register`),
  unregister: (eventId) => api.put(`/events/${eventId}/unregister`),
  update: (eventId, data) => api.put(`/events/${eventId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (eventId) => api.delete(`/events/${eventId}`) 
};

// --- Chat API ---
export const chatAPI = {
  sendMessage: (message) => api.post('/chat', { message }),
};

// --- Notifications API ---
export const notificationAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (notificationId) => api.delete(`/notifications/${notificationId}`),
  clearRead: () => api.delete('/notifications/clear'),
};

// --- Upload API ---
export const uploadAPI = {
  profilePicture: (formData) => api.post('/upload/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  postImage: (formData) => api.post('/upload/post-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteImage: (imageUrl) => api.delete('/upload/image', { data: { imageUrl } }),
};

// --- Directory API ---
export const directoryAPI = {
  getAlumni: (params = {}) => api.get('/directory/alumni', { params }),
  getUsers: (params = {}) => api.get('/directory/users', { params }),
  getStats: () => api.get('/directory/stats'),
};

// --- Connections API ---
export const connectionAPI = {
  sendRequest: (recipientId, message = '') => api.post('/connections/request', { recipientId, message }),
  respondToRequest: (connectionId, action) => api.put(`/connections/respond/${connectionId}`, { action }),
  getPendingRequests: () => api.get('/connections/requests'),
  getSentRequests: () => api.get('/connections/sent'),
  getConnections: (params = {}) => api.get('/connections', { params }),
  getConnectionStatus: (userId) => api.get(`/connections/status/${userId}`),
  removeConnection: (connectionId) => api.delete(`/connections/${connectionId}`),
  cancelRequest: (connectionId) => api.delete(`/connections/cancel/${connectionId}`),
};

// --- Messages API ---
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (recipientId) => api.post('/messages/conversation', { recipientId }),
  getMessages: (conversationId, params = {}) => api.get(`/messages/conversation/${conversationId}`, { params }),
  sendMessage: (conversationId, content, messageType = 'text') => 
    api.post('/messages/send', { conversationId, content, messageType }),
  markAsRead: (conversationId) => api.put(`/messages/conversation/${conversationId}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  deleteMessage: (conversationId, messageId) => api.delete(`/messages/${conversationId}/${messageId}`),
};

// --- Analytics API (Admin Only) ---
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getUserGrowth: (period = 30) => api.get('/analytics/user-growth', { params: { period } }),
  getEngagement: (period = 30) => api.get('/analytics/engagement', { params: { period } }),
  getTopContributors: (limit = 10) => api.get('/analytics/top-contributors', { params: { limit } }),
  getMentorshipStats: () => api.get('/analytics/mentorship'),
  getSkillDistribution: () => api.get('/analytics/skills'),
};

// --- Mentor Matching API ---
export const mentorMatchAPI = {
  getRecommendations: (params = {}) => api.get('/mentorship/recommendations', { params }),
};
