import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../context/ThemeContext';
import { getTaskTypeDetails, getPriorityStyle, useThemeClasses } from './kanbanUtils';
import { FaComment, FaPaperclip } from 'react-icons/fa';

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
        `p-3 rounded-lg mb-2 border ${canMove ? `border-${bgColor.replace('bg-', '')}-200 cursor-grab` : 'border-gray-200 cursor-not-allowed opacity-80'}`,
        `dark:border-gray-700 ${canMove ? 'dark:hover:bg-gray-700/30' : ''}`
      )}
      draggable={canMove}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      title={canMove ? "Drag to change status or click to view details" : "Click to view task details"}
      data-task-id={task.TaskID}
    >
      {/* Team Name Banner with Task Type */}
      <div className="flex items-center justify-between mb-2 -mt-0.5 -mx-0.5">

        {/* Task Type Badge */}
        <span className={getThemeClasses(
          `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${typeDetails.bgColor} ${typeDetails.textColor} border ${typeDetails.borderColor} shadow-sm flex-shrink-0`,
          `dark:${typeDetails.bgColor.replace('bg-', 'bg-')}/30 dark:${typeDetails.textColor.replace('text-', 'text-')}/90 dark:${typeDetails.borderColor.replace('border-', 'border-')}/50`
        )}>
          {typeDetails.icon}
          {task.Type}
        </span>

        {/* Task Priority Badge */}
        <span className={getThemeClasses(
          `inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${priorityDetails.bgColor} ${priorityDetails.textColor} border ${priorityDetails.borderColor}`,
          `dark:${priorityDetails.bgColor.replace('bg-', 'bg-')}/30 dark:${priorityDetails.textColor.replace('text-', 'text-')}/90 dark:${priorityDetails.borderColor.replace('border-', 'border-')}/50`
        )}>
          {priorityDetails.icon}
          {task.Priority}
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
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
        {/* Comments and Attachments Count (moved to left of footer) */}
        <div className="flex items-center gap-3">
          {task.commentsCount > 0 && (
            <div className={getThemeClasses(
              'flex items-center gap-1 text-xs text-gray-600',
              'dark:text-gray-400'
            )}>
              <FaComment className="w-3 h-3" />
              <span>{task.commentsCount}</span>
            </div>
          )}
          {task.attachmentsCount > 0 && (
            <div className={getThemeClasses(
              'flex items-center gap-1 text-xs text-gray-600',
              'dark:text-gray-400'
            )}>
              <FaPaperclip className="w-3 h-3" />
              <span>{task.attachmentsCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Badge - Only show for non-User Story tasks */}
          <div className="flex items-center">
            {/* Initials moved here */}
            {task.AssignedToDetails && (
              <div className={getThemeClasses(
                'rounded-lg border p-1 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium',
                'dark:from-blue-600 dark:to-blue-700'
              )}>
                {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
export default TaskCard; 