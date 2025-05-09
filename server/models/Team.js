const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TeamSchema = new mongoose.Schema({
  TeamID: {
    type: String,
    default: uuidv4,
    unique: true
  },
  TeamName: {
    type: String,
    required: true,
    maxlength: 50
  },
  TeamDescription: {
    type: String,
    maxlength: 100
  },
  TeamType: {
    type: Number,
    required: true
  },
  OwnerID: {
    type: String,
    required: true
  },
  organizationID: {
    type: String,
    default: ''
  },
  IsActive: {
    type: Boolean,
    default: true
  },
  CreatedDate: {
    type: Date,
    default: Date.now
  },
  ModifiedDate: {
    type: Date
  },
  ModifiedBy: {
    type: String,
    maxlength: 50
  }
});

module.exports = mongoose.model('Team', TeamSchema); 