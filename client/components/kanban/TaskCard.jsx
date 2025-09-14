import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { getTaskTypeDetails, getPriorityStyle, useThemeClasses } from './kanbanUtils';
import { FaRegComment  } from 'react-icons/fa';
import { TiAttachment } from "react-icons/ti";

const TaskCard = React.memo(({ task, handleDragStart, handleDragEnd, isTaskAssignedToUser, bgColor }) => {
  const router = useRouter();
  const getThemeClasses = useThemeClasses();
  const cardRef = useRef(null);
  const canMove = isTaskAssignedToUser(task) || task.Status === 1;

  const typeDetails = getTaskTypeDetails(task.Type);
  const priorityDetails = task.Type !== 'User Story' ? getPriorityStyle(task.Priority) : null;

  // Get column color for checkmarks
  const getColumnColor = () => {
    const colorMap = {
      'bg-red-500': 'text-red-500',
      'bg-yellow-500': 'text-yellow-500',
      'bg-blue-500': 'text-blue-500',
      'bg-green-500': 'text-green-500',
      'bg-purple-500': 'text-purple-500',
      'bg-pink-500': 'text-pink-500',
      'bg-indigo-500': 'text-indigo-500',
      'bg-gray-500': 'text-gray-500'
    };
    return colorMap[bgColor] || 'text-blue-500';
  };
  const accentMap = {
    'bg-red-500': 'accent-red-500',
    'bg-yellow-500': 'accent-yellow-500',
    'bg-blue-500': 'accent-blue-500',
    'bg-green-500': 'accent-green-500',
    'bg-purple-500': 'accent-purple-500',
    'bg-pink-500': 'accent-pink-500',
    'bg-indigo-500': 'accent-indigo-500',
    'bg-gray-500': 'accent-gray-500'
  };

  const map = {
    'bg-red-500': 'bg-red-500',
    'bg-yellow-500': 'bg-yellow-500',
    'bg-blue-500': 'bg-blue-500',
    'bg-green-500': 'bg-green-500',
    'bg-purple-500': 'bg-purple-500',
    'bg-pink-500': 'bg-pink-500',
    'bg-indigo-500': 'bg-indigo-500',
    'bg-gray-500': 'bg-gray-500'
  };
  const getColumnBg = () => {
    // Normalize any bg-<hue>-<shade> to bg-<hue>-500 to keep a vivid tone
    if (typeof bgColor === 'string') {
      const match = bgColor.match(/bg-([a-z]+)-(\d{2,3})/);
      if (match && match[1]) {
        return `bg-${match[1]}-500`;
      }
    }
    return 'bg-blue-500';
  };

  // Calculate progress based on task status
  const getProgressPercentage = () => {
    const statusProgress = {
      1: 0,    // Not Assigned
      2: 20,   // Assigned
      3: 50,   // In Progress
      4: 70,   // QA
      5: 85,   // Deployment
      6: 100   // Completed
    };
    return statusProgress[task.Status] || 0;
  };

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
    <div ref={cardRef} key={task.TaskID}
      className={getThemeClasses(
        `p-3 rounded-xl mb-2 border ${canMove ? `border-${bgColor.replace('bg-', '')}-200 cursor-grab` : 'border-gray-200 cursor-not-allowed opacity-80'}`,
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

      {/* Subtasks Section */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 space-y-1 ">
          {task.subtasks.slice(0, 4).map((subtask) => (
            <div key={subtask.SubtaskID} className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center justify-center w-4 h-4 aspect-square rounded-full border flex-none shrink-0 leading-none ${subtask.IsCompleted ? getColumnBg() + ' border-transparent' : 'border-gray-300 bg-white'}`}
                aria-hidden="true"
              >
                {subtask.IsCompleted ? (
                  <svg viewBox="0 0 20 20" className="w-3 h-3 text-white">
                    <path fill="currentColor" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.793a1 1 0 0 1 1.414 0Z" />
                  </svg>
                ) : null}
              </span>
              <span className={getThemeClasses(
                `text-xs whitespace-normal break-words ${subtask.IsCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`,
                `dark:text-xs whitespace-normal break-words ${subtask.IsCompleted ? 'dark:line-through dark:text-gray-400' : 'dark:text-gray-300'}`
              )}>
                {subtask.Name}
              </span>
            </div>
          ))}
          {task.subtasks.length > 4 && (
            <div className="flex items-center gap-2">
              <span className={getThemeClasses(
                'text-xs text-gray-500',
                'dark:text-xs dark:text-gray-400'
              )}>
                +{task.subtasks.length - 4} more
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {task.AssignedToDetails && (
          <div className={getThemeClasses(
            'w-6 h-6 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-semibold',
            'dark:from-blue-600 dark:to-blue-700'
          )}>
            {task.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={getThemeClasses(
                'text-xs font-medium text-gray-700',
                'dark:text-xs dark:font-medium dark:text-gray-300'
              )}>
                Progress
              </span>
            </div>
            <span className={getThemeClasses(
              'text-xs text-gray-600',
              'dark:text-xs dark:text-gray-400'
            )}>
              {getProgressPercentage()}%
            </span>
          </div>
          <div className={getThemeClasses(
            'w-full bg-gray-200 rounded-full h-2',
            'dark:w-full dark:bg-gray-700 dark:rounded-full dark:h-2'
          )}>
            <div
              className={`h-2 rounded-full transition-all duration-300 bg-green-500`}
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Task Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
        {/* Left: Due By */}
        <div className="flex items-center gap-2">
          <span className={getThemeClasses('text-xs font-medium text-gray-700', 'text-xs font-medium text-white')}>
            Due {(() => {
              const d = task.AssignedDate || task.CreatedDate;
              return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) : 'No due date';
            })()}
          </span>
        </div>

        {/* Right: Comments & Attachments */}
        <div className="flex items-center gap-3">
          {task.commentsCount > 0 && (
            <div className={getThemeClasses(
              'flex items-center gap-1 text-xs text-gray-600',
              'dark:text-gray-400'
            )}>
              <FaRegComment size={12} />
              <span>{task.commentsCount}</span>
            </div>
          )}
          {task.attachmentsCount > 0 && (
            <div className={getThemeClasses(
              'flex items-center gap-1 text-xs text-gray-600',
              'dark:text-gray-400'
            )}>
              <TiAttachment size={16} />
              <span>{task.attachmentsCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
export default TaskCard; 