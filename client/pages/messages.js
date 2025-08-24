import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api, { messagingService } from '../services/api';
import { connectSocket, getSocket, subscribe } from '../services/socket';
import { FaPaperPlane, FaPlus, FaSmile, FaImage, FaVideo, FaChevronDown, FaCheck, FaTimes, FaSearch, FaEllipsisV, FaCog, FaTrash, FaSignOutAlt, FaEdit, FaSave, FaPhone } from 'react-icons/fa';
import VideoCallModal from '../components/messages/VideoCallModal';
import IncomingCallScreen from '../components/messages/IncomingCallScreen';
import {
  ConversationSkeleton,
  MessageSkeleton,
  ConversationsListSkeleton,
  ChatHeaderSkeleton,
  MessagesAreaSkeleton,
  ChatFooterSkeleton
} from '../components/skeletons/MessageSkeletons';

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
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
  const [orgDetails, setOrgDetails] = useState(null);
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

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return messageDate.toLocaleDateString();
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
    if (conversationType === 'group' && user && orgUsers.length > 0) {
      // Find current user in orgUsers
      const currentUser = orgUsers.find(u => String(u._id) === String(user._id));
      if (currentUser && !groupMembers.some(m => String(m._id) === String(currentUser._id))) {
        setGroupMembers(prev => [...prev, currentUser]);
      }
    }
  }, [conversationType, user, orgUsers, groupMembers]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    if (!user) return conversations;

    const query = searchQuery.toLowerCase().trim();
    return conversations.filter(conversation => {
      // For group chats, search in group name
      if (conversation.isGroup) {
        const groupName = conversation.name || 'Group';
        if (groupName.toLowerCase().includes(query)) return true;
      } else {
        // For direct messages, search in participant names
        const participantNames = conversation.participants
          ?.filter(p => p._id !== user?._id)
          ?.map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim())
          ?.join(' ') || '';

        if (participantNames.toLowerCase().includes(query)) return true;
      }

      // Search in last message preview
      if (conversation.lastMessagePreview?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [conversations, searchQuery, user?._id]);

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
    if (!user) return;
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
    api.get(`/dashboard/${user.organizationID}`).then(res => {
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
      const isParticipant = (convo.participants || []).some(p => String(p._id || p) === String(user?._id));
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
              const isStillParticipant = (updatedDetails.participants || []).some(p => String(p._id || p) === String(user?._id));
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
      if (lastMessage && (String(lastMessage.sender?._id || lastMessage.sender) === String(user?._id))) {
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
      if (!data || !data.organizationId || data.organizationId !== user.organizationID) return;

      // Refresh organization users list when members are updated
      api.get(`/dashboard/${user.organizationID}`).then(res => {
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
  }, [user]);

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
      if (!userId || userId === user?._id) return;
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
      const isMember = (selectedConversation.participants || []).some(p => String(p._id || p) === String(user?._id));
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
          return (!query || memberName.includes(query.toLowerCase())) && String(member._id) !== String(user?._id);
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
      callerId: user._id,
      recipientId: recipientId,
      callerName: `${user.firstName} ${user.lastName}`.trim(),
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
      const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
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
      if (String(memberId) === String(user?._id)) {
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

  const bg = theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900';
  const panel = theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900';

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
        <div className={`flex h-[calc(100vh-82px)] ${bg} relative`}>
          {/* Mobile Overlay */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          <aside className={`w-80 border-r ${theme === 'dark' ? 'bg-transparent border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-200 text-gray-900'} p-3 overflow-y-auto transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static top-0 left-0 h-full z-50 lg:z-auto lg:w-80`}>
            <div className="flex items-center justify-between mb-3">
              {/* Search Input */}
              <div className="relative">
                <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={14} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              <button
                className={`p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-colors flex items-center gap-1 lg:gap-2 text-sm lg:text-base touch-manipulation ${theme === 'dark' ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : ''}`}
                onClick={() => setShowNewConversation(true)}
              >
                <FaPlus size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {isLoadingConversations ? (
                <ConversationsListSkeleton theme={theme} />
              ) : (
                <>
                  {/* Group Chats Section */}
                  {filteredConversations.filter(c => c.isGroup).length > 0 && (
                    <div>
                      <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Group Chats
                        {(() => {
                          const groupUnreadCount = filteredConversations
                            .filter(c => c.isGroup)
                            .reduce((sum, c) => sum + (unreadCounts[c._id] || 0), 0);
                          return groupUnreadCount > 0 ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                              {groupUnreadCount}
                            </span>
                          ) : null;
                        })()}
                      </h3>
                      <div className="space-y-2 transition-all duration-300 ease-in-out">
                        {filteredConversations.filter(c => c.isGroup).map((c) => {
                          const displayName = c.name || 'Group';
                          const parts = (c.name || '').split(' ').filter(Boolean);
                          const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'GR';
                          const isRecentlyUpdated = recentlyUpdatedConversation === c._id;
                          return (
                            <button key={c._id} onClick={() => selectConversationWithCleanup(c)} className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-all duration-500 ease-in-out transform ${isRecentlyUpdated ? 'animate-pulse scale-[1.02] shadow-lg' : 'scale-100'} ${selectedConversation?._id === c._id ? `${theme === 'dark' ? 'bg-blue-900 text-blue-200 border border-blue-600' : 'bg-blue-50 text-blue-700 border border-blue-300'}` : ''} ${panel} ${isRecentlyUpdated ? (theme === 'dark' ? 'bg-green-900/20 border border-green-500/30' : 'bg-green-50 border border-green-200') : ''}`}>
                              {c.avatarUrl ? (
                                <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{initials}</div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate flex items-center gap-2">
                                  <span className="truncate">{displayName}</span>
                                  {(unreadCounts[c._id] > 0) && (
                                    <span className={`ml-auto whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                                      {unreadCounts[c._id]} unread
                                    </span>
                                  )}
                                </div>
                                <div className={`text-sm opacity-70 truncate transition-all duration-300 ${isRecentlyUpdated ? (theme === 'dark' ? 'text-green-400 font-medium' : 'text-green-600 font-medium') : ''}`}>{c.lastMessagePreview}</div>
                              </div>
                              <div className="text-xs opacity-50 flex-shrink-0">
                                {formatTimeAgo(c.lastMessageTime || c.updatedAt || c.createdAt)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Direct Messages Section */}
                  {filteredConversations.filter(c => !c.isGroup).length > 0 && (
                    <div>
                      <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Direct Messages
                        {(() => {
                          const dmUnreadCount = filteredConversations
                            .filter(c => !c.isGroup)
                            .reduce((sum, c) => sum + (unreadCounts[c._id] || 0), 0);
                          return dmUnreadCount > 0 ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                              {dmUnreadCount}
                            </span>
                          ) : null;
                        })()}
                      </h3>
                      <div className="space-y-2 transition-all duration-300 ease-in-out">
                        {filteredConversations.filter(c => !c.isGroup).map((c) => {
                          const displayName = c.participants?.filter(p => p._id !== user?._id).map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'Direct';
                          const other = c.participants?.find(p => p._id !== user?._id);
                          const parts = `${other?.firstName || ''} ${other?.lastName || ''}`.trim().split(' ').filter(Boolean);
                          const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
                          const isRecentlyUpdated = recentlyUpdatedConversation === c._id;
                          return (
                            <button key={c._id} onClick={() => selectConversationWithCleanup(c)} className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-all duration-500 ease-in-out transform ${isRecentlyUpdated ? 'animate-pulse scale-[1.02] shadow-lg' : 'scale-100'} ${selectedConversation?._id === c._id ? `${theme === 'dark' ? 'bg-blue-900 text-blue-200 border border-blue-600' : 'bg-blue-50 text-blue-700 border border-blue-300'}` : ''} ${panel} ${isRecentlyUpdated ? (theme === 'dark' ? 'bg-green-900/20 border border-green-500/30' : 'bg-green-50 border border-green-200') : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{initials}</div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate flex items-center gap-2">
                                  <span className="truncate">{displayName}</span>
                                  {(unreadCounts[c._id] > 0) && (
                                    <span className={`ml-auto whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                                      {unreadCounts[c._id]} unread
                                    </span>
                                  )}
                                </div>
                                <div className={`text-sm opacity-70 truncate transition-all duration-300 ${isRecentlyUpdated ? (theme === 'dark' ? 'text-green-400 font-medium' : 'text-green-600 font-medium') : ''}`}>{c.lastMessagePreview}</div>
                              </div>
                              <div className="text-xs opacity-50 flex-shrink-0">
                                {formatTimeAgo(c.lastMessageTime || c.updatedAt || c.createdAt)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No conversations message */}
                  {filteredConversations.length === 0 && (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchQuery.trim() ? (
                        <>
                          <p className="text-sm">No conversations found</p>
                          <p className="text-xs mt-1">Try adjusting your search terms</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">No conversations yet</p>
                          <p className="text-xs mt-1">Start a new conversation to begin chatting</p>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
          <section className="flex-1 flex flex-col h-full w-full lg:w-auto">
            {selectedConversation ? (
              <>
                {isLoadingMessages ? (
                  <ChatHeaderSkeleton theme={theme} />
                ) : (
                  <header className={`p-3 border-b ${theme === 'dark' ? 'bg-transparent border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-200 text-gray-900'} flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                      {/* Mobile Menu Button */}
                      <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className={`lg:hidden p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} mr-3`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <button onClick={handleOpenDetails} className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-3">
                          {selectedConversation.isGroup && selectedConversation.avatarUrl ? (
                            <img src={selectedConversation.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
                              {(() => {
                                const isGroup = selectedConversation.isGroup;
                                if (!isGroup) {
                                  const other = selectedConversation.participants?.find(p => p._id !== user?._id);
                                  const parts = `${other?.firstName || ''} ${other?.lastName || ''}`.trim().split(' ').filter(Boolean);
                                  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
                                }
                                const parts = (selectedConversation.name || '').split(' ').filter(Boolean);
                                return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'GR';
                              })()}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-base lg:text-lg hover:underline transition-all duration-200 truncate block">
                              {selectedConversation.isGroup ? (selectedConversation.name || 'Group') : (selectedConversation.participants?.filter(p => p._id !== user?._id).map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'Direct')}
                            </span>
                            {/* Group members initials display */}
                            {selectedConversation.isGroup && selectedConversation.participants && (
                              <div className="flex items-center gap-1">
                                {selectedConversation.participants.slice(0, 3).map((member, idx) => {
                                  const initials = `${(member.firstName || '')[0] || ''}${(member.lastName || '')[0] || ''}`.toUpperCase() || 'U';
                                  return (
                                    <div
                                      key={member._id}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200 border border-gray-600' : 'bg-blue-600 text-white border border-white'} shadow-sm`}
                                      style={{ marginLeft: idx === 0 ? '0' : '-8px' }}
                                      title={`${member.firstName || ''} ${member.lastName || ''}`.trim()}
                                    >
                                      {member.profileImage ? (
                                        <img
                                          src={member.profileImage}
                                          alt={`${member.firstName} ${member.lastName}`}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      ) : (
                                        <span>{initials}</span>
                                      )}
                                    </div>
                                  );
                                })}
                                {selectedConversation.participants.length > 3 && (
                                  <div
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-white'} shadow-sm`}
                                    style={{ marginLeft: '-8px' }}
                                    title={`${selectedConversation.participants.length - 3} more members`}
                                  >
                                    +{selectedConversation.participants.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      {/* Call Button - Only show for direct messages */}
                      {!selectedConversation.isGroup && (
                        <button
                          onClick={() => {
                            const other = selectedConversation.participants?.find(p => p._id !== user?._id);
                            if (other) {
                              handleInitiateCall(
                                selectedConversation._id,
                                other._id,
                                `${other.firstName} ${other.lastName}`.trim()
                              );
                            }
                          }}
                          className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark'
                              ? 'text-green-400 hover:bg-gray-700 hover:text-green-400'
                              : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                            }`}
                          title="Start video call"
                        >
                          <FaVideo size={16} />
                        </button>
                      )}
                      
                      {/* Share Button */}
                      <button
                        onClick={copyConversationLink}
                        className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark'
                            ? 'text-blue-400 hover:bg-gray-700 hover:text-blue-300'
                            : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        title="Copy conversation link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        </button>


                      {/* Kebab Menu */}
                      <div className="relative" ref={kebabMenuRef}>
                        <button
                          onClick={() => setShowKebabMenu(!showKebabMenu)}
                          className={`p-2 rounded-xl transition-all duration-200 touch-manipulation ${theme === 'dark' ? 'text-blue-200 hover:bg-[#424242]' : 'text-blue-600 hover:bg-blue-100'}`}
                        >
                          <FaEllipsisV className="w-4 h-4" />
                        </button>

                        {showKebabMenu && (
                          <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg py-1 border z-50 ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} lg:w-48 w-40`}>
                            <button
                              onClick={() => {
                                setShowKebabMenu(false);
                                handleOpenDetails();
                              }}
                              className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
                            >
                              <FaCog size={16} />
                              <span>Settings</span>
                            </button>
                            {selectedConversation.isGroup && (
                              <button
                                onClick={() => {
                                  setShowKebabMenu(false);
                                  handleLeaveGroup();
                                }}
                                disabled={isLeaving}
                                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-orange-300' : 'hover:bg-blue-100 text-orange-600'} disabled:opacity-50`}
                              >
                                <FaSignOutAlt size={16} />
                                <span>{isLeaving ? 'Leaving...' : 'Leave'}</span>
                              </button>
                            )}
                            {selectedConversation.isGroup && (selectedConversation?.createdBy === user?._id || selectedConversation?.admins?.includes(user?._id)) && (
                              <button
                                onClick={() => {
                                  setShowKebabMenu(false);
                                  setShowDeleteDialog(true);
                                }}
                                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-red-300' : 'hover:bg-blue-100 text-red-600'}`}
                              >
                                <FaTrash size={16} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </header>
                )}
                {isLoadingMessages ? (
                  <MessagesAreaSkeleton theme={theme} />
                ) : (
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-3">
                    {hasMoreMessages && (
                      <div className="flex justify-center">
                        <button
                          onClick={handleLoadMore}
                          disabled={isFetchingMore}
                          className={`px-3 py-1 text-xs rounded-lg border ${theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                        >
                          {isFetchingMore ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                    {/* Group creation date display */}
                    {selectedConversation.isGroup && selectedConversation.createdAt && (
                      <div className="flex justify-center mb-4">
                        <div className={`px-4 py-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          Created on {new Date(selectedConversation.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} at {new Date(selectedConversation.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    )}

                    {messages.map((m, index) => {
                      const mine = String(m.sender?._id || m.sender) === String(user?._id);
                      const messageDate = new Date(m.createdAt || m.timestamp);
                      const prevMessage = index > 0 ? messages[index - 1] : null;
                      const prevMessageDate = prevMessage ? new Date(prevMessage.createdAt || prevMessage.timestamp) : null;

                      // Check if we need to show a date separator
                      const showDateSeparator = prevMessageDate &&
                        messageDate.toDateString() !== prevMessageDate.toDateString();

                      return (
                        <React.Fragment key={m._id}>
                          {/* Date separator - show for first message or when date changes */}
                          {(index === 0 || showDateSeparator) && (
                            <div className="flex justify-center my-4">
                              <div className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {messageDate.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          )}

                          {/* Handle system messages */}
                          {m.type === 'system' ? (
                            <div className="flex justify-center">
                              <div className={`px-3 py-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                {m.text}
                              </div>
                            </div>
                          ) : (
                            <div className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div className="max-w-[75%]">
                                {/* Sender info - show for all users */}
                                <div className={`flex items-center gap-2 mb-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                                  {!mine && (
                                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                                      {m.sender?.profileImage ? (
                                        <img src={m.sender.profileImage} alt="" className="w-7 h-7 object-cover" />
                                      ) : (
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
                                          {`${(m.sender?.firstName || '')[0] || ''}${(m.sender?.lastName || '')[0] || ''}`.toUpperCase() || 'U'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="text-xs opacity-70">
                                    {mine ? 'You' : `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`}
                                  </div>
                                  <div className="text-xs opacity-50">
                                    {formatTimeAgo(m.createdAt || m.timestamp)}
                                  </div>
                                </div>

                                {/* Message content */}
                                <div className={`relative ${mine ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' : `${theme === 'dark' ? 'bg-gray-700 ' : 'bg-gray-100 '} rounded-2xl rounded-bl-none`} ${m.type === 'text' ? 'inline-block w-fit' : 'p-3'}`}>
                                  {m.type === 'text' && (
                                    <div className="whitespace-pre-wrap px-3 py-2">{renderMessageText(m.text)}</div>
                                  )}
                                  {m.type === 'image' && (
                                    <img src={m.mediaUrl} alt="" className="rounded-lg max-h-80" />
                                  )}
                                  {m.type === 'video' && (
                                    <video src={m.mediaUrl} controls className="rounded-lg max-h-80" />
                                  )}
                                  {/* Reaction picker on hover */}
                                  <div className={`absolute -top-3 ${mine ? '-right-1' : '-left-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    <div className={`flex items-center gap-1 px-1 py-0.5 rounded-full border ${panel}`}>
                                      {['👍', '❤️', '😂', '🎉', '😮', '🙏'].map((e) => (
                                        <button key={e} className={`text-xs px-1.5 py-0.5 rounded-full ${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'}`} onClick={() => handleReaction(m._id, e)}>{e}</button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Read receipts (basic): show "Read" for messages you sent that have been read by others */}
                                {mine && Array.isArray(m.readBy) && m.readBy.some((uid) => String(uid) !== String(user?._id)) && (
                                  <div className={`mt-1 text-[10px] opacity-60 ${mine ? 'text-right' : ''}`}>
                                    Read
                                  </div>
                                )}

                                {/* Reactions outside the message block */}
                                {m.reactions?.length > 0 && (
                                  <div className={`mt-1 text-xs opacity-90 flex items-center gap-1 flex-wrap ${mine ? 'justify-end' : 'justify-start'}`}>
                                    {Object.entries(m.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([e, count]) => (
                                      <span key={e} className={`px-2 py-0.5 rounded-full border ${panel}`}>{e} {count}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* System message for users who are no longer members */}
                    {selectedConversation && !(selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id)) && (
                      <div className="flex justify-center mb-4">
                        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-orange-900/20 border border-orange-500/30 text-orange-300' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
                          ⚠️ You are no longer a member of this conversation. You can view the conversation history but cannot send new messages.
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
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
                  <footer className={`relative p-2 lg:p-3 mx-2 lg:mx-3 mb-2 lg:mb-3 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900'} flex-shrink-0 ${!(selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id)) ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Mention Dropdown */}
                    {showMentions && selectedConversation?.isGroup && (
                      <div ref={mentionDropdownRef} className={`absolute bottom-full left-0 right-0 mb-2 z-50 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-[#232323] border-[#424242]' : 'bg-white border-gray-200'}`}>
                        <div className="p-2 border-b border-gray-200 dark:border-[#424242]">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Mention a member
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {filteredMembers.length > 0 ? (
                            filteredMembers.map((member, index) => (
                              <button
                                key={member._id}
                                type="button"
                                onClick={() => handleMentionSelect(member)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${index === selectedMentionIndex
                                  ? (theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700')
                                  : (theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100')
                                  }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
                                  {`${(member.firstName || '')[0] || ''}${(member.lastName || '')[0] || ''}`.toUpperCase() || 'U'}
                                </span>
                                <span className="font-medium">{`${member.firstName || ''} ${member.lastName || ''}`.trim()}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                              No members found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 lg:gap-2">
                      <label className={`p-2 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'}`}>
                        <FaImage />
                        <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} disabled={!(selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id))} />
                      </label>
                      <label className={`p-2 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'}`}>
                        <FaVideo />
                        <input type="file" accept="video/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} disabled={!(selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id))} />
                      </label>
                      <input
                        className={`flex-1 px-2 lg:px-3 py-2 rounded-lg border ${panel} text-sm lg:text-base`}
                        placeholder={!(selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id))
                          ? "You are no longer a participant in this conversation"
                          : selectedConversation?.isGroup
                            ? "Type a message or @ to mention someone"
                            : "Type a message"}
                        value={input}
                        ref={messageInputRef}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          // Clear typing indicator when input loses focus
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
                        }}
                        disabled={!(selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id))}
                      />
                      <button disabled={isSending || !(selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id))} className={`px-2 lg:px-4 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-blue-50 text-blue-600'} flex items-center gap-1 lg:gap-2 touch-manipulation`} onClick={handleSend}>
                        <FaPaperPlane className="text-sm" />
                        <span className="hidden lg:inline">Send</span>
                      </button>
                    </div>
                    {/* Help text for mentions */}
                    {selectedConversation?.isGroup && (selectedConversation?.participants || []).some(p => String(p._id || p) === String(user?._id)) && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        💡 Type @ to mention a group member
                      </div>
                    )}
                  </footer>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center opacity-70 text-sm">Select a conversation</div>
            )}
          </section>

          {showNewConversation && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 lg:p-0 z-50">
              <div className={`w-full max-w-lg rounded-2xl border ${panel} p-4 lg:p-6 max-h-[90vh] overflow-y-auto`}>
                <div className="text-lg font-semibold mb-3">New Conversation</div>
                <div className="flex items-center gap-2 mb-3">
                  {['dm', 'group'].map(t => (
                    <button key={t} onClick={() => setConversationType(t)} className={`px-3 py-1.5 rounded-lg ${conversationType === t ? (theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100')}`}>{t === 'dm' ? 'Direct Message' : 'Group'}</button>
                  ))}
                </div>

                {conversationType === 'dm' ? (
                  <div className="mb-3">
                    <SingleUserDropdown
                      theme={theme}
                      panel={panel}
                      users={orgUsers.filter(u => String(u._id) !== String(user?._id))}
                      selected={selectedDmUser}
                      onChange={setSelectedDmUser}
                    />
                  </div>
                ) : (
                  <>
                    <input className={`w-full px-3 py-2 rounded-lg border ${panel} mb-3`} placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
                          {(() => {
                            const parts = (groupName || '').split(' ').filter(Boolean);
                            const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'GR';
                            return initials;
                          })()}
                        </div>
                        <span className="opacity-70 text-sm">Group Avatar</span>
                      </div>
                      <label className={`px-3 py-2 rounded-lg cursor-pointer border ${panel}`}>
                        Upload Image
                        <input type="file" accept="image/*" hidden onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const form = new FormData();
                          form.append('file', file);
                          form.append('filename', file.name);
                          const res = await messagingService.uploadChatMedia(form);
                          setGroupAvatar(res?.url || res?.attachment?.FileURL || '');
                        }} />
                      </label>
                      {groupAvatar && (
                        <img src={groupAvatar} alt="Group Avatar" className="w-10 h-10 rounded-full border" />
                      )}
                    </div>
                    {/* Multi-select dropdown styled like other pages (for Group) */}
                    <div className="mb-3" ref={memberDropdownRef}>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsMembersOpen((v) => !v)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${panel}`}
                        >
                          <div className="flex flex-wrap gap-2 items-center min-h-[24px]">
                            {groupMembers.length === 0 && (
                              <span className="opacity-70">Select members</span>
                            )}
                            {groupMembers.map((u) => (
                              <span key={u._id} className={`px-2 py-1 rounded-full text-sm border ${panel} flex items-center gap-2`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{u.initials}</span>
                                {u.name}
                                {String(u._id) !== String(user?._id) && (
                                  <button
                                    type="button"
                                    className={`${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'} rounded-full px-1`}
                                    onClick={(e) => { e.stopPropagation(); setGroupMembers((prev) => prev.filter((m) => m._id !== u._id)); }}
                                  >
                                    ×
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                          <FaChevronDown className={`ml-2 text-xs transition-transform ${isMembersOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-400'}`} />
                        </button>
                        {isMembersOpen && (
                          <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-[#232323] border-[#424242]' : 'bg-white border-gray-200'}`}>
                            <div className="p-2 border-b border-gray-200 dark:border-[#424242]">
                              <input
                                className={`w-full px-3 py-2 rounded-md border ${panel}`}
                                placeholder="Search members"
                                value={memberQuery}
                                onChange={(e) => setMemberQuery(e.target.value)}
                              />
                            </div>
                            <div className="py-1 max-h-60 overflow-y-auto">
                              {orgUsers
                                .filter((u) => {
                                  const q = memberQuery.toLowerCase();
                                  return !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                                })
                                .map((u) => {
                                  const selected = groupMembers.some((m) => m._id === u._id);
                                  const isCurrentUser = String(u._id) === String(user?._id);
                                  return (
                                    <button
                                      type="button"
                                      key={u._id}
                                      onClick={() => {
                                        if (!isCurrentUser) {
                                          setGroupMembers((prev) => (selected ? prev.filter((m) => m._id !== u._id) : [...prev, u]));
                                        }
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-150 ${selected
                                        ? theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'
                                        : theme === 'dark' ? 'hover:bg-[#2A2A2A] text-[#F3F6FA]' : 'hover:bg-gray-50 text-gray-900'} ${isCurrentUser ? 'cursor-not-allowed' : ''}`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{u.initials}</span>
                                        <span className="font-medium">{u.name}</span>
                                        <span className="opacity-70 text-sm ml-2">{u.email}</span>
                                        {isCurrentUser && <span className="text-xs opacity-60">(You)</span>}
                                      </span>
                                      {selected && <FaCheck className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} size={12} />}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className={getThemeClasses(
                      'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors',
                      'dark:text-gray-400 dark:hover:bg-gray-700 dark:border-gray-600'
                    )}
                    onClick={() => {
                      setShowNewConversation(false);
                      setConversationType('dm');
                      setGroupName(''); setGroupAvatar(''); setGroupMembers([]); setSelectedDmUser(null);
                    }}
                  >
                    Cancel
                  </button>
                  {conversationType === 'dm' ? (
                    <button
                      type="button"
                      disabled={!selectedDmUser}
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                        'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                      )}
                      onClick={async () => {
                        try {
                          if (!selectedDmUser) return;
                          const conv = await messagingService.getOrCreateDirectConversation(selectedDmUser._id);
                          setConversations((prev) => {
                            const exists = prev.find(c => c._id === conv._id);
                            return exists ? prev : [conv, ...prev];
                          });
                          selectConversationWithCleanup(conv);
                          setShowNewConversation(false);
                          setSelectedDmUser(null);
                        } catch (e) { }
                      }}
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={getThemeClasses(
                        'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-colors',
                        'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
                      )}
                      onClick={async () => {
                        try {
                          let ids = groupMembers.map(u => u._id);
                          // Ensure current user is always included
                          if (user && !ids.includes(user._id)) {
                            ids.push(user._id);
                          }
                          const conv = await messagingService.createGroup(groupName, ids, groupAvatar);
                          selectConversationWithCleanup(conv);

                          // System messages are now created automatically by the backend

                          setShowNewConversation(false);
                          setGroupName('');
                          setGroupMembers([]);
                          setGroupAvatar('');
                        } catch (e) {
                          console.error('Failed to create group:', e);
                        }
                      }}
                    >
                      Create
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {showDetails && (
          <div className="fixed inset-0 z-40">
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isDetailsAnimating ? 'opacity-0' : 'opacity-100'}`}
              onClick={handleCloseDetails}
            />
            <div className={`absolute right-0 top-0 bottom-0 w-full lg:max-w-md ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} p-4 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isDetailsAnimating ? 'translate-x-full' : 'translate-x-0'}`}>

              {convDetails && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {convDetails.isGroup && convDetails.avatarUrl ? (
                        <img src={convDetails.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
                          {(() => {
                            const parts = (convDetails.name || '').split(' ').filter(Boolean);
                            return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'GR';
                          })()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isEditingGroupName && convDetails.isGroup ? (
                            <div className="flex items-center gap-2 flex-1" ref={editInputRef}>
                              <input
                                type="text"
                                value={editedGroupName}
                                onChange={(e) => setEditedGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveGroupName();
                                  if (e.key === 'Escape') handleCancelEditGroupName();
                                }}
                                className={`flex-1 px-2 py-1 text-lg font-semibold rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} focus:outline-none`}
                                autoFocus
                              />
                              <button
                                onClick={handleSaveGroupName}
                                disabled={isSavingGroupName}
                                className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-gray-100 text-green-600'} disabled:opacity-50`}
                                title="Save"
                              >
                                <FaSave size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="font-semibold text-lg">{convDetails.isGroup ? (convDetails.name || 'Group') : 'Direct Message'}</div>
                              {convDetails.isGroup && (
                                <button
                                  onClick={handleEditGroupName}
                                  className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                  title="Edit group name"
                                >
                                  <FaEdit size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-xs opacity-75">Created {convDetails.createdAt ? new Date(convDetails.createdAt).toLocaleString() : ''}</div>
                      </div>
                    </div>
                    <button className={`${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'} rounded-lg px-3 py-1 touch-manipulation`} onClick={handleCloseDetails}><FaTimes /></button>
                  </div>
                  <div className="flex items-center gap-2 border-b mb-3 pb-2">
                    {['details', 'files', 'links'].map(tab => (
                      <button key={tab} onClick={() => setActiveDetailsTab(tab)} className={`px-3 py-1.5 rounded-lg ${activeDetailsTab === tab ? (theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100')}`}>{tab[0].toUpperCase() + tab.slice(1)}</button>
                    ))}
                  </div>
                  {activeDetailsTab === 'details' && (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm opacity-70 mb-1">Members</div>
                        <div className="flex flex-wrap gap-2">
                          {convDetails.participants?.map(p => {
                            const initials = `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase() || 'U';
                            const isGroupAdmin = convDetails?.createdBy === user?._id || convDetails?.admins?.includes(user?._id);
                            const isCurrentUser = String(p._id) === String(user?._id);
                            const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();

                            return (
                              <div key={p._id} className={`px-2 py-1 rounded-full border ${panel} flex items-center gap-2`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{initials}</span>
                                <div className="flex flex-col">
                                  <span className="text-sm">{fullName}</span>
                                  {(String(p._id) === String(convDetails?.createdBy) || convDetails?.admins?.includes(p._id)) && (
                                    <span className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} font-medium`}>Admin</span>
                                  )}
                                </div>
                                {isCurrentUser && <span className="text-xs opacity-60">(You)</span>}
                                {isGroupAdmin && !isCurrentUser && (
                                  <button
                                    onClick={() => handleRemoveMember(p._id, fullName)}
                                    className={`ml-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-colors`}
                                    title={`Remove ${fullName} from group`}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {(() => {
                        const availableUsers = orgUsers.filter(u => !convDetails.participants?.some(p => String(p._id) === String(u._id)));
                        return availableUsers.length > 0 && (
                          <div>
                            <div className="text-sm opacity-70 mb-1">Add members</div>
                            <AddMembersDropdown theme={theme} panel={panel} orgUsers={availableUsers} onAdd={async (ids) => {
                              try {
                                // Show loading state
                                const memberCount = ids.length;
                                const loadingMessage = memberCount === 1 ? 'Adding member...' : `Adding ${memberCount} members...`;
                                showToast(loadingMessage, 'info');

                                // Add members - the real-time events will handle UI updates
                                await messagingService.addMembers(selectedConversation._id, ids);

                                // Show success toast
                                const successMessage = memberCount === 1 ? 'Member added successfully' : `${memberCount} members added successfully`;
                                showToast(successMessage, 'success');
                              } catch (error) {
                                console.error('Failed to add members:', error);
                                showToast('Failed to add members to group', 'error');
                              }
                            }} />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {activeDetailsTab === 'files' && (
                    <div className="grid grid-cols-2 gap-3">
                      {convAssets.files.length === 0 && <div className="opacity-60 text-sm">No files</div>}
                      {convAssets.files.map(f => (
                        <a key={f._id} href={f.url} target="_blank" rel="noreferrer" className={`block rounded-lg border ${panel} overflow-hidden`}>
                          {f.type === 'image' ? (
                            <img src={f.url} alt="" className="w-full h-32 object-cover" />
                          ) : (
                            <div className="p-3 text-sm">{f.type.toUpperCase()}</div>
                          )}
                          <div className="p-2 text-xs opacity-70">{new Date(f.createdAt).toLocaleString()}</div>
                        </a>
                      ))}
                    </div>
                  )}
                  {activeDetailsTab === 'links' && (
                    <div className="space-y-2">
                      {convAssets.links.length === 0 && <div className="opacity-60 text-sm">No links</div>}
                      {convAssets.links.map((l, idx) => (
                        <a key={idx} href={l.url} target="_blank" rel="noreferrer" className={`block px-3 py-2 rounded-lg border ${panel} truncate`}>{l.url}</a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteDialog(false)} />
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border ${theme === 'dark' ? 'bg-[#18181b] text-white border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} p-6 shadow-xl`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
                  <FaTimes />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Delete Group</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Are you sure you want to delete "{selectedConversation?.name || 'Group'}"?
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-[#232323] border border-[#424242]' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  This action will:
                </p>
                <ul className={`text-sm mt-2 space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>• Delete all messages from the conversation</li>
                  <li>• Remove all members from the conversation</li>
                  <li>• Permanently delete the conversation</li>
                </ul>
                <p className={`text-sm mt-3 font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  className={getThemeClasses(
                    'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors',
                    'dark:text-gray-400 dark:hover:bg-gray-700 dark:border-gray-600'
                  )}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  disabled={isDeleting}
                  className={getThemeClasses(
                    'px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    'dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800'
                  )}
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </span>
                  ) : (
                    'Delete Group'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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
        currentUser={user}
        answerData={answerData}
        onOutgoingCallAnswered={handleOutgoingCallAnswered}
        initialAction={modalInitialAction}
      />
    </>
  );
}

function AddMembersDropdown({ theme, panel, orgUsers, onAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${panel}`}>
        <span className="opacity-80 text-sm">Select members to add</span>
        <FaChevronDown className={`ml-2 text-xs ${open ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-400'}`} />
      </button>
      {open && (
        <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-[#232323] border-[#424242]' : 'bg-white border-gray-200'}`}>
          <div className="p-2 border-b border-gray-200 dark:border-[#424242]">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className={`w-full px-3 py-2 rounded-md border ${panel}`} />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {orgUsers.filter(u => {
              const q = query.toLowerCase();
              return !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
            }).map(u => {
              const isSel = selected.includes(u._id);
              return (
                <button type="button" key={u._id} onClick={() => {
                  setSelected(prev => isSel ? prev.filter(id => id !== u._id) : [...prev, u._id]);
                }} className={`w-full flex items-center justify-between px-3 py-2 text-left ${isSel ? (theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50')}`}>
                  <span className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{(u.initials || 'U')}</span>
                    <span className="font-medium">{u.name}</span>
                    <span className="opacity-70 text-xs ml-1">{u.email}</span>
                  </span>
                  {isSel && <FaCheck className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} size={12} />}
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-gray-200 dark:border-[#424242] flex justify-end gap-2">
            <button className={`${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'} rounded-lg px-3 py-1`} onClick={() => { setOpen(false); setSelected([]); }}>Cancel</button>
            <button className={`${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-blue-50 text-blue-700'} rounded-lg px-3 py-1`} onClick={async () => { await onAdd(selected); setOpen(false); setSelected([]); }}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SingleUserDropdown({ theme, panel, users, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${panel}`}>
        <span className="flex items-center gap-2">
          {selected ? (
            <>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{selected.initials || 'U'}</span>
              <span className="font-medium">{selected.name}</span>
              <span className="opacity-70 text-xs ml-1">{selected.email}</span>
            </>
          ) : (
            <span className="opacity-70">Select a user</span>
          )}
        </span>
        <FaChevronDown className={`ml-2 text-xs ${open ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-400'}`} />
      </button>
      {open && (
        <div className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-[#232323] border-[#424242]' : 'bg-white border-gray-200'}`}>
          <div className="p-2 border-b border-gray-200 dark:border-[#424242]">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className={`w-full px-3 py-2 rounded-md border ${panel}`} />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {users.filter(u => {
              const q = query.toLowerCase();
              return !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
            }).map(u => (
              <button type="button" key={u._id} onClick={() => { onChange(u); setOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 text-left ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50'}`}>
                <span className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{u.initials || 'U'}</span>
                  <span className="font-medium">{u.name}</span>
                  <span className="opacity-70 text-xs ml-1">{u.email}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}