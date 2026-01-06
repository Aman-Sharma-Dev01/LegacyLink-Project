import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { searchAPI, messageAPI, connectionAPI } from '../services/api'
import { NotificationBell } from './Notifications'
import ThemeToggle from './ThemeToggle'
import { 
  GraduationCap, 
  Search, 
  LogOut, 
  ChevronDown,
  Menu,
  ShieldCheck,
  User,
  Briefcase,
  FileText,
  Calendar,
  X,
  Loader2,
  Users,
  MessageCircle,
  UserPlus
} from 'lucide-react'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingConnections, setPendingConnections] = useState(0)
  const searchRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Fetch unread counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [messagesRes, connectionsRes] = await Promise.all([
          messageAPI.getUnreadCount(),
          connectionAPI.getPendingRequests()
        ])
        setUnreadMessages(messagesRes.data.unreadCount || 0)
        setPendingConnections(connectionsRes.data.length || 0)
      } catch (error) {
        console.error('Error fetching counts:', error)
      }
    }
    fetchCounts()
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults(null)
      setShowSearchResults(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await searchAPI.global({ q: searchQuery, type: 'all' })
        setSearchResults(response.data)
        setShowSearchResults(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setShowSearchResults(false)
  }

  const handleResultClick = () => {
    clearSearch()
  }

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-linkedin-blue" />
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">LegacyLink</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative" ref={searchRef}>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                placeholder="Search alumni, posts, jobs..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50"
                >
                  {searchResults.totalResults === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No results found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                      {/* Users Section */}
                      {searchResults.users?.length > 0 && (
                        <div className="px-3 py-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                            <User className="w-3 h-3 mr-1" /> People
                          </div>
                          {searchResults.users.map((user) => (
                            <Link
                              key={user._id}
                              to={`/dashboard?view=profile&userId=${user._id}`}
                              onClick={handleResultClick}
                              className="flex items-center px-2 py-2 hover:bg-gray-50 rounded-md"
                            >
                              <div className="w-8 h-8 bg-linkedin-blue rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {user.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">
                                  {user.profile?.headline || user.role}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Jobs Section */}
                      {searchResults.jobs?.length > 0 && (
                        <div className="px-3 py-2 border-t">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" /> Jobs
                          </div>
                          {searchResults.jobs.map((job) => (
                            <Link
                              key={job._id}
                              to="/dashboard?tab=jobs"
                              onClick={handleResultClick}
                              className="block px-2 py-2 hover:bg-gray-50 rounded-md"
                            >
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Posts Section */}
                      {searchResults.posts?.length > 0 && (
                        <div className="px-3 py-2 border-t">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                            <FileText className="w-3 h-3 mr-1" /> Posts
                          </div>
                          {searchResults.posts.map((post) => (
                            <div
                              key={post._id}
                              onClick={handleResultClick}
                              className="px-2 py-2 hover:bg-gray-50 rounded-md cursor-pointer"
                            >
                              <div className="text-sm text-gray-900 line-clamp-2">{post.text}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                by {post.user?.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Events Section */}
                      {searchResults.events?.length > 0 && (
                        <div className="px-3 py-2 border-t">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> Events
                          </div>
                          {searchResults.events.map((event) => (
                            <Link
                              key={event._id}
                              to="/dashboard?tab=events"
                              onClick={handleResultClick}
                              className="block px-2 py-2 hover:bg-gray-50 rounded-md"
                            >
                              <div className="text-sm font-medium text-gray-900">{event.title}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(event.date).toLocaleDateString()} • {event.location}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Alumni Directory Link */}
            <Link
              to="/alumni-directory"
              className="hidden md:flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Directory</span>
            </Link>

            {/* Connections Link */}
            <Link
              to="/connections"
              className="hidden md:flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors relative"
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-sm font-medium">Network</span>
              {pendingConnections > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingConnections > 9 ? '9+' : pendingConnections}
                </span>
              )}
            </Link>

            {/* Messages Link */}
            <Link
              to="/messages"
              className="hidden md:flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors relative"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Messages</span>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden md:flex btn-secondary text-sm py-2 px-4"
              >
                Admin Panel
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-linkedin-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                    <span>{user?.name}</span>
                    {user?.isVerified ? (
                      <ShieldCheck className="w-4 h-4 bold text-linkedin-blue" />
                    ) : (
                      <span className="text-xs text-gray-500">Unverified</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b">
                      <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                        <span>{user?.name}</span>
                        {user?.isVerified ? (
                          <ShieldCheck className="w-4 h-4 bold text-linkedin-blue" />
                        ) : (
                          <span className="text-xs text-gray-500">Unverified</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                      <div className="text-xs text-linkedin-blue font-medium">{user?.role}</div>
                    </div>

                    <hr className="my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t py-4"
            >
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-5 w-5 text-gray-400" />
                    </button>
                  )}
                </div>
                
                {/* Mobile Search Results */}
                {showSearchResults && searchResults && searchResults.totalResults > 0 && (
                  <div className="bg-gray-50 rounded-lg p-2 max-h-60 overflow-y-auto">
                    {searchResults.users?.slice(0, 3).map((u) => (
                      <Link
                        key={u._id}
                        to={`/dashboard?view=profile&userId=${u._id}`}
                        onClick={() => { handleResultClick(); setShowMobileMenu(false); }}
                        className="flex items-center px-2 py-2 hover:bg-white rounded-md"
                      >
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm">{u.name}</span>
                      </Link>
                    ))}
                    {searchResults.jobs?.slice(0, 2).map((j) => (
                      <Link
                        key={j._id}
                        to="/dashboard?tab=jobs"
                        onClick={() => { handleResultClick(); setShowMobileMenu(false); }}
                        className="flex items-center px-2 py-2 hover:bg-white rounded-md"
                      >
                        <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm">{j.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar
