const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  listTeamMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  initiateGoogleCalendarAuth,
  getGoogleCalendarStatus,
  handleGoogleCalendarCallback,
  attachGoogleCalendarToken,
  disconnectGoogleCalendar
} = require('../controllers/meetingController');

// Meetings
router.get('/teams/:teamId/meetings', protect, listTeamMeetings);
router.get('/meetings/:meetingId', protect, getMeeting);
router.post('/teams/:teamId/meetings', protect, createMeeting);
router.put('/meetings/:meetingId', protect, updateMeeting);
router.delete('/meetings/:meetingId', protect, deleteMeeting);

// Google Calendar OAuth
router.post('/google-calendar/initiate', protect, initiateGoogleCalendarAuth);
router.get('/google-calendar/status/:userId', protect, getGoogleCalendarStatus);
router.get('/google-calendar/callback', handleGoogleCalendarCallback);
router.post('/google-calendar/attach-token', protect, attachGoogleCalendarToken);
router.post('/google-calendar/disconnect', protect, disconnectGoogleCalendar);

module.exports = router;