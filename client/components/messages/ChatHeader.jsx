import React from 'react';
import { FaVideo, FaEllipsisV, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { ChatHeaderSkeleton } from '../skeletons/MessageSkeletons';

const ChatHeader = ({
  theme,
  isLoadingMessages,
  setIsMobileSidebarOpen,
  handleOpenDetails,
  selectedConversation,
  userDetails,
  setShowVideoCallModal,
  showKebabMenu,
  setShowKebabMenu,
  kebabMenuRef,
  handleLeaveGroup,
  setShowDeleteDialog,
  showToast
}) => {
  if (isLoadingMessages) {
    return <ChatHeaderSkeleton theme={theme} />;
  }

  return (
    <header className={`p-3 border-b bg-white border-gray-200 text-gray-900 dark:bg-transparent dark:border-dark-border dark:text-[#F3F6FA] flex-shrink-0 z-20`}>
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 dark:hover:bg-dark-hover dark:text-gray-400 mr-3`}
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 bg-blue-600 text-white dark:bg-blue-900 dark:text-blue-200`}>
                {(() => {
                  if (selectedConversation.isGroup) {
                    const parts = (selectedConversation.name || '').split(' ').filter(Boolean);
                    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'GR';
                  } else {
                    const other = selectedConversation.participants?.find(p => String(p._id || p) !== String(userDetails?._id));
                    const parts = `${other?.firstName || ''} ${other?.lastName || ''}`.trim().split(' ').filter(Boolean);
                    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
                  }
                })()}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-sm lg:text-base truncate">
                {selectedConversation.isGroup
                  ? selectedConversation.name || 'Group'
                  : selectedConversation.participants?.filter(p => String(p._id || p) !== String(userDetails?._id)).map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim()).join(', ') || 'Direct Message'}
              </div>
              <div className={`text-xs text-gray-500 dark:text-gray-400 truncate`}>
                {selectedConversation.isGroup
                  ? `${selectedConversation.participants?.length || 0} members`
                  : 'Direct Message'}
              </div>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 lg:gap-4 relative">
          {/* Video Call button hidden for now */}

          {selectedConversation.isGroup && (
            <div className="relative" ref={kebabMenuRef}>
              <button
                className={`p-2 rounded-full transition-colors hover:bg-gray-100 text-gray-900 dark:hover:bg-[#2A2A2A] dark:text-[#F3F6FA]`}
                onClick={() => setShowKebabMenu(!showKebabMenu)}
              >
                <FaEllipsisV size={16} />
              </button>
              {showKebabMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 overflow-hidden bg-white border-gray-200 dark:bg-dark-card dark:border-dark-border`}>
                  {(selectedConversation?.participants || []).some(p => String(p._id || p) === String(userDetails?._id)) && (
                    <button
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors hover:bg-red-50 text-red-600 dark:hover:bg-[#2A2A2A] dark:text-red-400`}
                      onClick={handleLeaveGroup}
                    >
                      <FaSignOutAlt /> Leave Group
                    </button>
                  )}
                  {selectedConversation.createdBy === userDetails?._id && (
                    <button
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors border-t hover:bg-red-50 text-red-600 border-gray-100 dark:hover:bg-[#2A2A2A] dark:text-red-500 dark:border-dark-border`}
                      onClick={() => {
                        setShowKebabMenu(false);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <FaTrash /> Delete Group
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
