const express = require('express');
const router = express.Router();
const { getLiveSearchData } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getLiveSearchData);

module.exports = router;
