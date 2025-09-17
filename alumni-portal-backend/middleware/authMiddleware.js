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
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware for specific roles
const isAlumni = (req, res, next) => {
  if (req.user && req.user.role === 'Alumni') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Alumni' });
  }
};

const isInstituteAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Institute_Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Institute Admin' });
  }
};

const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Super_Admin') {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as a Super Admin' });
    }
  };


module.exports = { protect, isAlumni, isInstituteAdmin, isSuperAdmin };