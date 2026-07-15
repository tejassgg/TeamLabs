const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const TaskDetails = require('../models/TaskDetails');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Error: MONGO_URI is not defined in the environment variables.');
  process.exit(1);
}

(async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    // Fetch all active and inactive tasks sorted by CreatedDate ascending
    const tasks = await TaskDetails.find({}).sort({ CreatedDate: 1 });
    console.log(`Found ${tasks.length} tasks to update.`);

    let currentNum = 2500;
    for (const task of tasks) {
      const ticketNumber = String(currentNum);
      await TaskDetails.updateOne({ _id: task._id }, { $set: { TicketNumber: ticketNumber } });
      console.log(`Updated task "${task.Name}" [ID: ${task.TaskID}] -> TicketNumber: ${ticketNumber}`);
      currentNum++;
    }

    console.log(`Successfully updated all ${tasks.length} existing tasks starting from 2500!`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
})();
