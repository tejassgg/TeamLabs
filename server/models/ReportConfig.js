const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Report Configuration Schema
 * Stores user-defined report configurations and scheduling preferences
 */
const ReportConfigSchema = new mongoose.Schema({
  configId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  projectId: {
    type: String,
    required: true,
    ref: 'Project'
  },
  reportType: {
    type: String,
    enum: ['executive', 'detailed', 'technical', 'dashboard'],
    default: 'executive'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    default: 'weekly'
  },
  sections: [{
    name: {
      type: String,
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    customPrompt: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  recipients: [{
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['project_manager', 'stakeholder', 'team_member', 'executive'],
      default: 'stakeholder'
    },
    deliveryMethod: {
      type: String,
      enum: ['email', 'in_app', 'pdf_download'],
      default: 'email'
    }
  }],
  scheduleSettings: {
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: 1 // Monday
    },
    timeOfDay: {
      type: String,
      default: '09:00'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastGenerated: {
    type: Date,
    default: null
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

// Update the updatedAt field before saving
ReportConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ReportConfig', ReportConfigSchema);
