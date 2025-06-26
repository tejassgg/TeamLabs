const express = require('express');
const router = express.Router();
const { 
  processPayment, 
  getPaymentHistory, 
  getSubscriptionStatus, 
  cancelSubscription 
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Process payment
router.post('/process', protect, processPayment);

// Get payment history for organization
router.get('/history/:organizationID', protect, getPaymentHistory);

// Get subscription status
router.get('/subscription/:organizationID', protect, getSubscriptionStatus);

// Cancel subscription
router.post('/cancel/:organizationID', protect, cancelSubscription);

module.exports = router; 