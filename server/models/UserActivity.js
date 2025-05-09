const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'login_failed', 'profile_update', 'password_change', 'email_verification']
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed']
  },
  loginMethod: {
    type: String,
    enum: ['email', 'google', null],
    default: null
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
userActivitySchema.index({ user: 1, timestamp: -1 });
userActivitySchema.index({ type: 1, loginMethod: 1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity; 