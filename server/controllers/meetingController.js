const { google } = require('googleapis');
const axios = require('axios');
const Meeting = require('../models/Meeting');
const Team = require('../models/Team');
const TeamDetails = require('../models/TeamDetails');
const TaskDetails = require('../models/TaskDetails');
const User = require('../models/User');
const { logActivity } = require('../services/activityService');
const Integration = require('../models/Integration');

function buildGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.SERVER_URL}/api/google/callback`
  );
}

function assertGoogleOAuthEnvOrThrow() {
  const missing = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  // SERVER_URL is optional but helps ensure redirect URI matches
  if (missing.length) {
    const msg = `Missing required Google OAuth env: ${missing.join(', ')}`;
    throw new Error(msg);
  }
}

async function ensureGoogleAccessToken(userId) {
  const integration = await Integration.findOne({ userId, integrationType: 'google_calendar' });

  if (!integration || !integration.refreshToken) return null;

  const oauth2Client = buildGoogleOAuthClient();
  oauth2Client.setCredentials({ refresh_token: integration.refreshToken });

  // Try refreshing tokens; if library deprecates refreshAccessToken, fallback to getAccessToken
  let accessToken = null;
  let expiryDate = null;
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    accessToken = credentials.access_token;
    expiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
  } catch (_) {
    const tokenResponse = await oauth2Client.getAccessToken();
    accessToken = tokenResponse?.token || null;
    // Expiry not available via getAccessToken reliably
  }

  if (!accessToken) return null;

  await Integration.findOneAndUpdate(
    { userId, integrationType: 'google_calendar' },
    {
      accessToken: accessToken,
      tokenExpiry: expiryDate,
      isConnected: true,
      lastUsedAt: new Date()
    }
  );

  return accessToken;
}

exports.listTeamMeetings = async (req, res) => {
  try {
    const { teamId } = req.params;
    const meetings = await Meeting.find({ TeamID_FK: teamId, IsActive: true }).sort({ CreatedDate: -1 });
    res.json({ success: true, meetings });
  } catch (error) {
    console.error('listTeamMeetings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ MeetingID: meetingId });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    // Expand attendees and tasks
    const attendees = await User.find({ _id: { $in: meeting.AttendeeIDs } }).select('firstName lastName email');
    const tasks = await TaskDetails.find({ TaskID: { $in: meeting.TaskIDs } }).select('Name TaskID Title Description');
    res.json({ success: true, meeting, attendees, tasks });
  } catch (error) {
    console.error('getMeeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meeting' });
  }
};

exports.createMeeting = async (req, res) => {
  try {

    const { teamId } = req.params;
    const { title, description, attendeeIds = [], taskIds = [], startTime = null, endTime = null, googleAccessToken } = req.body;
    const organizerId = req.user._id.toString();

    const team = await Team.findOne({ TeamID: teamId });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Ensure organizer is member
    const isMember = await TeamDetails.findOne({ TeamID_FK: teamId, MemberID: organizerId, IsMemberActive: true });
    if (!isMember && team.OwnerID !== organizerId) {
      return res.status(403).json({ success: false, message: 'Not a member of the team' });
    }

    // Prepare Google Calendar event using client-provided access token or organizer's refreshed token
    let googleMeetLink = null;
    let googleEventId = null;

    try {
      // Prefer client-provided access token. Otherwise use stored token if not expired,
      // and finally attempt to refresh using the stored refresh token.
      let accessTokenToUse = googleAccessToken || null;
      if (!accessTokenToUse) {
        const integration = await Integration.findOne({ userId: organizerId, integrationType: 'google_calendar' });
        if (integration?.accessToken && !integration.isTokenExpired()) {
          accessTokenToUse = integration.accessToken;
        }
      }
      if (!accessTokenToUse) {
        try {
          const refreshed = await ensureGoogleAccessToken(organizerId);
          if (refreshed) {
            accessTokenToUse = refreshed;
          }
        } catch (_) { /* fall through to missing token error below */ }
      }

      if (accessTokenToUse) {
        const attendeesPayload = [];
        if (Array.isArray(attendeeIds) && attendeeIds.length > 0) {
          const users = await User.find({ _id: { $in: attendeeIds } });
          users.forEach(u => {
            if (u.email) attendeesPayload.push({ email: u.email });
          });
        }
        const organizer = await User.findById(organizerId);
        // Ensure organizer is included as attendee if they have an email
        if (organizer?.email && !attendeesPayload.find(a => a.email === organizer.email)) {
          attendeesPayload.push({ email: organizer.email });
        }

        const startISO = startTime ? new Date(startTime).toISOString() : new Date(Date.now() + 2 * 60 * 1000).toISOString();
        const endISO = endTime ? new Date(endTime).toISOString() : new Date(new Date(startISO).getTime() + 30 * 60 * 1000).toISOString();

        const oauth2Client = buildGoogleOAuthClient();
        oauth2Client.setCredentials({ access_token: accessTokenToUse });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const eventPayload = {
          summary: title,
          description,
          start: { dateTime: startISO, timeZone: 'UTC' },
          end: { dateTime: endISO, timeZone: 'UTC' },
          attendees: attendeesPayload,
          conferenceData: {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          }
        };
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventPayload,
          conferenceDataVersion: 1
        });

        const data = response?.data || {};
        googleEventId = data.id || null;
        googleMeetLink = data.hangoutLink || data?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;

        // // If Meet link not immediately present, fetch once to populate conferenceData
        // if (!googleMeetLink && googleEventId) {
        //   try {
        //     const getResp = await axios.get(
        //       `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}?conferenceDataVersion=1`,
        //       { headers: { Authorization: `Bearer ${accessTokenToUse}`, 'Content-Type': 'application/json' } }
        //     );
        //     googleMeetLink = getResp.data?.hangoutLink || getResp.data?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;
        //   } catch (_) { }
        // }

        const meeting = await Meeting.create({
          TeamID_FK: teamId,
          Title: title,
          Description: description,
          OrganizerID: organizerId,
          AttendeeIDs: attendeeIds,
          TaskIDs: taskIds,
          GoogleEventId: googleEventId,
          GoogleMeetLink: googleMeetLink,
          StartTime: startTime ? new Date(startTime) : new Date(new Date().getTime() + 2 * 60 * 1000),
          EndTime: endTime ? new Date(endTime) : new Date(new Date().getTime() + 32 * 60 * 1000),
          CreatedDate: new Date(),
          ModifiedDate: new Date(),
          IsActive: true
        });

        try {
          await logActivity(organizerId, 'team_meeting_create', 'success', `Created meeting "${title}"`, req, { teamId, meetingId: meeting.MeetingID });
        } catch (error) { console.error('logActivity error:', error); }

        res.status(201).json({ success: true, meeting });
      }
      else {
        res.status(400).json({ success: false, message: 'Google Calendar not connected. Provide googleAccessToken or connect account.' });
      }
    } catch (googleErr) {
      console.log('googleErr', googleErr);
      console.error('Google Calendar create event failed:', googleErr?.response?.data || googleErr.message);
      res.status(502).json({ success: false, message: 'Google Calendar create event failed' });
    }
  } catch (error) {
    console.error('createMeeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to create meeting' });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user._id.toString();

    const meeting = await Meeting.findOne({ MeetingID: meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Check if user is the meeting organizer
    if (meeting.OrganizerID !== userId) {
      return res.status(403).json({ success: false, message: 'Only the meeting organizer can delete the meeting' });
    }

    // Delete from Google Calendar if event exists
    if (meeting.GoogleEventId) {
      try {
        const accessToken = await ensureGoogleAccessToken(userId);
        if (accessToken) {
          const oauth2Client = buildGoogleOAuthClient();
          oauth2Client.setCredentials({ access_token: accessToken });
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: meeting.GoogleEventId
          });
        }
      } catch (googleErr) {
        console.error('Google Calendar delete event failed:', googleErr?.response?.data || googleErr.message);
        // Continue with local deletion even if Google deletion fails
      }
    }

    // Soft delete the meeting
    await Meeting.findOneAndUpdate(
      { MeetingID: meetingId },
      { IsActive: false, ModifiedDate: new Date() }
    );

    try {
      await logActivity(userId, 'team_meeting_delete', 'success', `Deleted meeting "${meeting.Title}"`, req, { teamId: meeting.TeamID_FK, meetingId });
    } catch (_) { }

    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('deleteMeeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete meeting' });
  }
};

// Update meeting (organizer only)
exports.updateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user._id.toString();
    const { title, description, attendeeIds = [], taskIds = [], startTime = null, endTime = null } = req.body;

    const meeting = await Meeting.findOne({ MeetingID: meetingId });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    // Only organizer can update
    if (meeting.OrganizerID !== userId) {
      return res.status(403).json({ success: false, message: 'Only the meeting organizer can update the meeting' });
    }

    // Compute next values (fallback to existing)
    const nextTitle = typeof title === 'string' ? title : meeting.Title;
    const nextDescription = typeof description === 'string' ? description : meeting.Description;
    const nextAttendeeIds = Array.isArray(attendeeIds) ? attendeeIds : meeting.AttendeeIDs || [];
    const nextTaskIds = Array.isArray(taskIds) ? taskIds : meeting.TaskIDs || [];
    const nextStart = startTime !== null ? (startTime ? new Date(startTime) : null) : meeting.StartTime || null;
    const nextEnd = endTime !== null ? (endTime ? new Date(endTime) : null) : meeting.EndTime || null;

    // Attempt to update Google Calendar event if it exists
    if (meeting.GoogleEventId) {
      try {
        const accessToken = await ensureGoogleAccessToken(userId);
        if (accessToken) {
          const oauth2Client = buildGoogleOAuthClient();
          oauth2Client.setCredentials({ access_token: accessToken });
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

          // Map attendees -> emails
          const attendeesPayload = [];
          if (Array.isArray(nextAttendeeIds) && nextAttendeeIds.length > 0) {
            const users = await User.find({ _id: { $in: nextAttendeeIds } });
            users.forEach(u => { if (u.email) attendeesPayload.push({ email: u.email }); });
          }
          if (organizer?.email && !attendeesPayload.find(a => a.email === organizer.email)) {
            attendeesPayload.push({ email: organizer.email });
          }

          const patchBody = {
            summary: nextTitle,
            description: nextDescription,
          };
          if (nextStart) patchBody.start = { dateTime: new Date(nextStart).toISOString(), timeZone: 'UTC' };
          if (nextEnd) patchBody.end = { dateTime: new Date(nextEnd).toISOString(), timeZone: 'UTC' };
          if (attendeesPayload.length > 0) patchBody.attendees = attendeesPayload;

          await calendar.events.patch({
            calendarId: 'primary',
            eventId: meeting.GoogleEventId,
            requestBody: patchBody
          });
        }
      } catch (googleErr) {
        console.error('Google Calendar update event failed:', googleErr?.response?.data || googleErr.message);
        // Continue with local update even if Google update fails
      }
    }

    const update = {
      ModifiedDate: new Date()
    };
    if (typeof title === 'string') update.Title = title;
    if (typeof description === 'string') update.Description = description;
    if (Array.isArray(attendeeIds)) update.AttendeeIDs = attendeeIds;
    if (Array.isArray(taskIds)) update.TaskIDs = taskIds;
    if (startTime !== undefined) update.StartTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) update.EndTime = endTime ? new Date(endTime) : null;

    // Persist update
    await Meeting.findOneAndUpdate({ MeetingID: meetingId }, update);
    const updated = await Meeting.findOne({ MeetingID: meetingId });

    try {
      await logActivity(userId, 'team_meeting_update', 'success', `Updated meeting "${updated.Title}"`, req, { teamId: updated.TeamID_FK, meetingId });
    } catch (_) { }

    res.json({ success: true, meeting: updated });
  } catch (error) {
    console.error('updateMeeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to update meeting' });
  }
};

exports.getGoogleCalendarStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('email profileImage');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const integration = await Integration.findOne({ userId, integrationType: 'google_calendar' });

    if (!integration) {
      return res.json({
        success: true,
        connected: false,
        email: user.email || null,
        tokenExpiry: null,
        avatarUrl: user.profileImage || null
      });
    }

    res.json({
      success: true,
      connected: integration.isConnected || false,
      email: user.email || null,
      tokenExpiry: integration.tokenExpiry || null,
      avatarUrl: user.profileImage || null
    });
  } catch (error) {
    console.error('getGoogleCalendarStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to get Google Calendar status' });
  }
};

exports.initiateGoogleAuth = async (req, res) => {
  try {
    assertGoogleOAuthEnvOrThrow();
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const { service } = req.body;
    if (!service || !['google_calendar', 'google_drive'].includes(service)) {
      return res.status(400).json({ success: false, message: 'Invalid service. Must be google_calendar or google_drive' });
    }

    // Define scopes based on service
    const scopeMap = {
      google_calendar: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      google_drive: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    };

    const oauth2Client = buildGoogleOAuthClient();
    const scopes = scopeMap[service];

    // Persist return URL (current page) in state so we can redirect back after OAuth
    const returnUrl = req.body?.returnUrl || req.headers?.referer || `${process.env.FRONTEND_URL}`;
    const state = Buffer.from(JSON.stringify({ userId, returnUrl, service })).toString('base64url');
    const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent', state });
    res.json({ success: true, authUrl: url });
  } catch (error) {
    console.error('initiateGoogleAuth error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate Google auth' });
  }
};

exports.handleGoogleCallback = async (req, res) => {
  try {
    assertGoogleOAuthEnvOrThrow();
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).json({ success: false, message: 'Missing code or state' });

    let userId = null;
    let returnUrl = null;
    let service = null;
    try {
      const parsed = JSON.parse(Buffer.from(String(state), 'base64').toString('utf8'));
      userId = parsed.userId;
      returnUrl = parsed.returnUrl || null;
      service = parsed.service || 'google_calendar'; // Default to calendar for backward compatibility
    } catch (_) { }

    if (!userId) return res.status(400).json({ success: false, message: 'Invalid state' });

    const oauth2Client = buildGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // Get user info from Google (with fallback)
    let userInfo = { data: {} };
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    userInfo = await oauth2.userinfo.get();

    const user = await User.findById(userId).select('organizationID');

    const integrationData = {
      userId,
      organizationId: user.organizationID,
      integrationType: service,
      isConnected: true,
      connectedAt: new Date(),
      accessToken: tokens.access_token || null,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      externalId: userInfo.data.id,
      externalUsername: userInfo.data.name,
      externalEmail: userInfo.data.email,
      externalAvatarUrl: userInfo.data.picture,
      status: 'active',
      lastUsedAt: new Date()
    };

    await Integration.findOneAndUpdate(
      { userId, integrationType: service },
      integrationData,
      { upsert: true }
    );

    // Redirect back to original page after successful connection
    const redirectParam = service === 'google_drive' ? 'googleDrive=connected' : 'googleCalendar=connected';
    const redirectTo = (returnUrl || `${process.env.FRONTEND_URL}`) + (returnUrl && returnUrl.includes('?') ? '&' : '?') + redirectParam;
    res.redirect(302, redirectTo);
  } catch (error) {
    console.error('handleGoogleCallback error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete Google auth' });
  }
};

// Attach Google Calendar token(s) coming from client-side OAuth
exports.attachGoogleCalendarToken = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

    const { accessToken, refreshToken = null, tokenExpiry = null } = req.body;
    if (!accessToken) return res.status(400).json({ success: false, message: 'Missing accessToken' });

    const user = await User.findById(userId).select('organizationID');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Integration.findOneAndUpdate(
      { userId, integrationType: 'google_calendar' },
      {
        userId,
        organizationId: user.organizationID,
        integrationType: 'google_calendar',
        isConnected: true,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        status: 'active',
        lastUsedAt: new Date()
      },
      { upsert: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('attachGoogleCalendarToken error:', error);
    return res.status(500).json({ success: false, message: 'Failed to attach Google Calendar token' });
  }
};

// Disconnect Google Calendar: clear tokens and mark disconnected
exports.disconnectGoogleCalendar = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

    // Update or create integration record to mark as disconnected
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'google_calendar' },
      {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        status: 'revoked'
      },
      { upsert: true }
    );

    return res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('disconnectGoogleCalendar error:', error);
    return res.status(500).json({ success: false, message: 'Failed to disconnect Google Calendar' });
  }
};

exports.getGoogleDriveStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
    const integration = await Integration.findOne({ userId, integrationType: 'google_drive' });

    if (!integration || !integration.isConnected) {
      return res.json({ success: true, connected: false });
    }

    res.json({
      success: true,
      connected: true,
      connectedAt: integration.connectedAt,
      tokenExpiry: integration.tokenExpiry,
      externalEmail: integration.externalEmail,
      externalUsername: integration.externalUsername,
      externalAvatarUrl: integration.externalAvatarUrl
    });
  } catch (error) {
    console.error('getGoogleDriveStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to get Google Drive status' });
  }
};

exports.disconnectGoogleDrive = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

    // Update or create integration record to mark as disconnected
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'google_drive' },
      {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        status: 'revoked'
      },
      { upsert: true }
    );

    return res.json({ success: true, message: 'Google Drive disconnected' });
  } catch (error) {
    console.error('disconnectGoogleDrive error:', error);
    res.status(500).json({ success: false, message: 'Failed to disconnect Google Drive' });
  }
};


