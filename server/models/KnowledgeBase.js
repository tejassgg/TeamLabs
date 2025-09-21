const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Knowledge Base Schema
 * Stores processed documents and their embeddings for RAG system
 */
const KnowledgeBaseSchema = new mongoose.Schema({
  documentId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  sourceType: {
    type: String,
    enum: ['project', 'task', 'user_activity', 'report', 'team', 'comment', 'attachment'],
    required: true
  },
  sourceId: {
    type: String,
    required: true // ID of the original document (ProjectID, TaskID, etc.)
  },
  organizationId: {
    type: String,
    required: true
  },
  projectId: {
    type: String,
    required: false // For project-specific documents
  },
  userId: {
    type: String,
    required: false // For user-specific documents
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000 // Chunked content
  },
  metadata: {
    originalData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    chunkIndex: {
      type: Number,
      default: 0
    },
    totalChunks: {
      type: Number,
      default: 1
    },
    keywords: [{
      type: String
    }],
    categories: [{
      type: String,
      enum: ['project_management', 'task_management', 'team_collaboration', 'performance', 'risk_assessment', 'timeline', 'resource_allocation']
    }]
  },
  embedding: {
    type: [Number], // Vector embedding
    required: true
  },
  embeddingModel: {
    type: String,
    default: 'text-embedding-004' // Google's embedding model
  },
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for efficient querying
KnowledgeBaseSchema.index({ organizationId: 1, sourceType: 1 });
KnowledgeBaseSchema.index({ projectId: 1, sourceType: 1 });
KnowledgeBaseSchema.index({ embedding: '2dsphere' }); // For vector similarity search
KnowledgeBaseSchema.index({ 'metadata.keywords': 1 });
KnowledgeBaseSchema.index({ 'metadata.categories': 1 });
KnowledgeBaseSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
KnowledgeBaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
