const User = require('../models/userModel');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.profile.headline = req.body.headline || user.profile.headline;
        user.profile.bio = req.body.bio || user.profile.bio;
        user.profile.location = req.body.location || user.profile.location;

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
        res.json(updatedUser);

    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all alumni profiles (for directory)
// @route   GET /api/users/alumni
// @access  Private
const getAlumniProfiles = async (req, res) => {
    const users = await User.find({ role: 'Alumni', isVerified: true }).select('-password');
    res.json(users);
}

module.exports = { getUserProfile, updateUserProfile, getAlumniProfiles };