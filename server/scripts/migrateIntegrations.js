const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Integration = require('../models/Integration');

dotenv.config();
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

(async () => {
  try {
    console.log('🔄 Starting migration of integration data...');
    
    // Get all users with integration data
    const usersWithIntegrations = await User.find({
      $or: [
        { githubConnected: true },
        { googleCalendarConnected: true }
      ]
    }).select('_id organizationID githubConnected githubAccessToken githubUserId githubUsername githubEmail githubAvatarUrl githubConnectedAt googleCalendarConnected googleCalendarAccessToken googleCalendarRefreshToken googleCalendarTokenExpiry');

    console.log(`📊 Found ${usersWithIntegrations.length} users with integration data`);

    let githubMigrations = 0;
    let googleCalendarMigrations = 0;

    for (const user of usersWithIntegrations) {
      // Migrate GitHub integration data
      if (user.githubConnected && user.githubAccessToken) {
        const existingGithubIntegration = await Integration.findOne({
          userId: user._id,
          integrationType: 'github'
        });

        if (!existingGithubIntegration) {
          await Integration.create({
            userId: user._id,
            organizationId: user.organizationID,
            integrationType: 'github',
            isConnected: user.githubConnected,
            connectedAt: user.githubConnectedAt,
            accessToken: user.githubAccessToken,
            externalId: user.githubUserId,
            externalUsername: user.githubUsername,
            externalEmail: user.githubEmail,
            externalAvatarUrl: user.githubAvatarUrl,
            status: 'active'
          });
          githubMigrations++;
        }
      }

      // Migrate Google Calendar integration data
      if (user.googleCalendarConnected && user.googleCalendarAccessToken) {
        const existingGoogleIntegration = await Integration.findOne({
          userId: user._id,
          integrationType: 'google_calendar'
        });

        if (!existingGoogleIntegration) {
          await Integration.create({
            userId: user._id,
            organizationId: user.organizationID,
            integrationType: 'google_calendar',
            isConnected: user.googleCalendarConnected,
            accessToken: user.googleCalendarAccessToken,
            refreshToken: user.googleCalendarRefreshToken,
            tokenExpiry: user.googleCalendarTokenExpiry,
            status: 'active'
          });
          googleCalendarMigrations++;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log(`📈 Migration summary:`);
    console.log(`   - GitHub integrations migrated: ${githubMigrations}`);
    console.log(`   - Google Calendar integrations migrated: ${googleCalendarMigrations}`);
    console.log(`   - Total integrations created: ${githubMigrations + googleCalendarMigrations}`);

    // Verify migration
    const totalIntegrations = await Integration.countDocuments();
    console.log(`🔍 Verification: Total integrations in new collection: ${totalIntegrations}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    mongoose.disconnect();
  }
})();

