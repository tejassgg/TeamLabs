const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organizationId: {
    type: Number,
    ref: 'Organization',
    required: true,
    index: true
  },
  integrationType: {
    type: String,
    required: true,
    enum: ['github', 'google_calendar', 'google_meet', 'google_drive', 'dropbox', 'slack', 'zoom', 'microsoft_teams', 'onedrive', 'microsoft_outlook'],
    index: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  connectedAt: {
    type: Date,
    default: null
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  
  // OAuth tokens and credentials
  accessToken: {
    type: String,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  },
  tokenExpiry: {
    type: Date,
    default: null
  },
  scope: {
    type: [String],
    default: []
  },
  
  // Integration-specific data
  externalId: {
    type: String,
    default: null // GitHub user ID, Google user ID, etc.
  },
  externalUsername: {
    type: String,
    default: null // GitHub username, Google email, etc.
  },
  externalEmail: {
    type: String,
    default: null
  },
  externalAvatarUrl: {
    type: String,
    default: null
  },
  externalName: {
    type: String,
    default: null // Full name from external service
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Status and error tracking
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'error'],
    default: 'active'
  },
  lastError: {
    type: String,
    default: null
  },
  errorCount: {
    type: Number,
    default: 0
  },
  
  // Settings and preferences
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
IntegrationSchema.index({ userId: 1, integrationType: 1 }, { unique: true });
IntegrationSchema.index({ organizationId: 1, integrationType: 1 });
IntegrationSchema.index({ isConnected: 1, integrationType: 1 });
IntegrationSchema.index({ tokenExpiry: 1 });

// Instance methods
IntegrationSchema.methods.isTokenExpired = function() {
  if (!this.tokenExpiry) return false;
  return new Date() > this.tokenExpiry;
};

IntegrationSchema.methods.needsRefresh = function() {
  if (!this.tokenExpiry || !this.refreshToken) return false;
  // Consider token needing refresh if it expires within 5 minutes
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return fiveMinutesFromNow > this.tokenExpiry;
};

IntegrationSchema.methods.updateLastUsed = function() {
  this.lastUsedAt = new Date();
  return this.save();
};

IntegrationSchema.methods.incrementErrorCount = function(error) {
  this.errorCount += 1;
  this.lastError = error;
  this.status = this.errorCount > 5 ? 'error' : 'active';
  return this.save();
};

IntegrationSchema.methods.resetErrorCount = function() {
  this.errorCount = 0;
  this.lastError = null;
  this.status = 'active';
  return this.save();
};

// Static methods
IntegrationSchema.statics.findByUserAndType = function(userId, integrationType) {
  return this.findOne({ userId, integrationType });
};

IntegrationSchema.statics.findByOrganization = function(organizationId) {
  return this.find({ organizationId }).populate('userId', 'firstName lastName email');
};

IntegrationSchema.statics.findConnectedIntegrations = function(userId) {
  return this.find({ userId, isConnected: true });
};

IntegrationSchema.statics.findExpiredTokens = function() {
  return this.find({ 
    tokenExpiry: { $lt: new Date() },
    isConnected: true 
  });
};

// Pre-save middleware
IntegrationSchema.pre('save', function(next) {
  // Update connectedAt when connection status changes to true
  if (this.isModified('isConnected') && this.isConnected && !this.connectedAt) {
    this.connectedAt = new Date();
  }
  
  // Reset connectedAt when disconnected
  if (this.isModified('isConnected') && !this.isConnected) {
    this.connectedAt = null;
  }
  
  next();
});

module.exports = mongoose.model('Integration', IntegrationSchema);
