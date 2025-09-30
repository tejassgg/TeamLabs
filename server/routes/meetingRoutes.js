const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  listTeamMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  attachGoogleCalendarToken,
} = require('../controllers/meetingController');
const {
  initiateGoogleAuth,
  getGoogleCalendarStatus,
  handleGoogleCallback,
  getGoogleDriveStatus,
  disconnectGoogleCalendar,
  disconnectGoogleDrive
} = require('../controllers/integrationController');

// Meetings
router.get('/teams/:teamId/meetings', protect, listTeamMeetings);
router.get('/meetings/:meetingId', protect, getMeeting);
router.post('/teams/:teamId/meetings', protect, createMeeting);
router.put('/meetings/:meetingId', protect, updateMeeting);
router.delete('/meetings/:meetingId', protect, deleteMeeting);

// Google OAuth (unified for Calendar and Drive)
router.post('/google/initiate', protect, initiateGoogleAuth);
router.get('/google-calendar/status', protect, getGoogleCalendarStatus);
router.get('/google-drive/status', protect, getGoogleDriveStatus);
router.get('/google/callback', handleGoogleCallback);
router.post('/google-calendar/attach-token', protect, attachGoogleCalendarToken);
router.post('/google-calendar/disconnect', protect, disconnectGoogleCalendar);
router.post('/google-drive/disconnect', protect, disconnectGoogleDrive);

module.exports = router;