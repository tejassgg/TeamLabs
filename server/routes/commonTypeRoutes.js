const express = require('express');
const router = express.Router();
const CommonType = require('../models/CommonType');

// GET /api/common-types/team-types
router.get('/team-types', async (req, res) => {
  try {
    const teamTypes = await CommonType.find({ MasterType: 'TeamType' });
    res.json(teamTypes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team types' });
  }
});

// GET /api/common-types/organizations - Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const orgs = await CommonType.find({ MasterType: { $in: ['Organisation', 'Organization'] } });
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// GET /api/common-types/user-roles - Get all user roles
router.get('/user-roles', async (req, res) => {
  try {
    const roles = await CommonType.find({ MasterType: 'UserRole' }).sort({ Code: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

router.get('/project-statuses', async (req, res) => {
  try {
    const statuses = await CommonType.find({ MasterType: 'ProjectStatus' }).sort({ Code: 1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project statuses' });
  }
}); 

// GET /api/common-types/phone-extensions - Get all Phone Extensions
router.get('/phone-extensions', async (req, res) => {
  try {
    const roles = await CommonType.find({ MasterType: 'PhoneExtension' }).sort({ Code: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

module.exports = router; 