const mongoose = require('mongoose');

const PunchDetailsSchema = new mongoose.Schema({
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    PunchDate:{
        type:String,
        require: true
    },
    InTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    OutTime: Date,
    CreatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PunchDetails', PunchDetailsSchema); 