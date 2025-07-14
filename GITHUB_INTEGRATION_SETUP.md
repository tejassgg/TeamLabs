# GitHub Integration Setup Guide

This guide explains how to set up GitHub OAuth integration for the TeamLabs application.

## Prerequisites

1. A GitHub account
2. Node.js and npm installed
3. MongoDB database running

## GitHub OAuth App Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: TeamLabs
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/github-callback`
4. Click "Register application"
5. Note down the **Client ID** and **Client Secret**

### 2. Environment Variables

Add the following environment variables to your `server/.env` file:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Client URL (for OAuth redirects)
CLIENT_URL=http://localhost:3000
```

### 3. Install Dependencies

Make sure axios is installed in the server:

```bash
cd server
npm install axios
```

## Features

The GitHub integration includes the following features:

### Backend Features
- **OAuth Flow**: Complete GitHub OAuth 2.0 flow with state parameter verification
- **User Data Storage**: Stores GitHub user information in the database
- **Token Management**: Securely stores and manages GitHub access tokens
- **Activity Logging**: Logs GitHub connection/disconnection activities
- **Token Revocation**: Properly revokes GitHub tokens on disconnection

### Frontend Features
- **Settings Integration**: GitHub integration tab in the settings page
- **Connection Status**: Shows current GitHub connection status
- **User Profile**: Displays GitHub username, email, and avatar
- **Loading States**: Proper loading indicators during connection/disconnection
- **Error Handling**: Comprehensive error handling and user feedback

### API Endpoints

- `POST /auth/github/initiate` - Start GitHub OAuth flow
- `POST /auth/github/callback` - Handle OAuth callback
- `POST /auth/github/disconnect` - Disconnect GitHub account
- `GET /auth/github/status/:userId` - Get GitHub connection status

## Database Schema

The User model has been extended with GitHub fields:

```javascript
// GitHub Integration fields
githubConnected: Boolean,
githubAccessToken: String,
githubUserId: String,
githubUsername: String,
githubEmail: String,
githubAvatarUrl: String,
githubConnectedAt: Date
```

## Security Features

- **State Parameter**: CSRF protection using state parameter
- **Token Storage**: Secure storage of GitHub access tokens
- **Token Revocation**: Proper cleanup of GitHub tokens on disconnection
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Secure error handling without exposing sensitive data

## Usage

1. Navigate to Settings > Integrations
2. Click "Connect GitHub Account"
3. Authorize the application on GitHub
4. You'll be redirected back to the settings page
5. Your GitHub account will be connected and you can disconnect it anytime

## Production Considerations

For production deployment:

1. Update the GitHub OAuth app callback URL to your production domain
2. Set the `CLIENT_URL` environment variable to your production URL
3. Use HTTPS for all OAuth redirects
4. Consider using Redis for state parameter storage instead of localStorage
5. Implement rate limiting on OAuth endpoints
6. Add monitoring and logging for OAuth activities

## Troubleshooting

### Common Issues

1. **"Invalid GitHub authentication state"**
   - Clear browser localStorage and try again
   - Check that the state parameter is being properly generated and stored

2. **"Failed to obtain access token"**
   - Verify GitHub OAuth app credentials
   - Check that the callback URL matches exactly

3. **"User not found"**
   - Ensure the user is properly authenticated
   - Check that the userId is being passed correctly

### Debug Mode

To enable debug logging, add to your server environment:

```env
DEBUG=github:*
```

## Future Enhancements

- Repository listing and management
- Issue and pull request integration
- Webhook support for real-time updates
- Team and organization integration
- Advanced repository permissions 