# Video Calling Functionality

This project now includes comprehensive video calling capabilities using WebRTC and Socket.io for real-time communication.

## Features

### 🎥 Video Calls
- **Direct Message Calls**: Initiate video calls with individual users
- **Real-time Communication**: Low-latency video and audio streaming
- **WebRTC Integration**: Peer-to-peer connection for optimal performance

### 📱 Call Controls
- **Mute/Unmute**: Toggle microphone on/off
- **Camera On/Off**: Enable/disable video stream
- **Speaker Control**: Toggle remote audio output
- **Call End**: Hang up the call

### 🔔 Call Management
- **Incoming Call Modal**: Accept or decline incoming calls
- **Outgoing Call Modal**: See call status and cancel if needed
- **Call Timeout**: Automatic timeout if recipient doesn't respond
- **User Notifications**: Toast messages for call events

## How to Use

### Starting a Call
1. Navigate to a direct message conversation
2. Click the green phone icon next to the conversation name
3. The video call modal will open and attempt to connect

### Receiving a Call
1. When someone calls you, a modal will appear
2. Click the green phone button to answer
3. Click the red phone button to decline

### During a Call
- **Mute Button**: Toggle your microphone
- **Camera Button**: Toggle your video camera
- **Speaker Button**: Toggle remote audio output
- **End Call Button**: Hang up the call

## Technical Implementation

### Server-Side (Socket.io)
- **Call Events**: Handle call initiation, answering, declining, and ending
- **WebRTC Signaling**: Manage offer/answer exchange and ICE candidates
- **User Authentication**: Verify call participants are authorized

### Client-Side (React + WebRTC)
- **Media Streams**: Access camera and microphone
- **Peer Connection**: Establish WebRTC connection
- **Real-time Updates**: Socket.io event handling for call state

### WebRTC Configuration
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

## Browser Requirements

- **HTTPS Required**: WebRTC requires secure context
- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **Media Permissions**: Camera and microphone access must be granted

## Security Features

- **User Authentication**: Only authenticated users can make calls
- **Conversation Validation**: Users can only call participants in their conversations
- **Organization Isolation**: Calls are restricted to organization members

## Error Handling

- **Device Access**: Clear error messages for camera/microphone issues
- **Network Issues**: Automatic fallback and timeout handling
- **User Feedback**: Toast notifications for call events

## Future Enhancements

- **Group Video Calls**: Support for multiple participants
- **Screen Sharing**: Share screen during calls
- **Call Recording**: Option to record calls
- **Advanced Controls**: Virtual backgrounds, filters, etc.
- **Call History**: Track call duration and history

## Troubleshooting

### Common Issues
1. **Camera Not Working**: Check browser permissions and device connections
2. **Audio Issues**: Verify microphone permissions and system audio settings
3. **Connection Problems**: Ensure stable internet connection
4. **Browser Compatibility**: Update to latest browser version

### Debug Mode
Enable browser console logging to see detailed WebRTC connection information.

## Testing

To test the video calling functionality:

1. Open the application in two different browsers or incognito windows
2. Log in with different user accounts
3. Start a direct message conversation between the users
4. Initiate a video call from one user
5. Accept the call from the other user
6. Test various controls (mute, camera, speaker)

## Dependencies

- **Socket.io**: Real-time communication
- **WebRTC**: Peer-to-peer media streaming
- **React**: User interface components
- **Tailwind CSS**: Styling and responsive design
