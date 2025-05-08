const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { 
      username, 
      firstName, 
      lastName, 
      middleName, 
      phone, 
      email, 
      password,
      address,
      aptNumber,
      zipCode,
      city,
      state,
      country
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }, {phone}] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      firstName,
      lastName,
      middleName,
      phone,
      email,
      password,
      address,
      aptNumber,
      zipCode,
      city,
      state,
      country,
      lastLogin: new Date(),
    });

    if (user) {
      // Log the user creation and last login
      console.log(`New user registered: ${user.username}`);
      console.log(`User last logged in @ ${user.lastLogin}`);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password is correct
    if (user && (await user.comparePassword(password))) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Log the last login
      console.log(`User ${user.username} logged in at ${user.lastLogin}`);

      res.json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Google Sign In
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { email_verified, name, email, given_name, family_name, sub } = ticket.getPayload();
    
    // If email is not verified by Google
    if (!email_verified) {
      return res.status(400).json({ message: 'Email not verified by Google' });
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists, update last login
      user.lastLogin = new Date();
      await user.save();
      
      console.log(`User ${user.username} logged in via Google at ${user.lastLogin}`);
      
      // Return user data with token
      return res.json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // If user doesn't exist, create new user
      // Generate username from email
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      // Create random password for Google users
      const password = Math.random().toString(36).slice(-8);
      
      user = await User.create({
        username,
        firstName: given_name || name.split(' ')[0],
        lastName: family_name || name.split(' ').slice(1).join(' '),
        email,
        password,
        googleId: sub, // Use the Google subject ID as the googleId
        lastLogin: new Date(),
      });
      
      console.log(`New Google user registered: ${user.username}`);
      console.log(`User last login: ${user.lastLogin}`);
      
      res.status(201).json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile
}; 