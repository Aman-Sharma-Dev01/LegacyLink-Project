const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validations
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role')
    .optional()
    .isIn(['Student', 'Alumni']).withMessage('Invalid role. Only Student or Alumni registration allowed'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  handleValidationErrors
];

const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  handleValidationErrors
];

// Post validations
const validatePost = [
  body('text')
    .trim()
    .notEmpty().withMessage('Post content is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Post must be between 1 and 5000 characters'),
  handleValidationErrors
];

const validateComment = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  handleValidationErrors
];

// Job validations
const validateJob = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('company')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ max: 100 }).withMessage('Company name must be less than 100 characters'),
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required'),
  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  body('jobType')
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship']).withMessage('Invalid job type'),
  body('applyLink')
    .optional()
    .isURL().withMessage('Apply link must be a valid URL'),
  handleValidationErrors
];

// Event validations
const validateEvent = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Event description is required')
    .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  body('date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Please provide a valid date'),
  body('location')
    .trim()
    .notEmpty().withMessage('Event location is required'),
  body('visibility')
    .optional()
    .isIn(['Alumni_Only', 'All']).withMessage('Invalid visibility option'),
  handleValidationErrors
];

// Mentorship validations
const validateMentorshipRequest = [
  body('alumniId')
    .notEmpty().withMessage('Alumni ID is required')
    .isMongoId().withMessage('Invalid alumni ID'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
  handleValidationErrors
];

const validateMentorshipResponse = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Accepted', 'Rejected']).withMessage('Status must be Accepted or Rejected'),
  handleValidationErrors
];

// Profile validations
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('headline')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Headline must be less than 120 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Bio must be less than 2000 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  handleValidationErrors
];

// Chat validation
const validateChatMessage = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query must be less than 100 characters'),
  handleValidationErrors
];

// MongoDB ID validation for :id param
const validateMongoId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

// MongoDB ID validation for :connectionId param
const validateConnectionId = [
  param('connectionId')
    .isMongoId().withMessage('Invalid connection ID format'),
  handleValidationErrors
];

// MongoDB ID validation for :userId param
const validateUserId = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors
];

// MongoDB ID validation for :conversationId param
const validateConversationId = [
  param('conversationId')
    .isMongoId().withMessage('Invalid conversation ID format'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validatePost,
  validateComment,
  validateJob,
  validateEvent,
  validateMentorshipRequest,
  validateMentorshipResponse,
  validateProfileUpdate,
  validateChatMessage,
  validatePagination,
  validateSearch,
  validateMongoId,
  validateConnectionId,
  validateUserId,
  validateConversationId
};
