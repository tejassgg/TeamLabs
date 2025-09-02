const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MeetingSchema = new mongoose.Schema({
  MeetingID: {
    type: String,
    default: uuidv4,
    unique: true
  },
  TeamID_FK: {
    type: String,
    required: true,
    ref: 'Team'
  },
  Title: {
    type: String,
    required: true,
    maxlength: 200
  },
  Description: {
    type: String,
    default: ''
  },
  OrganizerID: {
    type: String,
    required: true,
    ref: 'User'
  },
  AttendeeIDs: {
    type: [String],
    default: []
  },
  TaskIDs: {
    type: [String],
    default: []
  },
  GoogleEventId: {
    type: String,
    default: null
  },
  GoogleMeetLink: {
    type: String,
    default: null
  },
  StartTime: {
    type: Date,
    default: null
  },
  EndTime: {
    type: Date,
    default: null
  },
  CreatedDate: {
    type: Date,
    default: Date.now
  },
  ModifiedDate: {
    type: Date,
    default: Date.now
  },
  IsActive: {
    type: Boolean,
    default: true
  }
});

MeetingSchema.index({ TeamID_FK: 1, CreatedDate: -1 });
MeetingSchema.index({ OrganizerID: 1, CreatedDate: -1 });

module.exports = mongoose.model('Meeting', MeetingSchema);


