// Integration Icons Utility
// Maps integration types to their corresponding FontAwesome icons

export const INTEGRATION_ICONS = {
  github: 'FaGithub',
  google_calendar: 'FaCalendarAlt',
  google_meet: 'FaVideo',
  google_drive: 'FaGoogleDrive',
  dropbox: 'FaDropbox',
  slack: 'FaSlack',
  zoom: 'FaVideo',
  microsoft_teams: 'FaMicrosoft',
  onedrive: 'FaMicrosoft',
  microsoft_outlook: 'FaMicrosoft'
};

export const INTEGRATION_NAMES = {
  github: 'GitHub',
  google_calendar: 'Google Calendar',
  google_meet: 'Google Meet',
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  slack: 'Slack',
  zoom: 'Zoom',
  microsoft_teams: 'Microsoft Teams',
  onedrive: 'OneDrive',
  microsoft_outlook: 'Microsoft Outlook'
};

export const INTEGRATION_DESCRIPTIONS = {
  github: 'Code repository management and collaboration',
  google_calendar: 'Auto-sync meetings & set reminders',
  google_meet: 'Sync meeting notes with AI-generated highlights',
  google_drive: 'Save meeting notes and attachments securely',
  dropbox: 'Store and share files directly from your meetings',
  slack: 'Get instant meeting summaries & action items in your team channels',
  zoom: 'AI-powered meeting transcriptions & summaries',
  microsoft_teams: 'Capture key discussions & automate action items',
  onedrive: 'Sync meeting documents across your devices',
  microsoft_outlook: 'Schedule and track discussions effortlessly'
};

/**
 * Get FontAwesome icon name for an integration type
 * @param {string} integrationType - The integration type (e.g., 'github', 'google_calendar')
 * @returns {string} FontAwesome icon name
 */
export const getIntegrationIcon = (integrationType) => {
  return INTEGRATION_ICONS[integrationType] || 'FaQuestionCircle';
};

/**
 * Get display name for an integration type
 * @param {string} integrationType - The integration type
 * @returns {string} Display name
 */
export const getIntegrationName = (integrationType) => {
  return INTEGRATION_NAMES[integrationType] || 'Unknown Integration';
};

/**
 * Get description for an integration type
 * @param {string} integrationType - The integration type
 * @returns {string} Description
 */
export const getIntegrationDescription = (integrationType) => {
  return INTEGRATION_DESCRIPTIONS[integrationType] || 'Integration description not available';
};

/**
 * Get all available integration types
 * @returns {string[]} Array of integration types
 */
export const getAllIntegrationTypes = () => {
  return Object.keys(INTEGRATION_ICONS);
};

/**
 * Get integration info object
 * @param {string} integrationType - The integration type
 * @returns {object} Integration info object
 */
export const getIntegrationInfo = (integrationType) => {
  return {
    type: integrationType,
    name: getIntegrationName(integrationType),
    icon: getIntegrationIcon(integrationType),
    description: getIntegrationDescription(integrationType)
  };
};

/**
 * Get all integrations info
 * @returns {object[]} Array of integration info objects
 */
export const getAllIntegrationsInfo = () => {
  return getAllIntegrationTypes().map(getIntegrationInfo);
};
