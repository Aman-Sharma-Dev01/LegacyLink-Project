/**
 * Analytics Controller
 * Provides statistics and insights for the admin dashboard
 */

const User = require('../models/userModel');
const Post = require('../models/postModel');
const Event = require('../models/eventModel');
const Job = require('../models/jobModel');
const MentorshipRequest = require('../models/mentorshipRequestModel');

// @desc    Get dashboard overview statistics
// @route   GET /api/analytics/overview
// @access  Private/Admin
const getOverviewStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      usersByRole,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: false }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
    ]);

    // Content statistics
    const [
      totalPosts,
      postsThisMonth,
      totalEvents,
      upcomingEvents,
      totalJobs,
      activeJobs,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Event.countDocuments(),
      Event.countDocuments({ date: { $gte: now } }),
      Job.countDocuments(),
      Job.countDocuments({ 
        $or: [
          { deadline: { $gte: now } },
          { deadline: { $exists: false } }
        ]
      }),
    ]);

    // Mentorship statistics
    const [
      totalMentorships,
      activeMentorships,
      pendingMentorships,
      mentorshipsThisMonth,
    ] = await Promise.all([
      MentorshipRequest.countDocuments(),
      MentorshipRequest.countDocuments({ status: 'Accepted' }),
      MentorshipRequest.countDocuments({ status: 'Pending' }),
      MentorshipRequest.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Engagement metrics
    const engagementData = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } },
          avgLikesPerPost: { $avg: { $size: '$likes' } },
          avgCommentsPerPost: { $avg: { $size: '$comments' } },
        }
      }
    ]);

    const engagement = engagementData[0] || {
      totalLikes: 0,
      totalComments: 0,
      avgLikesPerPost: 0,
      avgCommentsPerPost: 0,
    };

    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: newUsersThisWeek,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      content: {
        posts: {
          total: totalPosts,
          thisMonth: postsThisMonth,
        },
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
        },
      },
      mentorship: {
        total: totalMentorships,
        active: activeMentorships,
        pending: pendingMentorships,
        thisMonth: mentorshipsThisMonth,
        successRate: totalMentorships > 0 
          ? Math.round((activeMentorships / totalMentorships) * 100) 
          : 0,
      },
      engagement: {
        totalLikes: engagement.totalLikes,
        totalComments: engagement.totalComments,
        avgLikesPerPost: Math.round(engagement.avgLikesPerPost * 10) / 10,
        avgCommentsPerPost: Math.round(engagement.avgCommentsPerPost * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
};

// @desc    Get user growth trend
// @route   GET /api/analytics/user-growth
// @access  Private/Admin
const getUserGrowthTrend = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growthData = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          students: {
            $sum: { $cond: [{ $eq: ['$role', 'Student'] }, 1, 0] }
          },
          alumni: {
            $sum: { $cond: [{ $eq: ['$role', 'Alumni'] }, 1, 0] }
          },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format data for charts
    const formattedData = growthData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      total: item.count,
      students: item.students,
      alumni: item.alumni,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ message: 'Error fetching user growth data' });
  }
};

// @desc    Get engagement metrics over time
// @route   GET /api/analytics/engagement
// @access  Private/Admin
const getEngagementMetrics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const engagementData = await Post.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          posts: { $sum: 1 },
          likes: { $sum: { $size: '$likes' } },
          comments: { $sum: { $size: '$comments' } },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const formattedData = engagementData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      posts: item.posts,
      likes: item.likes,
      comments: item.comments,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ message: 'Error fetching engagement data' });
  }
};

// @desc    Get top contributors
// @route   GET /api/analytics/top-contributors
// @access  Private/Admin
const getTopContributors = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topPosters = await Post.aggregate([
      {
        $group: {
          _id: '$author',
          postCount: { $sum: 1 },
          totalLikes: { $sum: { $size: '$likes' } },
        }
      },
      { $sort: { postCount: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          postCount: 1,
          totalLikes: 1,
          name: '$user.name',
          role: '$user.role',
          profilePicture: '$user.profile.profilePicture',
        }
      }
    ]);

    res.json(topPosters);
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({ message: 'Error fetching top contributors' });
  }
};

// @desc    Get mentorship statistics
// @route   GET /api/analytics/mentorship
// @access  Private/Admin
const getMentorshipStats = async (req, res) => {
  try {
    const statusBreakdown = await MentorshipRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const topMentors = await MentorshipRequest.aggregate([
      { $match: { status: 'Accepted' } },
      {
        $group: {
          _id: '$alumni',
          menteeCount: { $sum: 1 }
        }
      },
      { $sort: { menteeCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'mentor'
        }
      },
      { $unwind: '$mentor' },
      {
        $project: {
          menteeCount: 1,
          name: '$mentor.name',
          company: '$mentor.profile.company',
          jobTitle: '$mentor.profile.jobTitle',
        }
      }
    ]);

    res.json({
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topMentors,
    });
  } catch (error) {
    console.error('Error fetching mentorship stats:', error);
    res.status(500).json({ message: 'Error fetching mentorship statistics' });
  }
};

// @desc    Get skill distribution
// @route   GET /api/analytics/skills
// @access  Private/Admin
const getSkillDistribution = async (req, res) => {
  try {
    const skillData = await User.aggregate([
      { $match: { 'profile.skills': { $exists: true, $ne: [] } } },
      { $unwind: '$profile.skills' },
      {
        $group: {
          _id: { $toLower: '$profile.skills' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json(skillData.map(item => ({
      skill: item._id,
      count: item.count,
    })));
  } catch (error) {
    console.error('Error fetching skill distribution:', error);
    res.status(500).json({ message: 'Error fetching skill distribution' });
  }
};

module.exports = {
  getOverviewStats,
  getUserGrowthTrend,
  getEngagementMetrics,
  getTopContributors,
  getMentorshipStats,
  getSkillDistribution,
};
