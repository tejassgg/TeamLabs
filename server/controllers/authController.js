// Note: real-time emissions are handled in specific controllers/routes
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const Organization = require('../models/Organization');
const Project = require('../models/Project');
const Integration = require('../models/Integration');
const CommonType = require('../models/CommonType');
const axios = require('axios');
const qrcode = require('qrcode');
const speakeasy = require('speakeasy');
const { logActivity } = require('../services/activityService');
const Invite = require('../models/Invite');
const { randomUUID: uuidv4 } = require('crypto');
require('dotenv').config();
const { emitToOrg } = require('../socket');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { sendEmailVerification, sendSignInCode } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  if (isProduction) {
    options.sameSite = 'none';
    options.secure = true; // 'SameSite=None' MUST be paired with 'Secure=true'
  } else {
    // Development settings
    options.secure = false;
    options.sameSite = 'lax';
  }

  res.cookie('token', token, options);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      role,
      inviteToken
    } = req.body;

    // Basic required field validation
    if (!email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // If username missing, generate one from email
    let finalUsername = username;
    if (!finalUsername) {
      const base = email.split('@')[0];
      // Ensure uniqueness by appending a random suffix if needed
      let candidate = base;
      let exists = await User.findOne({ username: candidate });
      while (exists) {
        const suffix = Math.floor(Math.random() * 10000);
        candidate = `${base}${suffix}`;
        exists = await User.findOne({ username: candidate });
      }
      finalUsername = candidate;
    }

    // Check if user already exists (email or username)
    const userExists = await User.findOne({ $or: [{ email }, { username: finalUsername }] });

    if (userExists) {
      return res.status(400).json({ message: 'Email Already Exists' });
    }

    let organizationID = null;
    let invite = null;
    let assignedRole = role || 'User';

    // Handle invite token if provided
    if (inviteToken) {
      invite = await Invite.findOne({
        token: inviteToken,
        status: 'Pending'
      });

      if (invite) {
        // Check accessType restriction
        if (invite.accessType === 'invited' && invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
          return res.status(400).json({ message: `This invite link is restricted to ${invite.email}` });
        }

        organizationID = invite.organizationID;
        assignedRole = invite.role || assignedRole;

        if (invite.accessType === 'invited') {
          invite.status = 'Accepted';
          invite.acceptedAt = new Date();
          await invite.save();
        }
      } else if (inviteToken.startsWith('inv_')) {
        // Pre-generated HMAC signature fallback verification
        const parts = inviteToken.split('_');
        if (parts.length >= 5) {
          const [prefix, orgId, randomHex, timestampStr, providedSig] = parts;
          const crypto = require('crypto');
          const secret = process.env.JWT_SECRET || 'teamlabs_secret_key';
          const expectedSig = crypto.createHmac('sha256', secret)
            .update(`${orgId}:${randomHex}:${timestampStr}`)
            .digest('hex').substring(0, 16);

          if (providedSig === expectedSig) {
            organizationID = orgId;
          } else {
            return res.status(400).json({ message: 'Invalid or expired invite token' });
          }
        } else {
          return res.status(400).json({ message: 'Invalid or expired invite token' });
        }
      } else {
        return res.status(400).json({ message: 'Invalid or expired invite token' });
      }
    }

    // Validate role
    let safeRole = assignedRole;
    if (role && !invite) {
      try {
        const CommonType = require('../models/CommonType');
        const roleExists = await CommonType.findOne({ MasterType: 'UserRole', Value: role });
        if (!roleExists) {
          return res.status(400).json({ message: 'Invalid role' });
        }
        if (role === 'Admin') {
          return res.status(403).json({ message: 'Not allowed to register with Admin role' });
        }
        safeRole = role;
      } catch (e) {
        safeRole = 'User';
      }
    }

    // Create user (only selected fields); do not verify email yet
    const user = await User.create({
      username: finalUsername,
      email,
      role: safeRole,
      organizationID: organizationID,
      lastLogin: null,
      emailVerified: false
    });

    if (user) {
      // If joined via invite and organization is premium, grant premium to the new user
      try {
        if (organizationID) {
          const org = await Organization.findOne({ OrganizationID: organizationID });
          if (org?.isPremium && org?.subscription?.endDate && new Date(org.subscription.endDate) > new Date()) {
            const plan = org.subscription.plan || 'monthly';
            const startDate = org.subscription.startDate || new Date();
            const endDate = org.subscription.endDate;
            await user.activatePremium(plan, startDate, endDate);
          }
        }
      } catch (e) {
        // Non-fatal: log and continue response
        console.error('Auto-activate premium for invited user failed:', e?.message || e);
      }
      // Generate verification token
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 7 * 60 * 60 * 1000);
      await EmailVerificationToken.deleteMany({ userId: user._id, used: false });
      await EmailVerificationToken.create({ userId: user._id, token, expiresAt });

      const verifyLink = `${process.env.FRONTEND_URL}/auth?type=verify&token=${token}`;
      await sendEmailVerification(user.email, user.username || user.email.split('@')[0], verifyLink);

      // Respond without logging in
      res.status(201).json({
        message: 'Registration successful. Please verify your email to activate your account.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify email via token and redirect to login
// @route   GET /api/auth/verify-email?token=...
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token is required' });

    const record = await EmailVerificationToken.findOne({ token, used: false });
    if (!record) return res.status(400).json({ message: 'Invalid or expired verification link' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'Verification link has expired' });

    await User.findByIdAndUpdate(record.userId, { emailVerified: true });
    record.used = true;
    await record.save();

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { usernameOrEmail } = req.body || {};
    if (!usernameOrEmail) return res.status(400).json({ message: 'Username or email is required' });

    const user = await User.findOne({ $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(200).json({ message: 'Email already verified' });

    await EmailVerificationToken.deleteMany({ userId: user._id, used: false });
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await EmailVerificationToken.create({ userId: user._id, token, expiresAt });

    const verifyLink = `${process.env.FRONTEND_URL}/auth?type=verify&token=${token}`;
    await sendEmailVerification(user.email, user.username || user.email.split('@')[0], verifyLink);

    return res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Server error' });
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
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
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

    const { credential, inviteToken } = req.body;

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
      const userData = user.toObject();

      userData.profileImage = picture;
      userData.needsAdditionalDetails = false;
      userData.emailVerified = true;
      // Return user data with token and Google profile image
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      userData.token = token;
      return res.json(userData);
    } else {
      // If user doesn't exist, create new user with partial profile
      // Generate username from email (use base prefix if unique, otherwise append random suffix)
      const base = email.split('@')[0];
      let candidate = base;
      let exists = await User.findOne({ username: candidate });
      while (exists) {
        const suffix = Math.floor(Math.random() * 10000);
        candidate = `${base}${suffix}`;
        exists = await User.findOne({ username: candidate });
      }
      const username = candidate;

      let organizationID = null;
      let invite = null;
      let assignedRole = 'User';

      // Handle invite token if provided
      if (inviteToken) {
        invite = await Invite.findOne({
          token: inviteToken,
          status: 'Pending'
        });

        if (invite) {
          if (invite.accessType === 'invited' && invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(400).json({ message: `This invite link is restricted to ${invite.email}` });
          }

          organizationID = invite.organizationID;
          assignedRole = invite.role || assignedRole;

          if (invite.accessType === 'invited') {
            invite.status = 'Accepted';
            invite.acceptedAt = new Date();
            await invite.save();
          }
        } else if (inviteToken.startsWith('inv_')) {
          const parts = inviteToken.split('_');
          if (parts.length >= 5) {
            const [prefix, orgId, randomHex, timestampStr, providedSig] = parts;
            const crypto = require('crypto');
            const secret = process.env.JWT_SECRET || 'teamlabs_secret_key';
            const expectedSig = crypto.createHmac('sha256', secret)
              .update(`${orgId}:${randomHex}:${timestampStr}`)
              .digest('hex').substring(0, 16);

            if (providedSig === expectedSig) {
              organizationID = orgId;
            } else {
              return res.status(400).json({ message: 'Invalid or expired invite token' });
            }
          } else {
            return res.status(400).json({ message: 'Invalid or expired invite token' });
          }
        } else {
          return res.status(400).json({ message: 'Invalid or expired invite token' });
        }
      }

      user = await User.create({
        username,
        firstName: given_name || name.split(' ')[0],
        lastName: family_name || name.split(' ').slice(1).join(' '),
        email,
        googleId: sub,
        lastLogin: new Date(),
        emailVerified: true,
        phone: null,
        middleName: null,
        address: null,
        aptNumber: null,
        zipCode: null,
        city: null,
        state: null,
        country: null,
        role: assignedRole,
        organizationID: organizationID,
        // Set default security settings
        twoFactorEnabled: false,
        sessionTimeout: 30,
        loginNotifications: true,
        status: 'Offline',
      });

      // If joined via invite and organization is premium, grant premium to the new user
      try {
        if (organizationID) {
          const org = await Organization.findOne({ OrganizationID: organizationID });
          if (org?.isPremium && org?.subscription?.endDate && new Date(org.subscription.endDate) > new Date()) {
            const plan = org.subscription.plan || 'monthly';
            const startDate = org.subscription.startDate || new Date();
            const endDate = org.subscription.endDate;
            await user.activatePremium(plan, startDate, endDate);
          }
        }
      } catch (e) {
        // Non-fatal: log and continue
        console.error('Auto-activate premium for invited user (Google) failed:', e?.message || e);
      }

      // Log successful Google login for new user
      await logActivity(user._id, 'login', 'success', 'New user registered and logged in via Google', req, { provider: 'google' });

      const userData = user.toObject();
      userData.profileImage = picture;
      userData.needsAdditionalDetails = !organizationID;
      userData.message = organizationID ? 'Welcome to the organization!' : 'Please complete your profile with additional details';
      // Include security settings in login response
      userData.twoFactorEnabled = false;
      userData.sessionTimeout = 30;
      userData.loginNotifications = true;
      userData.status = 'Offline';
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      userData.token = token;
      res.status(201).json(userData);
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
      firstName,
      lastName,
      address,
      aptNumber,
      zipCode,
      city,
      state,
      country,
      organizationID,
      role,
      needsUpdate
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (needsUpdate === 'organizationID') {
      user.organizationID = organizationID;
    }
    else {
      // Update user profile with additional details
      user.phone = phone;
      user.phoneExtension = phoneExtension || user.phoneExtension; // Keep existing if not provided
      user.firstName = firstName;
      user.lastName = lastName;
      user.address = address;
      user.aptNumber = aptNumber;
      user.zipCode = zipCode;
      user.city = city;
      user.state = state;
      user.country = country;
    }

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

    // Mark user as Active after profile completion
    user.status = 'Active';

    await user.save();

    // Log profile update
    await logActivity(user._id, 'profile_update', 'success', 'Profile updated successfully', req);

    // Only try to find organization if organizationID is provided
    let organization = null;
    if (user.organizationID) {
      organization = await Organization.findOne({
        OrganizationID: user.organizationID
      });
    }

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
      role: user.role,
      organization: organization ? {
        name: organization.Name,
        code: organization.Code
      } : null
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
    const user = await User.findById(req.user._id).select('-googleId');

    if (user) {
      // If user has an organization ID, fetch the organization details
      if (user.organizationID) {
        const CommonType = require('../models/CommonType');

        const organization = await Organization.findOne({
          OrganizationID: user.organizationID
        });

        // Add organization details to the response
        const userProfile = user.toObject();
        userProfile.organization = organization ? {
          name: organization.Name,
          code: organization.Code
        } : null;
        userProfile.organizationID = user.organizationID;
        userProfile.status = user.status;
        userProfile.orgName = organization ? organization.Name : null;
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


    let types = ['team_create', 'team_update', 'team_delete', 'team_join', 'team_leave', 'team_status_toggle', 'team_status_update', 'project_create', 'project_update', 'task_create', 'task_update', 'task_complete', 'task_assign', 'user_story_create', 'user_story_update', 'user_story_delete'];

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
      const organization = await Organization.findOne({
        OrganizationID: user.organizationID
      });

      if (organization) {
        return res.json([{
          _id: organization._id,
          name: organization.Name,
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
    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

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
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    const userData = user.toObject();
    userData.token = token;
    return res.status(200).json(userData);
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

// @desc    Update User Settings
// @route   PUT /api/auth/user-settings
// @access  Private
const updateUserSettings = async (req, res) => {
  try {
    const { fontFamily, userId } = req.body;

    await User.findByIdAndUpdate(userId, {
      $set: {
        fontFamily: fontFamily
      }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('User Settings Update Error:', error);
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
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Emit real-time update to organization members
    try {
      if (user.organizationID) {
        emitToOrg(user.organizationID, 'org.member.updated', {
          event: 'org.member.updated',
          version: 1,
          data: {
            organizationId: String(user.organizationID),
            member: {
              userId: user._id.toString(),
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              role: user.role,
              status: user.status
            }
          },
          meta: { emittedAt: new Date().toISOString() }
        });
      }
    } catch (e) { /* ignore emission errors */ }

    res.status(200).json({ message: 'Status updated successfully', status: user.status });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// GitHub OAuth Integration
const initiateGitHubAuth = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Generate state parameter for security using browser-compatible method
    const generateRandomString = (length) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const state = generateRandomString(32);

    // Store state in session or temporary storage (for production, use Redis)
    // For now, we'll use a simple approach
    const redirectUri = `${process.env.FRONTEND_URL}/github-callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user:email&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    res.json({
      success: true,
      authUrl: githubAuthUrl,
      state: state
    });
  } catch (error) {
    console.error('GitHub auth initiation error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate GitHub authentication' });
  }
};

const handleGitHubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = req.body;

    if (!code || !state || !userId) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(400).json({ success: false, error: 'Failed to obtain access token' });
    }

    // Get user information from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const githubUser = userResponse.data;

    // Get user's email from GitHub
    const emailsResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const primaryEmail = emailsResponse.data.find(email => email.primary)?.email || githubUser.email;

    // Update user with GitHub information
    const Integration = require('../models/Integration');
    const user = await User.findById(userId).select('organizationID');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await Integration.findOneAndUpdate(
      { userId, integrationType: 'github' },
      {
        userId,
        organizationId: user.organizationID,
        integrationType: 'github',
        isConnected: true,
        connectedAt: new Date(),
        accessToken: access_token,
        externalId: githubUser.id.toString(),
        externalUsername: githubUser.login,
        externalEmail: primaryEmail,
        externalAvatarUrl: githubUser.avatar_url,
        status: 'active',
        lastUsedAt: new Date(),
        tokenExpiry: tokenResponse.data.expires_in ? new Date(Date.now() + tokenResponse.data.expires_in * 1000) : null,
      },
      { upsert: true }
    );

    // Log the activity
    await UserActivity.create({
      user: userId,
      type: 'github_connected',
      status: 'success',
      details: `Connected GitHub account: ${githubUser.login}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'GitHub account connected successfully',
      githubUser: {
        username: githubUser.login,
        email: primaryEmail,
        avatarUrl: githubUser.avatar_url
      }
    });
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete GitHub authentication' });
  }
};

const disconnectGitHub = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const Integration = require('../models/Integration');
    const integration = await Integration.findOne({ userId, integrationType: 'github' });

    if (!integration || !integration.isConnected) {
      return res.status(400).json({ success: false, error: 'GitHub account is not connected' });
    }

    // Revoke GitHub access token
    if (integration.accessToken) {
      try {
        await axios.delete(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
          headers: {
            'Authorization': `token ${integration.accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          data: {
            access_token: integration.accessToken
          }
        });
      } catch (error) {
        console.error('Error revoking GitHub token:', error);
        // Continue with disconnection even if token revocation fails
      }
    }

    // Update integration to remove GitHub connection
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'github' },
      {
        isConnected: false,
        accessToken: null,
        externalId: null,
        externalUsername: null,
        externalEmail: null,
        externalAvatarUrl: null,
        connectedAt: null,
        status: 'revoked'
      }
    );

    // Log the activity
    await UserActivity.create({
      user: userId,
      type: 'github_disconnected',
      status: 'success',
      details: 'Disconnected GitHub account',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'GitHub account disconnected successfully'
    });
  } catch (error) {
    console.error('GitHub disconnect error:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect GitHub account' });
  }
};

const getGitHubStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const integration = await Integration.findOne({ userId, integrationType: 'github' });

    if (!integration) {
      return res.json({
        success: true,
        githubStatus: {
          connected: false,
          username: null,
          email: null,
          avatarUrl: null,
          connectedAt: null
        }
      });
    }

    res.json({
      success: true,
      githubStatus: {
        connected: integration.isConnected,
        username: integration.externalUsername,
        email: integration.externalEmail,
        avatarUrl: integration.externalAvatarUrl,
        connectedAt: integration.connectedAt
      }
    });
  } catch (error) {
    console.error('GitHub status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get GitHub status' });
  }
};

const getIntegrationsStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const user = await User.findById(userId).select('email profileImage organizationID');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get all available integrations from CommonType
    const availableIntegrations = await CommonType.find({ MasterType: 'Integrations' }).sort({ Code: 1 });

    // Get user's connected integrations
    const userIntegrations = await Integration.find({ userId }).select('integrationType isConnected connectedAt externalUsername externalEmail externalAvatarUrl tokenExpiry');

    // Create a map of user's connected integrations
    const userIntegrationsMap = {};
    userIntegrations.forEach(integration => {
      userIntegrationsMap[integration.integrationType] = {
        connected: integration.isConnected,
        username: integration.externalUsername || null,
        email: integration.externalEmail || null,
        avatarUrl: integration.externalAvatarUrl || null,
        connectedAt: integration.connectedAt || null,
        tokenExpiry: integration.tokenExpiry || null
      };
    });

    // Format all integrations with their status
    const allIntegrations = availableIntegrations.map(integration => {
      const integrationType = integration.Description;
      const userIntegration = userIntegrationsMap[integrationType];

      return {
        id: integration.Code,
        name: integration.Value,
        type: integrationType,
        icon: integration.FaIcon,
        description: getIntegrationDescription(integrationType),
        connected: userIntegration?.connected || false,
        username: userIntegration?.username || null,
        email: userIntegration?.email || null,
        avatarUrl: userIntegration?.avatarUrl || null,
        connectedAt: userIntegration?.connectedAt || null,
        tokenExpiry: userIntegration?.tokenExpiry || null
      };
    });

    res.json({
      success: true,
      integrations: allIntegrations
    });
  } catch (error) {
    console.error('Integrations status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get integrations status' });
  }
};

// Helper function to get integration description
const getIntegrationDescription = (integrationType) => {
  const descriptions = {
    github: 'Code repository management and collaboration',
    google_calendar: 'Auto-sync meetings & set reminders',
    google_meet: 'Sync meeting notes with AI-generated highlights',
    google_drive: 'Save meeting notes and attachments securely',
    dropbox: 'Store and share files directly from your meetings',
    slack: 'Get instant meeting summaries & action items in your team channels',
    zoom: 'AI-powered meeting transcriptions & summaries',
    microsoft_teams: 'Capture key discussions & automate action items',
    onedrive: 'Sync meeting documents across your devices',
    microsoft_outlook: 'Schedule and track discussions effortlessly'
  };
  return descriptions[integrationType] || 'Integration description not available';
};

// GitHub Repository methods
const getUserRepositories = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const integration = await Integration.findOne({ userId, integrationType: 'github' });

    if (!integration || !integration.isConnected) {
      return res.status(400).json({ success: false, error: 'GitHub account not connected' });
    }

    // Fetch user's repositories from GitHub
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${integration.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        sort: 'updated',
        per_page: 100
      }
    });

    const repositories = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      private: repo.private,
      updated_at: repo.updated_at
    }));

    res.json({
      success: true,
      repositories
    });
  } catch (error) {
    console.error('Error fetching user repositories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch repositories' });
  }
};

// Project GitHub Repository methods
const linkRepositoryToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { repositoryData } = req.body;
    const userId = req.user._id;

    if (!projectId || !repositoryData) {
      return res.status(400).json({ success: false, error: 'Project ID and repository data are required' });
    }

    // Check if user has GitHub connected
    const integration = await Integration.findOne({ userId, integrationType: 'github' });

    if (!integration || !integration.isConnected) {
      return res.status(400).json({ success: false, error: 'GitHub account not connected' });
    }

    // Find the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if user is project owner or has permission
    if (project.ProjectOwner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to link repository to this project' });
    }

    // Update project with repository information
    const updatedProject = await Project.findOneAndUpdate(
      { ProjectID: projectId },
      {
        'githubRepository.connected': true,
        'githubRepository.repositoryId': repositoryData.id,
        'githubRepository.repositoryName': repositoryData.name,
        'githubRepository.repositoryUrl': repositoryData.html_url,
        'githubRepository.repositoryFullName': repositoryData.full_name,
        'githubRepository.repositoryDescription': repositoryData.description,
        'githubRepository.repositoryLanguage': repositoryData.language,
        'githubRepository.repositoryStars': repositoryData.stargazers_count,
        'githubRepository.repositoryForks': repositoryData.forks_count,
        'githubRepository.connectedAt': new Date(),
        'githubRepository.connectedBy': userId
      },
      { returnDocument: 'after' }
    );

    // Log the activity
    await UserActivity.create({
      user: userId,
      type: 'repository_linked',
      status: 'success',
      details: `Linked repository ${repositoryData.full_name} to project ${project.Name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Repository linked successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error linking repository to project:', error);
    res.status(500).json({ success: false, error: 'Failed to link repository to project' });
  }
};

const unlinkRepositoryFromProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    // Find the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if user is project owner or has permission
    if (project.ProjectOwner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to unlink repository from this project' });
    }

    // Check if repository is linked
    if (!project.githubRepository?.connected) {
      return res.status(400).json({ success: false, error: 'No repository linked to this project' });
    }

    // Update project to remove repository information
    const updatedProject = await Project.findOneAndUpdate(
      { ProjectID: projectId },
      {
        'githubRepository.connected': false,
        'githubRepository.repositoryId': null,
        'githubRepository.repositoryName': null,
        'githubRepository.repositoryUrl': null,
        'githubRepository.repositoryFullName': null,
        'githubRepository.repositoryDescription': null,
        'githubRepository.repositoryLanguage': null,
        'githubRepository.repositoryStars': 0,
        'githubRepository.repositoryForks': 0,
        'githubRepository.connectedAt': null,
        'githubRepository.connectedBy': null
      },
      { returnDocument: 'after' }
    );

    // Log the activity
    await UserActivity.create({
      user: userId,
      type: 'repository_unlinked',
      status: 'success',
      details: `Unlinked repository from project ${project.Name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Repository unlinked successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error unlinking repository from project:', error);
    res.status(500).json({ success: false, error: 'Failed to unlink repository from project' });
  }
};

const updateOnboardingStatus = async (req, res) => {
  try {
    const { completed, step, progress } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (completed !== undefined) updateData.onboardingCompleted = completed;
    if (step) updateData.onboardingStep = step;
    if (progress) updateData.onboardingProgress = progress;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
      onboardingProgress: user.onboardingProgress
    });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    res.status(500).json({ message: 'Failed to update onboarding status' });
  }
};

const getProjectRepository = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    // Import Project model
    const Project = require('../models/Project');

    // Find the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!project.githubRepository?.connected) {
      return res.json({
        success: true,
        repository: null
      });
    }

    res.json({
      success: true,
      repository: project.githubRepository
    });
  } catch (error) {
    console.error('Error getting project repository:', error);
    res.status(500).json({ success: false, error: 'Failed to get project repository' });
  }
};

// Get commits from GitHub repository
const getProjectCommits = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, per_page = 20 } = req.query;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    // Find the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if repository is linked
    if (!project.githubRepository?.connected) {
      return res.status(400).json({ success: false, error: 'No repository linked to this project' });
    }

    // Get the user who linked the repository
    const linkingIntegration = await Integration.findOne({
      userId: project.githubRepository.connectedBy,
      integrationType: 'github'
    });

    if (!linkingIntegration || !linkingIntegration.isConnected) {
      return res.status(400).json({ success: false, error: 'Repository owner not connected to GitHub' });
    }

    // Fetch commits from GitHub API
    const response = await axios.get(
      `https://api.github.com/repos/${project.githubRepository.repositoryFullName}/commits`,
      {
        headers: {
          'Authorization': `token ${linkingIntegration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          page,
          per_page
        }
      }
    );

    // Format the commits data
    const commits = response.data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date
      },
      committer: {
        name: commit.commit.committer.name,
        email: commit.commit.committer.email,
        date: commit.commit.committer.date
      },
      html_url: commit.html_url,
      url: commit.url,
      parents: commit.parents.map(parent => parent.sha)
    }));

    res.json({
      success: true,
      commits,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        has_next: response.data.length === parseInt(per_page)
      }
    });
  } catch (error) {
    console.error('Error fetching project commits:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, error: 'Repository not found or access denied' });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch commits' });
  }
};

// Get issues from GitHub repository
const getProjectIssues = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, per_page = 20 } = req.query;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    // Find the project
    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if repository is linked
    if (!project.githubRepository?.connected) {
      return res.status(400).json({ success: false, error: 'No repository linked to this project' });
    }

    // Get the user who linked the repository
    const linkingIntegration = await Integration.findOne({
      userId: project.githubRepository.connectedBy,
      integrationType: 'github'
    });

    if (!linkingIntegration || !linkingIntegration.isConnected) {
      return res.status(400).json({ success: false, error: 'Repository owner not connected to GitHub' });
    }

    // Fetch issues from GitHub API
    const response = await axios.get(
      `https://api.github.com/repos/${project.githubRepository.repositoryFullName}/issues`,
      {
        headers: {
          'Authorization': `token ${linkingIntegration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          page,
          per_page,
          state: 'all' // Get both open and closed issues
        }
      }
    );

    // Format the issues data
    const issues = response.data.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      locked: issue.locked,
      assignees: issue.assignees,
      labels: issue.labels,
      user: {
        login: issue.user.login,
        avatar_url: issue.user.avatar_url,
        html_url: issue.user.html_url
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      html_url: issue.html_url,
      comments: issue.comments,
      pull_request: issue.pull_request
    }));

    res.json({
      success: true,
      issues,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        has_next: response.data.length === parseInt(per_page)
      }
    });
  } catch (error) {
    console.error('Error fetching project issues:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, error: 'Repository not found or access denied' });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch issues' });
  }
};

const getProjectBranches = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!project.githubRepository?.connected) {
      return res.status(400).json({ success: false, error: 'No repository linked to this project' });
    }

    const linkingIntegration = await Integration.findOne({
      userId: project.githubRepository.connectedBy,
      integrationType: 'github'
    });

    if (!linkingIntegration || !linkingIntegration.isConnected) {
      return res.status(400).json({ success: false, error: 'Repository owner not connected to GitHub' });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${project.githubRepository.repositoryFullName}/branches`,
      {
        headers: {
          'Authorization': `token ${linkingIntegration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          per_page: 100
        }
      }
    );

    const branches = response.data.map(branch => ({
      name: branch.name,
      commitSha: branch.commit?.sha,
      protected: branch.protected
    }));

    res.json({
      success: true,
      branches
    });
  } catch (error) {
    console.error('Error fetching project branches:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, error: 'Repository not found or access denied' });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch branches' });
  }
};

const getProjectPullRequests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    const project = await Project.findOne({ ProjectID: projectId });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!project.githubRepository?.connected) {
      return res.status(400).json({ success: false, error: 'No repository linked to this project' });
    }

    const linkingIntegration = await Integration.findOne({
      userId: project.githubRepository.connectedBy,
      integrationType: 'github'
    });

    if (!linkingIntegration || !linkingIntegration.isConnected) {
      return res.status(400).json({ success: false, error: 'Repository owner not connected to GitHub' });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${project.githubRepository.repositoryFullName}/pulls`,
      {
        headers: {
          'Authorization': `token ${linkingIntegration.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          state: 'all',
          per_page: 100
        }
      }
    );

    const pulls = response.data.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      htmlUrl: pr.html_url,
      branch: pr.head?.ref,
      user: pr.user?.login
    }));

    res.json({
      success: true,
      pulls
    });
  } catch (error) {
    console.error('Error fetching project pull requests:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, error: 'Repository not found or access denied' });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch pull requests' });
  }
};

// @desc    Request verification code for sign in
// @route   POST /api/auth/signin-code/request
// @access  Public
const requestSignInCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    // Generate a 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save code to user
    user.signInCode = code;
    user.signInCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    // Send email
    const emailSent = await sendSignInCode(user.email, user.username || user.email.split('@')[0], code);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    // Log activity
    await logActivity(user._id, 'signin_code_requested', 'success', 'Sign in code requested by user', req, {}, 'email');

    res.status(200).json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Request sign in code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify sign in code and authenticate user
// @route   POST /api/auth/signin-code/verify
// @access  Public
const verifySignInCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+signInCode');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.signInCode || user.signInCode !== code) {
      await logActivity(user._id, 'login_failed', 'error', 'Invalid verification code', req, {}, 'email');
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > user.signInCodeExpires) {
      await logActivity(user._id, 'login_failed', 'error', 'Expired verification code', req, {}, 'email');
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Code is valid! Clear it
    user.signInCode = null;
    user.signInCodeExpires = null;

    // Auto-verify email if not verified
    if (!user.emailVerified) {
      user.emailVerified = true;
    }

    user.lastLogin = new Date();
    user.status = 'Active';
    await user.save();

    // Log successful login
    await logActivity(user._id, 'login', 'success', 'User logged in successfully via verification code', req, {}, 'email');

    // Handle 2FA if enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        twoFactorEnabled: true,
        userId: user._id
      });
    }

    const userData = user.toObject();
    delete userData.signInCode;
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    userData.token = token;

    res.status(200).json(userData);
  } catch (error) {
    console.error('Verify sign in code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  googleLogin,
  verifyEmail,
  resendVerification,
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
  updateUserSettings,
  updateUserStatus,
  initiateGitHubAuth,
  handleGitHubCallback,
  disconnectGitHub,
  getGitHubStatus,
  getIntegrationsStatus,
  getUserRepositories,
  linkRepositoryToProject,
  unlinkRepositoryFromProject,
  getProjectRepository,
  getProjectCommits,
  getProjectBranches,
  getProjectPullRequests,
  getProjectIssues,
  updateOnboardingStatus,
  requestSignInCode,
  verifySignInCode
}; 