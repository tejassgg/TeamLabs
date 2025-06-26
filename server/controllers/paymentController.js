const Payment = require('../models/Payment');
const User = require('../models/User');

// Generate unique payment ID
const generatePaymentId = () => {
  return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Process payment and activate subscription
const processPayment = async (req, res) => {
  try {
    const {
      plan,
      amount,
      paymentMethod,
      organizationID,
      userId,
      saveCard,
      // Card details
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      cvv,
      billingAddress,
      city,
      state,
      zipCode,
      country,
      // Bank details
      bankName,
      accountNumber,
      routingNumber,
      accountHolderName
    } = req.body;

    // Validate required fields
    if (!plan || !amount || !paymentMethod || !organizationID || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate payment ID
    const paymentId = generatePaymentId();

    // Calculate subscription end date
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date(subscriptionStartDate);
    
    if (plan === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    } else if (plan === 'annual') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    }

    // Create payment record
    const paymentData = {
      paymentId,
      amount,
      plan,
      billingCycle: plan,
      paymentMethod,
      organizationID,
      userId,
      savePaymentMethod: saveCard,
      status: 'pending',
      subscriptionStartDate,
      subscriptionEndDate
    };

    // Add payment method details
    if (paymentMethod === 'card') {
      paymentData.cardDetails = {
        last4: cardNumber.slice(-4),
        brand: getCardBrand(cardNumber),
        expiryMonth,
        expiryYear,
        cardHolderName
      };
      paymentData.billingAddress = {
        address: billingAddress,
        city,
        state,
        zipCode,
        country
      };
    } else if (paymentMethod === 'bank') {
      paymentData.bankDetails = {
        bankName,
        accountLast4: accountNumber.slice(-4),
        routingNumber,
        accountHolderName
      };
    }

    // Simulate payment processing (replace with actual payment gateway)
    const paymentResult = await simulatePaymentProcessing(paymentData);
    
    if (paymentResult.success) {
      // Update payment status
      paymentData.status = 'completed';
      paymentData.transactionId = paymentResult.transactionId;
      paymentData.gatewayResponse = paymentResult.response;

      // Create payment record
      const payment = new Payment(paymentData);
      await payment.save();

      // Activate premium subscription for all users in organization
      await activateOrganizationPremium(organizationID, plan);

      // Save payment method if requested
      if (saveCard && paymentMethod === 'card') {
        await saveUserPaymentMethod(userId, paymentMethod, paymentData.cardDetails);
      }

      res.json({
        success: true,
        message: 'Payment processed successfully',
        paymentId,
        transactionId: paymentResult.transactionId
      });
    } else {
      // Payment failed
      paymentData.status = 'failed';
      paymentData.gatewayResponse = paymentResult.response;

      const payment = new Payment(paymentData);
      await payment.save();

      res.status(400).json({
        success: false,
        message: paymentResult.message || 'Payment failed'
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get payment history for organization
const getPaymentHistory = async (req, res) => {
  try {
    const { organizationID } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;
    
    const payments = await Payment.getPaymentHistory(organizationID, parseInt(limit));
    const total = await Payment.countDocuments({ organizationID });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: skip + payments.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get subscription status
const getSubscriptionStatus = async (req, res) => {
  try {
    const { organizationID } = req.params;

    const activeSubscription = await Payment.getActiveSubscription(organizationID);
    const premiumUsers = await User.getPremiumUsers(organizationID);

    res.json({
      success: true,
      data: {
        hasActiveSubscription: !!activeSubscription,
        subscription: activeSubscription,
        premiumUsersCount: premiumUsers.length,
        premiumUsers: premiumUsers.map(user => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          subscriptionEndDate: user.subscriptionEndDate
        }))
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { organizationID } = req.params;
    const { userId } = req.body;

    // Find active subscription
    const activeSubscription = await Payment.getActiveSubscription(organizationID);
    
    if (!activeSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Update subscription to not auto-renew
    activeSubscription.autoRenew = false;
    await activeSubscription.save();

    // Deactivate premium for all users in organization
    await deactivateOrganizationPremium(organizationID);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper functions
const simulatePaymentProcessing = async (paymentData) => {
  // Simulate payment gateway processing
  // In real implementation, integrate with Stripe, PayPal, etc.
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 95% success rate
      const isSuccess = Math.random() > 0.05;
      
      if (isSuccess) {
        resolve({
          success: true,
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          response: {
            status: 'succeeded',
            message: 'Payment processed successfully'
          }
        });
      } else {
        resolve({
          success: false,
          message: 'Payment declined by bank',
          response: {
            status: 'failed',
            message: 'Payment declined by bank'
          }
        });
      }
    }, 2000); // Simulate 2-second processing time
  });
};

const getCardBrand = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^6/.test(cleanNumber)) return 'discover';
  
  return 'unknown';
};

const activateOrganizationPremium = async (organizationID, plan) => {
  try {
    // Get all users in the organization
    const users = await User.find({ organizationID: organizationID });
    
    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Activate premium for all users
    const updatePromises = users.map(user => 
      user.activatePremium(plan, startDate, endDate)
    );
    
    await Promise.all(updatePromises);
    
    console.log(`Premium activated for ${users.length} users in organization ${organizationID}`);
  } catch (error) {
    console.error('Error activating organization premium:', error);
    throw error;
  }
};

const deactivateOrganizationPremium = async (organizationID) => {
  try {
    // Get all users in the organization
    const users = await User.find({ organizationID: organizationID });
    
    // Deactivate premium for all users
    const updatePromises = users.map(user => 
      user.deactivatePremium()
    );
    
    await Promise.all(updatePromises);
    
    console.log(`Premium deactivated for ${users.length} users in organization ${organizationID}`);
  } catch (error) {
    console.error('Error deactivating organization premium:', error);
    throw error;
  }
};

const saveUserPaymentMethod = async (userId, paymentMethod, details) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.savedPaymentMethod = {
      type: paymentMethod,
      ...(paymentMethod === 'card' ? { cardDetails: details } : { bankDetails: details })
    };

    await user.save();
  } catch (error) {
    console.error('Error saving payment method:', error);
  }
};

module.exports = {
  processPayment,
  getPaymentHistory,
  getSubscriptionStatus,
  cancelSubscription
}; 