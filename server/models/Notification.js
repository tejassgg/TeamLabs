const mongoose = require('mongoose');
const { randomUUID: uuidv4 } = require('crypto');

const NotificationSchema = new mongoose.Schema({
  NotificationID: {
    type: String,
    default: uuidv4,
    unique: true
  },
  RecipientID: {
    type: String,
    required: true
  },
  SenderID: {
    type: String,
    default: null
  },
  Type: {
    type: String,
    enum: ['mention', 'assignment', 'status_change', 'comment', 'message'],
    required: true
  },
  Title: {
    type: String,
    required: true
  },
  Body: {
    type: String,
    required: true
  },
  Link: {
    type: String,
    default: ''
  },
  IsRead: {
    type: Boolean,
    default: false
  },
  IsActive: {
    type: Boolean,
    default: true
  },
  CreatedDate: {
    type: Date,
    default: Date.now
  }
});

// Indexing for high-speed queries
NotificationSchema.index({ RecipientID: 1, IsRead: 1 });
NotificationSchema.index({ CreatedDate: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
