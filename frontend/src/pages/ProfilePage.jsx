import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Briefcase,
  MapPin,
  GraduationCap,
  Mail,
  Calendar,
  ArrowLeft,
  MessageCircle,
  UserPlus,
  UserMinus,
  Check,
  Clock,
  Loader2,
  Building2,
} from 'lucide-react';
import { userAPI, connectionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (userId !== currentUser?._id) {
      fetchConnectionStatus();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await userAPI.getPublicProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Profile not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async () => {
    try {
      const { data } = await connectionAPI.getConnectionStatus(userId);
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({ status: 'none' });
    }
  };

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      await connectionAPI.sendRequest(userId);
      setConnectionStatus({ status: 'pending', direction: 'sent' });
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages?user=${userId}`);
  };

  const handleRemoveConnection = async () => {
    if (!connectionStatus?.connectionId) return;
    setActionLoading(true);
    try {
      await connectionAPI.removeConnection(connectionStatus.connectionId);
      setConnectionStatus({ status: 'none' });
      toast.success('Connection removed');
    } catch (error) {
      toast.error('Failed to remove connection');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-600 dark:text-slate-400">Profile not found</h2>
          <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {/* Cover / Header */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600" />

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              {profile.profile?.profilePicture && profile.profile.profilePicture !== 'default_avatar.png' ? (
                <img
                  src={profile.profile.profilePicture}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Title */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {profile.profile?.headline && (
                  <p className="text-gray-600 mt-1">{profile.profile.headline}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.role === 'Alumni' 
                      ? 'bg-blue-100 text-blue-700'
                      : profile.role === 'Student'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {profile.role}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex gap-3">
                  {connectionStatus?.status === 'accepted' ? (
                    <>
                      <button
                        onClick={handleMessage}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Message
                      </button>
                      <button
                        onClick={handleRemoveConnection}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <UserMinus className="w-5 h-5" />
                        )}
                        Remove
                      </button>
                    </>
                  ) : connectionStatus?.status === 'pending' ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                      <Clock className="w-5 h-5" />
                      {connectionStatus.direction === 'sent' ? 'Request Sent' : 'Pending'}
                    </span>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {isOwnProfile && (
                <Link
                  to="/dashboard?tab=profile"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Bio */}
            {profile.profile?.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{profile.profile.bio}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.profile?.company && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <span>{profile.profile.jobTitle ? `${profile.profile.jobTitle} at ` : ''}{profile.profile.company}</span>
                </div>
              )}
              {profile.profile?.location && (
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{profile.profile.location}</span>
                </div>
              )}
              {profile.profile?.graduationYear && (
                <div className="flex items-center gap-3 text-gray-600">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <span>Class of {profile.profile.graduationYear}</span>
                </div>
              )}
              {profile.profile?.major && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <span>{profile.profile.major}</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {profile.profile?.skills && profile.profile.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
