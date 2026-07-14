const express = require('express');
const router = express.Router();
const { getPrefetchedSearchData, getLiveSearchData } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

router.get('/prefetch', protect, getPrefetchedSearchData);
router.get('/', protect, getLiveSearchData);

module.exports = router;
