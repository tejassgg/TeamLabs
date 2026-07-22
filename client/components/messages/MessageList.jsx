import React from 'react';
import Message from './Message';

const MessageList = ({
  messages,
  hasMoreMessages,
  isFetchingMore,
  handleLoadMore,
  selectedConversation,
  theme,
  userDetails,
  formatTimeAgo,
  handleReaction,
  messagesContainerRef,
  bottomRef
}) => {
  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-2 lg:p-4 space-y-3">
      {hasMoreMessages && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className={`px-3 py-1 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            {isFetchingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
      
      {/* Group creation date display */}
      {selectedConversation.isGroup && selectedConversation.createdAt && (
        <div className="flex justify-center mb-4">
          <div className={`px-4 py-2 rounded-lg text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`}>
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
        const mine = String(m.sender?._id || m.sender) === String(userDetails?._id);
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
                <div className={`text-xs font-bold text-gray-600 dark:text-gray-400`}>
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
                <div className={`px-3 py-2 rounded-lg text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`}>
                  {m.text}
                </div>
              </div>
            ) : (
              <Message
                message={m}
                mine={mine}
                theme={theme}
                userDetails={userDetails}
                formatTimeAgo={formatTimeAgo}
                handleReaction={handleReaction}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* System message for users who are no longer members */}
      {selectedConversation && !(selectedConversation?.participants || []).some(p => String(p._id || p) === String(userDetails?._id)) && (
        <div className="flex justify-center mb-4">
          <div className={`px-4 py-3 rounded-lg text-sm font-medium bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border dark:border-orange-500/30 dark:text-orange-300`}>
            ⚠️ You are no longer a member of this conversation. You can view the conversation history but cannot send new messages.
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
