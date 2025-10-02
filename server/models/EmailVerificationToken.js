const mongoose = require('mongoose');

// Store email verification tokens separately from the user collection
// One active token per user; create a TTL index on expiresAt for cleanup
const EmailVerificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Optionally, enable automatic document expiration if you want Mongo to purge
// expired records. Commented out as it requires a specific index setup.
// EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailVerificationToken', EmailVerificationTokenSchema);


