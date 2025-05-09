const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CommonType = require('../models/CommonType');

dotenv.config();
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const orgTypes = [
  { Value: 'Olanthroxx', Code: 1, MasterType: 'Organization' },
  { Value: 'CoolStraxx', Code: 2, MasterType: 'Organization' },
  { Value: 'Persistent Systems Limited', Code: 3, MasterType: 'Organization' },
];

(async () => {
  await CommonType.deleteMany({ MasterType: 'Organization' });
  await CommonType.insertMany(orgTypes);
  console.log('Seeded Organization options!');
  mongoose.disconnect();
})();