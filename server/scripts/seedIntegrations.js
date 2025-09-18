const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CommonType = require('../models/CommonType');

dotenv.config();
mongoose.connect('mongodb+srv://admin:J4wNjyXGCHrhjepi@teamlabs.mlkgq1g.mongodb.net/?retryWrites=true&w=majority&appName=TeamLabs', { useNewUrlParser: true, useUnifiedTopology: true });

const Integrations = [
  // GitHub Integration
  { 
    Value: 'GitHub', 
    Code: 1, 
    MasterType: 'Integrations', 
    Description: 'github',
    FaIcon: 'FaGithub'
  },
  
  // Google Calendar Integration
  { 
    Value: 'Google Calendar', 
    Code: 2, 
    MasterType: 'Integrations', 
    Description: 'google_calendar',
    FaIcon: 'FaCalendarAlt'
  },
  
  // Google Meet Integration
  { 
    Value: 'Google Meet', 
    Code: 3, 
    MasterType: 'Integrations', 
    Description: 'google_meet',
    FaIcon: 'FaVideo'
  },
  
  // Google Drive Integration
  { 
    Value: 'Google Drive', 
    Code: 4, 
    MasterType: 'Integrations', 
    Description: 'google_drive',
    FaIcon: 'FaGoogleDrive'
  },
  
  // Dropbox Integration
  { 
    Value: 'Dropbox', 
    Code: 5, 
    MasterType: 'Integrations', 
    Description: 'dropbox',
    FaIcon: 'FaDropbox'
  },
  
  // Slack Integration
  { 
    Value: 'Slack', 
    Code: 6, 
    MasterType: 'Integrations', 
    Description: 'slack',
    FaIcon: 'FaSlack'
  },

  // Zoom Integration
  { 
    Value: 'Zoom', 
    Code: 7, 
    MasterType: 'Integrations', 
    Description: 'zoom',
    FaIcon: 'FaVideo'
  },

  // Microsoft Teams Integration
  { 
    Value: 'Microsoft Teams', 
    Code: 8, 
    MasterType: 'Integrations', 
    Description: 'microsoft_teams',
    FaIcon: 'FaMicrosoft'
  },

  // OneDrive Integration
  { 
    Value: 'OneDrive', 
    Code: 9, 
    MasterType: 'Integrations', 
    Description: 'onedrive',
    FaIcon: 'FaMicrosoft'
  },

  // Microsoft Outlook Integration
  { 
    Value: 'Microsoft Outlook', 
    Code: 10, 
    MasterType: 'Integrations', 
    Description: 'microsoft_outlook',
    FaIcon: 'FaMicrosoft'
  }
];

(async () => {
  try {
    // Clear existing integrations
    await CommonType.deleteMany({ MasterType: 'Integrations' });
    
    // Insert new integrations
    await CommonType.insertMany(Integrations);
    
    console.log('✅ Seeded Integrations successfully!');
    console.log(`🔗 Total integrations seeded: ${Integrations.length}`);
    console.log('📋 Available integrations:');
    
    Integrations.forEach(integration => {
      console.log(`   ${integration.FaIcon} ${integration.Value} (${integration.Description})`);
    });
    
    console.log('\n📊 Integration Details:');
    console.log(`   🐙 GitHub (FaGithub) - Code repository management and collaboration`);
    console.log(`   📅 Google Calendar (FaCalendarAlt) - Event scheduling and calendar integration`);
    console.log(`   📹 Google Meet (FaVideo) - Video conferencing and meetings`);
    console.log(`   💾 Google Drive (FaGoogleDrive) - File storage and document collaboration`);
    console.log(`   📦 Dropbox (FaDropbox) - Cloud file storage and synchronization`);
    console.log(`   💬 Slack (FaSlack) - Team communication and notifications`);
    console.log(`   📹 Zoom (FaVideo) - AI-powered meeting transcriptions & summaries`);
    console.log(`   🏢 Microsoft Teams (FaMicrosoft) - Capture key discussions & automate action items`);
    console.log(`   ☁️ OneDrive (FaMicrosoft) - Sync meeting documents across your devices`);
    console.log(`   📧 Microsoft Outlook (FaMicrosoft) - Schedule and track discussions effortlessly`);
    
  } catch (error) {
    console.error('❌ Error seeding integrations:', error);
  } finally {
    mongoose.disconnect();
  }
})();
