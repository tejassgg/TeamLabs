# Integrations System

This document describes the new integrations system that replaces the previous integration fields in the User model with a dedicated Integrations collection.

## Overview

The integrations system allows users to connect various third-party services to their TeamLabs account. The system is designed to be scalable, secure, and maintainable.

## Architecture

### Collections

#### 1. CommonType Collection
Stores integration types and metadata in the `Integrations` master type.

#### 2. Integration Collection (New)
Dedicated collection for storing user integration data, tokens, and metadata.

#### 3. User Collection (Updated)
Removed integration-specific fields, now references Integration collection.

## Available Integrations

The system supports the following integrations:

1. **GitHub** (`github`)
   - Repository access
   - Issue tracking
   - Pull request management

2. **Google Calendar** (`google_calendar`)
   - Calendar event creation
   - Meeting scheduling

3. **Google Meet** (`google_meet`)
   - Video conferencing integration
   - Meeting link generation

4. **Google Drive** (`google_drive`)
   - File storage and sharing
   - Document collaboration

5. **Dropbox** (`dropbox`)
   - File storage and synchronization
   - Document sharing

6. **Slack** (`slack`)
   - Team communication
   - Notification integration

## Database Schema

### Integration Model

```javascript
{
  userId: ObjectId,           // Reference to User
  organizationId: ObjectId,   // Reference to Organization
  integrationType: String,    // One of: github, google_calendar, google_meet, google_drive, dropbox, slack
  isConnected: Boolean,       // Connection status
  connectedAt: Date,          // When connection was established
  lastUsedAt: Date,           // Last time integration was used
  
  // OAuth tokens
  accessToken: String,        // OAuth access token
  refreshToken: String,       // OAuth refresh token
  tokenExpiry: Date,          // Token expiration date
  scope: [String],            // OAuth scopes
  
  // External service data
  externalId: String,         // External service user ID
  externalUsername: String,   // External username/email
  externalEmail: String,      // External email
  externalAvatarUrl: String,  // External avatar URL
  externalName: String,       // External full name
  
  // Status and error tracking
  status: String,             // active, expired, revoked, error
  lastError: String,          // Last error message
  errorCount: Number,         // Number of consecutive errors
  
  // Settings and metadata
  settings: Object,           // Integration-specific settings
  metadata: Object,           // Additional metadata
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Get All Integrations Status
```
GET /api/auth/integrations/:userId
```
Returns the status of all integrations for a user.

**Response:**
```json
{
  "success": true,
  "integrations": {
    "github": {
      "connected": true,
      "username": "johndoe",
      "email": "john@example.com",
      "avatarUrl": "https://...",
      "connectedAt": "2024-01-01T00:00:00Z"
    },
    "googleCalendar": {
      "connected": true,
      "email": "john@example.com",
      "tokenExpiry": "2024-01-31T00:00:00Z",
      "avatarUrl": "https://..."
    }
  }
}
```

### Individual Integration Endpoints
- `GET /api/auth/github/status/:userId` - GitHub status
- `GET /api/google-calendar/status/:userId` - Google Calendar status

## Setup Instructions

### 1. Seed Integration Types

Run the seed script to populate CommonType with integration types:

```bash
cd server
node scripts/seedIntegrations.js
```

### 2. Migrate Existing Data

If you have existing integration data in the User model, run the migration:

```bash
cd server
node scripts/migrateIntegrations.js
```

### 3. Clean Up User Model (Optional)

After migration, remove old integration fields from User model:

```bash
cd server
node scripts/cleanupUserIntegrations.js
```

## Usage Examples

### Check Integration Status

```javascript
const Integration = require('../models/Integration');

// Get all integrations for a user
const integrations = await Integration.findConnectedIntegrations(userId);

// Check specific integration
const githubIntegration = await Integration.findByUserAndType(userId, 'github');
if (githubIntegration && githubIntegration.isConnected) {
  // GitHub is connected
}
```

### Handle Token Expiration

```javascript
const integration = await Integration.findByUserAndType(userId, 'google_calendar');

if (integration.needsRefresh()) {
  // Refresh the token
  const newToken = await refreshOAuthToken(integration.refreshToken);
  integration.accessToken = newToken.access_token;
  integration.tokenExpiry = new Date(newToken.expires_in * 1000);
  await integration.save();
}
```

### Track Integration Usage

```javascript
// Update last used timestamp
await integration.updateLastUsed();

// Handle errors
await integration.incrementErrorCount('Token expired');
```

## Security Considerations

1. **Token Storage**: OAuth tokens are stored securely in the database
2. **Token Expiry**: Automatic tracking of token expiration
3. **Error Handling**: Error counting and status tracking
4. **Scope Management**: OAuth scopes are stored and validated
5. **Organization Isolation**: Integrations are scoped to organizations

## Error Handling

The system includes comprehensive error handling:

- **Error Counting**: Tracks consecutive errors
- **Status Management**: Automatic status updates based on error count
- **Token Refresh**: Automatic token refresh when needed
- **Graceful Degradation**: System continues to work even if integrations fail

## Monitoring and Maintenance

### Token Expiration Monitoring

```javascript
// Find all expired tokens
const expiredIntegrations = await Integration.findExpiredTokens();

// Process expired tokens
for (const integration of expiredIntegrations) {
  if (integration.refreshToken) {
    // Attempt to refresh
    await refreshToken(integration);
  } else {
    // Mark as expired
    integration.status = 'expired';
    await integration.save();
  }
}
```

### Error Monitoring

```javascript
// Find integrations with errors
const errorIntegrations = await Integration.find({ 
  status: 'error',
  errorCount: { $gte: 5 }
});

// Reset error count for resolved integrations
await integration.resetErrorCount();
```

## Future Enhancements

1. **Webhook Support**: Add webhook endpoints for real-time updates
2. **Batch Operations**: Support for bulk integration operations
3. **Integration Templates**: Pre-configured integration setups
4. **Analytics**: Integration usage analytics and reporting
5. **Rate Limiting**: Built-in rate limiting for API calls
6. **Caching**: Token caching for improved performance

## Troubleshooting

### Common Issues

1. **Token Expired**: Check `tokenExpiry` field and refresh if needed
2. **Connection Lost**: Verify `isConnected` status and re-authenticate
3. **Error Count High**: Check `lastError` and `errorCount` fields
4. **Missing Integration**: Ensure integration type exists in CommonType

### Debug Queries

```javascript
// Find all integrations for debugging
const allIntegrations = await Integration.find()
  .populate('userId', 'firstName lastName email')
  .populate('organizationId', 'name');

// Find problematic integrations
const problematic = await Integration.find({
  $or: [
    { status: 'error' },
    { errorCount: { $gte: 3 } },
    { tokenExpiry: { $lt: new Date() } }
  ]
});
```

## Migration Notes

- The migration script preserves all existing integration data
- Old User model fields are safely removed after migration
- No data loss occurs during the migration process
- The system maintains backward compatibility during transition

## Support

For issues or questions regarding the integrations system:

1. Check the error logs for specific error messages
2. Verify integration configuration in CommonType collection
3. Ensure proper OAuth setup for each integration
4. Check token expiration and refresh mechanisms

