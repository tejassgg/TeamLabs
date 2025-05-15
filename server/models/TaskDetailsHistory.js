const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TaskDetailsHistorySchema = new mongoose.Schema({
  ParentID: {
    type: String,
    default: null
  },
  Name: {
    type: String,
    maxlength: 50
  },
  Description: {
    type: String,
    maxlength: 100
  },
  OldStatus: {
    type: Number
  },
  Type: {
    type: String,
    enum: ['Task', 'Bug', 'User Story', 'Feature', 'Improvement', 'Documentation', 'Maintenance']
  },
  Old_Assignee: {
    type: String
  },
  Old_AssignedTo: {
    type: String
  },
  ProjectID_FK: {
    type: String
  },
  IsActive: {
    type: Boolean
  },
  CreatedDate: {
    type: Date
  },
  AssignedDate: {
    type: Date
  },
  CreatedBy: {
    type: String
  }
});

module.exports = mongoose.model('TaskDetailsHistory', TaskDetailsHistorySchema); 