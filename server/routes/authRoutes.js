const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  googleLogin, 
  getUserProfile 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
router.post('/register', registerUser);

// @route   POST /api/auth/login
router.post('/login', loginUser);

// @route   POST /api/auth/google
router.post('/google', googleLogin);

// @route   GET /api/auth/profile
router.get('/profile', protect, getUserProfile);

module.exports = router; 