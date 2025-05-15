const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TaskDetailsSchema = new mongoose.Schema({
  TaskID: {
    type: String,
    default: uuidv4,
    unique: true
  },
  ParentID: {
    type: String,
    required: function() {
      return this.Type != "User Story";
    }
  },
  Name: {
    type: String,
    required: true,
    maxlength: 50
  },
  Description: {
    type: String,
    maxlength: 100
  },
  Status: {
    type: Number,
    default: 1
  },
  Type: {
    type: String,
    enum: ['Task', 'Bug', 'User Story', 'Feature', 'Improvement', 'Documentation', 'Maintenance'],
    required: true
  },
  Assignee: {
    type: String,
    required: false
  },
  AssignedTo: {
    type: String,
    default: null
  },
  ProjectID_FK: {
    type: String,
    required: true
  },
  IsActive: {
    type: Boolean,
    default: true
  },
  CreatedDate: {
    type: Date,
    default: Date.now
  },
  AssignedDate: {
    type: Date,
    default: null
  },
  CreatedBy: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('TaskDetails', TaskDetailsSchema); 