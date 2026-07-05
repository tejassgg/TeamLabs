const mongoose = require('mongoose');
const { randomUUID: uuidv4 } = require('crypto');

const TeamDetailsSchema = new mongoose.Schema({
  TeamDetailsID: {
    type: String,
    default: uuidv4,
    unique: true
  },
  TeamID_FK: {
    type: String,
    required: true
  },
  MemberID: {
    type: String,
    required: true
  },
  IsMemberActive: {
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
    type: String
  }
});

module.exports = mongoose.model('TeamDetails', TeamDetailsSchema); 