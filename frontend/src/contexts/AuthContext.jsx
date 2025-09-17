import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { api } from '../services/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    const userData = Cookies.get('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (error) {
        console.error('Error parsing user data:', error)
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    setUser(userData)
    Cookies.set('token', token, { expires: 7 }) // 7 days
    Cookies.set('user', JSON.stringify(userData), { expires: 7 })
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  const logout = () => {
    setUser(null)
    Cookies.remove('token')
    Cookies.remove('user')
    delete api.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Institute_Admin',
    isAlumni: user?.role === 'Alumni',
    isStudent: user?.role === 'Student'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}