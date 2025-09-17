import axios from 'axios'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

const BASE_URL = 'http://localhost:5001/api'

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
    
    const message = error.response?.data?.message || 'An unexpected error occurred'
    toast.error(message)
    return Promise.reject(error)
  }
)

// --- Auth API ---
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

// --- User API ---
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAlumni: () => api.get('/users/alumni'),

};

// --- Admin API ---
export const adminAPI = {
  getUnverifiedUsers: () => api.get('/admin/verify'),
  verifyUser: (userId) => api.put(`/admin/verify/${userId}`),
}

// --- Posts API ---
export const postsAPI = {
  create: (data) => api.post('/posts', data),
  getAll: () => api.get('/posts'),
  like: (postId) => api.put(`/posts/${postId}/like`),
  comment: (postId, data) => api.post(`/posts/${postId}/comment`, data),
  delete: (postId) => api.delete(`/posts/${postId}`),
  getPostsByUser: (userId) => api.get(`/posts/user/${userId}`),
}

// --- Jobs API ---
export const jobsAPI = {
  create: (data) => api.post('/jobs', data),
  getAll: () => api.get('/jobs'),
  delete: (jobId) => api.delete(`/jobs/${jobId}`),
}

// --- Mentorship API ---
export const mentorshipAPI = {
  sendRequest: (data) => api.post('/mentorship/request', data),
  getRequests: () => api.get('/mentorship/requests'),
  respondToRequest: (requestId, data) => api.put(`/mentorship/respond/${requestId}`, data),
}

// --- Events API (Newly Added) ---
// In src/services/api.js

export const eventAPI = {
  create: (data) => api.post('/events', data),
  getAll: () => api.get('/events'),
  register: (eventId) => api.put(`/events/${eventId}/register`),
  unregister: (eventId) => api.put(`/events/${eventId}/unregister`),     // ➕ ADD
  update: (eventId, data) => api.put(`/events/${eventId}`, data), // ➕ ADD
  delete: (eventId) => api.delete(`/events/${eventId}`) 
};
