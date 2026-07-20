const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true },
  organizationID: { type: String, required: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Expired'], default: 'Pending' },
  token: { type: String, required: true },
  role: { type: String, default: 'User' },
  accessType: { type: String, enum: ['anyone', 'invited'], default: 'anyone' },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  expiredAt: { type: Date, default: function() { 
    // Set expiration to 7 days from creation
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }}
}, { timestamps: true });

// Method to check if invite is expired
inviteSchema.methods.isExpired = function() {
  return new Date() > this.expiredAt;
};

// Pre-save middleware to update status if expired
inviteSchema.pre('save', function() {
  if (this.status === 'Pending' && this.isExpired()) {
    this.status = 'Expired';
  }
});

module.exports = mongoose.model('Invite', inviteSchema);