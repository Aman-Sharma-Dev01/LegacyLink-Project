import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Feed from '../components/Feed'
import JobBoard from '../components/JobBoard'
import Mentorship from '../components/Mentorship'
import Profile from '../components/Profile'
import Events from '../components/Events'
import { Briefcase, MessageSquare, Users, User, Calendar } from 'lucide-react'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('feed')
  const { user } = useAuth()

  const tabs = [
    { id: 'feed', label: 'Feed', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'mentorship', label: 'Mentorship', icon: <Users className="w-5 h-5" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <Feed />
      case 'jobs':
        return <JobBoard />
      case 'mentorship':
        return <Mentorship />
      case 'events':
        return <Events />
      case 'profile':
        return <Profile />
      default:
        return <Feed />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
        
        <main className="flex-1 lg:ml-64">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
