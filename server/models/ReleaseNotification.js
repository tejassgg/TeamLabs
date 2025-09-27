const mongoose = require('mongoose');

/**
 * Release Notification Schema
 * Stores system release notifications created by organization admins
 */
const ReleaseNotificationSchema = new mongoose.Schema({
  releaseId: {
    type: String,
    unique: true
  },
  version: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  features: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  improvements: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  bugFixes: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  createdByName: {
    type: String,
    required: true
  },
  organizationID: {
    type: Number,
    required: true,
    ref: 'Organization',
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishDate: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'admin', 'premium', 'beta'],
    default: 'all'
  },
  releaseNotes: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  compatibility: {
    minVersion: String,
    maxVersion: String,
    supportedBrowsers: [String],
    requirements: [String]
  },
  metadata: {
    releaseType: {
      type: String,
      enum: ['major', 'minor', 'patch', 'hotfix'],
      default: 'minor'
    },
    buildNumber: {
      type: String,
      default: null
    },
    releaseChannel: {
      type: String,
      enum: ['stable', 'beta', 'alpha', 'dev'],
      default: 'stable'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
ReleaseNotificationSchema.index({ organizationID: 1, isActive: 1, isPublished: 1 });
ReleaseNotificationSchema.index({ createdAt: -1 });
ReleaseNotificationSchema.index({ version: 1, organizationID: 1 });

// Update the updatedAt field before saving
ReleaseNotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate unique release ID before saving
ReleaseNotificationSchema.pre('save', async function(next) {
  if (this.isNew && !this.releaseId) {
    const count = await mongoose.model('ReleaseNotification').countDocuments();
    this.releaseId = `REL-${Date.now()}-${count + 1}`;
  }
  next();
});

// Auto-generate build number before saving
ReleaseNotificationSchema.pre('save', async function(next) {
  if (this.isNew && (!this.metadata.buildNumber || this.metadata.buildNumber === '')) {
    try {
      // Get the count of existing releases for this organization to generate sequential build numbers
      const orgReleaseCount = await mongoose.model('ReleaseNotification').countDocuments({
        organizationID: this.organizationID,
        isActive: true
      });
      
      // Generate build number: timestamp + organization count for uniqueness
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const buildNumber = `${timestamp}${String(orgReleaseCount + 1).padStart(3, '0')}`;
      this.metadata.buildNumber = buildNumber;
    } catch (error) {
      console.error('Error generating build number:', error);
      // Fallback to timestamp-based build number
      this.metadata.buildNumber = Date.now().toString();
    }
  }
  next();
});

module.exports = mongoose.model('ReleaseNotification', ReleaseNotificationSchema);
