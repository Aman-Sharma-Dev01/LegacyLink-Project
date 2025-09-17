import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ activeTab, setActiveTab, tabs }) => {
  const { user } = useAuth()

  return (
    <aside className="fixed left-0 top-16 h-full w-64 bg-white shadow-sm border-r z-30 hidden lg:block">
      <div className="p-6">
        {/* User Info Card */}
        <motion.div 
          className="bg-gradient-to-r from-linkedin-blue to-linkedin-lightblue rounded-lg p-4 text-white mb-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-blue-100 text-sm">{user?.role}</div>
              {!user?.isVerified && (
                <div className="text-yellow-300 text-xs mt-1">Pending Verification</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-linkedin-blue text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        {/* <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Connections</span>
              <span className="font-medium">42</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Profile Views</span>
              <span className="font-medium">128</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Posts</span>
              <span className="font-medium">15</span>
            </div>
          </div>
        </div> */}

        {/* Recent Activity */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">New job posting</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Mentorship request</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Profile update</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar