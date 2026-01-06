const User = require('../models/userModel');
const Post = require('../models/postModel');
const Job = require('../models/jobModel');
const Event = require('../models/eventModel');

// @desc    Global search across users, posts, jobs, events
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Create case-insensitive regex for search
    const searchRegex = new RegExp(searchQuery, 'i');

    let results = {
      users: [],
      posts: [],
      jobs: [],
      events: [],
      totalResults: 0
    };

    // Search based on type or search all
    if (!type || type === 'all' || type === 'users') {
      const usersQuery = User.find({
        isVerified: true,
        $or: [
          { name: searchRegex },
          { 'profile.headline': searchRegex },
          { 'profile.company': searchRegex },
          { 'profile.jobTitle': searchRegex },
          { 'profile.location': searchRegex },
          { 'profile.skills': searchRegex }
        ]
      })
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .limit(type === 'users' ? limitNum : 5)
        .skip(type === 'users' ? skip : 0);

      results.users = await usersQuery;
    }

    if (!type || type === 'all' || type === 'posts') {
      const postsQuery = Post.find({
        text: searchRegex
      })
        .populate('user', 'name profile')
        .sort({ createdAt: -1 })
        .limit(type === 'posts' ? limitNum : 5)
        .skip(type === 'posts' ? skip : 0);

      results.posts = await postsQuery;
    }

    if (!type || type === 'all' || type === 'jobs') {
      const jobsQuery = Job.find({
        $or: [
          { title: searchRegex },
          { company: searchRegex },
          { location: searchRegex },
          { description: searchRegex }
        ]
      })
        .populate('postedBy', 'name profile.company')
        .sort({ createdAt: -1 })
        .limit(type === 'jobs' ? limitNum : 5)
        .skip(type === 'jobs' ? skip : 0);

      results.jobs = await jobsQuery;
    }

    if (!type || type === 'all' || type === 'events') {
      let eventQuery = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { location: searchRegex }
        ]
      };

      // Filter by visibility for students
      if (req.user.role === 'Student') {
        eventQuery.visibility = 'All';
      }

      const eventsQuery = Event.find(eventQuery)
        .populate('createdBy', 'name')
        .sort({ date: 1 })
        .limit(type === 'events' ? limitNum : 5)
        .skip(type === 'events' ? skip : 0);

      results.events = await eventsQuery;
    }

    // Calculate totals if searching specific type
    if (type && type !== 'all') {
      let total = 0;
      switch (type) {
        case 'users':
          total = await User.countDocuments({
            isVerified: true,
            $or: [
              { name: searchRegex },
              { 'profile.headline': searchRegex },
              { 'profile.company': searchRegex }
            ]
          });
          break;
        case 'posts':
          total = await Post.countDocuments({ text: searchRegex });
          break;
        case 'jobs':
          total = await Job.countDocuments({
            $or: [
              { title: searchRegex },
              { company: searchRegex },
              { location: searchRegex }
            ]
          });
          break;
        case 'events':
          total = await Event.countDocuments({
            $or: [
              { title: searchRegex },
              { description: searchRegex }
            ]
          });
          break;
      }
      results.totalResults = total;
      results.pagination = {
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total
      };
    } else {
      results.totalResults = 
        results.users.length + 
        results.posts.length + 
        results.jobs.length + 
        results.events.length;
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error performing search' });
  }
};

// @desc    Search users/alumni
// @route   GET /api/search/users
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { 
      q, 
      role, 
      company, 
      graduationYear, 
      location,
      skills,
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build query
    let query = { isVerified: true };

    // Role filter
    if (role && ['Student', 'Alumni'].includes(role)) {
      query.role = role;
    }

    // Text search
    if (q && q.trim().length > 0) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { 'profile.headline': searchRegex },
        { 'profile.company': searchRegex },
        { 'profile.jobTitle': searchRegex },
        { 'profile.bio': searchRegex }
      ];
    }

    // Company filter
    if (company) {
      query['profile.company'] = new RegExp(company, 'i');
    }

    // Graduation year filter
    if (graduationYear) {
      query['profile.graduationYear'] = parseInt(graduationYear);
    }

    // Location filter
    if (location) {
      query['profile.location'] = new RegExp(location, 'i');
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query['profile.skills'] = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
    }

    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ name: 1 })
      .limit(limitNum)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total
      }
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

module.exports = { globalSearch, searchUsers };
