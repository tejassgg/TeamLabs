import React, { useState, useEffect } from 'react';
import { FaUsers, FaEye, FaEdit, FaChevronDown, FaCircle } from 'react-icons/fa';

import { useGlobal } from '../../context/GlobalContext';
import { connectSocket, subscribe, getSocket } from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';

const TaskCollaborationIndicator = ({ taskId, projectId }) => {
  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const [collaborators, setCollaborators] = useState([]);
  const [isExpanded, setIsExpanded] = useState(null); // Start expanded by default to show all collaborators

  useEffect(() => {
    if (!taskId) return;
    connectSocket();
    const socket = getSocket();

    if (socket) {
      // Join task collaboration room
      socket.emit('task.collaboration.join', { taskId, projectId });

      // Listen for server-driven full state updates
      const unsubState = subscribe('task.collaboration.state', (payload) => {
        const { data } = payload || {};
        if (!data || data.taskId !== taskId) return;
        const safeUsers = Array.isArray(data.users) ? data.users : [];
        // Exclude current user from collaborators array; we add current user separately in memo
        setCollaborators(safeUsers.filter(u => u.userId !== userDetails?._id));
      });

      // Emit user's current action (viewing by default)
      socket.emit('task.collaboration.action', { 
        taskId, 
        projectId, 
        action: 'viewing' 
      });

      // Emit join event (server will broadcast full state)
      socket.emit('task.collaboration.join', { 
        taskId, 
        projectId, 
        action: 'viewing' 
      });

      return () => {
        unsubState();
        socket.emit('task.collaboration.leave', { taskId, projectId });
      };
    }
  }, [taskId, projectId]);

  // Update action when user starts editing
  const updateUserAction = (action) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('task.collaboration.action', { 
        taskId, 
        projectId, 
        action 
      });
    }
  };

  // Listen for editing events to update action
  useEffect(() => {
    if (!taskId) return;

    const handleEditStart = () => updateUserAction('editing');
    const handleEditEnd = () => updateUserAction('viewing');

    // Add event listeners for common editing actions
    document.addEventListener('focusin', (e) => {
      if (e.target.closest(`[data-task-id="${taskId}"]`)) {
        if (e.target.matches('input, textarea, [contenteditable]')) {
          handleEditStart();
        }
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target.closest(`[data-task-id="${taskId}"]`)) {
        if (e.target.matches('input, textarea, [contenteditable]')) {
          // Delay to allow for save operations
          setTimeout(handleEditEnd, 1000);
        }
      }
    });

    return () => {
      document.removeEventListener('focusin', handleEditStart);
      document.removeEventListener('focusout', handleEditEnd);
    };
  }, [taskId]);

  // Add current user to collaborators list if not already present
  const allActiveUsers = React.useMemo(() => {
    const currentUserInList = collaborators.find(c => c.userId === userDetails?._id);
    if (!currentUserInList && userDetails) {
      return [{
        userId: userDetails._id,
        name: userDetails.name || `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || 'You',
        action: 'viewing',
        joinedAt: new Date(),
        isCurrentUser: true
      }, ...collaborators];
    }
    return collaborators.map(c => ({
      ...c,
      isCurrentUser: c.userId === userDetails?._id
    }));
  }, [collaborators, userDetails]);

  // Helper function to get initials from name - following existing system pattern
  const getInitials = (name) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
  };

  // Always show the indicator if there are any users (including current user)
  if (allActiveUsers.length === 0) return null;

  const getActionColor = (action) => {
    return action === 'editing' ? 'orange' : 'blue';
  };

  const getActionText = (action) => {
    return action === 'editing' ? 'editing' : 'viewing';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          theme === 'dark' 
            ? 'hover:bg-gray-600/70 text-gray-200' 
            : 'hover:bg-gray-200/90 text-gray-700'
        }`}
        title={allActiveUsers.length === 1 ? 'You are here' : 'Show active collaborators'}
      >
        <div className="flex items-center -space-x-1">
          {allActiveUsers.slice(0, 3).map((collaborator, index) => (
            <div
              key={collaborator.userId}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                collaborator.isCurrentUser
                  ? 'bg-green-500 text-white'
                  : collaborator.action === 'editing' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-blue-500 text-white'
              }`}
              title={`${collaborator.name} (${collaborator.isCurrentUser ? 'you' : getActionText(collaborator.action)})`}
            >
              {getInitials(collaborator.name)}
            </div>
          ))}
          {allActiveUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-medium">
              +{allActiveUsers.length - 3}
            </div>
          )}
        </div>
        
        <span className="text-xs opacity-75">
          {allActiveUsers.length === 1 ? 'You' : `${allActiveUsers.length} active`}
        </span>
        
        <FaChevronDown 
          size={10} 
          className={`transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isExpanded && (
        <div className={`absolute top-full right-0 mt-2 p-4 rounded-xl shadow-xl border z-50 min-w-72 transition-all duration-300 ease-out ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-600 shadow-2xl' 
            : 'bg-white border-gray-200 shadow-lg'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2">
            <div className="flex items-center gap-2">
              <FaUsers className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                {allActiveUsers.length === 1 ? 'You' : `Active Collaborators (${allActiveUsers.length})`}
              </span>
            </div>
          </div>
          
          {/* Users List - Unified */}
          <div className="space-y-2">
            {allActiveUsers.map(collaborator => {
              const actionColor = getActionColor(collaborator.action);
              const isCurrentUser = collaborator.isCurrentUser;
              
              return (
                <div key={collaborator.userId} 
                  className={`group relative overflow-hidden ${
                    theme === 'dark' 
                      ? `bg-${actionColor}-900/20 ` 
                      : `bg-${actionColor}-50 `
                  } rounded-lg p-3 transition-all duration-200 hover:shadow-md`}
                >
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className={`absolute top-0 right-0 w-12 h-12 bg-${actionColor}-500 rounded-full -translate-y-6 translate-x-6`}></div>
                    <div className={`absolute bottom-0 left-0 w-8 h-8 bg-${actionColor}-400 rounded-full translate-y-4 -translate-x-4`}></div>
                  </div>
                  
                  <div className="relative flex items-center gap-3">
                                         <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                       isCurrentUser
                         ? theme === 'dark'
                           ? 'bg-green-500 text-white ring-2 ring-green-400/30'
                           : 'bg-green-400 text-white ring-2 ring-green-200'
                         : theme === 'dark'
                           ? `bg-${actionColor}-500 text-white ring-2 ring-${actionColor}-400/30`
                           : `bg-${actionColor}-400 text-white ring-2 ring-${actionColor}-200`
                     }`}>
                       <span className="text-white font-extrabold tracking-wide">
                         {getInitials(collaborator.name)}
                       </span>
                      
                      {/* Status indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        isCurrentUser
                          ? 'bg-green-500'
                          : collaborator.action === 'editing'
                            ? 'bg-orange-500 animate-pulse'
                            : 'bg-blue-500'
                      }`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                        {isCurrentUser ? 'You' : collaborator.name}
                      </div>
                      <div className={`text-xs flex items-center gap-1 ${theme === 'dark' ? `text-${actionColor}-300` : `text-${actionColor}-600`}`}>
                        <span className="font-medium">
                          {isCurrentUser ? 'You are ' : ''}{getActionText(collaborator.action)} this task
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCollaborationIndicator;
