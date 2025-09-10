const express = require('express');
const router = express.Router();
const { 
  submitContactRequest, 
  getContactRequests, 
  getContactRequest, 
  updateContactRequest, 
  deleteContactRequest
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

// Public route - Submit contact support request
router.post('/', submitContactRequest);

// Protected routes - Admin only
router.get('/', protect, getContactRequests);
router.get('/:id', protect, getContactRequest);
router.put('/:id', protect, updateContactRequest);
router.delete('/:id', protect, deleteContactRequest);

module.exports = router;