import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

import { useGlobal } from '../../context/GlobalContext';
import { useToast } from '../../context/ToastContext';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaTasks } from 'react-icons/fa';
import { connectSocket, subscribe, getSocket } from '../../services/socket';
import { subtaskService } from '../../services/api';

const SubtaskList = ({ taskId, subtasks: initialSubtasks, onSubtasksChange }) => {
  const { theme } = useTheme();
  const { userDetails } = useGlobal();
  const { showToast } = useToast();

  const [subtasks, setSubtasks] = useState(initialSubtasks || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [loading, setLoading] = useState(false);

  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const NAME_LIMIT = 120;

  useEffect(() => {
    setSubtasks(initialSubtasks || []);
  }, [initialSubtasks]);

  useEffect(() => {
    if (showAddForm && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showAddForm]);

  useEffect(() => {
    if (editingSubtask && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [editingSubtask]);

  const beginInlineEdit = (subtask) => {
    if (!canEditSubtask(subtask)) return;
    setEditingSubtask(subtask);
    setEditingName(subtask.Name || '');
    setTimeout(() => descriptionInputRef.current?.focus(), 0);
  };

  const saveInlineEdit = async (subtask) => {
    const next = (editingName || '').trim();
    if (!next || next === subtask.Name) {
      setEditingSubtask(null);
      return;
    }
    if (next.length > NAME_LIMIT) {
      showToast(`Subtask name cannot exceed ${NAME_LIMIT} characters`, 'error');
      return;
    }
    await handleUpdateSubtask(subtask.SubtaskID, { Name: next });
  };

  // Socket connection for real-time updates
  useEffect(() => {
    if (!taskId) return;

    connectSocket();
    const socket = getSocket();

    if (socket) {
      socket.emit('subtask.join', { taskId });

      const unsubCreated = subscribe('task.subtask.created', (data) => {
        if (data.taskId === taskId) {
          setSubtasks((prev) => {
            const next = [...prev, data.subtask];
            onSubtasksChange && onSubtasksChange(next);
            return next;
          });
        }
      });

      const unsubUpdated = subscribe('task.subtask.updated', (data) => {
        if (data.taskId === taskId) {
          setSubtasks((prev) => {
            const next = prev.map((s) => s.SubtaskID === data.subtask.SubtaskID ? data.subtask : s);
            onSubtasksChange && onSubtasksChange(next);
            return next;
          });
        }
      });

      const unsubDeleted = subscribe('task.subtask.deleted', (data) => {
        if (data.taskId === taskId) {
          setSubtasks((prev) => {
            const next = prev.filter((s) => s.SubtaskID !== data.subtaskId);
            onSubtasksChange && onSubtasksChange(next);
            return next;
          });
        }
      });

      return () => {
        unsubCreated();
        unsubUpdated();
        unsubDeleted();
        socket.emit('subtask.leave', { taskId });
      };
    }
  }, [taskId, onSubtasksChange, showToast]);

  const handleCreateSubtask = async () => {
    if (!newSubtaskName.trim()) {
      showToast('Subtask name is required', 'error');
      return;
    }
    if (newSubtaskName.length > NAME_LIMIT) {
      showToast(`Subtask name cannot exceed ${NAME_LIMIT} characters`, 'error');
      return;
    }

    setLoading(true);
    try {
      await subtaskService.createSubtask({
        TaskID_FK: taskId,
        Name: newSubtaskName.trim()
      });

      showToast('Subtask created successfully', 'success');
      setNewSubtaskName('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating subtask:', error);
      showToast('Failed to create subtask', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    // Optimistic UI update
    setSubtasks((prev) => {
      const next = prev.map((s) => s.SubtaskID === subtaskId ? { ...s, IsCompleted: !s.IsCompleted } : s);
      onSubtasksChange && onSubtasksChange(next);
      return next;
    });

    try {
      await subtaskService.toggleSubtask(subtaskId);
    } catch (error) {
      // Rollback on failure
      setSubtasks((prev) => {
        const next = prev.map((s) => s.SubtaskID === subtaskId ? { ...s, IsCompleted: !s.IsCompleted } : s);
        onSubtasksChange && onSubtasksChange(next);
        return next;
      });
      console.error('Error toggling subtask:', error);
      showToast('Failed to toggle subtask', 'error');
    }
  };

  const handleUpdateSubtask = async (subtaskId, updates) => {
    try {
      await subtaskService.updateSubtask(subtaskId, updates);
      setEditingSubtask(null);
    } catch (error) {
      console.error('Error updating subtask:', error);
      showToast('Failed to update subtask', 'error');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!confirm('Are you sure you want to delete this subtask?')) {
      return;
    }

    try {
      await subtaskService.deleteSubtask(subtaskId);
      showToast('Subtask deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      showToast('Failed to delete subtask', 'error');
    }
  };

  const canEditSubtask = (subtask) => {
    return userDetails && userDetails._id === subtask.CreatedBy;
  };

  const canDeleteSubtask = (subtask) => {
    return userDetails && userDetails._id === subtask.CreatedBy;
  };

  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? darkClasses : lightClasses;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit'
    });
  };

  const getInitials = (fullName) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  if (!taskId) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FaTasks className={getThemeClasses("text-gray-500", "dark:text-gray-400")} />
        <span className={getThemeClasses("text-lg font-semibold text-gray-900", "dark:text-gray-100")}>Subtasks</span>
        <span className={getThemeClasses("bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full", "dark:bg-blue-900/30 dark:text-blue-300")}>{subtasks.length}</span>
      </div>

      {/* Subtasks List */}
      <div className="space-y-1">
        {subtasks.length === 0 ? (
          <div className={getThemeClasses(
            'text-center text-gray-500',
            'text-center text-gray-400'
          )}>
            <p>No subtasks yet.</p>
          </div>
        ) : (
          subtasks.map((subtask) => (
            <div
              key={subtask.SubtaskID}
              className={getThemeClasses(
                'px-2 py-2 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors',
                'px-2 py-2 bg-transparent border-b border-gray-700 hover:bg-white/5 transition-colors'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: checkbox + text */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    role="checkbox"
                    aria-checked={!!subtask.IsCompleted}
                    tabIndex={0}
                    onClick={() => handleToggleSubtask(subtask.SubtaskID)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleSubtask(subtask.SubtaskID); }}
                    className={getThemeClasses(
                      `inline-flex items-center justify-center w-4 h-4 rounded-full border ${subtask.IsCompleted ? 'bg-blue-600 border-transparent' : 'bg-white border-gray-300'}`,
                      `inline-flex items-center justify-center w-4 h-4 rounded-full border ${subtask.IsCompleted ? 'bg-blue-600 border-transparent' : 'bg-transparent border-gray-600'}`
                    )}
                    style={{ cursor: 'pointer' }}
                  >
                    {subtask.IsCompleted ? (
                      <svg viewBox="0 0 20 20" className="w-3 h-3 text-white">
                        <path fill="currentColor" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.793a1 1 0 0 1 1.414 0Z"/>
                      </svg>
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    {editingSubtask && editingSubtask.SubtaskID === subtask.SubtaskID ? (
                      <div>
                        <input
                          ref={descriptionInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value.slice(0, NAME_LIMIT))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveInlineEdit(subtask);
                            if (e.key === 'Escape') setEditingSubtask(null);
                          }}
                          onBlur={() => saveInlineEdit(subtask)}
                          className={getThemeClasses(
                            'w-full px-0 py-0 text-sm bg-transparent border-none focus:outline-none focus:ring-0',
                            'w-full px-0 py-0 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-white'
                          )}
                          maxLength={NAME_LIMIT}
                          autoFocus
                        />
                        <div className={getThemeClasses('text-[10px] text-gray-400 mt-0.5', 'text-[10px] text-gray-500 mt-0.5')}>
                          {editingName.length}/{NAME_LIMIT}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div
                          onClick={() => beginInlineEdit(subtask)}
                          className={getThemeClasses(
                            `text-md ${subtask.IsCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`,
                            `text-md ${subtask.IsCompleted ? 'line-through text-gray-500' : 'text-gray-100'}`
                          )}
                          style={{ cursor: canEditSubtask(subtask) ? 'text' : 'default' }}
                          title={canEditSubtask(subtask) ? 'Click to edit' : undefined}
                        >
                          {subtask.Name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: date + avatar + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={getThemeClasses('text-xs text-gray-500', 'text-xs text-gray-400')}>
                    {formatDate(subtask.CreatedDate)}
                  </span>
                  <div
                    className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                    title={subtask.CreatedByDetails?.fullName || 'Unknown'}
                  >
                    {getInitials(subtask.CreatedByDetails?.fullName)}
                  </div>
                  {/* Actions */}
                  {!editingSubtask && (
                    <div className="flex items-center gap-1">
                      {canDeleteSubtask(subtask) && (
                        <button
                          onClick={() => handleDeleteSubtask(subtask.SubtaskID)}
                          className={getThemeClasses(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200",
                            "dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                          )}
                          title="Delete subtask"
                        >
                          <FaTrash size={12} className='text-red-500 dark:text-red-400' />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline Add Row */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className={getThemeClasses(
            'w-full text-left flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-2 py-2',
            'w-full text-left flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 px-2 py-2'
          )}
        >
          <span className={getThemeClasses('text-gray-400', 'text-gray-500')}>+</span>
          <span>Add subtask</span>
        </button>
      )}

      {/* Add Subtask Form (inline) */}
      {showAddForm && (
        <div className={getThemeClasses(
          'px-2 py-2 bg-white border-b border-gray-200',
          'px-2 py-2 bg-transparent border-b border-gray-700'
        )}>
          <div className="flex items-center gap-2">
            {/* Circular placeholder checkbox */}
            <span
              className={getThemeClasses(
                'inline-flex items-center justify-center w-4 h-4 rounded-full border bg-white border-gray-300',
                'inline-flex items-center justify-center w-4 h-4 rounded-full border bg-transparent border-gray-600'
              )}
            />
            <input
              ref={nameInputRef}
              type="text"
              value={newSubtaskName}
              onChange={(e) => setNewSubtaskName(e.target.value.slice(0, NAME_LIMIT))}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await handleCreateSubtask();
                }
                if (e.key === 'Escape') {
                  setShowAddForm(false);
                  setNewSubtaskName('');
                }
              }}
              onBlur={async () => {
                if (newSubtaskName.trim()) {
                  await handleCreateSubtask();
                } else {
                  setShowAddForm(false);
                }
              }}
              placeholder="Add a subtask"
              className={getThemeClasses(
                'w-full px-0 py-0 text-sm bg-transparent border-none focus:outline-none focus:ring-0',
                'w-full px-0 py-0 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-white'
              )}
              maxLength={NAME_LIMIT}
              autoFocus
            />
            <span className={getThemeClasses('ml-auto text-[10px] text-gray-400', 'ml-auto text-[10px] text-gray-500')}>
              {newSubtaskName.length}/{NAME_LIMIT}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtaskList;
