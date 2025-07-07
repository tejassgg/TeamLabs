const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { logActivity } = require('../services/activityService');
const { sendResetEmail } = require('../services/emailService');
const UserActivity = require('../models/UserActivity');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const ForgotPasswordHistory = require('../models/ForgotPasswordHistory');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

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
      phoneExtension,
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
    const userExists = await User.findOne({ $or: [{ email }, { username }, { phone }] });

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
      phoneExtension: phoneExtension || '+1', // Use provided extension or default
      email,
      password,
      address,
      aptNumber,
      zipCode,
      city,
      state,
      country,
      role: 'User',
      organizationID: null,
      lastLogin: new Date(),
    });

    if (user) {
      // Log the user creation and last login
      res.status(201).json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        phoneExtension: user.phoneExtension,
        organizationID: user.organizationID,
        role: user.role,
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
    const { usernameOrEmail, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail },
        { username: usernameOrEmail }
      ]
    });

    // Check if user exists and password is correct
    if (user && (await user.comparePassword(password))) {
      // Update last login and set status to Active
      user.lastLogin = new Date();
      user.status = 'Active';
      await user.save();

      // Log successful login
      await logActivity(user._id, 'login', 'success', 'User logged in successfully', req, {}, 'email');

      if (user.twoFactorEnabled) {
        return res.status(200).json({
          twoFactorEnabled: true,
          userId: user._id
        });
      }
      
      return res.status(200).json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationID: user.organizationID,
        token: generateToken(user._id),
        // Include security settings in login response
        twoFactorEnabled: user.twoFactorEnabled || false,
        sessionTimeout: user.sessionTimeout || 30,
        loginNotifications: user.loginNotifications !== false, // default to true if not set
        status: user.status,
      });
    } else {
      // Log failed login attempt
      if (user) {
        await logActivity(user._id, 'login_failed', 'error', 'Invalid password', req, {}, 'email');
      } else {
        // Log failed login attempt for non-existent user
        await logActivity(null, 'login_failed', 'error', 'User not found', req, {}, 'email');
      }
      res.status(401).json({ message: 'Invalid username/email or password' });
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

    // Update user status to Offline
    await User.findByIdAndUpdate(req.user._id, { status: 'Offline' });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
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
      await logActivity(null, 'login_failed', 'error', 'Email not verified by Google', req, 'google');
      return res.status(400).json({ message: 'Email not verified by Google' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, update last login
      user.lastLogin = new Date();
      user.status = 'Active';
      await user.save();

      // Log successful Google login
      await logActivity(user._id, 'login', 'success', 'User logged in via Google', req, { provider: 'google' });

      // Return user data with token and Google profile image
      return res.json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationID: user.organizationID,
        profileImage: picture,
        token: generateToken(user._id),
        role: user.role,
        needsAdditionalDetails: false,
        // Include security settings in login response
        twoFactorEnabled: user.twoFactorEnabled || false,
        sessionTimeout: user.sessionTimeout || 30,
        loginNotifications: user.loginNotifications !== false, // default to true if not set
        status: user.status
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
        country: null,
        role: 'User',
        // Set default security settings
        twoFactorEnabled: false,
        sessionTimeout: 30,
        loginNotifications: true,
        status: 'Offline'
      });

      // Log successful Google login for new user
      await logActivity(user._id, 'login', 'success', 'New user registered and logged in via Google', req, { provider: 'google' });

      res.status(201).json({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: picture,
        token: generateToken(user._id),
        needsAdditionalDetails: true,
        role: user.role,
        message: 'Please complete your profile with additional details',
        // Include security settings in login response
        twoFactorEnabled: false,
        sessionTimeout: 30,
        loginNotifications: true,
        status: 'Offline'
      });
    }
  } catch (error) {
    console.error(error);
    // Log failed Google login attempt
    await logActivity(null, 'login_failed', 'error', 'Google login failed: ' + error.message, req, { provider: 'google' });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile with additional details
// @route   PUT /api/auth/complete-profile
// @access  Private
const completeUserProfile = async (req, res) => {
  try {
    const {
      phone,
      phoneExtension,
      middleName,
      address,
      aptNumber,
      zipCode,
      city,
      state,
      country,
      organizationID,
      role
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user profile with additional details
    user.phone = phone;
    user.phoneExtension = phoneExtension || user.phoneExtension; // Keep existing if not provided
    user.middleName = middleName;
    user.address = address;
    user.aptNumber = aptNumber;
    user.zipCode = zipCode;
    user.city = city;
    user.state = state;
    user.country = country;
    user.organizationID = organizationID;

    if (role) {
      // Verify that the role exists in CommonTypes
      const CommonType = require('../models/CommonType');
      const roleExists = await CommonType.findOne({
        MasterType: 'UserRole',
        Value: role
      });
      if (!roleExists) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }

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
      phoneExtension: user.phoneExtension,
      middleName: user.middleName,
      address: user.address,
      aptNumber: user.aptNumber,
      zipCode: user.zipCode,
      city: user.city,
      state: user.state,
      country: user.country,
      organizationID: user.organizationID,
      needsAdditionalDetails: false,
      role: user.role
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
        userProfile.organizationID = user.organizationID;
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


    let types = ['team_create', 'team_update', 'team_delete', 'team_join', 'team_leave', 'team_status_toggle', 'project_create', 'project_update', 'task_create', 'task_update', 'task_complete', 'task_assign', 'user_story_create', 'user_story_update', 'user_story_delete'];

    const result = await UserActivity.find({ user: req.user._id, type: { $in: types } })
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

// @desc    Generate 2FA
// @route   POST /api/auth/2fa/generate
// @access  Private
const generate2FA = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `TeamLabs:${user.email}`,
      issuer: 'TeamLabs'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Store temporary secret in database
    user.tempTwoFactorSecret = secret.base32;
    user.tempTwoFactorSecretCreatedAt = new Date();
    await user.save();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ 
      secret: secret.base32,
      qrCode,
      otpauth_url: secret.otpauth_url
    });
  } catch (error) {
    console.error('2FA Generation Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// @desc    Verify 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+tempTwoFactorSecret');
    
    if (!user || !user.tempTwoFactorSecret) {
      return res.status(400).json({ error: 'No temporary secret found. Please generate a new one.' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.tempTwoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Move temporary secret to permanent secret and enable 2FA
    await User.findByIdAndUpdate(req.user.id, {
      twoFactorSecret: user.tempTwoFactorSecret,
      twoFactorEnabled: true,
      $unset: { tempTwoFactorSecret: 1, tempTwoFactorSecretCreatedAt: 1 }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('2FA Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify the token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Disable 2FA
    await User.findByIdAndUpdate(req.user.id, {
      twoFactorEnabled: false,
      $unset: { twoFactorSecret: 1 }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('2FA Disable Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// @desc    Verify Login 2FA
// @route   POST /api/auth/2fa/verify-login
// @access  Private
const verifyLogin2FA = async (req, res) => {
  try {
    const { code, userId } = req.body;
    const user = await User.findById(userId).select('+twoFactorSecret');
    
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    return res.status(200).json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationID: user.organizationID,
      token: generateToken(user._id),
      // Include security settings in login response
      twoFactorEnabled: user.twoFactorEnabled || false,
      sessionTimeout: user.sessionTimeout || 30,
      loginNotifications: user.loginNotifications !== false, // default to true if not set
      status: user.status
    });
  } catch (error) {
    console.error('2FA Login Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// @desc    Get Security Settings
// @route   GET /api/auth/security-settings
// @access  Private
const getSecuritySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('twoFactorEnabled sessionTimeout loginNotifications');
    
    return res.json({
      twoFactorEnabled: user?.twoFactorEnabled || false,
      sessionTimeout: user?.sessionTimeout || 30,
      loginNotifications: user?.loginNotifications || true
    });
  } catch (error) {
    console.error('Security Settings Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Update Security Settings
// @route   PUT /api/auth/security-settings
// @access  Private
const updateSecuritySettings = async (req, res) => {
  try {
    const { sessionTimeout, loginNotifications, userId } = req.body;
    
    await User.findByIdAndUpdate(userId, {
      $set: {
        sessionTimeout: Number(sessionTimeout),
        loginNotifications: Boolean(loginNotifications)
      }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Security Settings Update Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Update User Status
// @route   PUT /api/auth/status
// @access  Private
const updateUserStatus = async (req, res) => {
  try {

    const { status, userId } = req.body;

    // Validate status
    const validStatuses = ['Active', 'In a Meeting', 'Presenting', 'Away', 'Offline', 'Busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Status updated successfully', status: user.status });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ message: 'Username or email is required' });
    }
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail },
        { username: usernameOrEmail }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Generate unique key and expiry
    const key = uuidv4();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const link = `${process.env.FRONTEND_URL}/reset-password?key=${key}`;
    // Create ForgotPasswordHistory record
    await ForgotPasswordHistory.create({
      Username: user.username,
      AttemptNo: 1,
      MaxNoOfAttempts: 3,
      Key: key,
      ExpiryTime: expiry,
      Link: link,
      IsValid: true
    });
    // Send email with link
    await sendResetEmail(user.email, user.username, link);
    res.json({ message: 'If the user exists, a password reset link has been sent to the registered email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/verify-reset-password
// @access  Public
const verifyResetPassword = async (req, res) => {
  try {
    const { key } = req.body;
    const record = await ForgotPasswordHistory.findOne({ Key: key });
    if (!record) {
      return res.status(201).json({ message: 'Invalid or expired reset link' });
    }
    if (record.IsValid == false) {
      return res.status(201).json({ message: 'Reset link has already been used' });
    }
    if (record.ExpiryTime < new Date()) {
      return res.status(201).json({ message: 'Reset link has expired' });
    }
    return res.status(200).json({ message: 'Reset link is valid' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { key, newPassword } = req.body;
    if (!key || !newPassword) {
      return res.status(400).json({ message: 'Key and new password are required' });
    }
    const record = await ForgotPasswordHistory.findOne({ Key: key, IsValid: true });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }
    if (record.ExpiryTime < new Date()) {
      return res.status(400).json({ message: 'Reset link has expired' });
    }
    const user = await User.findOne({ username: record.Username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Check if new password is same as old password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: 'New password cannot be the same as the old password' });
    }
    // Enforce strong password requirements
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.' });
    }
    // Update password
    user.password = newPassword;
    await user.save();
    // Mark record as used
    record.IsValid = false;
    record.PasswordChangedDate = new Date();
    await record.save();
    res.status(200).json({ message: 'Password has been reset successfully' });
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
  getUserOrganizations,
  generate2FA,
  verify2FA,
  disable2FA,
  verifyLogin2FA,
  getSecuritySettings,
  updateSecuritySettings,
  updateUserStatus,
  forgotPassword,
  resetPassword,
  verifyResetPassword
}; 