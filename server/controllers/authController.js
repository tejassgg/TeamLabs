const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { logActivity } = require('../services/activityService');
const UserActivity = require('../models/UserActivity');

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
      
      // Log successful login
      await logActivity(user._id, 'login', 'success', 'User logged in successfully', req, 'email');

      res.json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // Log failed login attempt
      if (user) {
        await logActivity(user._id, 'login_failed', 'failed', 'Invalid password', req, 'email');
      } else {
        // Log failed login attempt for non-existent user
        await logActivity(null, 'login_failed', 'failed', 'User not found', req, 'email');
      }
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // Log the logout activity
    await logActivity(req.user._id, 'logout', 'success', 'User logged out successfully', req);
    
    res.json({ message: 'Logged out successfully' });
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
    
    const { email_verified, name, email, given_name, family_name, sub, picture } = ticket.getPayload();
    
    // If email is not verified by Google
    if (!email_verified) {
      await logActivity(null, 'login_failed', 'failed', 'Email not verified by Google', req, 'google');
      return res.status(400).json({ message: 'Email not verified by Google' });
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists, update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Log successful Google login
      await logActivity(user._id, 'login', 'success', 'User logged in via Google', req, 'google');
      
      // Return user data with token and Google profile image
      return res.json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: picture,
        token: generateToken(user._id),
        needsAdditionalDetails: false
      });
    } else {
      // If user doesn't exist, create new user with partial profile
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
        googleId: sub,
        lastLogin: new Date(),
        // Set these fields as null to indicate they need to be filled
        phone: null,
        middleName: null,
        address: null,
        aptNumber: null,
        zipCode: null,
        city: null,
        state: null,
        country: null
      });
      
      // Log successful Google login for new user
      await logActivity(user._id, 'login', 'success', 'New user registered and logged in via Google', req, 'google');
      
      res.status(201).json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: picture,
        token: generateToken(user._id),
        needsAdditionalDetails: true,
        message: 'Please complete your profile with additional details'
      });
    }
  } catch (error) {
    console.error(error);
    // Log failed Google login attempt
    await logActivity(null, 'login_failed', 'failed', 'Google login failed: ' + error.message, req, 'google');
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile with additional details
// @route   PUT /api/auth/complete-profile
// @access  Private
const completeUserProfile = async (req, res) => {
  try {
    const { phone, middleName, address, aptNumber, zipCode, city, state, country, organizationID } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user profile with additional details
    user.phone = phone;
    user.middleName = middleName;
    user.address = address;
    user.aptNumber = aptNumber;
    user.zipCode = zipCode;
    user.city = city;
    user.state = state;
    user.country = country;
    user.organizationID = organizationID;
    
    await user.save();

    // Log profile update
    await logActivity(user._id, 'profile_update', 'success', 'Profile updated successfully', req);
    
    res.json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      middleName: user.middleName,
      address: user.address,
      aptNumber: user.aptNumber,
      zipCode: user.zipCode,
      city: user.city,
      state: user.state,
      country: user.country,
      organizationID: user.organizationID,
      needsAdditionalDetails: false
    });
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
      // If user has an organization ID, fetch the organization details
      if (user.organizationID) {
        const CommonType = require('../models/CommonType');
        const organization = await CommonType.findOne({
          Code: user.organizationID,
          MasterType: 'Organization'
        });

        // Add organization details to the response
        const userProfile = user.toObject();
        userProfile.organization = organization ? {
          name: organization.Value,
          code: organization.Code
        } : null;

        res.json(userProfile);
      } else {
        res.json(user);
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user activities
// @route   GET /api/auth/activities
// @access  Private
const getUserActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const result = await UserActivity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await UserActivity.countDocuments({ user: req.user._id });

    res.json({
      activities: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user organizations
// @route   GET /api/auth/organizations
// @access  Private
const getUserOrganizations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('organizationID');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has an organization ID, fetch the organization details
    if (user.organizationID) {
      const CommonType = require('../models/CommonType');
      const organization = await CommonType.findOne({
        Code: user.organizationID,
        MasterType: 'Organization'
      });

      if (organization) {
        return res.json([{
          _id: organization._id,
          name: organization.Value,
          code: organization.Code
        }]);
      }
    }

    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  completeUserProfile,
  getUserActivities,
  logoutUser,
  getUserOrganizations
}; 