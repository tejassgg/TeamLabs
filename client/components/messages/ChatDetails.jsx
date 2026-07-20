import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaEdit, FaSave, FaSearch } from 'react-icons/fa';
import { messagingService } from '../../services/api';

const ChatDetails = ({
  theme,
  showDetails,
  isDetailsAnimating,
  handleCloseDetails,
  convDetails,
  userDetails,
  isEditingGroupName,
  editInputRef,
  editedGroupName,
  setEditedGroupName,
  handleSaveGroupName,
  handleCancelEditGroupName,
  isSavingGroupName,
  handleEditGroupName,
  activeDetailsTab,
  setActiveDetailsTab,
  handleRemoveMember,
  orgUsers,
  showToast,
  selectedConversation,
  convAssets
}) => {
  if (!showDetails) return null;
  const panel = theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isDetailsAnimating ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleCloseDetails}
      />
      <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-lg ${theme === 'dark' ? 'bg-dark-bg text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-dark-card' : 'border-gray-200'} p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isDetailsAnimating ? 'translate-x-full' : 'translate-x-0'}`}>

        {convDetails && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {convDetails.isGroup && convDetails.avatarUrl ? (
                  <img src={convDetails.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
                    {(() => {
                      if (!convDetails.isGroup) {
                        const other = convDetails.participants?.find(p => String(p._id) !== String(userDetails?._id));
                        if (other) {
                          return `${(other.firstName || '')[0] || ''}${(other.lastName || '')[0] || ''}`.toUpperCase() || 'U';
                        }
                        return 'U';
                      }
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
                        <div className="font-semibold text-lg">{convDetails.isGroup ? (convDetails.name || 'Group') : (convDetails.participants?.filter(p => String(p._id) !== String(userDetails?._id)).map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim()).join(', ') || 'Direct Message')}</div>
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
              <button className={`${theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-gray-100'} rounded-lg px-3 py-1 touch-manipulation`} onClick={handleCloseDetails}><FaTimes /></button>
            </div>
            <div className={`border-b mb-4 ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
              <nav className="-mb-px flex items-center justify-between">
                <div className="flex space-x-8">
                  {(convDetails.isGroup ? ['details', 'files', 'links'] : ['files', 'links']).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveDetailsTab(tab)}
                      className={`${activeDetailsTab === tab
                        ? theme === 'dark'
                          ? 'border-blue-400 text-blue-400'
                          : 'border-blue-600 text-blue-600'
                        : theme === 'dark'
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm capitalize transition-all duration-200`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
            {activeDetailsTab === 'details' && (
              <div className="space-y-4">
                <div className="mb-6">
                  <div className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Members</div>
                  <div className="flex flex-col space-y-2">
                    {convDetails.participants?.map(p => {
                      const initials = `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase() || 'U';
                      const isGroupAdmin = convDetails?.createdBy === userDetails?._id || convDetails?.admins?.includes(userDetails?._id);
                      const isCurrentUser = String(p._id) === String(userDetails?._id);
                      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
                      const isAdminUser = String(p._id) === String(convDetails?.createdBy) || convDetails?.admins?.includes(p._id);

                      return (
                        <div key={p._id} className={`flex items-center justify-between p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{initials}</span>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{fullName}</span>
                                {isCurrentUser && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">You</span>}
                                {isAdminUser && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Admin</span>}
                              </div>
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{p.email}</span>
                            </div>
                          </div>
                          {isGroupAdmin && !isCurrentUser && (
                            <button
                              onClick={() => handleRemoveMember(p._id, fullName)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
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
                          const memberCount = ids.length;
                          const loadingMessage = memberCount === 1 ? 'Adding member...' : `Adding ${memberCount} members...`;
                          showToast(loadingMessage, 'info');
                          await messagingService.addMembers(selectedConversation._id, ids);
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
  );
};

export function AddMembersDropdown({ theme, panel, orgUsers, onAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const clickOut = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className={`w-full px-3 py-2 text-left rounded-lg border ${panel} text-sm`}>
        {selected.length === 0 ? 'Select members to add' : `${selected.length} selected`}
      </button>
      {open && (
        <div className={`absolute bottom-full left-0 right-0 mb-1 z-50 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} flex flex-col max-h-64`}>
          <div className="p-2 border-b border-gray-200 dark:border-dark-border">
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={12} />
              <input
                className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-md border ${panel}`}
                placeholder="Search..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto py-1 flex-1">
            {orgUsers.filter(u => !query || u.name.toLowerCase().includes(query.toLowerCase())).map(u => {
              const sel = selected.includes(u._id);
              return (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => setSelected(prev => sel ? prev.filter(id => id !== u._id) : [...prev, u._id])}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${sel ? (theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-50') : (theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50')}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>{u.initials}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{u.name}</div>
                  </div>
                  {sel && <div className="text-blue-500">✓</div>}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-dark-border">
              <button
                type="button"
                onClick={() => {
                  onAdd(selected);
                  setSelected([]);
                  setOpen(false);
                }}
                className={`w-full py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700`}
              >
                Add {selected.length} {selected.length === 1 ? 'member' : 'members'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatDetails;
