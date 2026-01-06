const User = require('../models/userModel');

// @desc    Get alumni directory with filters
// @route   GET /api/directory/alumni
// @access  Private
const getAlumniDirectory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query filters
    const query = {
      role: 'Alumni',
      isVerified: true,
    };

    // Search by name
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Filter by graduation year
    if (req.query.graduationYear) {
      query['profile.graduationYear'] = parseInt(req.query.graduationYear);
    }

    // Filter by graduation year range
    if (req.query.yearFrom || req.query.yearTo) {
      query['profile.graduationYear'] = {};
      if (req.query.yearFrom) {
        query['profile.graduationYear'].$gte = parseInt(req.query.yearFrom);
      }
      if (req.query.yearTo) {
        query['profile.graduationYear'].$lte = parseInt(req.query.yearTo);
      }
    }

    // Filter by company
    if (req.query.company) {
      query['profile.company'] = { $regex: req.query.company, $options: 'i' };
    }

    // Filter by job title
    if (req.query.jobTitle) {
      query['profile.jobTitle'] = { $regex: req.query.jobTitle, $options: 'i' };
    }

    // Filter by skills
    if (req.query.skills) {
      const skillsArray = req.query.skills.split(',').map(s => s.trim());
      query['profile.skills'] = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
    }

    // Filter by location
    if (req.query.location) {
      query['profile.location'] = { $regex: req.query.location, $options: 'i' };
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (req.query.sort === 'name') {
      sortOption = { name: 1 };
    } else if (req.query.sort === 'year') {
      sortOption = { 'profile.graduationYear': -1 };
    }

    const alumni = await User.find(query)
      .select('name profile createdAt')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get unique values for filters
    const [graduationYears, companies, locations] = await Promise.all([
      User.distinct('profile.graduationYear', { role: 'Alumni', isVerified: true }),
      User.distinct('profile.company', { role: 'Alumni', isVerified: true }),
      User.distinct('profile.location', { role: 'Alumni', isVerified: true }),
    ]);

    res.json({
      alumni,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
      filters: {
        graduationYears: graduationYears.filter(y => y).sort((a, b) => b - a),
        companies: companies.filter(c => c).sort(),
        locations: locations.filter(l => l).sort(),
      },
    });
  } catch (error) {
    console.error('Error fetching alumni directory:', error);
    res.status(500).json({ message: 'Error fetching alumni directory' });
  }
};

// @desc    Get all users directory (for admin or discovery)
// @route   GET /api/directory/users
// @access  Private
const getUsersDirectory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { isVerified: true };

    // Search by name
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .select('name role profile createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching users directory:', error);
    res.status(500).json({ message: 'Error fetching users directory' });
  }
};

// @desc    Get statistics for the directory
// @route   GET /api/directory/stats
// @access  Private
const getDirectoryStats = async (req, res) => {
  try {
    const [alumniCount, studentCount, facultyCount, employerCount] = await Promise.all([
      User.countDocuments({ role: 'Alumni', isVerified: true }),
      User.countDocuments({ role: 'Student', isVerified: true }),
      User.countDocuments({ role: 'Faculty', isVerified: true }),
      User.countDocuments({ role: 'Employer', isVerified: true }),
    ]);

    // Get top companies
    const topCompanies = await User.aggregate([
      { $match: { role: 'Alumni', isVerified: true, 'profile.company': { $exists: true, $ne: '' } } },
      { $group: { _id: '$profile.company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get alumni by graduation year
    const alumniByYear = await User.aggregate([
      { $match: { role: 'Alumni', isVerified: true, 'profile.graduationYear': { $exists: true } } },
      { $group: { _id: '$profile.graduationYear', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      counts: {
        alumni: alumniCount,
        students: studentCount,
        faculty: facultyCount,
        employers: employerCount,
        total: alumniCount + studentCount + facultyCount + employerCount,
      },
      topCompanies: topCompanies.map(c => ({ company: c._id, count: c.count })),
      alumniByYear: alumniByYear.map(y => ({ year: y._id, count: y.count })),
    });
  } catch (error) {
    console.error('Error fetching directory stats:', error);
    res.status(500).json({ message: 'Error fetching directory stats' });
  }
};

module.exports = {
  getAlumniDirectory,
  getUsersDirectory,
  getDirectoryStats,
};
