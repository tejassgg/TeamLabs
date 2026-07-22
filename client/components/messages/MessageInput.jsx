import React from 'react';
import { FaPaperPlane, FaImage, FaVideo } from 'react-icons/fa';
import { ChatFooterSkeleton } from '../skeletons/MessageSkeletons';

const MessageInput = ({
  selectedConversation,
  theme,
  isLoadingMessages,
  showMentions,
  mentionDropdownRef,
  filteredMembers,
  handleMentionSelect,
  selectedMentionIndex,
  handleUpload,
  input,
  messageInputRef,
  handleInputChange,
  handleKeyDown,
  handleBlur,
  isSending,
  handleSend,
  userDetails
}) => {
  const isParticipant = (selectedConversation?.participants || []).some(p => String(p._id || p) === String(userDetails?._id));

  return (
    <>


      {isLoadingMessages ? (
        <ChatFooterSkeleton theme={theme} />
      ) : (
        <footer className={`relative p-2 lg:p-3 bg-white text-gray-900 border-t border-gray-200 dark:bg-[#221E1E] dark:text-[#F3F6FA] dark:border-t dark:border-gray-600 flex-shrink-0 ${!isParticipant ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Mention Dropdown */}
          {showMentions && selectedConversation?.isGroup && (
            <div ref={mentionDropdownRef} className={`absolute bottom-full left-0 right-0 mb-2 z-50 rounded-lg border shadow-lg bg-white border-gray-200 dark:bg-dark-card dark:border-dark-border`}>
              <div className="p-2 border-b border-gray-200 dark:border-dark-border">
                <span className="text-xs font-semibold text-gray-500">Mention Member</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {filteredMembers.map((member, index) => {
                  const label = `${member.firstName || ''} ${member.lastName || ''}`.trim();
                  return (
                    <button
                      key={member._id}
                      onClick={() => handleMentionSelect(member)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${index === selectedMentionIndex
                        ? 'bg-blue-50 text-blue-600 dark:bg-dark-hover dark:text-white'
                        : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-dark-hover/50 dark:text-gray-300'
                        }`}
                    >
                      <span>{label}</span>
                      <span className="text-xs text-gray-400">@{member.username}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 lg:gap-2">
            <label className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-hover">
              <FaImage />
              <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} disabled={!isParticipant} />
            </label>
            <label className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-hover">
              <FaVideo />
              <input type="file" accept="video/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} disabled={!isParticipant} />
            </label>

            <input
              className="flex-1 px-2 lg:px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 dark:bg-[#221E1E] dark:border-dark-border dark:text-[#F3F6FA] text-sm lg:text-base focus:outline-none"
              placeholder={!isParticipant
                ? "You are no longer a participant in this conversation"
                : selectedConversation?.isGroup
                ? "Type a message or @ to mention someone"
                : "Type a message"}
              value={input}
              ref={messageInputRef}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={!isParticipant}
            />
            <button
              disabled={isSending || !isParticipant}
              className="px-2 lg:px-4 py-2 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-dark-hover dark:text-gray-200 flex items-center gap-1 lg:gap-2 touch-manipulation"
              onClick={handleSend}
            >
              <FaPaperPlane className="text-sm" />
              <span className="hidden lg:inline">Send</span>
            </button>
          </div>
          
          {/* Help text for mentions */}
          {selectedConversation?.isGroup && isParticipant && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Type @ to mention a group member
            </div>
          )}
        </footer>
      )}
    </>
  );
};

export default MessageInput;
