const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Generated Report Schema
 * Stores the actual generated reports with content and metadata
 */
const GeneratedReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  projectId: {
    type: String,
    required: true,
    ref: 'Project'
  },
  configId: {
    type: String,
    required: true,
    ref: 'ReportConfig'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  reportType: {
    type: String,
    enum: ['executive', 'detailed', 'technical', 'dashboard'],
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  content: {
    rawContent: {
      type: String,
      required: true
    },
    metrics: {
      totalTasks: {
        type: Number,
        default: 0
      },
      completedTasks: {
        type: Number,
        default: 0
      },
      overdueTasks: {
        type: Number,
        default: 0
      },
      completionRate: {
        type: Number,
        default: 0
      },
      averageCompletionTime: {
        type: Number,
        default: 0
      },
      teamUtilization: {
        type: Number,
        default: 0
      },
      projectHealth: {
        type: Number,
        default: 0
      }
    },
    riskAssessment: {
      high: [{
        type: String
      }],
      medium: [{
        type: String
      }],
      low: [{
        type: String
      }]
    },
    teamPerformance: {
      topPerformers: [{
        userId: String,
        name: String,
        tasksCompleted: Number,
        averageCompletionTime: Number
      }],
      underPerformers: [{
        userId: String,
        name: String,
        tasksCompleted: Number,
        averageCompletionTime: Number
      }]
    }
  },
  metadata: {
    generationTime: {
      type: Number,
      required: true // Time in milliseconds
    },
    dataPoints: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number,
      default: 0
    },
    llmModel: {
      type: String,
      default: 'gemini-pro'
    },
    promptTokens: {
      type: Number,
      default: 0
    },
    responseTokens: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'cancelled'],
    default: 'generating'
  },
  errorMessage: {
    type: String,
    default: null
  },
  deliveryStatus: {
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date,
      default: null
    },
    recipientsNotified: [{
      email: String,
      sentAt: Date,
      status: {
        type: String,
        enum: ['sent', 'failed', 'pending'],
        default: 'pending'
      }
    }]
  },
  views: [{
    userId: String,
    viewedAt: Date,
    viewDuration: Number // in seconds
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comments: {
      type: String,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    submittedBy: {
      type: String,
      ref: 'User',
      default: null
    }
  }
});

// Index for efficient querying
GeneratedReportSchema.index({ projectId: 1, generatedAt: -1 });
GeneratedReportSchema.index({ userId: 1, generatedAt: -1 });
GeneratedReportSchema.index({ configId: 1, generatedAt: -1 });
GeneratedReportSchema.index({ status: 1 });

// Virtual for completion percentage
GeneratedReportSchema.virtual('completionPercentage').get(function() {
  if (this.content.metrics.totalTasks === 0) return 0;
  return Math.round((this.content.metrics.completedTasks / this.content.metrics.totalTasks) * 100);
});

// Method to add view tracking
GeneratedReportSchema.methods.addView = function(userId) {
  this.views.push({
    userId,
    viewedAt: new Date()
  });
  return this.save();
};

// Method to add feedback
GeneratedReportSchema.methods.addFeedback = function(rating, comments, userId) {
  this.feedback = {
    rating,
    comments,
    submittedAt: new Date(),
    submittedBy: userId
  };
  return this.save();
};

// Static method to get reports by project
GeneratedReportSchema.statics.getReportsByProject = function(projectId, limit = 10) {
  return this.find({ projectId })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName email')
    .populate('configId', 'reportType frequency');
};

// Static method to get reports by user
GeneratedReportSchema.statics.getReportsByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .populate('projectId', 'Name Description')
    .populate('configId', 'reportType frequency');
};

module.exports = mongoose.model('GeneratedReport', GeneratedReportSchema);
