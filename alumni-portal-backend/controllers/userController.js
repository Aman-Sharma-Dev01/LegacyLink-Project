const User = require('../models/userModel');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpire');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// @desc    Get public user profile by ID
// @route   GET /api/users/:id
// @access  Private
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -email');

    if (user && user.isVerified) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.profile.headline = req.body.headline || user.profile.headline;
      user.profile.bio = req.body.bio || user.profile.bio;
      user.profile.location = req.body.location || user.profile.location;

      // Update skills if provided
      if (req.body.skills) {
        user.profile.skills = Array.isArray(req.body.skills) 
          ? req.body.skills 
          : req.body.skills.split(',').map(s => s.trim());
      }

      // Update role-specific fields
      if (user.role === 'Alumni') {
        user.profile.graduationYear = req.body.graduationYear || user.profile.graduationYear;
        user.profile.company = req.body.company || user.profile.company;
        user.profile.jobTitle = req.body.jobTitle || user.profile.jobTitle;
      } else if (user.role === 'Student') {
        user.profile.major = req.body.major || user.profile.major;
        user.profile.expectedGraduationYear = req.body.expectedGraduationYear || user.profile.expectedGraduationYear;
      }

      const updatedUser = await user.save();
      
      // Remove sensitive fields before sending response
      const userResponse = updatedUser.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpire;
      
      res.json(userResponse);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// @desc    Get all alumni profiles (with pagination)
// @route   GET /api/users/alumni
// @access  Private
const getAlumniProfiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query for filtering
    let query = { role: 'Alumni', isVerified: true };

    // Filter by company
    if (req.query.company) {
      query['profile.company'] = new RegExp(req.query.company, 'i');
    }

    // Filter by graduation year
    if (req.query.graduationYear) {
      query['profile.graduationYear'] = parseInt(req.query.graduationYear);
    }

    // Filter by location
    if (req.query.location) {
      query['profile.location'] = new RegExp(req.query.location, 'i');
    }

    // Search by name
    if (req.query.q) {
      query.name = new RegExp(req.query.q, 'i');
    }

    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ name: 1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching alumni' });
  }
};

module.exports = { getUserProfile, getPublicProfile, updateUserProfile, getAlumniProfiles };