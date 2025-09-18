const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

(async () => {
  try {
    console.log('🧹 Starting cleanup of old integration fields from User model...');
    
    // Fields to remove from User model
    const fieldsToRemove = {
      // GitHub fields
      githubConnected: 1,
      githubAccessToken: 1,
      githubUserId: 1,
      githubUsername: 1,
      githubEmail: 1,
      githubAvatarUrl: 1,
      githubConnectedAt: 1,
      
      // Google Calendar fields
      googleCalendarConnected: 1,
      googleCalendarAccessToken: 1,
      googleCalendarRefreshToken: 1,
      googleCalendarTokenExpiry: 1
    };

    // Use $unset to remove these fields from all users
    const result = await User.updateMany(
      {},
      { $unset: fieldsToRemove }
    );

    console.log('✅ Cleanup completed successfully!');
    console.log(`📊 Users updated: ${result.modifiedCount}`);
    console.log(`🗑️  Fields removed:`);
    console.log(`   - GitHub integration fields (7 fields)`);
    console.log(`   - Google Calendar integration fields (4 fields)`);
    console.log(`   - Total fields removed: 11`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.disconnect();
  }
})();
