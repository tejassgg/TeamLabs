const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CommonType = require('../models/CommonType');
const Project = require('../models/Project');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const PriorityTypes = [
  { Value: 'Critical', Code: 0, MasterType: 'PriorityType' },
  { Value: 'High', Code: 1, MasterType: 'PriorityType' },
  { Value: 'Medium', Code: 2, MasterType: 'PriorityType' },
  { Value: 'Low', Code: 3, MasterType: 'PriorityType' },
];

(async () => {
  try {
    await CommonType.deleteMany({ MasterType: 'PriorityType' });
    await CommonType.insertMany(PriorityTypes);
    console.log('Seeded PriorityType options!');

    // Update projects with new priority code mapping
    // Old mapping: 1=Low, 2=Medium, 3=High
    // New mapping: 0=Critical, 1=High, 2=Medium, 3=Low
    const res1 = await Project.updateMany({ Priority: 1 }, { $set: { Priority: -1 } }); // Old Low (1) -> temp -1
    const res3 = await Project.updateMany({ Priority: 3 }, { $set: { Priority: 1 } });  // Old High (3) -> New High (1)
    const resFinal = await Project.updateMany({ Priority: -1 }, { $set: { Priority: 3 } }); // Temp -1 -> New Low (3)

    console.log('Updated existing project priorities in database successfully!');
  } catch (err) {
    console.error('Error updating priority types:', err);
  } finally {
    await mongoose.disconnect();
  }
})();