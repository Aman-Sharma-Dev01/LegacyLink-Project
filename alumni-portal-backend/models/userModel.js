const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['Student', 'Alumni', 'Faculty', 'Institute_Admin', 'Employer', 'Super_Admin'],
      default: 'Student',
    },
    isVerified: { type: Boolean, default: false }, // Verified by Institute Admin
    // Profile specific data
    profile: {
        headline: { type: String, default: '' },
        bio: { type: String, default: '' },
        profilePicture: { type: String, default: 'default_avatar.png' },
        location: { type: String, default: '' },
        // Alumni specific
        graduationYear: { type: Number },
        company: { type: String },
        jobTitle: { type: String },
        // Student specific
        major: { type: String },
        expectedGraduationYear: { type: Number },
    },
  },
  { timestamps: true }
);

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;