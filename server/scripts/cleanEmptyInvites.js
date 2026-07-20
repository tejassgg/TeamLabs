const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Invite = require('../models/Invite');

dotenv.config();

const cleanInvites = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI not found in env variables.');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Find and delete invites without an email
    const result = await Invite.deleteMany({
      email: { $in: [null, ''] }
    });

    console.log(`Successfully deleted ${result.deletedCount} empty invite records!`);
  } catch (error) {
    console.error('Error cleaning empty invites:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

cleanInvites();
