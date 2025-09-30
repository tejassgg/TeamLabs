const { google } = require('googleapis');
const axios = require('axios');
const User = require('../models/User');
const Integration = require('../models/Integration');
const UserActivity = require('../models/UserActivity');

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
  if (missing.length) {
    const msg = `Missing required Google OAuth env: ${missing.join(', ')}`;
    throw new Error(msg);
  }
}

// ---------- Integrations Catalog ----------
const getIntegrationDescription = (integrationType) => {
  const descriptions = {
    github: 'Code repository management and collaboration',
    google_calendar: 'Auto-sync meetings & set reminders',
    google_meet: 'Sync meeting notes with AI-generated highlights',
    google_drive: 'Save meeting notes and attachments securely',
    dropbox: 'Store and share files directly from your meetings',
    slack: 'Get instant meeting summaries & action items in your team channels',
    zoom: 'AI-powered meeting transcriptions & summaries'
  };
  return descriptions[integrationType] || 'Integration description not available';
};

exports.getIntegrationsStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const CommonType = require('../models/CommonType');
    const user = await User.findById(userId).select('email profileImage organizationID');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const availableIntegrations = await CommonType.find({ MasterType: 'Integrations' }).sort({ Code: 1 });
    const userIntegrations = await Integration.find({ userId }).select('integrationType isConnected connectedAt externalUsername externalEmail externalAvatarUrl tokenExpiry');

    const userIntegrationsMap = {};
    userIntegrations.forEach(integration => {
      userIntegrationsMap[integration.integrationType] = {
        connected: integration.isConnected,
        username: integration.externalUsername || null,
        email: integration.externalEmail || null,
        avatarUrl: integration.externalAvatarUrl || null,
        connectedAt: integration.connectedAt || null,
        tokenExpiry: integration.tokenExpiry || null
      };
    });

    const allIntegrations = availableIntegrations.map(integration => {
      const integrationType = integration.Description;
      const userIntegration = userIntegrationsMap[integrationType];
      return {
        id: integration.Code,
        name: integration.Value,
        type: integrationType,
        icon: integration.FaIcon,
        description: getIntegrationDescription(integrationType),
        connected: userIntegration?.connected || false,
        username: userIntegration?.username || null,
        email: userIntegration?.email || null,
        avatarUrl: userIntegration?.avatarUrl || null,
        connectedAt: userIntegration?.connectedAt || null,
        tokenExpiry: userIntegration?.tokenExpiry || null
      };
    });

    res.json({ success: true, integrations: allIntegrations });
  } catch (error) {
    console.error('Integrations status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get integrations status' });
  }
};

// ---------- GitHub ----------
exports.initiateGitHubAuth = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const generateRandomString = (length) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const state = generateRandomString(32);
    const redirectUri = `${process.env.FRONTEND_URL}/github-callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user:email&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    res.json({ success: true, authUrl: githubAuthUrl, state });
  } catch (error) {
    console.error('GitHub auth initiation error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate GitHub authentication' });
  }
};

exports.handleGitHubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = req.body;
    if (!code || !state || !userId) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, { headers: { 'Accept': 'application/json' } });
    const { access_token } = tokenResponse.data;
    if (!access_token) {
      return res.status(400).json({ success: false, error: 'Failed to obtain access token' });
    }
    const userResponse = await axios.get('https://api.github.com/user', { headers: { 'Authorization': `token ${access_token}`, 'Accept': 'application/vnd.github.v3+json' } });
    const githubUser = userResponse.data;
    const emailsResponse = await axios.get('https://api.github.com/user/emails', { headers: { 'Authorization': `token ${access_token}`, 'Accept': 'application/vnd.github.v3+json' } });
    const primaryEmail = emailsResponse.data.find(email => email.primary)?.email || githubUser.email;
    const user = await User.findById(userId).select('organizationID');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'github' },
      {
        userId,
        organizationId: user.organizationID,
        integrationType: 'github',
        isConnected: true,
        connectedAt: new Date(),
        accessToken: access_token,
        externalId: githubUser.id.toString(),
        externalUsername: githubUser.login,
        externalEmail: primaryEmail,
        externalAvatarUrl: githubUser.avatar_url,
        status: 'active',
        lastUsedAt: new Date(),
        tokenExpiry: tokenResponse.data.expires_in ? new Date(Date.now() + tokenResponse.data.expires_in * 1000) : null,
      },
      { upsert: true }
    );
    await UserActivity.create({ user: userId, type: 'github_connected', status: 'success', details: `Connected GitHub account: ${githubUser.login}`, ipAddress: req.ip, userAgent: req.get('User-Agent') });
    res.json({ success: true, message: 'GitHub account connected successfully', githubUser: { username: githubUser.login, email: primaryEmail, avatarUrl: githubUser.avatar_url } });
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete GitHub authentication' });
  }
};

exports.disconnectGitHub = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const integration = await Integration.findOne({ userId, integrationType: 'github' });
    if (!integration || !integration.isConnected) {
      return res.status(400).json({ success: false, error: 'GitHub account is not connected' });
    }
    if (integration.accessToken) {
      try {
        await axios.delete(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
          headers: { 'Authorization': `token ${integration.accessToken}`, 'Accept': 'application/vnd.github.v3+json' },
          data: { access_token: integration.accessToken }
        });
      } catch (error) {
        console.error('Error revoking GitHub token:', error);
      }
    }
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'github' },
      { isConnected: false, accessToken: null, externalId: null, externalUsername: null, externalEmail: null, externalAvatarUrl: null, connectedAt: null, status: 'revoked' }
    );
    await UserActivity.create({ user: userId, type: 'github_disconnected', status: 'success', details: 'Disconnected GitHub account', ipAddress: req.ip, userAgent: req.get('User-Agent') });
    res.json({ success: true, message: 'GitHub account disconnected successfully' });
  } catch (error) {
    console.error('GitHub disconnect error:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect GitHub account' });
  }
};

exports.getGitHubStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const integration = await Integration.findOne({ userId, integrationType: 'github' });
    if (!integration) {
      return res.json({ success: true, githubStatus: { connected: false, username: null, email: null, avatarUrl: null, connectedAt: null } });
    }
    res.json({ success: true, githubStatus: { connected: integration.isConnected, username: integration.externalUsername, email: integration.externalEmail, avatarUrl: integration.externalAvatarUrl, connectedAt: integration.connectedAt } });
  } catch (error) {
    console.error('GitHub status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get GitHub status' });
  }
};

exports.getUserRepositories = async (req, res) => {
  try {
    const { userId } = req.user?._id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const integration = await Integration.findOne({ userId, integrationType: 'github' });
    if (!integration || !integration.isConnected) {
      return res.status(400).json({ success: false, error: 'GitHub account not connected' });
    }
    const response = await axios.get('https://api.github.com/user/repos', { headers: { 'Authorization': `token ${integration.accessToken}`, 'Accept': 'application/vnd.github.v3+json' }, params: { sort: 'updated', per_page: 100 } });
    const repositories = response.data.map(repo => ({ id: repo.id, name: repo.name, full_name: repo.full_name, description: repo.description, language: repo.language, stargazers_count: repo.stargazers_count, forks_count: repo.forks_count, html_url: repo.html_url, clone_url: repo.clone_url, private: repo.private, updated_at: repo.updated_at }));
    res.json({ success: true, repositories });
  } catch (error) {
    console.error('Error fetching user repositories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch repositories' });
  }
};

// ---------- Google (OAuth unified) ----------
exports.getGoogleCalendarStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('email profileImage');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const integration = await Integration.findOne({ userId, integrationType: 'google_calendar' });
    if (!integration) {
      return res.json({ success: true, connected: false, email: user.email || null, tokenExpiry: null, avatarUrl: user.profileImage || null });
    }
    res.json({ success: true, connected: integration.isConnected || false, email: user.email || null, tokenExpiry: integration.tokenExpiry || null, avatarUrl: user.profileImage || null });
  } catch (error) {
    console.error('getGoogleCalendarStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to get Google Calendar status' });
  }
};

exports.initiateGoogleAuth = async (req, res) => {
  try {
    assertGoogleOAuthEnvOrThrow();
    const userId = req.user._id;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const { service } = req.body;
    if (!service || !['google_calendar', 'google_drive'].includes(service)) {
      return res.status(400).json({ success: false, message: 'Invalid service. Must be google_calendar or google_drive' });
    }
    const scopeMap = {
      google_calendar: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      google_drive: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    };
    const oauth2Client = buildGoogleOAuthClient();
    const scopes = scopeMap[service];
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
      service = parsed.service || 'google_calendar';
    } catch (_) { }
    if (!userId) return res.status(400).json({ success: false, message: 'Invalid state' });
    const oauth2Client = buildGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    });
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    let userInfo = { data: {} };
    try {
      userInfo = await oauth2.userinfo.get();
    } catch (e) {
      // continue without userinfo
    }
    console.log(userInfo);
    const user = await User.findById(userId).select('organizationID email');
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
      externalEmail: userInfo.data.email || user.email,
      externalAvatarUrl: userInfo.data.picture,
      status: 'active',
      lastUsedAt: new Date()
    };
    await Integration.findOneAndUpdate({ userId, integrationType: service }, integrationData, { upsert: true });
    const redirectParam = service === 'google_drive' ? 'googleDrive=connected' : 'googleCalendar=connected';
    const redirectTo = (returnUrl || `${process.env.FRONTEND_URL}`) + (returnUrl && returnUrl.includes('?') ? '&' : '?') + redirectParam;
    res.redirect(302, redirectTo);
  } catch (error) {
    console.error('handleGoogleCallback error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete Google auth' });
  }
};

exports.attachGoogleCalendarToken = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
    const { accessToken, refreshToken = null, tokenExpiry = null } = req.body;
    if (!accessToken) return res.status(400).json({ success: false, message: 'Missing accessToken' });
    const user = await User.findById(userId).select('organizationID');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'google_calendar' },
      { userId, organizationId: user.organizationID, integrationType: 'google_calendar', isConnected: true, accessToken, refreshToken, tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null, status: 'active', lastUsedAt: new Date() },
      { upsert: true }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('attachGoogleCalendarToken error:', error);
    return res.status(500).json({ success: false, message: 'Failed to attach Google Calendar token' });
  }
};

exports.disconnectGoogleCalendar = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'google_calendar' },
      { isConnected: false, accessToken: null, refreshToken: null, tokenExpiry: null, status: 'revoked' },
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
    const userId = req.user._id;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
    const integration = await Integration.findOne({ userId, integrationType: 'google_drive' });
    if (!integration || !integration.isConnected) {
      return res.json({ success: true, connected: false });
    }
    res.json({ success: true, connected: true, connectedAt: integration.connectedAt, tokenExpiry: integration.tokenExpiry, externalEmail: integration.externalEmail, externalUsername: integration.externalUsername, externalAvatarUrl: integration.externalAvatarUrl });
  } catch (error) {
    console.error('getGoogleDriveStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to get Google Drive status' });
  }
};

exports.disconnectGoogleDrive = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });
    await Integration.findOneAndUpdate(
      { userId, integrationType: 'google_drive' },
      { isConnected: false, accessToken: null, refreshToken: null, tokenExpiry: null, status: 'revoked' },
      { upsert: true }
    );
    return res.json({ success: true, message: 'Google Drive disconnected' });
  } catch (error) {
    console.error('disconnectGoogleDrive error:', error);
    res.status(500).json({ success: false, message: 'Failed to disconnect Google Drive' });
  }
};

// Export GitHub project-related to keep API parity
exports.linkRepositoryToProject = require('./authController').linkRepositoryToProject;
exports.unlinkRepositoryFromProject = require('./authController').unlinkRepositoryFromProject;
exports.getProjectRepository = require('./authController').getProjectRepository;
exports.getProjectCommits = require('./authController').getProjectCommits;
exports.getProjectIssues = require('./authController').getProjectIssues;


