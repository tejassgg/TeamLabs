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

module.exports = router; 