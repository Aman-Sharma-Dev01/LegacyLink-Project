const User = require('../models/userModel');

// @desc    Get all unverified users
// @route   GET /api/admin/verify
// @access  Private/Institute_Admin
const getUnverifiedUsers = async (req, res) => {
    // In a real app, you'd filter by institution
    const users = await User.find({ isVerified: false, role: { $in: ['Student', 'Alumni'] } }).select('-password');
    res.json(users);
};

// @desc    Verify a user
// @route   PUT /api/admin/verify/:id
// @access  Private/Institute_Admin
const verifyUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.isVerified = true;
        await user.save();
        res.json({ message: 'User has been verified' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { getUnverifiedUsers, verifyUser };