import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api, { messagingService } from '../services/api';
import { FaPaperPlane, FaPlus, FaSmile, FaImage, FaVideo, FaChevronDown, FaCheck, FaTimes, FaSearch, FaEllipsisV, FaCog, FaTrash, FaSignOutAlt, FaEdit, FaSave } from 'react-icons/fa';

// Skeleton Components
const ConversationSkeleton = ({ theme }) => (
  <div className={`w-full p-2 rounded-lg flex items-center gap-3 ${theme === 'dark' ? 'bg-[#221E1E]' : 'bg-white'}`}>
    <div className={`w-8 h-8 rounded-full animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
    <div className="flex-1 space-y-2">
      <div className={`h-4 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} style={{ width: '70%' }} />
      <div className={`h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} style={{ width: '50%' }} />
    </div>
    <div className={`w-12 h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
  </div>
);

const MessageSkeleton = ({ isMine, theme }) => (
  <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
    <div className="max-w-[75%]">
      <div className={`flex items-center gap-2 mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <div className={`w-7 h-7 rounded-full animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
        )}
        <div className={`w-16 h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
        <div className={`w-12 h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      </div>
      <div className={`relative border rounded-2xl ${isMine ? 'rounded-br-none' : 'rounded-bl-none'} ${theme === 'dark' ? 'bg-[#221E1E] border-[#424242]' : 'bg-white border-gray-200'}`}>
        <div className="px-3 py-2">
          <div className={`h-4 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} style={{ width: isMine ? '120px' : '180px' }} />
        </div>
      </div>
    </div>
  </div>
);

const ConversationsListSkeleton = ({ theme }) => (
  <div className="space-y-4">
    {/* Group Chats Section Skeleton */}
    <div>
      <div className={`h-4 w-24 rounded animate-pulse mb-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <ConversationSkeleton key={`group-${i}`} theme={theme} />
        ))}
      </div>
    </div>
    
    {/* Direct Messages Section Skeleton */}
    <div>
      <div className={`h-4 w-32 rounded animate-pulse mb-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <ConversationSkeleton key={`dm-${i}`} theme={theme} />
        ))}
      </div>
    </div>
  </div>
);

const ChatHeaderSkeleton = ({ theme }) => (
  <div className={`p-3 border-b ${theme === 'dark' ? 'bg-transparent border-[#424242]' : 'bg-white border-gray-200'} flex-shrink-0`}>
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`h-5 w-32 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
    </div>
  </div>
);

const MessagesAreaSkeleton = ({ theme }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <MessageSkeleton key={i} isMine={i % 2 === 0} theme={theme} />
    ))}
  </div>
);

const ChatFooterSkeleton = ({ theme }) => (
  <div className={`p-3 mx-3 mb-3 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-[#221E1E]' : 'bg-white'} flex-shrink-0`}>
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`w-8 h-8 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`flex-1 h-10 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`w-20 h-10 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
    </div>
  </div>
);

export default function MessagesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [isSavingGroupName, setIsSavingGroupName] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const memberDropdownRef = useRef(null);
  const bottomRef = useRef(null);
  const kebabMenuRef = useRef(null);
  const editInputRef = useRef(null);

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
    
    // URL regex pattern to match http/https URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split text by URLs and render accordingly
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // This is a URL - render as clickable link
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      // This is regular text
      return part;
    });
  };

  // Add current user to group members by default when group type is selected
  useEffect(() => {
    if (conversationType === 'group' && user && orgUsers.length > 0) {
      // Find current user in orgUsers
      const currentUser = orgUsers.find(u => String(u._id) === String(user._id));
      if (currentUser && !groupMembers.some(m => String(m._id) === String(user._id))) {
        setGroupMembers(prev => [...prev, currentUser]);
      }
    }
  }, [conversationType, user, orgUsers]);

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

  useEffect(() => {
    if (!user) return;
    setIsLoadingConversations(true);
    messagingService.getConversations()
      .then(setConversations)
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
  }, [user]);

  // Select first conversation by default
  useEffect(() => {
    if (!selectedConversation && conversations && conversations.length > 0) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

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
    setIsLoadingMessages(true);
    messagingService.getMessages(selectedConversation._id)
      .then((data) => {
        setMessages(data);
        setTimeout(scrollToBottom, 50);
      })
      .finally(() => setIsLoadingMessages(false));
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
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation) return;
    setIsSending(true);
    try {
      const msg = await messagingService.sendMessage(selectedConversation._id, { type: 'text', text: input.trim() });
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      updateConversationPreview(selectedConversation._id, msg);
      setInput('');
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSending(false);
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
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      updateConversationPreview(selectedConversation._id, msg);
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      console.error('Failed to upload file:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    const updated = await messagingService.react(messageId, emoji);
    setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
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
      // Update conversation name via API
      const response = await api.patch(`/messages/conversations/${selectedConversation._id}`, {
        name: editedGroupName.trim()
      });
      
      // Update local state
      setConvDetails(prev => ({ ...prev, name: editedGroupName.trim() }));
      setSelectedConversation(prev => ({ ...prev, name: editedGroupName.trim() }));
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === selectedConversation._id 
            ? { ...conv, name: editedGroupName.trim() }
            : conv
        )
      );
      
      // Send system message
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
      
      // Show success toast
      showToast('You have left the group', 'success');
      
      // Small delay to show the message before clearing
      setTimeout(() => {
        // Remove from conversations list
        setConversations((prev) => prev.filter(c => c._id !== selectedConversation._id));
        
        // Clear selected conversation
        setSelectedConversation(null);
        setMessages([]);
        
        // Close menu
        setShowKebabMenu(false);
      }, 1000);
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
      
      // Show success toast
      showToast(`${memberName} has been removed from the group`, 'success');
    } catch (error) {
      console.error('Failed to remove member:', error);
      showToast('Failed to remove member from group', 'error');
    }
  };

  const bg = theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900';
  const panel = theme === 'dark' ? 'bg-[#221E1E] border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-200 text-gray-900';

  return (
    <Layout>
      <Head>
        <title>Messages - TeamLabs</title>
      </Head>

      <div className="mx-auto">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className={getThemeClasses("text-3xl font-bold text-gray-900", "dark:text-white")}>
              Messages
            </h1>
            <p className={getThemeClasses("text-gray-600 mt-2", "dark:text-gray-400")}>
              Chat with your team members and collaborate on projects
            </p>
          </div>
          <button 
            className={`px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-colors flex items-center gap-2 ${theme === 'dark' ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : ''}`} 
            onClick={() => setShowNewConversation(true)}
          >
            <FaPlus size={14} />
            New
          </button>
        </div>

        <div className={`flex h-[calc(100vh-175px)] ${bg}`}>
          <aside className={`w-80 border-r ${theme === 'dark' ? 'bg-transparent border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-200 text-gray-900'} p-3 overflow-y-auto`}>
            <div className="mb-3">
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
            </div>
            <div className="space-y-4">
              {isLoadingConversations ? (
                <ConversationsListSkeleton theme={theme} />
              ) : (
                <>
                  {/* Group Chats Section */}
                  {filteredConversations.filter(c => c.isGroup).length > 0 && (
                    <div>
                      <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Group Chats
                      </h3>
                      <div className="space-y-2">
                        {filteredConversations.filter(c => c.isGroup).map((c) => {
                          const displayName = c.name || 'Group';
                          const parts = (c.name || '').split(' ').filter(Boolean);
                          const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'GR';
                          return (
                            <button key={c._id} onClick={() => setSelectedConversation(c)} className={`w-full text-left p-2 rounded-lg flex items-center gap-3 ${selectedConversation?._id === c._id ? `${theme === 'dark' ? 'bg-blue-900 text-blue-200 border border-blue-600' : 'bg-blue-50 text-blue-700 border border-blue-300'}` : ''} ${panel}`}>
                              {c.avatarUrl ? (
                                <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{initials}</div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{displayName}</div>
                                <div className="text-sm opacity-70 truncate">{c.lastMessagePreview}</div>
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
                      <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Direct Messages
                      </h3>
                      <div className="space-y-2">
                        {filteredConversations.filter(c => !c.isGroup).map((c) => {
                          const displayName = c.participants?.filter(p => p._id !== user?._id).map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'Direct';
                          const other = c.participants?.find(p => p._id !== user?._id);
                          const parts = `${other?.firstName || ''} ${other?.lastName || ''}`.trim().split(' ').filter(Boolean);
                          const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
                          return (
                            <button key={c._id} onClick={() => setSelectedConversation(c)} className={`w-full text-left p-2 rounded-lg flex items-center gap-3 ${selectedConversation?._id === c._id ? `${theme === 'dark' ? 'bg-blue-900 text-blue-200 border border-blue-600' : 'bg-blue-50 text-blue-700 border border-blue-300'}` : ''} ${panel}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{initials}</div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{displayName}</div>
                                <div className="text-sm opacity-70 truncate">{c.lastMessagePreview}</div>
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
          <section className="flex-1 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {isLoadingMessages ? (
                  <ChatHeaderSkeleton theme={theme} />
                ) : (
                  <header className={`p-3 border-b ${theme === 'dark' ? 'bg-transparent border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-200 text-gray-900'} flex-shrink-0`}>
                  <div className="flex items-center justify-between">
                    <button onClick={async () => {
                      setShowDetails(true);
                      const det = await messagingService.getConversation(selectedConversation._id);
                      setConvDetails(det);
                      const assets = await messagingService.getAssets(selectedConversation._id);
                      setConvAssets(assets);
                    }} className="flex-1 text-left">
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
                          <span className="font-semibold text-lg hover:underline transition-all duration-200">
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
                    
                    {/* Kebab Menu */}
                    <div className="relative" ref={kebabMenuRef}>
                      <button
                        onClick={() => setShowKebabMenu(!showKebabMenu)}
                        className={`p-2 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'text-blue-200 hover:bg-[#424242]' : 'text-blue-600 hover:bg-blue-100'}`}
                      >
                        <FaEllipsisV className="w-4 h-4" />
                      </button>
                      
                      {showKebabMenu && (
                        <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg py-1 border z-50 ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'}`}>
                          <button
                            onClick={async () => {
                              setShowKebabMenu(false);
                              setShowDetails(true);
                              const det = await messagingService.getConversation(selectedConversation._id);
                              setConvDetails(det);
                              const assets = await messagingService.getAssets(selectedConversation._id);
                              setConvAssets(assets);
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    <div ref={bottomRef} />
                  </div>
                )}
                {isLoadingMessages ? (
                  <ChatFooterSkeleton theme={theme} />
                ) : (
                  <footer className={`p-3 mx-3 mb-3 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900'} flex-shrink-0`}>
                  <div className="flex items-center gap-2">
                    <label className={`p-2 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'}`}>
                      <FaImage />
                      <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} />
                    </label>
                    <label className={`p-2 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'}`}>
                      <FaVideo />
                      <input type="file" accept="video/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} />
                    </label>
                    <input
                      className={`flex-1 px-3 py-2 rounded-lg border ${panel}`}
                      placeholder="Type a message"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    />
                    <button disabled={isSending} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-blue-50 text-blue-600'} flex items-center gap-2`} onClick={handleSend}>
                      <FaPaperPlane /> Send
                    </button>
                  </div>
                  </footer>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center opacity-70 text-sm">Select a conversation</div>
            )}
          </section>

          {showNewConversation && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40">
              <div className={`w-full max-w-lg rounded-2xl border ${panel} p-4`}>
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
                          setSelectedConversation(conv);
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
                          setConversations((prev) => [conv, ...prev]);
                          setSelectedConversation(conv);
                          
                          // Send system messages for all members added during group creation
                          // Filter out the current user from the system messages since they created the group
                          const membersToShow = groupMembers.filter(member => String(member._id) !== String(user._id));
                          
                          // Add messages with slight delay to ensure they appear after group selection
                          setTimeout(async () => {
                            for (const member of membersToShow) {
                              await sendSystemMessage(conv._id, `${member.name} added to the group`);
                            }
                          }, 100);
                          
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
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetails(false)} />
            <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} p-4 overflow-y-auto`}>

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
                    <button className={`${theme === 'dark' ? 'hover:bg-[#424242]' : 'hover:bg-gray-100'} rounded-lg px-3 py-1`} onClick={() => setShowDetails(false)}><FaTimes /></button>
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
                                const updated = await messagingService.addMembers(selectedConversation._id, ids);
                                setConvDetails(updated);
                                // also refresh sidebar conversations
                                const list = await messagingService.getConversations();
                                setConversations(list);
                                
                                // Send system messages for each added member to DB
                                const addedMembers = availableUsers.filter(u => ids.includes(u._id));
                                for (const member of addedMembers) {
                                  await sendSystemMessage(selectedConversation._id, `${member.name} added to the group`);
                                }
                                
                                // Show success toast
                                const memberCount = ids.length;
                                const message = memberCount === 1 ? 'Member added successfully' : `${memberCount} members added successfully`;
                                showToast(message, 'success');
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
    </Layout>
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