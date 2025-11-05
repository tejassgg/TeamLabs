const mongoose = require('mongoose');

const TimeSheetSchema = new mongoose.Schema({
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    PunchID: { type: mongoose.Schema.Types.ObjectId, ref: 'PunchDetails', required: true },
    Description: {
        type: String,
        required: true
    },
    StartTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    EndTime: {
        type: Date,
        required: true
    },
    CreatedAt: {
        type: Date,
        default: Date.now
    },
    IsActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('TimeSheet', TimeSheetSchema); 