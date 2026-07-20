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
  const panel = theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900';
  const border = theme === 'dark' ? 'border border-dark-border' : 'border border-gray-200';
  const isParticipant = (selectedConversation?.participants || []).some(p => String(p._id || p) === String(userDetails?._id));

  return (
    <>


      {isLoadingMessages ? (
        <ChatFooterSkeleton theme={theme} />
      ) : (
        <footer className={`relative p-2 lg:p-3 ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA] border-t border-gray-600' : 'bg-white text-gray-900 border-t border-gray-200'} flex-shrink-0 ${!isParticipant ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Mention Dropdown */}
          {showMentions && selectedConversation?.isGroup && (
            <div ref={mentionDropdownRef} className={`absolute bottom-full left-0 right-0 mb-2 z-50 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'}`}>
              <div className="p-2 border-b border-gray-200 dark:border-dark-border">
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
            <label className={`p-2 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-gray-100'}`}>
              <FaImage />
              <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} disabled={!isParticipant} />
            </label>
            <label className={`p-2 rounded-lg cursor-pointer ${theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-gray-100'}`}>
              <FaVideo />
              <input type="file" accept="video/*" hidden onChange={(e) => handleUpload(e.target.files?.[0])} disabled={!isParticipant} />
            </label>

            <input
              className={`flex-1 px-2 lg:px-3 py-2 rounded-lg ${panel} ${border} text-sm lg:text-base`}
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
              className={`px-2 lg:px-4 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-blue-50 text-blue-600'} flex items-center gap-1 lg:gap-2 touch-manipulation`}
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
