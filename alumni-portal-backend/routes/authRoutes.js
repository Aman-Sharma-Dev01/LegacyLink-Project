const express = require('express');
const router = express.Router();
const { registerUser, authUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validators');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Auth routes with validation and rate limiting
router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, validateLogin, authUser);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateResetPassword, resetPassword);

module.exports = router;