import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useThemeClasses } from './kanbanUtils';
import { getPriorityBadge, getTaskTypeBadge } from '../task/TaskTypeBadge';
import { FaRegComment } from 'react-icons/fa';
import { TiAttachment } from "react-icons/ti";

const TaskCard = React.memo(({ task, handleDragStart, handleDragEnd, isTaskAssignedToUser, bgColor }) => {
  const router = useRouter();
  const getThemeClasses = useThemeClasses();
  const cardRef = useRef(null);
  const isSupport = task.Name?.startsWith('Support Request:');
  const canMove = isSupport || isTaskAssignedToUser(task) || task.Status === 1;

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

  // isSupport already computed above to control draggable permission
  return (
    <div ref={cardRef} key={task.TaskID}
      className={getThemeClasses(
        `${isSupport ? 'p-3 rounded-xl mb-2 border border-amber-300 bg-amber-50' : 'p-3 rounded-xl mb-2 border'} ${canMove ? (isSupport ? 'cursor-grab' : `border-${bgColor.replace('bg-', '')}-200 cursor-grab`) : 'border-gray-200 cursor-not-allowed opacity-80'}`,
        `${isSupport ? 'dark:border-amber-600 dark:bg-amber-900/20' : 'dark:border-gray-700'} ${canMove && !isSupport ? 'dark:hover:bg-gray-700/30' : ''}`
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
        {getTaskTypeBadge(task.Type)}

        {/* Task Priority Badge */}
        {task.Type !== 'User Story' && task.Priority && getPriorityBadge(task.Priority)}

      </div>

      <div className={getThemeClasses(
        'mb-1 text-gray-900',
        'dark:text-gray-100'
      )}>
        <span className={getThemeClasses('text-sm font-medium text-gray-900', 'dark:text-gray-100')}>
          {task.Name}
        </span>
        {task.Description && (
          <p className={getThemeClasses('text-sm text-gray-600', 'dark:text-gray-400')}>
            {task.Description}
          </p>
        )}
      </div>

      <h4 className="font-medium mb-1 flex items-center justify-start gap-2 mt-1">
        {isSupport && (
          <span className={getThemeClasses(
            "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200",
            "dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
          )}>Support</span>
        )}
        {isSupport && task.TicketNumber && (
          <span className={getThemeClasses(
            "ml-auto text-[10px] font-medium px-2 py-0.5 rounded bg-amber-200 text-amber-800 border border-amber-300",
            "dark:bg-amber-800 dark:text-amber-100 dark:border-amber-700"
          )}>#{task.TicketNumber}</span>
        )}
      </h4>

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