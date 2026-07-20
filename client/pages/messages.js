import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api, { messagingService } from '../services/api';
import { connectSocket, getSocket, subscribe } from '../services/socket';
import { FaTimes } from 'react-icons/fa';
import VideoCallModal from '../components/messages/VideoCallModal';
import IncomingCallScreen from '../components/messages/IncomingCallScreen';
import ChatSidebar from '../components/messages/ChatSidebar';
import ChatHeader from '../components/messages/ChatHeader';
import MessageList from '../components/messages/MessageList';
import MessageInput from '../components/messages/MessageInput';
import ChatDetails from '../components/messages/ChatDetails';
import NewConversationModal from '../components/messages/NewConversationModal';
import DeleteConversationModal from '../components/messages/DeleteConversationModal';
import {
  ChatHeaderSkeleton,
  MessagesAreaSkeleton,
  ChatFooterSkeleton
} from '../components/skeletons/MessageSkeletons';

export default function MessagesPage() {
  const router = useRouter();
  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { formatTimeAgo } = useGlobal();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimersRef = useRef({});
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const MESSAGES_PAGE_SIZE = 8;
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [conversationType, setConversationType] = useState('dm'); // 'dm' | 'group'
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [selectedDmUser, setSelectedDmUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState('details'); // details | files | links
  const [convDetails, setConvDetails] = useState(null);
  const [convAssets, setConvAssets] = useState({ files: [], links: [] });
  const [groupMembers, setGroupMembers] = useState([]); // array of user objects
  const [orgUsers, setOrgUsers] = useState([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [isSavingGroupName, setIsSavingGroupName] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [recentlyUpdatedConversation, setRecentlyUpdatedConversation] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDetailsAnimating, setIsDetailsAnimating] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Voice message state removed
  const mentionDropdownRef = useRef(null);
  const messageInputRef = useRef(null);
  const memberDropdownRef = useRef(null);
  const bottomRef = useRef(null);
  const kebabMenuRef = useRef(null);
  const shareMenuRef = useRef(null);
  const editInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Call-related state
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [showIncomingCallScreen, setShowIncomingCallScreen] = useState(false);
  const [callType, setCallType] = useState(null); // 'incoming' | 'outgoing' | 'active'
  const [callData, setCallData] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [answerData, setAnswerData] = useState(null); // Store answer when caller receives it
  const [modalInitialAction, setModalInitialAction] = useState(null); // 'answer' | 'decline' | null

  // Get theme classes helper function
  const getThemeClasses = (baseClasses, darkClasses) => {
    return `${baseClasses} ${theme === 'dark' ? darkClasses : ''}`;
  };


  const renderMessageText = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /@([A-Za-z_]+)/g;

    const renderMentions = (chunk, baseKey) => {
      const nodes = [];
      let lastIndex = 0;
      let match;
      while ((match = mentionRegex.exec(chunk)) !== null) {
        if (match.index > lastIndex) nodes.push(chunk.substring(lastIndex, match.index));
        const displayName = match[1].replace(/_/g, ' ');
        nodes.push(
          <span key={`${baseKey}-m-${match.index}`} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">
            @{displayName}
          </span>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < chunk.length) nodes.push(chunk.substring(lastIndex));
      return nodes;
    };

    const parts = text.split(urlRegex);
    const out = [];
    parts.forEach((part, idx) => {
      if (urlRegex.test(part)) {
        out.push(
          <a
            key={`u-${idx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else {
        const nodes = renderMentions(part, `p-${idx}`);
        nodes.forEach((n, i) => out.push(typeof n === 'string' ? <span key={`t-${idx}-${i}`}>{n}</span> : n));
      }
    });
    return out;
  };

  // Add current user to group members by default when group type is selected
  useEffect(() => {
    if (conversationType === 'group' && userDetails && orgUsers.length > 0) {
      // Find current user in orgUsers
      const currentUser = orgUsers.find(u => String(u._id) === String(userDetails._id));
      if (currentUser && !groupMembers.some(m => String(m._id) === String(currentUser._id))) {
        setGroupMembers(prev => [...prev, currentUser]);
      }
    }
  }, [conversationType, userDetails, orgUsers, groupMembers]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    if (!userDetails) return conversations;

    const query = searchQuery.toLowerCase().trim();
    return conversations.filter(conversation => {
      // For group chats, search in group name
      if (conversation.isGroup) {
        const groupName = conversation.name || 'Group';
        if (groupName.toLowerCase().includes(query)) return true;
      } else {
        // For direct messages, search in participant names
        const participantNames = conversation.participants
          ?.filter(p => p._id !== userDetails?._id)
          ?.map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim())
          ?.join(' ') || '';

        if (participantNames.toLowerCase().includes(query)) return true;
      }

      // Search in last message preview
      if (conversation.lastMessagePreview?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [conversations, searchQuery, userDetails?._id]);

  // URL query parameter handling functions
  const updateURLWithConversation = (conversationId) => {
    if (conversationId) {
      router.push({
        pathname: '/messages',
        query: { conversationID: conversationId }
      }, undefined, { shallow: true });
    } else {
      router.push('/messages', undefined, { shallow: true });
    }
  };

  const getConversationFromURL = () => {
    return router.query.conversationID;
  };

  const selectConversationFromURL = (conversationId) => {
    // Clear typing indicator when switching conversations
    if (selectedConversation && typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;

      // Emit typing stop event for the previous conversation
      const socket = getSocket();
      if (socket) {
        socket.emit('chat.typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        });
      }
    }

    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        return true;
      }
    }
    return false;
  };

  // Helper function to select conversation with typing indicator cleanup
  const selectConversationWithCleanup = (conversation) => {
    // Clear typing indicator when switching conversations
    if (selectedConversation && typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;

      // Emit typing stop event for the previous conversation
      const socket = getSocket();
      if (socket) {
        socket.emit('chat.typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        });
      }
    }

    setSelectedConversation(conversation);
    updateURLWithConversation(conversation._id);
  };

  useEffect(() => {
    if (!userDetails) return;
    connectSocket();
    setIsLoadingConversations(true);
    messagingService.getConversations()
      .then((list) => {
        setConversations(list);
        // Initialize unreadCounts from server-provided unreadCount per conversation
        const initialCounts = (list || []).reduce((acc, c) => {
          acc[c._id] = typeof c.unreadCount === 'number' ? c.unreadCount : 0;
          return acc;
        }, {});
        setUnreadCounts(initialCounts);
      })
      .catch(() => { })
      .finally(() => setIsLoadingConversations(false));

    // load org users for multi-select
    api.get(`/dashboard/${userDetails.organizationID}`).then(res => {
      const users = res.data?.members?.map(m => {
        const name = m.name || '';
        const parts = name.split(' ').filter(Boolean);
        let initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
        if (!initials) {
          const base = name || m.email || '';
          initials = base.slice(0, 2).toUpperCase();
        }
        return {
          _id: m.id,
          name,
          email: m.email,
          initials
        };
      }) || [];
      setOrgUsers(users);
    }).catch(() => { });

    // Subscribe to conversation creation to add new groups/DMs live
    const offConv = subscribe('chat.conversation.created', (payload) => {
      const { data } = payload || {};
      const convo = data?.conversation;
      if (!convo) return;
      // Only add if current user is a participant
      const isParticipant = (convo.participants || []).some(p => String(p._id || p) === String(userDetails?._id));
      if (!isParticipant) return;
      setConversations(prev => {
        if (prev.some(c => c._id === convo._id)) return prev;
        return [convo, ...prev];
      });
    });
    const offConvDeleted = subscribe('chat.conversation.deleted', (payload) => {
      const { data } = payload || {};
      const deletedId = data?.conversationId;
      if (!deletedId) return;
      setConversations(prev => prev.filter(c => c._id !== deletedId));
      setSelectedConversation((cur) => cur && cur._id === deletedId ? null : cur);
      if (selectedConversation && selectedConversation._id === deletedId) {
        setMessages([]);
      }
    });
    const offConvUpdated = subscribe('chat.conversation.updated', (payload) => {
      const { data } = payload || {};
      const { conversationId, participants, name, updatedAt } = data || {};
      if (!conversationId) return;

      // Update conversations list and move updated conversation to top
      setConversations(prev => {
        const updatedConv = prev.find(c => c._id === conversationId);
        if (!updatedConv) return prev;

        const updated = {
          ...updatedConv,
          ...(participants && { participants }),
          ...(name && { name }),
          ...(updatedAt && { updatedAt })
        };

        // Move updated conversation to top
        const otherConvs = prev.filter(c => c._id !== conversationId);
        return [updated, ...otherConvs];
      });

      // If this is a significant update (participants or name), refresh the full conversation data
      if (participants || name) {
        messagingService.getConversation(conversationId)
          .then(fullDetails => {
            // Update conversations list with full details
            setConversations(prev => {
              const otherConvs = prev.filter(c => c._id !== conversationId);
              return [fullDetails, ...otherConvs];
            });
          })
          .catch(console.error);
      }

      // Update current conversation details if it's the selected one
      if (selectedConversation && selectedConversation._id === conversationId) {
        setConvDetails(prev => prev ? {
          ...prev,
          ...(participants && { participants }),
          ...(name && { name }),
          ...(updatedAt && { updatedAt })
        } : prev);

        // Also update the selected conversation to reflect changes
        setSelectedConversation(prev => prev && prev._id === conversationId ? {
          ...prev,
          ...(participants && { participants }),
          ...(name && { name }),
          ...(updatedAt && { updatedAt })
        } : prev);

        // If we're editing the group name and it was updated, reset the edit state
        if (name && isEditingGroupName) {
          setIsEditingGroupName(false);
          setEditedGroupName('');
        }

        // If participants were updated, refresh conversation details to get full member information
        if (participants) {
          messagingService.getConversation(conversationId)
            .then(updatedDetails => {
              setConvDetails(updatedDetails);
              // Also update selected conversation with full details
              setSelectedConversation(prev => prev ? { ...prev, ...updatedDetails } : prev);

              // Check if current user is still a participant
              const isStillParticipant = (updatedDetails.participants || []).some(p => String(p._id || p) === String(userDetails?._id));
              if (!isStillParticipant) {
                // User is no longer a participant, redirect to conversation list
                setSelectedConversation(null);
                setMessages([]);
                updateURLWithConversation(null);
                showToast('You are no longer a participant in this conversation', 'info');
              }
            })
            .catch(console.error);
        }

        // If name was updated, also refresh conversation details to ensure consistency
        if (name) {
          messagingService.getConversation(conversationId)
            .then(updatedDetails => {
              setConvDetails(updatedDetails);
              // Also update selected conversation with full details
              setSelectedConversation(prev => prev ? { ...prev, ...updatedDetails } : prev);
            })
            .catch(console.error);
        }
      }

      // Set animation state for the updated conversation
      setRecentlyUpdatedConversation(conversationId);
      setTimeout(() => {
        setRecentlyUpdatedConversation(null);
      }, 1000);
    });

    // Global inbox updates for unread counts and ordering
    const offInbox = subscribe('chat.inbox.updated', (payload) => {
      const { data } = payload || {};
      const { conversationId, lastMessage, updatedAt, unreadCount } = data || {};
      if (!conversationId) return;
      // Ignore counting unread for messages sent by the current user
      if (lastMessage && (String(lastMessage.sender?._id || lastMessage.sender) === String(userDetails?._id))) {
        setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
        return;
      }
      // If server provided a concrete unreadCount (e.g., after markRead), honor it
      if (typeof unreadCount === 'number') {
        setUnreadCounts((prev) => ({ ...prev, [conversationId]: unreadCount }));
      } else {
        // Increment unread if conversation is not currently open
        setUnreadCounts((prev) => {
          const isActive = selectedConversation && selectedConversation._id === conversationId;
          if (isActive) return { ...prev, [conversationId]: 0 };
          const current = prev[conversationId] || 0;
          return { ...prev, [conversationId]: current + 1 };
        });
      }
      // Update preview and move to top in the sidebar list
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversationId);
        if (!exists) return prev;
        const updatedConv = {
          ...exists,
          lastMessagePreview: lastMessage?.text || (lastMessage?.type === 'image' ? '📷 Photo' : lastMessage?.type === 'video' ? '🎥 Video' : lastMessage?.type === 'system' ? lastMessage?.text : exists.lastMessagePreview),
          lastMessageTime: updatedAt || new Date().toISOString(),
          updatedAt: updatedAt || new Date().toISOString()
        };
        const others = prev.filter((c) => c._id !== conversationId);
        return [updatedConv, ...others];
      });
      // Nudge animation
      setRecentlyUpdatedConversation(conversationId);
      setTimeout(() => setRecentlyUpdatedConversation(null), 1000);
    });

    // Subscribe to organization member updates to refresh orgUsers list
    const offOrgMemberUpdated = subscribe('org.member.updated', (payload) => {
      const { data } = payload || {};
      if (!data || !data.organizationId || data.organizationId !== userDetails.organizationID) return;

      // Refresh organization users list when members are updated
      api.get(`/dashboard/${userDetails.organizationID}`).then(res => {
        const users = res.data?.members?.map(m => {
          const name = m.name || '';
          const parts = name.split(' ').filter(Boolean);
          let initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
          if (!initials) {
            const base = name || m.email || '';
            initials = base.slice(0, 2).toUpperCase();
          }
          return {
            _id: m.id,
            name,
            email: m.email,
            initials
          };
        }) || [];
        setOrgUsers(users);
      }).catch(() => { });
    });

    return () => {
      offConv && offConv();
      offConvDeleted && offConvDeleted();
      offConvUpdated && offConvUpdated();
      offOrgMemberUpdated && offOrgMemberUpdated();
      offInbox && offInbox();

      // Clear typing stop timer on component unmount
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
    };
  }, [userDetails]);

  // Handle URL query parameter changes and auto-select conversations
  useEffect(() => {
    if (!router.isReady || !conversations.length) return;

    const conversationId = getConversationFromURL();
    if (conversationId) {
      const success = selectConversationFromURL(conversationId);
      if (!success) {
        // If conversation not found, clear the URL and show error
        updateURLWithConversation(null);
        showToast('Conversation not found or you no longer have access', 'error');
      }
    }
  }, [router.isReady, router.query.conversationID, conversations]);

  // Handle browser back/forward button navigation
  useEffect(() => {
    const handlePopState = () => {
      // Clear typing indicator when navigating away
      if (selectedConversation && typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;

        // Emit typing stop event
        const socket = getSocket();
        if (socket) {
          socket.emit('chat.typing', {
            conversationId: selectedConversation._id,
            isTyping: false
          });
        }
      }

      const conversationId = getConversationFromURL();
      if (conversationId) {
        selectConversationFromURL(conversationId);
      } else {
        // URL cleared, go back to conversation list
        setSelectedConversation(null);
        setMessages([]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [conversations, selectedConversation]);

  // Handle page refresh and maintain conversation selection
  useEffect(() => {
    if (router.isReady && !selectedConversation) {
      const conversationId = getConversationFromURL();
      if (conversationId && conversations.length > 0) {
        // Small delay to ensure conversations are loaded
        const timer = setTimeout(() => {
          selectConversationFromURL(conversationId);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [router.isReady, conversations, selectedConversation]);

  // Select first conversation by default (only if no URL parameter)
  useEffect(() => {
    if (!selectedConversation && conversations && conversations.length > 0 && !getConversationFromURL()) {
      selectConversationWithCleanup(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Reset unread count and mark as read on server when opening a conversation
  useEffect(() => {
    if (selectedConversation?._id) {
      setUnreadCounts((prev) => ({ ...prev, [selectedConversation._id]: 0 }));
      // Mark as read on server (fire-and-forget)
      messagingService.markRead(selectedConversation._id).catch(() => { });
    }
  }, [selectedConversation?._id]);

  // Close mobile sidebar when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      setIsMobileSidebarOpen(false);
    }
  }, [selectedConversation]);

  // Handle page visibility changes to clear typing indicators
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && selectedConversation && typingStopTimerRef.current) {
        // Clear typing indicator when page becomes hidden
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;

        // Emit typing stop event
        const socket = getSocket();
        if (socket) {
          socket.emit('chat.typing', {
            conversationId: selectedConversation._id,
            isTyping: false
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedConversation]);

  // Handle router navigation to clear typing indicators
  useEffect(() => {
    const handleRouteChangeStart = () => {
      if (selectedConversation && typingStopTimerRef.current) {
        // Clear typing indicator when navigating away
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;

        // Emit typing stop event
        const socket = getSocket();
        if (socket) {
          socket.emit('chat.typing', {
            conversationId: selectedConversation._id,
            isTyping: false
          });
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    return () => router.events.off('routeChangeStart', handleRouteChangeStart);
  }, [selectedConversation, router]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target)) {
        setIsMembersOpen(false);
      }
      if (kebabMenuRef.current && !kebabMenuRef.current.contains(e.target)) {
        setShowKebabMenu(false);
      }
      if (editInputRef.current && !editInputRef.current.contains(e.target)) {
        handleCancelEditGroupName();
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;
    // Join conversation room
    try { getSocket().emit('conversation.join', { conversationId: selectedConversation._id }); } catch (_) { }
    setIsLoadingMessages(true);
    setMessagesPage(1);
    setHasMoreMessages(true);
    messagingService.getMessages(selectedConversation._id, 1, MESSAGES_PAGE_SIZE)
      .then((data) => {
        setMessages(data);
        setTimeout(scrollToBottom, 50);
        if (!data || data.length < MESSAGES_PAGE_SIZE) setHasMoreMessages(false);
      })
      .finally(() => setIsLoadingMessages(false));
    // Subscribe to chat events
    const offMsg = subscribe('chat.message.created', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;

      // Add new message to the current conversation
      setMessages((prev) => (prev.some((m) => m._id === data.message._id) ? prev : [...prev, data.message]));

      // Update conversation preview and move to top
      updateConversationPreview(selectedConversation._id, data.message);

      // Auto-scroll to bottom for new messages
      setTimeout(scrollToBottom, 50);

      // If it's a system message about member changes, refresh conversation details
      if (data.message.type === 'system' && (
        data.message.text.includes('added to the group') ||
        data.message.text.includes('removed from the group') ||
        data.message.text.includes('left the group')
      )) {
        // Refresh conversation details to show updated participant list
        messagingService.getConversation(selectedConversation._id)
          .then(updatedDetails => {
            setConvDetails(updatedDetails);
            // Also update the selected conversation to reflect new participants
            setSelectedConversation(prev => prev ? { ...prev, participants: updatedDetails.participants } : prev);
          })
          .catch(console.error);
      }
    });
    // Reaction and other message updates (e.g., edits)
    const offMsgUpdated = subscribe('chat.message.updated', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;
      const updatedMsg = data.message;
      if (!updatedMsg?._id) return;
      setMessages((prev) => prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)));
    });
    // Read receipt updates from others
    const offRead = subscribe('chat.messages.read', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;
      // Optionally force refresh read state if needed in future
    });
    const offTyping = subscribe('chat.typing', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;
      const { userId, isTyping } = data;
      if (!userId || userId === userDetails?._id) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        if (isTyping) {
          next[userId] = true;
        } else {
          delete next[userId];
        }
        return next;
      });
      if (isTyping) {
        if (typingTimersRef.current[userId]) clearTimeout(typingTimersRef.current[userId]);
        typingTimersRef.current[userId] = setTimeout(() => {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          delete typingTimersRef.current[userId];
        }, 2000);
      }
    });

    // Call-related subscriptions
    const offCallIncoming = subscribe('call.incoming', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;

      setCallData(data);
      setCallType('incoming');
      setShowIncomingCallScreen(true); // Show small screen first
    });

    const offCallAnswered = subscribe('call.answered', (payload) => {
      const { data } = payload || {};
      // console.log('🔔 call.answered event received:', payload);
      if (!data || data.conversationId !== selectedConversation._id) return;

      // Store the answer data for the caller to process
      if (data.answer) {
        // console.log('Storing answer data for caller:', data.answer);
        setAnswerData(data.answer);
        // Don't change callType yet - let VideoCallModal process the answer
      } else {
        // console.log('No answer data in call.answered event');
        // If no answer data, update UI state
        setCallType('active');
      }
    });

    const offCallDeclined = subscribe('call.declined', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;

      // Handle call declined - close modal and show notification
      setShowVideoCallModal(false);
      setShowIncomingCallScreen(false);
      setCallType(null);
      setCallData(null);
      showToast('Call was declined', 'info');
    });

    const offCallEnded = subscribe('call.ended', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;

      // Handle call ended - close modal and show notification
      setShowVideoCallModal(false);
      setShowIncomingCallScreen(false);
      setCallType(null);
      setCallData(null);
      setActiveCall(null);
    });

    const offCallIceCandidate = subscribe('call.ice-candidate', (payload) => {
      const { data } = payload || {};
      if (!data || data.conversationId !== selectedConversation._id) return;

      // Handle ICE candidate for WebRTC
      if (activeCall && activeCall.peerConnection) {
        activeCall.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(console.error);
      }
    });

    return () => {
      offMsg && offMsg();
      offMsgUpdated && offMsgUpdated();
      offRead && offRead();
      offTyping && offTyping();
      offCallIncoming && offCallIncoming();
      offCallAnswered && offCallAnswered();
      offCallDeclined && offCallDeclined();
      offCallEnded && offCallEnded();
      offCallIceCandidate && offCallIceCandidate();
      try { getSocket().emit('conversation.leave', { conversationId: selectedConversation._id }); } catch (_) { }
      setTypingUsers({});
      try {
        Object.values(typingTimersRef.current || {}).forEach((t) => clearTimeout(t));
      } catch (_) { }
      typingTimersRef.current = {};

      // Clear typing stop timer
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
    };
  }, [selectedConversation?._id]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to update conversation preview and move to top
  const updateConversationPreview = (conversationId, message) => {
    setConversations(prev => {
      let updatedConv = null;
      const otherConvs = prev.filter(conv => {
        if (conv._id === conversationId) {
          let preview = '';
          if (message.type === 'text') {
            preview = message.text;
          } else if (message.type === 'image') {
            preview = '📷 Photo';
          } else if (message.type === 'video') {
            preview = '🎥 Video';
          } else if (message.type === 'voice') {
            preview = '🎤 Voice Message';
          } else if (message.type === 'system') {
            preview = message.text;
          }

          updatedConv = {
            ...conv,
            lastMessagePreview: preview,
            lastMessageTime: message.createdAt || new Date().toISOString(),
            updatedAt: message.createdAt || new Date().toISOString()
          };
          return false; // Remove from this position
        }
        return true; // Keep other conversations
      });

      // Return with updated conversation at the top
      return updatedConv ? [updatedConv, ...otherConvs] : prev;
    });

    // Set animation state
    setRecentlyUpdatedConversation(conversationId);
    setTimeout(() => {
      setRecentlyUpdatedConversation(null);
    }, 1000); // Clear animation after 1 second
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation) return;

    // Clear typing indicator when sending message
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    // Emit typing stop event
    if (selectedConversation) {
      const socket = getSocket();
      if (socket) {
        socket.emit('chat.typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        });
      }
    }

    setIsSending(true);
    try {
      // If the user is no longer a participant, block locally with a toast
      const isMember = (selectedConversation.participants || []).some(p => String(p._id || p) === String(userDetails?._id));
      if (!isMember) {
        showToast('You are no longer a participant in this conversation', 'error');
        setIsSending(false);
        return;
      }
      setInput('');

      // Clear typing indicator when input is cleared
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }

      // Emit typing stop event when input is cleared
      if (selectedConversation) {
        const socket = getSocket();
        if (socket) {
          socket.emit('chat.typing', {
            conversationId: selectedConversation._id,
            isTyping: false
          });
        }
      }

      setTimeout(scrollToBottom, 50);
      const msg = await messagingService.sendMessage(selectedConversation._id, { type: 'text', text: input.trim() });
      // setMessages((prev) => [...prev, msg]);
      updateConversationPreview(selectedConversation._id, msg);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSending(false);
    }
  };

  const typingStopTimerRef = useRef(null);
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Check for @ symbol to show mentions
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && selectedConversation?.isGroup) {
      // Stop mention mode if a whitespace occurs immediately after '@'
      const after = value.substring(atIndex + 1);
      const stop = after.length === 0 ? false : /\s/.test(after[0]);
      const query = stop ? '' : after;
      setMentionQuery(query);
      setMentionPosition(atIndex);
      setSelectedMentionIndex(0); // Reset selection when showing mentions

      // Filter members based on query (fallback to selectedConversation participants if convDetails not loaded)
      const participantsSrc = (convDetails?.participants || selectedConversation?.participants || []);
      if (participantsSrc && Array.isArray(participantsSrc)) {
        const filtered = participantsSrc.filter(member => {
          const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim().toLowerCase();
          return (!query || memberName.includes(query.toLowerCase())) && String(member._id) !== String(userDetails?._id);
        });
        setFilteredMembers(filtered);
        setShowMentions(!stop && filtered.length > 0);
      }
    } else {
      setShowMentions(false);
    }

    // Emit typing event
    if (selectedConversation) {
      const socket = getSocket();
      if (socket) {
        // Clear existing typing stop timer
        if (typingStopTimerRef.current) {
          clearTimeout(typingStopTimerRef.current);
        }

        // If input is empty, emit typing stop event immediately
        if (!value.trim()) {
          socket.emit('chat.typing', {
            conversationId: selectedConversation._id,
            isTyping: false
          });
          typingStopTimerRef.current = null;
          return;
        }

        // Emit typing start event
        socket.emit('chat.typing', {
          conversationId: selectedConversation._id,
          isTyping: true
        });

        // Set timer to emit typing stop event after 2 seconds of inactivity
        typingStopTimerRef.current = setTimeout(() => {
          socket.emit('chat.typing', {
            conversationId: selectedConversation._id,
            isTyping: false
          });
          typingStopTimerRef.current = null;
        }, 2000);

        // Also set a longer timeout to ensure typing indicator is cleared even if the 2-second timer fails
        setTimeout(() => {
          if (typingStopTimerRef.current) {
            clearTimeout(typingStopTimerRef.current);
            typingStopTimerRef.current = null;
            socket.emit('chat.typing', {
              conversationId: selectedConversation._id,
              isTyping: false
            });
          }
        }, 10000); // 10 seconds as a fallback
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // If mentions are shown, select the highlighted mention
      if (showMentions && filteredMembers.length > 0) {
        handleMentionSelect(filteredMembers[selectedMentionIndex]);
        return;
      }

      handleSend();
    }

    // Handle arrow keys for mention navigation
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        setMentionQuery('');

        // Clear input and typing indicator when Escape is pressed
        setInput('');
        if (typingStopTimerRef.current) {
          clearTimeout(typingStopTimerRef.current);
          typingStopTimerRef.current = null;
        }

        // Emit typing stop event
        if (selectedConversation) {
          const socket = getSocket();
          if (socket) {
            socket.emit('chat.typing', {
              conversationId: selectedConversation._id,
              isTyping: false
            });
          }
        }
      }
    }
  };

  const handleUpload = async (file) => {
    if (!file || !selectedConversation) return;
    setIsSending(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('filename', file.name);
      const res = await messagingService.uploadChatMedia(form);
      const mediaUrl = res?.url || res?.attachment?.FileURL || '';
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const msg = await messagingService.sendMessage(selectedConversation._id, { type, mediaUrl });
      // setMessages((prev) => prev.map(m => m._id === tempId ? msg : m));
      updateConversationPreview(selectedConversation._id, msg);
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      console.error('Failed to upload file:', e);
    } finally {
      setIsSending(false);
    }
  };

  // handleVoiceMessage removed

  // Load older messages via button
  const handleLoadMore = async () => {
    if (!hasMoreMessages || isFetchingMore || !selectedConversation) return;
    const el = messagesContainerRef.current;
    const prevHeight = el ? el.scrollHeight : 0;
    const nextPage = messagesPage + 1;
    setIsFetchingMore(true);
    try {
      const older = await messagingService.getMessages(selectedConversation._id, nextPage, MESSAGES_PAGE_SIZE);
      if (older && older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
        setMessagesPage(nextPage);
        setTimeout(() => {
          const newHeight = el ? el.scrollHeight : 0;
          if (el) el.scrollTop = newHeight - prevHeight;
        }, 0);
        if (older.length < MESSAGES_PAGE_SIZE) setHasMoreMessages(false);
      } else {
        setHasMoreMessages(false);
      }
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    const updated = await messagingService.react(messageId, emoji);
    setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
  };

  // Call handling functions
  const handleInitiateCall = (conversationId, recipientId, recipientName) => {
    if (!conversationId || !recipientId) return;

    setCallData({
      conversationId,
      callerId: userDetails._id,
      recipientId: recipientId,
      callerName: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
      recipientName: recipientName || '',
      type: 'video'
    });
    setCallType('outgoing');
    setShowVideoCallModal(true);
  };

  const handleCallAnswer = (peerConnection) => {
    setActiveCall({ peerConnection });
    setCallType('active');
  };

  // Handle when outgoing call is successfully answered
  const handleOutgoingCallAnswered = () => {
    // console.log('Outgoing call successfully answered, changing callType to active');
    setCallType('active');
  };

  const handleCallEnd = () => {
    setShowVideoCallModal(false);
    setShowIncomingCallScreen(false);
    setCallType(null);
    setCallData(null);
    setActiveCall(null);
    setAnswerData(null); // Clear answer data
  };

  const handleCallDecline = () => {
    setShowVideoCallModal(false);
    setShowIncomingCallScreen(false);
    setCallType(null);
    setCallData(null);
    setAnswerData(null); // Clear answer data
  };

  // Handle answer from small incoming call screen
  const handleIncomingCallAnswer = () => {
    setShowIncomingCallScreen(false);
    setModalInitialAction('answer');
    setShowVideoCallModal(true);
  };

  // Handle decline from small incoming call screen
  const handleIncomingCallDecline = () => {
    setShowIncomingCallScreen(false);
    setModalInitialAction('decline');
    setShowVideoCallModal(true);
  };

  // Handle close from small incoming call screen
  const handleIncomingCallClose = () => {
    setShowIncomingCallScreen(false);
  };

  // Notify user if they're not in the chat
  const notifyUserNotInChat = (recipientName) => {
    showToast(`${recipientName} is not currently in the chat`, 'info');
  };

  // Helper function to send system messages
  const sendSystemMessage = async (conversationId, text) => {
    try {
      const systemMessage = await messagingService.sendMessage(conversationId, {
        type: 'system',
        text: text
      });
      setMessages((prev) => [...prev, systemMessage]);
      updateConversationPreview(conversationId, systemMessage);
      return systemMessage;
    } catch (error) {
      console.error('Failed to send system message:', error);
    }
  };

  const handleEditGroupName = () => {
    setEditedGroupName(convDetails?.name || '');
    setIsEditingGroupName(true);
  };

  const handleSaveGroupName = async () => {
    if (!editedGroupName.trim() || !selectedConversation) return;

    setIsSavingGroupName(true);
    try {
      // Update conversation name via API - real-time events will handle UI updates
      await api.patch(`/messages/conversations/${selectedConversation._id}`, {
        name: editedGroupName.trim()
      });

      // Send system message about the name change
      await sendSystemMessage(selectedConversation._id, `Group name changed to "${editedGroupName.trim()}"`);

      setIsEditingGroupName(false);
      showToast('Group name updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update group name:', error);
      showToast('Failed to update group name', 'error');
    } finally {
      setIsSavingGroupName(false);
    }
  };

  const handleCancelEditGroupName = () => {
    setIsEditingGroupName(false);
    setEditedGroupName('');
  };

  const handleOpenDetails = async () => {
    setShowDetails(true);
    setIsDetailsAnimating(true);
    // Start with panel off-screen, then slide in
    setTimeout(() => {
      setIsDetailsAnimating(false);
    }, 50);
    const det = await messagingService.getConversation(selectedConversation._id);
    setConvDetails(det);

    if (!det.isGroup && activeDetailsTab === 'details') {
      setActiveDetailsTab('files');
    }

    const assets = await messagingService.getAssets(selectedConversation._id);
    setConvAssets(assets);
  };

  const handleCloseDetails = () => {
    setIsDetailsAnimating(true);
    // Trigger slide-out animation, then hide panel
    setTimeout(() => {
      setShowDetails(false);
      setIsDetailsAnimating(false);
    }, 300); // Match animation duration
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setMessages([]);
    updateURLWithConversation(null);
  };

  // Function to navigate to a specific conversation (for external use)
  const navigateToConversation = (conversationId) => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        selectConversationWithCleanup(conversation);
        return true;
      }
    }
    return false;
  };

  // Function to copy conversation link to clipboard
  const copyConversationLink = async () => {
    if (!selectedConversation) return;

    const conversationUrl = `${window.location.origin}/messages?conversationID=${selectedConversation._id}`;

    try {
      await navigator.clipboard.writeText(conversationUrl);
      showToast('Conversation link copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showToast('Failed to copy link', 'error');
    }
  };

  // Function to open conversation in new tab
  const openConversationInNewTab = () => {
    if (!selectedConversation) return;

    const conversationUrl = `${window.location.origin}/messages?conversationID=${selectedConversation._id}`;
    window.open(conversationUrl, '_blank');
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !selectedConversation.isGroup) return;

    setIsDeleting(true);
    try {
      // Delete the conversation (this should handle messages and members deletion on the backend)
      await messagingService.deleteConversation(selectedConversation._id);

      // Remove from conversations list
      setConversations((prev) => prev.filter(c => c._id !== selectedConversation._id));

      // Clear selected conversation
      setSelectedConversation(null);
      setMessages([]);
      updateURLWithConversation(null);

      // Close dialogs
      setShowDeleteDialog(false);
      setShowKebabMenu(false);

      // Show success toast
      showToast('Group deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      showToast('Failed to delete group', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedConversation || !selectedConversation.isGroup) return;

    setIsLeaving(true);
    try {
      await messagingService.leaveConversation(selectedConversation._id);

      // Send system message to DB about leaving
      const userName = `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim();
      await sendSystemMessage(selectedConversation._id, `${userName} left the group`);
      // Clear URL since user is no longer in this conversation
      updateURLWithConversation(null);

      // Show success toast
      showToast('You have left the group', 'success');

      setShowKebabMenu(false);
    } catch (error) {
      console.error('Failed to leave group:', error);
      showToast('Failed to leave group', 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!selectedConversation || !convDetails) return;

    try {
      const updated = await messagingService.removeMembers(selectedConversation._id, [memberId]);
      setConvDetails(updated);

      // Refresh conversations list
      const list = await messagingService.getConversations();
      setConversations(list);

      // Send system message to DB
      await sendSystemMessage(selectedConversation._id, `${memberName} has been removed from the group`);

      // Check if current user was removed
      if (String(memberId) === String(userDetails?._id)) {
        setSelectedConversation(null);
        setMessages([]);
        updateURLWithConversation(null);
        showToast('You have been removed from the group', 'info');
      } else {
        // Show success toast
        showToast(`${memberName} has been removed from the group`, 'success');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      showToast('Failed to remove member from group', 'error');
    }
  };

  const bg = theme === 'dark' ? 'bg-dark-bg text-white' : 'bg-white text-gray-900';

  const handleMentionSelect = (member) => {
    const beforeMention = input.substring(0, mentionPosition);
    const afterMention = input.substring(mentionPosition + mentionQuery.length + 1); // +1 for @
    const label = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    const mentionToken = `@${label.replace(/\s+/g, '_')}`;
    const newInput = `${beforeMention}${mentionToken} ${afterMention}`;
    setInput(newInput);
    setShowMentions(false);
    setMentionQuery('');
    // Focus back to input
    if (messageInputRef.current) {
      messageInputRef.current.focus();
      const newPosition = (beforeMention + mentionToken + ' ').length;
      messageInputRef.current.setSelectionRange(newPosition, newPosition);
    }
  };

  // Handle clicking outside mention dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showMentions) return;
      const inDropdown = mentionDropdownRef.current && mentionDropdownRef.current.contains(event.target);
      const inInput = messageInputRef.current && event.target === messageInputRef.current;
      if (!inDropdown && !inInput) {
        setShowMentions(false);
        setMentionQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentions]);

  // Handle clicking outside share menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showShareMenu) return;
      const inMenu = shareMenuRef.current && shareMenuRef.current.contains(event.target);
      if (!inMenu) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  // Ensure convDetails is available for mentions (use current selection as base)
  useEffect(() => {
    if (selectedConversation) {
      setConvDetails((prev) => {
        if (!prev || String(prev._id) !== String(selectedConversation._id)) return selectedConversation;
        return prev;
      });
    }
  }, [selectedConversation?._id]);

  return (
    <>
      <Head>
        <title>Messages - TeamLabs</title>
      </Head>

      <div className="mx-auto">
        <div className={`flex h-[calc(111.11vh-64px)] ${bg} relative`}>
          {/* Mobile Overlay */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          <ChatSidebar
            theme={theme}
            isMobileSidebarOpen={isMobileSidebarOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setShowNewConversation={setShowNewConversation}
            isLoadingConversations={isLoadingConversations}
            filteredConversations={filteredConversations}
            unreadCounts={unreadCounts}
            recentlyUpdatedConversation={recentlyUpdatedConversation}
            selectConversationWithCleanup={selectConversationWithCleanup}
            selectedConversation={selectedConversation}
            formatTimeAgo={formatTimeAgo}
            userDetails={userDetails}
          />
          <section className="flex-1 flex flex-col h-full w-full lg:w-auto">
            {selectedConversation ? (
              <>
                {isLoadingMessages ? (
                  <ChatHeaderSkeleton theme={theme} />
                ) : (
                  <ChatHeader
                    theme={theme}
                    isLoadingMessages={isLoadingMessages}
                    setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                    handleOpenDetails={handleOpenDetails}
                    selectedConversation={selectedConversation}
                    userDetails={userDetails}
                    setShowVideoCallModal={setShowVideoCallModal}
                    showKebabMenu={showKebabMenu}
                    setShowKebabMenu={setShowKebabMenu}
                    kebabMenuRef={kebabMenuRef}
                    handleLeaveGroup={handleLeaveGroup}
                    setShowDeleteDialog={setShowDeleteDialog}
                    showToast={showToast}
                  />
                )}
                {isLoadingMessages ? (
                  <MessagesAreaSkeleton theme={theme} />
                ) : (
                  <MessageList
                    theme={theme}
                    messages={messages}
                    userDetails={userDetails}
                    selectedConversation={selectedConversation}
                    messagesContainerRef={messagesContainerRef}
                    bottomRef={bottomRef}
                    hasMoreMessages={hasMoreMessages}
                    handleLoadMore={handleLoadMore}
                    isFetchingMore={isFetchingMore}
                    formatTimeAgo={formatTimeAgo}
                    renderMessageText={renderMessageText}
                    handleReaction={handleReaction}
                  />
                )}
                {/* Typing Indicator - positioned at bottom of message area, above footer */}
                {Object.keys(typingUsers).length > 0 && (
                  <div className={`px-2 lg:px-3 mx-2 lg:mx-3 mb-2 text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="text-xs">{Object.keys(typingUsers).map((userId) => {
                      // Try to find user in conversation participants first, then fallback to orgUsers
                      const participant = (convDetails?.participants || selectedConversation?.participants || []).find(p => String(p._id) === String(userId));
                      if (participant) {
                        return `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || 'Someone';
                      }
                      // Fallback to orgUsers if participant not found
                      const orgUser = orgUsers.find((u) => String(u._id) === String(userId));
                      return orgUser ? orgUser.name : 'Someone';
                    }).join(', ')} is typing</div>
                  </div>
                )}
                {isLoadingMessages ? (
                  <ChatFooterSkeleton theme={theme} />
                ) : (
                  <MessageInput
                    theme={theme}
                    selectedConversation={selectedConversation}
                    userDetails={userDetails}
                    input={input}
                    handleInputChange={handleInputChange}
                    handleKeyDown={handleKeyDown}
                    handleSend={handleSend}
                    handleUpload={handleUpload}
                    isSending={isSending}
                    showMentions={showMentions}
                    mentionDropdownRef={mentionDropdownRef}
                    filteredMembers={filteredMembers}
                    handleMentionSelect={handleMentionSelect}
                    selectedMentionIndex={selectedMentionIndex}
                    messageInputRef={messageInputRef}
                    typingStopTimerRef={typingStopTimerRef}
                    getSocket={getSocket}
                  />
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center opacity-70 text-sm">Select a conversation</div>
            )}
            <NewConversationModal
              showNewConversation={showNewConversation}
              setShowNewConversation={setShowNewConversation}
              theme={theme}
              conversationType={conversationType}
              setConversationType={setConversationType}
              orgUsers={orgUsers}
              userDetails={userDetails}
              selectedDmUser={selectedDmUser}
              setSelectedDmUser={setSelectedDmUser}
              groupName={groupName}
              setGroupName={setGroupName}
              groupAvatar={groupAvatar}
              setGroupAvatar={setGroupAvatar}
              groupMembers={groupMembers}
              setGroupMembers={setGroupMembers}
              isMembersOpen={isMembersOpen}
              setIsMembersOpen={setIsMembersOpen}
              memberQuery={memberQuery}
              setMemberQuery={setMemberQuery}
              memberDropdownRef={memberDropdownRef}
              setConversations={setConversations}
              selectConversationWithCleanup={selectConversationWithCleanup}
            />
          </section>

          <ChatDetails
            theme={theme}
            showDetails={showDetails}
            isDetailsAnimating={isDetailsAnimating}
            handleCloseDetails={handleCloseDetails}
            convDetails={convDetails}
            userDetails={userDetails}
            isEditingGroupName={isEditingGroupName}
            editInputRef={editInputRef}
            editedGroupName={editedGroupName}
            setEditedGroupName={setEditedGroupName}
            handleSaveGroupName={handleSaveGroupName}
            handleCancelEditGroupName={handleCancelEditGroupName}
            isSavingGroupName={isSavingGroupName}
            handleEditGroupName={handleEditGroupName}
            activeDetailsTab={activeDetailsTab}
            setActiveDetailsTab={setActiveDetailsTab}
            handleRemoveMember={handleRemoveMember}
            orgUsers={orgUsers}
            showToast={showToast}
            selectedConversation={selectedConversation}
            convAssets={convAssets}
          />
        </div>

        <DeleteConversationModal
          showDeleteDialog={showDeleteDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          theme={theme}
          selectedConversation={selectedConversation}
          isDeleting={isDeleting}
          handleDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Small incoming call screen */}
      <IncomingCallScreen
        isVisible={showIncomingCallScreen && callType === 'incoming'}
        callData={callData}
        onAnswer={handleIncomingCallAnswer}
        onDecline={handleIncomingCallDecline}
        onClose={handleIncomingCallClose}
      />

      {/* Full video call modal */}
      <VideoCallModal
        isOpen={showVideoCallModal}
        onClose={() => { setShowVideoCallModal(false); setModalInitialAction(null); }}
        callType={callType}
        callData={callData}
        onAnswer={handleCallAnswer}
        onDecline={handleCallDecline}
        onEnd={handleCallEnd}
        currentUser={userDetails}
        answerData={answerData}
        onOutgoingCallAnswered={handleOutgoingCallAnswered}
        initialAction={modalInitialAction}
      />
    </>
  );
}