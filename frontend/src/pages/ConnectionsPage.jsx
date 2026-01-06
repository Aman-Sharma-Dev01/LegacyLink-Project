import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
  Loader2,
  MessageCircle,
  Search,
} from 'lucide-react';
import { connectionAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ConnectionsPage = () => {
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'connections') {
        const { data } = await connectionAPI.getConnections();
        setConnections(data.connections);
        setPagination(data.pagination);
      } else if (activeTab === 'requests') {
        const { data } = await connectionAPI.getPendingRequests();
        setPendingRequests(data);
      } else if (activeTab === 'sent') {
        const { data } = await connectionAPI.getSentRequests();
        setSentRequests(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId) => {
    try {
      await connectionAPI.respondToRequest(connectionId, 'accept');
      toast.success('Connection accepted!');
      setPendingRequests(prev => prev.filter(r => r._id !== connectionId));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (connectionId) => {
    try {
      await connectionAPI.respondToRequest(connectionId, 'reject');
      toast.success('Request declined');
      setPendingRequests(prev => prev.filter(r => r._id !== connectionId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleCancelRequest = async (connectionId) => {
    try {
      await connectionAPI.cancelRequest(connectionId);
      toast.success('Request cancelled');
      setSentRequests(prev => prev.filter(r => r._id !== connectionId));
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Remove this connection?')) return;
    try {
      await connectionAPI.removeConnection(connectionId);
      toast.success('Connection removed');
      setConnections(prev => prev.filter(c => c._id !== connectionId));
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const handleMessage = async (userId) => {
    navigate(`/messages?user=${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Network</h1>
          <Link
            to="/alumni-directory"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Find Connections
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-6">
          <div className="flex border-b dark:border-slate-700">
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'connections'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Connections
              {connections.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
                  {pagination.total || connections.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-sm">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-5 h-5 inline mr-2" />
              Sent
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Connections Tab */}
                  {activeTab === 'connections' && (
                    <div className="space-y-4">
                      {connections.length === 0 ? (
                        <EmptyState
                          icon={<Users className="w-16 h-16" />}
                          title="No connections yet"
                          description="Start building your network by connecting with alumni and students"
                          action={
                            <Link
                              to="/alumni-directory"
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Explore Alumni Directory →
                            </Link>
                          }
                        />
                      ) : (
                        connections.map((connection) => (
                          <ConnectionCard
                            key={connection._id}
                            user={connection.user}
                            connectedAt={connection.connectedAt}
                            onMessage={() => handleMessage(connection.user._id)}
                            onRemove={() => handleRemoveConnection(connection._id)}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Pending Requests Tab */}
                  {activeTab === 'requests' && (
                    <div className="space-y-4">
                      {pendingRequests.length === 0 ? (
                        <EmptyState
                          icon={<UserPlus className="w-16 h-16" />}
                          title="No pending requests"
                          description="When someone wants to connect with you, it will appear here"
                        />
                      ) : (
                        pendingRequests.map((request) => (
                          <RequestCard
                            key={request._id}
                            user={request.requester}
                            message={request.message}
                            createdAt={request.createdAt}
                            onAccept={() => handleAcceptRequest(request._id)}
                            onReject={() => handleRejectRequest(request._id)}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Sent Requests Tab */}
                  {activeTab === 'sent' && (
                    <div className="space-y-4">
                      {sentRequests.length === 0 ? (
                        <EmptyState
                          icon={<Clock className="w-16 h-16" />}
                          title="No pending sent requests"
                          description="Connection requests you've sent will appear here"
                        />
                      ) : (
                        sentRequests.map((request) => (
                          <SentRequestCard
                            key={request._id}
                            user={request.recipient}
                            createdAt={request.createdAt}
                            onCancel={() => handleCancelRequest(request._id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const EmptyState = ({ icon, title, description, action }) => (
  <div className="text-center py-12">
    <div className="text-gray-300 mb-4 flex justify-center">{icon}</div>
    <h3 className="text-lg font-medium text-gray-600">{title}</h3>
    <p className="text-gray-400 mt-1">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const ConnectionCard = ({ user, connectedAt, onMessage, onRemove }) => (
  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
    <Link to={`/profile/${user._id}`} className="flex items-center gap-4">
      {user.profile?.profilePicture && user.profile.profilePicture !== 'default_avatar.png' ? (
        <img
          src={user.profile.profilePicture}
          alt={user.name}
          className="w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      <div>
        <h3 className="font-medium text-gray-900">{user.name}</h3>
        <p className="text-sm text-gray-500">
          {user.profile?.jobTitle && `${user.profile.jobTitle} at `}
          {user.profile?.company || user.role}
        </p>
        <p className="text-xs text-gray-400">
          Connected {formatDistanceToNow(new Date(connectedAt), { addSuffix: true })}
        </p>
      </div>
    </Link>
    <div className="flex items-center gap-2">
      <button
        onClick={onMessage}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Send message"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
      <button
        onClick={onRemove}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Remove connection"
      >
        <UserX className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const RequestCard = ({ user, message, createdAt, onAccept, onReject }) => (
  <div className="p-4 border rounded-lg">
    <div className="flex items-start justify-between">
      <Link to={`/profile/${user._id}`} className="flex items-center gap-4">
        {user.profile?.profilePicture && user.profile.profilePicture !== 'default_avatar.png' ? (
          <img
            src={user.profile.profilePicture}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-medium text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.role}</p>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          Accept
        </button>
        <button
          onClick={onReject}
          className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Decline
        </button>
      </div>
    </div>
    {message && (
      <div className="mt-3 ml-18 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        "{message}"
      </div>
    )}
  </div>
);

const SentRequestCard = ({ user, createdAt, onCancel }) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <Link to={`/profile/${user._id}`} className="flex items-center gap-4">
      {user.profile?.profilePicture && user.profile.profilePicture !== 'default_avatar.png' ? (
        <img
          src={user.profile.profilePicture}
          alt={user.name}
          className="w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      <div>
        <h3 className="font-medium text-gray-900">{user.name}</h3>
        <p className="text-sm text-gray-500">{user.role}</p>
        <p className="text-xs text-gray-400">
          Sent {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </Link>
    <div className="flex items-center gap-2">
      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
        Pending
      </span>
      <button
        onClick={onCancel}
        className="px-3 py-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
      >
        Cancel
      </button>
    </div>
  </div>
);

export default ConnectionsPage;
