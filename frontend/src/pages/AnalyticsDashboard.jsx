import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  TrendingUp,
  Briefcase,
  Calendar,
  MessageSquare,
  Heart,
  Award,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [mentorshipStats, setMentorshipStats] = useState(null);
  const [skillDistribution, setSkillDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState(30);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, growthRes, engagementRes, contributorsRes, mentorshipRes, skillsRes] = 
        await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getUserGrowth(period),
          analyticsAPI.getEngagement(period),
          analyticsAPI.getTopContributors(10),
          analyticsAPI.getMentorshipStats(),
          analyticsAPI.getSkillDistribution(),
        ]);

      setOverview(overviewRes.data);
      setUserGrowth(growthRes.data);
      setEngagement(engagementRes.data);
      setTopContributors(contributorsRes.data);
      setMentorshipStats(mentorshipRes.data);
      setSkillDistribution(skillsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-linkedin-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-slate-400">Platform insights and statistics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-800 dark:text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={overview?.users?.total || 0}
            subtext={`+${overview?.users?.newThisMonth || 0} this month`}
            icon={<Users className="w-6 h-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Verified Users"
            value={overview?.users?.verified || 0}
            subtext={`${overview?.users?.unverified || 0} pending`}
            icon={<UserCheck className="w-6 h-6" />}
            color="bg-green-500"
          />
          <StatCard
            title="Active Mentorships"
            value={overview?.mentorship?.active || 0}
            subtext={`${overview?.mentorship?.successRate || 0}% success rate`}
            icon={<Award className="w-6 h-6" />}
            color="bg-purple-500"
          />
          <StatCard
            title="Total Engagement"
            value={overview?.engagement?.totalLikes + overview?.engagement?.totalComments || 0}
            subtext={`${overview?.engagement?.avgLikesPerPost || 0} avg likes/post`}
            icon={<Heart className="w-6 h-6" />}
            color="bg-pink-500"
          />
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Posts"
            value={overview?.content?.posts?.total || 0}
            subtext={`+${overview?.content?.posts?.thisMonth || 0} this month`}
            icon={<MessageSquare className="w-6 h-6" />}
            color="bg-indigo-500"
          />
          <StatCard
            title="Events"
            value={overview?.content?.events?.total || 0}
            subtext={`${overview?.content?.events?.upcoming || 0} upcoming`}
            icon={<Calendar className="w-6 h-6" />}
            color="bg-orange-500"
          />
          <StatCard
            title="Job Listings"
            value={overview?.content?.jobs?.total || 0}
            subtext={`${overview?.content?.jobs?.active || 0} active`}
            icon={<Briefcase className="w-6 h-6" />}
            color="bg-teal-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Distribution by Role */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 dark:bg-slate-800"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <PieChart className="w-5 h-5 text-linkedin-blue" />
              Users by Role
            </h3>
            <div className="space-y-3">
              {Object.entries(overview?.users?.byRole || {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getRoleColor(role)}`}></div>
                    <span className="text-gray-700 dark:text-slate-300">{formatRole(role)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getRoleColor(role)}`}
                        style={{ width: `${(count / overview?.users?.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 dark:text-slate-400 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mentorship Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 dark:bg-slate-800"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Activity className="w-5 h-5 text-linkedin-blue" />
              Mentorship Overview
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{mentorshipStats?.statusBreakdown?.Accepted || 0}</div>
                <div className="text-sm text-green-700 dark:text-green-400">Accepted</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{mentorshipStats?.statusBreakdown?.Pending || 0}</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-400">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{mentorshipStats?.statusBreakdown?.Rejected || 0}</div>
                <div className="text-sm text-red-700 dark:text-red-400">Rejected</div>
              </div>
            </div>
            <h4 className="font-medium mb-3 dark:text-slate-300">Top Mentors</h4>
            <div className="space-y-2">
              {mentorshipStats?.topMentors?.slice(0, 5).map((mentor, index) => (
                <div key={mentor._id} className="flex items-center justify-between py-2 border-b dark:border-slate-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-linkedin-blue text-white rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium dark:text-white">{mentor.name}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{mentor.jobTitle} @ {mentor.company}</div>
                    </div>
                  </div>
                  <div className="text-linkedin-blue font-semibold">{mentor.menteeCount} mentees</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Contributors & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Contributors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6 dark:bg-slate-800"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <TrendingUp className="w-5 h-5 text-linkedin-blue" />
              Top Contributors
            </h3>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={contributor._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium dark:text-white">{contributor.name}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{formatRole(contributor.role)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold dark:text-white">{contributor.postCount} posts</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{contributor.totalLikes} likes</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6 dark:bg-slate-800"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <BarChart3 className="w-5 h-5 text-linkedin-blue" />
              Popular Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillDistribution.map((skill, index) => (
                <span
                  key={skill.skill}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    index < 5 
                      ? 'bg-linkedin-blue text-white' 
                      : index < 10 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {skill.skill} ({skill.count})
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, subtext, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-6 dark:bg-slate-800"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} text-white`}>
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <div className="text-gray-600 dark:text-slate-400 font-medium">{title}</div>
    <div className="text-sm text-gray-500 dark:text-slate-500 mt-1">{subtext}</div>
  </motion.div>
);

// Helper functions
const getRoleColor = (role) => {
  const colors = {
    Student: 'bg-blue-500',
    Alumni: 'bg-green-500',
    Faculty: 'bg-orange-500',
    Institute_Admin: 'bg-purple-500',
    Employer: 'bg-teal-500',
    Super_Admin: 'bg-red-500',
  };
  return colors[role] || 'bg-gray-500';
};

const formatRole = (role) => {
  return role?.replace('_', ' ') || role;
};

export default AnalyticsDashboard;
