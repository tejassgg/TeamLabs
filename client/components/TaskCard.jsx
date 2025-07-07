import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../context/ThemeContext';
import { getTaskTypeDetails, getPriorityStyle, useThemeClasses } from './kanbanUtils';

const TaskCard = React.memo(({ task, statusCode, handleDragStart, handleDragEnd, isTaskAssignedToUser, bgColor }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();
  const cardRef = useRef(null);
  const canMove = isTaskAssignedToUser(task) || task.Status === 1;

  const typeDetails = getTaskTypeDetails(task.Type);
  const priorityDetails = task.Type !== 'User Story' ? getPriorityStyle(task.Priority) : null;

  const onDragStart = (e) => {
    if (!canMove) return;

    // Set task card dimensions to use for the placeholder
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      handleDragStart(task, e, {
        width: rect.width,
        height: rect.height,
        taskId: task.TaskID
      });
    } else {
      handleDragStart(task, e);
    }

    // This helps with drag image in some browsers
    if (e.dataTransfer.setDragImage && cardRef.current) {
      e.dataTransfer.setDragImage(cardRef.current, 20, 20);
    }
  };

  const handleCardClick = (e) => {
    // Don't navigate if we're dragging or if the click is on a button/action element
    if (e.target.closest('button') || e.target.closest('svg') || e.target.closest('path')) {
      return;
    }
    
    // Navigate to task details page
    router.push(`/task/${task.TaskID}`);
  };

  return (
    <div
      ref={cardRef}
      key={task.TaskID}
      className={getThemeClasses(
        `bg-white p-3 rounded-lg shadow-sm mb-2 border ${canMove ? `border-${bgColor.replace('bg-', '')}-200 cursor-grab` : 'border-gray-200 cursor-not-allowed opacity-80'}`,
        `dark:bg-gray-800 dark:border-gray-700 ${canMove ? 'dark:hover:bg-gray-700/50' : ''}`
      )}
      draggable={canMove}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      title={canMove ? "Drag to change status or click to view details" : "Click to view task details"}
      data-task-id={task.TaskID}
    >
      {/* Team Name Banner with Task Type and Priority Badges */}
      <div className="flex items-center justify-between mb-2 -mt-0.5 -mx-0.5">
        {task.AssignedTo && task.AssignedToDetails?.teamName && (
          <div className={getThemeClasses(
            'px-2 py-1 bg-purple-50 text-purple-700 border-b border-purple-100 rounded-tl-lg text-xs font-medium flex items-center gap-1',
            'dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50'
          )}>
            <svg className="w-3 h-3 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
            </svg>
            {task.AssignedToDetails.teamName}
          </div>
        )}

        {/* Task Type Badge */}
        <span className={getThemeClasses(
          `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${typeDetails.bgColor} ${typeDetails.textColor} border ${typeDetails.borderColor} shadow-sm flex-shrink-0`,
          `dark:${typeDetails.bgColor.replace('bg-', 'bg-')}/30 dark:${typeDetails.textColor.replace('text-', 'text-')}/90 dark:${typeDetails.borderColor.replace('border-', 'border-')}/50`
        )}>
          {typeDetails.icon}
          {task.Type}
        </span>
      </div>

      <div className={getThemeClasses(
        'text-gray-900',
        'dark:text-gray-100'
      )}>
        <h4 className="font-medium mb-1">{task.Name}</h4>
        {task.Description && (
          <p className={getThemeClasses(
            'text-sm text-gray-600',
            'dark:text-gray-400'
          )}>
            {task.Description}
          </p>
        )}
      </div>

      {/* Task Footer */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.AssignedToDetails && (
            <div className={getThemeClasses(
              'flex items-center gap-1.5 text-xs text-gray-600',
              'dark:text-gray-400'
            )}>
              <div className={getThemeClasses(
                'w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium',
                'dark:from-blue-600 dark:to-blue-700'
              )}>
                {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <span>{task.AssignedToDetails.fullName}</span>
            </div>
          )}
        </div>
        {/* Priority Badge - Only show for non-User Story tasks */}
        {task.Type !== 'User Story' && task.Priority && (
          <div className="flex items-center gap-1.5">
            {(() => {
              const priorityDetails = getPriorityStyle(task.Priority);
              return (
                <span className={getThemeClasses(
                  `inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${priorityDetails.bgColor} ${priorityDetails.textColor} border ${priorityDetails.borderColor}`,
                  `dark:${priorityDetails.bgColor.replace('bg-', 'bg-')}/30 dark:${priorityDetails.textColor.replace('text-', 'text-')}/90 dark:${priorityDetails.borderColor.replace('border-', 'border-')}/50`
                )}>
                  {priorityDetails.icon}
                  {task.Priority}
                </span>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
export default TaskCard; 