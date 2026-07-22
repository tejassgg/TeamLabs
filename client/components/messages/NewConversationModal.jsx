import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck, FaTimes, FaUser, FaUsers, FaUpload, FaSearch } from 'react-icons/fa';
import { messagingService } from '../../services/api';

function SingleUserList({ theme, users, selected, onChange }) {
  const [query, setQuery] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = query.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-3 h-[330px]">
      <div className="relative">
        <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team members by name or email..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-gray-50 dark:bg-[#27272a] border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white"
        />
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border p-1 custom-scrollbar bg-gray-50/50 border-gray-200 dark:bg-[#27272a]/50 dark:border-[#3f3f46]">
        {filteredUsers.map((u) => {
          const isSel = selected && selected._id === u._id;
          return (
            <button
              type="button"
              key={u._id}
              onClick={() => onChange(u)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${isSel
                ? 'bg-blue-50 dark:bg-blue-600/30 text-blue-700 dark:text-white border border-blue-200 dark:border-blue-500/50 font-medium'
                : 'hover:bg-white dark:hover:bg-[#27272a] text-gray-800 dark:text-gray-200 border border-transparent hover:border-gray-200 dark:hover:border-transparent'
                }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                  {u.initials || 'U'}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{u.name}</span>
                  <span className="opacity-60 text-xs">{u.email}</span>
                </div>
              </span>
              {isSel && <FaCheck className="text-blue-600 dark:text-blue-400" size={14} />}
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm opacity-60">
            No team members found
          </div>
        )}
      </div>
    </div>
  );
}

const NewConversationModal = ({
  showNewConversation,
  setShowNewConversation,
  theme,
  conversationType,
  setConversationType,
  orgUsers,
  userDetails,
  selectedDmUser,
  setSelectedDmUser,
  groupName,
  setGroupName,
  groupAvatar,
  setGroupAvatar,
  groupMembers,
  setGroupMembers,
  isMembersOpen,
  setIsMembersOpen,
  memberQuery,
  setMemberQuery,
  memberDropdownRef,
  setConversations,
  selectConversationWithCleanup
}) => {
  if (!showNewConversation) return null;

  const resetState = () => {
    setShowNewConversation(false);
    setConversationType('dm');
    setGroupName('');
    setGroupAvatar('');
    setGroupMembers([]);
    setSelectedDmUser(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border shadow-2xl bg-white dark:bg-dark-bg border-gray-100 dark:border-[#27272a] text-gray-900 dark:text-white p-6 h-[600px] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#27272a] mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold">
              {conversationType === 'dm' ? <FaUser size={16} /> : <FaUsers size={16} />}
            </div>
            <div>
              <h3 className="text-lg font-bold">New Conversation</h3>
              <p className="text-xs opacity-60">Start a direct message or create a group chat</p>
            </div>
          </div>
          <button
            onClick={resetState}
            className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-[#27272a] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-1 rounded-xl flex gap-1 mb-4 flex-shrink-0 bg-gray-100 dark:bg-[#27272a]">
          <button
            type="button"
            onClick={() => setConversationType('dm')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${conversationType === 'dm'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <FaUser size={13} /> Direct Message
          </button>
          <button
            type="button"
            onClick={() => setConversationType('group')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${conversationType === 'group'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <FaUsers size={14} /> Group Chat
          </button>
        </div>

        {/* Form Body - Fixed Consistent Height */}
        <div className="flex-1 min-h-[330px] flex flex-col justify-start">
          {conversationType === 'dm' ? (
            <SingleUserList
              theme={theme}
              users={orgUsers.filter((u) => String(u._id) !== String(userDetails?._id))}
              selected={selectedDmUser}
              onChange={setSelectedDmUser}
            />
          ) : (
            <div className="flex flex-col gap-4 h-[330px] overflow-y-auto pr-1 custom-scrollbar">
              {/* Group Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">Group Name</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-gray-50 dark:bg-[#27272a] border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white"
                  placeholder="e.g. Design Team, Frontend Sprint"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              {/* Group Avatar Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">Group Icon</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-inner bg-blue-50 dark:bg-[#27272a] text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-[#3f3f46]">
                    {groupAvatar ? (
                      <img src={groupAvatar} alt="Group Avatar" className="w-12 h-12 rounded-2xl object-cover" />
                    ) : (
                      (() => {
                        const parts = (groupName || '').split(' ').filter(Boolean);
                        return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'GR';
                      })()
                    )}
                  </div>
                  <label className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer border border-gray-200 dark:border-[#3f3f46] hover:bg-gray-50 dark:hover:bg-[#27272a] text-gray-700 dark:text-gray-300 transition-all flex items-center gap-2">
                    <FaUpload size={12} /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const form = new FormData();
                        form.append('file', file);
                        form.append('filename', file.name);
                        const res = await messagingService.uploadChatMedia(form);
                        setGroupAvatar(res?.url || res?.attachment?.FileURL || '');
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Multi-Select Members Dropdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">Add Members</label>
                <div className="relative" ref={memberDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsMembersOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all bg-gray-50 dark:bg-[#27272a] border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white hover:border-blue-500"
                  >
                    <div className="flex flex-wrap gap-1.5 items-center min-h-[24px]">
                      {groupMembers.length === 0 && <span className="opacity-60">Select team members...</span>}
                      {groupMembers.map((u) => (
                        <span key={u._id} className="px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-200 dark:border-[#52525b] flex items-center gap-1.5 bg-blue-50 dark:bg-[#3f3f46]/40 text-primary dark:text-gray-200">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                            {u.initials}
                          </span>
                          {u.name}
                          {String(u._id) !== String(userDetails?._id) && (
                            <button
                              type="button"
                              className="hover:opacity-75 rounded-full px-1 text-xs font-bold"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupMembers((prev) => prev.filter((m) => m._id !== u._id));
                              }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    <FaChevronDown className={`ml-2 text-xs transition-transform duration-200 ${isMembersOpen ? 'rotate-180' : ''} text-gray-500 dark:text-gray-400`} />
                  </button>

                  {isMembersOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl border border-gray-200 dark:border-[#3f3f46] shadow-xl overflow-hidden animate-in fade-in duration-150 bg-white dark:bg-dark-bg">
                      <div className="p-2 border-b border-gray-100 dark:border-[#27272a]">
                        <input
                          className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-blue-500 bg-gray-50 dark:bg-[#27272a] border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white"
                          placeholder="Search members..."
                          value={memberQuery}
                          onChange={(e) => setMemberQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                        {orgUsers
                          .filter((u) => {
                            const q = memberQuery.toLowerCase();
                            return !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                          })
                          .map((u) => {
                            const selected = groupMembers.some((m) => m._id === u._id);
                            const isCurrentUser = String(u._id) === String(userDetails?._id);
                            return (
                              <button
                                type="button"
                                key={u._id}
                                onClick={() => {
                                  if (!isCurrentUser) {
                                    setGroupMembers((prev) => (selected ? prev.filter((m) => m._id !== u._id) : [...prev, u]));
                                  }
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${selected
                                  ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#27272a] text-gray-800 dark:text-gray-200'
                                  } ${isCurrentUser ? 'cursor-not-allowed opacity-60' : ''}`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                                    {u.initials}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{u.name}</span>
                                    <span className="opacity-60 text-xs">{u.email}</span>
                                  </div>
                                  {isCurrentUser && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">You</span>}
                                </span>
                                {selected && <FaCheck className="text-blue-600 dark:text-blue-400" size={14} />}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-gray-200 dark:border-[#27272a] flex-shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-[#3f3f46] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors"
            onClick={resetState}
          >
            Cancel
          </button>
          {conversationType === 'dm' ? (
            <button
              type="button"
              disabled={!selectedDmUser}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                try {
                  if (!selectedDmUser) return;
                  const conv = await messagingService.getOrCreateDirectConversation(selectedDmUser._id);
                  setConversations((prev) => {
                    const exists = prev.find((c) => c._id === conv._id);
                    return exists ? prev : [conv, ...prev];
                  });
                  selectConversationWithCleanup(conv);
                  resetState();
                } catch (e) { }
              }}
            >
              Start Chat
            </button>
          ) : (
            <button
              type="button"
              disabled={!groupName.trim()}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                try {
                  let ids = groupMembers.map((u) => u._id);
                  if (userDetails && !ids.includes(userDetails._id)) {
                    ids.push(userDetails._id);
                  }
                  const conv = await messagingService.createGroup(groupName, ids, groupAvatar);
                  selectConversationWithCleanup(conv);
                  resetState();
                } catch (e) {
                  console.error('Failed to create group:', e);
                }
              }}
            >
              Create Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
