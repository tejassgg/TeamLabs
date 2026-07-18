const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ReleaseSchema = new mongoose.Schema({
  version: String,
  isPublished: Boolean,
  publishDate: Date
}, { collection: 'releasenotifications' });

const Release = mongoose.model('Release', ReleaseSchema);

async function run() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  
  const result = await Release.updateOne(
    { version: '1.1.0' },
    { $set: { isPublished: true, publishDate: new Date() } }
  );
  
  console.log('Update result:', result);
  await mongoose.disconnect();
}

run().catch(console.error);
