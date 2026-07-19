const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/read', notificationController.markAsRead);
router.post('/subscribe', notificationController.subscribeWebPush);
router.get('/vapid-public-key', notificationController.getVapidPublicKey);

module.exports = router;
