import React from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { ConversationsListSkeleton } from '../skeletons/MessageSkeletons';

const ChatSidebar = ({
  theme,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  searchQuery,
  setSearchQuery,
  setShowNewConversation,
  isLoadingConversations,
  filteredConversations,
  unreadCounts,
  recentlyUpdatedConversation,
  selectConversationWithCleanup,
  selectedConversation,
  formatTimeAgo,
  userDetails
}) => {

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      <aside className={`w-80 border-r bg-white border-gray-200 text-gray-900 dark:bg-transparent dark:border-dark-border dark:text-[#F3F6FA] p-3 overflow-y-auto no-scrollbar transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:static top-0 left-0 h-full z-50 lg:z-auto lg:w-80`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Search Input */}
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400`} size={14} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <button
            className={`p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-colors flex items-center gap-1 lg:gap-2 text-sm lg:text-base touch-manipulation dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800`}
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
                  <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 text-gray-600 dark:text-gray-300`}>
                    Group Chats
                    {(() => {
                      const groupUnreadCount = filteredConversations
                        .filter(c => c.isGroup)
                        .reduce((sum, c) => sum + (unreadCounts[c._id] || 0), 0);
                      return groupUnreadCount > 0 ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200`}>
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
                        <button key={c._id} onClick={() => selectConversationWithCleanup(c)} className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-all duration-500 ease-in-out transform ${isRecentlyUpdated ? 'animate-pulse scale-[1.02] shadow-lg' : 'scale-100'} ${selectedConversation?._id === c._id ? `bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border dark:border-blue-600` : ''} ${panel} ${isRecentlyUpdated ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-500/30' : ''}`}>
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-blue-600 text-white dark:bg-blue-900 dark:text-blue-200`}>{initials}</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate flex items-center gap-2">
                              <span className="truncate">{displayName}</span>
                              {(unreadCounts[c._id] > 0) && (
                                <span className={`ml-auto whitespace-nowrap text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200`}>
                                  {unreadCounts[c._id]} unread
                                </span>
                              )}
                            </div>
                            <div className={`text-sm opacity-70 truncate transition-all duration-300 ${isRecentlyUpdated ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>{c.lastMessagePreview}</div>
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
                  <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 text-gray-600 dark:text-gray-300`}>
                    Direct Messages
                    {(() => {
                      const dmUnreadCount = filteredConversations
                        .filter(c => !c.isGroup)
                        .reduce((sum, c) => sum + (unreadCounts[c._id] || 0), 0);
                      return dmUnreadCount > 0 ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200`}>
                          {dmUnreadCount}
                        </span>
                      ) : null;
                    })()}
                  </h3>
                  <div className="space-y-2 transition-all duration-300 ease-in-out">
                    {filteredConversations.filter(c => !c.isGroup).map((c) => {
                      const displayName = c.participants?.filter(p => p._id !== userDetails?._id).map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'Direct';
                      const other = c.participants?.find(p => p._id !== userDetails?._id);
                      const parts = `${other?.firstName || ''} ${other?.lastName || ''}`.trim().split(' ').filter(Boolean);
                      const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
                      const isRecentlyUpdated = recentlyUpdatedConversation === c._id;
                      return (
                        <button key={c._id} onClick={() => selectConversationWithCleanup(c)} className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-all duration-500 ease-in-out transform ${isRecentlyUpdated ? 'animate-pulse scale-[1.02] shadow-lg' : 'scale-100'} ${selectedConversation?._id === c._id ? `bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border dark:border-blue-600` : ''} ${panel} ${isRecentlyUpdated ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-500/30' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-blue-600 text-white dark:bg-blue-900 dark:text-blue-200`}>{initials}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate flex items-center gap-2">
                              <span className="truncate">{displayName}</span>
                              {(unreadCounts[c._id] > 0) && (
                                <span className={`ml-auto whitespace-nowrap text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200`}>
                                  {unreadCounts[c._id]} unread
                                </span>
                              )}
                            </div>
                            <div className={`text-sm opacity-70 truncate transition-all duration-300 ${isRecentlyUpdated ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>{c.lastMessagePreview}</div>
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
                <div className={`text-center py-8 text-gray-500 dark:text-gray-400`}>
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
    </>
  );
};

export default ChatSidebar;
