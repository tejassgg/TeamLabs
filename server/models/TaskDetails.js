const mongoose = require('mongoose');
const { randomUUID: uuidv4 } = require('crypto');

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
    maxlength: 150
  },
  Description: {
    type: String
  },
  Status: {
    type: Number,
    default: 1
  },
  Type: {
    type: String,
    enum: ['Task', 'Bug', 'User Story', 'Feature', 'Improvement', 'Documentation', 'Maintenance', 'Support'],
    required: true
  },
  Priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
    required: function() {
      return this.Type !== 'User Story';
    }
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
  DueDate: {
    type: Date,
    default: null,
    required: function() {
      return this.Type === 'User Story';
    }
  },
  ModifiedDate: {
    type: Date,
    default: null
  },
  ModifiedBy: {
    type: String,
    default: null
  },
  CreatedBy: {
    type: String,
    required: true
  },
  TicketNumber: {
    type: String,
    default: null
  },
  StartDate: {
    type: Date,
    default: null
  },
  Dependencies: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('TaskDetails', TaskDetailsSchema); 