const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Unique username for the user
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         middleName:
 *           type: string
 *           description: User's middle name (optional)
 *         phone:
 *           type: string
 *           description: User's phone number
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (hashed)
 *         address:
 *           type: string
 *           description: User's street address
 *         aptNumber:
 *           type: string
 *           description: Apartment or suite number
 *         zipCode:
 *           type: string
 *           description: ZIP or postal code
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State or province
 *         country:
 *           type: string
 *           description: Country name
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *         googleId:
 *           type: string
 *           description: Google OAuth ID if user signed up with Google
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *         createdDate:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         organizationID:
 *           type: string
 *           description: Organization ID from CommonTypes collection
 */

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  aptNumber: {
    type: String,
    default: '',
    trim: true
  },
  zipCode: {
    type: String,
    default: '',
    trim: true
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  state: {
    type: String,
    default: '',
    trim: true
  },
  country: {
    type: String,
    default: '',
    trim: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  googleId: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: ''
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  organizationID: {
    type: String,
    default: ''
  }
});

// Before saving, hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's new or modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 