const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware for specific roles
const isAlumni = (req, res, next) => {
  if (req.user && req.user.role === 'Alumni') {
    return next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an Alumni' });
  }
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'Student') {
    return next();
  } else {
    return res.status(403).json({ message: 'Not authorized as a Student' });
  }
};

const isInstituteAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Institute_Admin') {
    return next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an Institute Admin' });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Super_Admin') {
    return next();
  } else {
    return res.status(403).json({ message: 'Not authorized as a Super Admin' });
  }
};

// Check if user is verified
const isVerified = (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return next();
  } else {
    return res.status(403).json({ message: 'Account not verified' });
  }
};

module.exports = { protect, isAlumni, isStudent, isInstituteAdmin, isSuperAdmin, isVerified };