const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const TaskDetails = require('../models/TaskDetails');
const TaskDetailsHistory = require('../models/TaskDetailsHistory');
const ContactSupport = require('../models/ContactSupport');

const run = async () => {
  try {
    await connectDB();

    // 1. Migrate TaskDetails Priority
    console.log('Fetching all TaskDetails documents...');
    const tasks = await TaskDetails.find({});
    console.log(`Found ${tasks.length} tasks to check/migrate.`);

    let tasksUpdated = 0;
    for (const task of tasks) {
      const orig = task.Priority;
      let target = 2; // Default to Medium (2)

      if (orig === 'Critical' || orig === '0' || orig === 0 || orig === '1' || orig === 1) {
        target = 0;
      } else if (orig === 'High' || orig === '2' || orig === 2) {
        target = 1;
      } else if (orig === 'Medium' || orig === '3' || orig === 3) {
        target = 2;
      } else if (orig === 'Low' || orig === '4' || orig === 4) {
        target = 3;
      }

      if (task.Priority !== target) {
        task.Priority = target;
        await TaskDetails.updateOne({ _id: task._id }, { $set: { Priority: target } });
        tasksUpdated++;
      }
    }
    console.log(`Successfully migrated ${tasksUpdated} TaskDetails documents to numeric priorities.`);

    // 2. Migrate TaskDetailsHistory Priority
    console.log('Fetching all TaskDetailsHistory documents...');
    const histories = await TaskDetailsHistory.find({});
    console.log(`Found ${histories.length} history items to check/migrate.`);

    let historiesUpdated = 0;
    for (const hist of histories) {
      const orig = hist.Priority;
      let target = 2;

      if (orig === 'Critical' || orig === '0' || orig === 0 || orig === '1' || orig === 1) {
        target = 0;
      } else if (orig === 'High' || orig === '2' || orig === 2) {
        target = 1;
      } else if (orig === 'Medium' || orig === '3' || orig === 3) {
        target = 2;
      } else if (orig === 'Low' || orig === '4' || orig === 4) {
        target = 3;
      }

      if (hist.Priority !== target) {
        await TaskDetailsHistory.updateOne({ _id: hist._id }, { $set: { Priority: target } });
        historiesUpdated++;
      }
    }
    console.log(`Successfully migrated ${historiesUpdated} TaskDetailsHistory documents to numeric priorities.`);

    // 3. Migrate ContactSupport priority
    console.log('Fetching all ContactSupport documents...');
    const tickets = await ContactSupport.find({});
    console.log(`Found ${tickets.length} support tickets to check/migrate.`);

    let ticketsUpdated = 0;
    for (const ticket of tickets) {
      const orig = ticket.priority;
      let target = 2;

      const cleanOrig = String(orig || '').toLowerCase().trim();

      if (cleanOrig === 'critical' || cleanOrig === 'urgent' || cleanOrig === '0' || cleanOrig === '1' || orig === 0 || orig === 1) {
        target = 0;
      } else if (cleanOrig === 'high' || cleanOrig === '2' || orig === 2) {
        target = 1;
      } else if (cleanOrig === 'medium' || cleanOrig === '3' || orig === 3) {
        target = 2;
      } else if (cleanOrig === 'low' || cleanOrig === '4' || orig === 4) {
        target = 3;
      }

      if (ticket.priority !== target) {
        await ContactSupport.updateOne({ _id: ticket._id }, { $set: { priority: target } });
        ticketsUpdated++;
      }
    }
    console.log(`Successfully migrated ${ticketsUpdated} ContactSupport documents to numeric priorities.`);

    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

run();
