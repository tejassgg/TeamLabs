const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ReleaseSchema = new mongoose.Schema({
  version: String,
  title: String,
  isPublished: Boolean,
  isActive: Boolean,
  organizationID: Number,
  createdAt: Date
}, { collection: 'releasenotifications' });

const Release = mongoose.model('Release', ReleaseSchema);

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
  }
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.');
  
  const releases = await Release.find({}).sort({ createdAt: -1 });
  console.log('\n=== Release Notifications in Database ===');
  console.log(`Total count: ${releases.length}\n`);
  
  releases.forEach((r, i) => {
    console.log(`${i+1}. Version: ${r.version}`);
    console.log(`   Title: ${r.title}`);
    console.log(`   isPublished: ${r.isPublished}`);
    console.log(`   isActive: ${r.isActive}`);
    console.log(`   organizationID: ${r.organizationID}`);
    console.log(`   Created At: ${r.createdAt}`);
    console.log('-----------------------------------');
  });
  
  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

run().catch(console.error);
