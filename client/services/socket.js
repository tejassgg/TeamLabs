import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

// Prefer explicit socket host; otherwise derive from API by stripping /api
const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
const derivedSocketBase = apiBase.replace(/\/?api\/?$/, '');
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || derivedSocketBase;
const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

let socket = null;
let isConnecting = false;
const subscribers = new Map(); // eventName -> Set<callback>

export function connectSocket() {
  if (socket || isConnecting) return socket;
  isConnecting = true;
  const token = Cookies.get('token');
  socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    transports: ['websocket', 'polling'],
    auth: { token },
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGINS ? process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGINS.split(',') : '*',
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000
  });

  socket.on('connect', () => {
    isConnecting = false;
  });
  socket.on('disconnect', () => {});
  socket.on('connect_error', () => {
    // leave socket to retry with backoff
  });

  // Generic dispatcher to local subscribers
  const dispatch = (eventName, payload) => {
    const set = subscribers.get(eventName);
    if (set) {
      set.forEach((cb) => {
        try { cb(payload); } catch (_) { /* ignore */ }
      });
    }
  };

  // Phase 1 org presence & member updates
  socket.on('org.member.presence', (payload) => dispatch('org.member.presence', payload));
  socket.on('org.member.updated', (payload) => dispatch('org.member.updated', payload));
  socket.on('org.member.joined', (payload) => dispatch('org.member.joined', payload));
  socket.on('org.member.left', (payload) => dispatch('org.member.left', payload));
  socket.on('org.member.removed', (payload) => dispatch('org.member.removed', payload));

  // Phase 2 dashboard metrics
  socket.on('dashboard.metrics.updated', (payload) => dispatch('dashboard.metrics.updated', payload));

  // Phase 3 kanban events
  socket.on('kanban.task.created', (payload) => dispatch('kanban.task.created', payload));
  socket.on('kanban.task.updated', (payload) => dispatch('kanban.task.updated', payload));
  socket.on('kanban.task.status.updated', (payload) => dispatch('kanban.task.status.updated', payload));
  socket.on('kanban.task.deleted', (payload) => dispatch('kanban.task.deleted', payload));
  socket.on('kanban.task.assigned', (payload) => dispatch('kanban.task.assigned', payload));

  // Phase 4 task details page events
  socket.on('task.updated', (payload) => dispatch('task.updated', payload));
  socket.on('task.subtask.created', (payload) => dispatch('task.subtask.created', payload));
  socket.on('task.subtask.updated', (payload) => dispatch('task.subtask.updated', payload));
  socket.on('task.subtask.deleted', (payload) => dispatch('task.subtask.deleted', payload));
  socket.on('task.comment.created', (payload) => dispatch('task.comment.created', payload));
  socket.on('task.comment.updated', (payload) => dispatch('task.comment.updated', payload));
  socket.on('task.comment.deleted', (payload) => dispatch('task.comment.deleted', payload));
  socket.on('task.attachment.added', (payload) => dispatch('task.attachment.added', payload));
  socket.on('task.attachment.removed', (payload) => dispatch('task.attachment.removed', payload));
  socket.on('project.attachment.added', (payload) => dispatch('project.attachment.added', payload));
  socket.on('project.attachment.removed', (payload) => dispatch('project.attachment.removed', payload));

  // Phase 6 messaging
  socket.on('chat.message.created', (payload) => dispatch('chat.message.created', payload));
  socket.on('chat.message.updated', (payload) => dispatch('chat.message.updated', payload));
  socket.on('chat.typing', (payload) => dispatch('chat.typing', payload));
  socket.on('chat.conversation.created', (payload) => dispatch('chat.conversation.created', payload));
  socket.on('chat.conversation.updated', (payload) => dispatch('chat.conversation.updated', payload));
  socket.on('chat.conversation.deleted', (payload) => dispatch('chat.conversation.deleted', payload));
  socket.on('chat.inbox.updated', (payload) => dispatch('chat.inbox.updated', payload));

  // Phase 7: task collaboration (server-driven state)
  socket.on('task.collaboration.state', (payload) => dispatch('task.collaboration.state', payload));

  // Phase 8: screen sharing
  socket.on('call.screen-share.started', (payload) => dispatch('call.screen-share.started', payload));
  socket.on('call.screen-share.stopped', (payload) => dispatch('call.screen-share.stopped', payload));
  socket.on('chat.messages.read', (payload) => dispatch('chat.messages.read', payload));

  // Call events
  socket.on('call.incoming', (payload) => dispatch('call.incoming', payload));
  socket.on('call.answered', (payload) => dispatch('call.answered', payload));
  socket.on('call.declined', (payload) => dispatch('call.declined', payload));
  socket.on('call.ended', (payload) => dispatch('call.ended', payload));
  socket.on('call.initiated', (payload) => dispatch('call.initiated', payload));
  socket.on('call.ice-candidate', (payload) => dispatch('call.ice-candidate', payload));

  // Team events
  socket.on('team.created', (payload) => dispatch('team.created', payload));
  socket.on('team.updated', (payload) => dispatch('team.updated', payload));
  socket.on('team.deleted', (payload) => dispatch('team.deleted', payload));
  socket.on('team.status.updated', (payload) => dispatch('team.status.updated', payload));
  socket.on('team.member.added', (payload) => dispatch('team.member.added', payload));
  socket.on('team.member.removed', (payload) => dispatch('team.member.removed', payload));
  socket.on('team.member.status.updated', (payload) => dispatch('team.member.status.updated', payload));
  socket.on('team.members.bulk_removed', (payload) => dispatch('team.members.bulk_removed', payload));
  socket.on('team.projects.bulk_removed', (payload) => dispatch('team.projects.bulk_removed', payload));
  socket.on('team.join_request.created', (payload) => dispatch('team.join_request.created', payload));
  socket.on('team.join_request.accepted', (payload) => dispatch('team.join_request.accepted', payload));
  socket.on('team.join_request.rejected', (payload) => dispatch('team.join_request.rejected', payload));

  return socket;
}

export function getSocket() {
  if (!socket) connectSocket();
  return socket;
}

export function subscribe(eventName, callback) {
  if (!subscribers.has(eventName)) subscribers.set(eventName, new Set());
  subscribers.get(eventName).add(callback);
  return () => {
    const set = subscribers.get(eventName);
    if (set) set.delete(callback);
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.close();
    socket = null;
  }
}


