const User = require('../models/userModel');
const {
  uploadToCloudinary,
  uploadProfilePicture,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require('../middleware/uploadMiddleware');

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private
const uploadProfilePictureHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture from Cloudinary if it exists and is not default
    if (
      user.profile.profilePicture &&
      user.profile.profilePicture !== 'default_avatar.png' &&
      user.profile.profilePicture.includes('cloudinary.com')
    ) {
      const publicId = getPublicIdFromUrl(user.profile.profilePicture);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // Upload new profile picture
    const result = await uploadProfilePicture(req.file.buffer);

    // Update user profile
    user.profile.profilePicture = result.secure_url;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: result.secure_url,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
};

// @desc    Upload post image
// @route   POST /api/upload/post-image
// @access  Private
const uploadPostImageHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'legacylink/posts');

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
};

// @desc    Delete an uploaded image
// @route   DELETE /api/upload/image
// @access  Private
const deleteImageHandler = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    await deleteFromCloudinary(publicId);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
};

module.exports = {
  uploadProfilePictureHandler,
  uploadPostImageHandler,
  deleteImageHandler,
};
