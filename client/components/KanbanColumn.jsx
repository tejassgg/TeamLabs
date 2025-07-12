import React from 'react';
import { useTheme } from '../context/ThemeContext';
import TaskCard from './TaskCard';
import { FaTasks } from 'react-icons/fa';
import { useThemeClasses, statusColors } from './kanbanUtils';

const KanbanColumn = React.memo(({ statusCode, statusName, icon, bgColor, tasks, handleDragStart, handleDragEnd, handleDrop, isTaskAssignedToUser, isLast, addTaskButton }) => {
  const { theme } = useTheme();
  const getThemeClasses = useThemeClasses();
  const tasksInStatus = tasks.filter(task => task.Status === statusCode);
  const statusStyle = statusColors[statusCode];
  const columnScrollClass = statusCode === 1 && tasksInStatus.length === 0 ? 'overflow-y-hidden' : 'overflow-y-auto';
  return (
    <div
      className={getThemeClasses(
        `flex flex-col h-[750px] ${!isLast ? 'border-r border-gray-200' : ''} bg-transparent`,
        `dark:${!isLast ? 'border-r border-gray-700' : ''} dark:bg-[#18191A]`
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(statusCode)}
    >
      <div className={getThemeClasses(
        `px-4 py-3 border-b ${statusStyle.borderLight} flex items-center gap-2 sticky top-0 bg-transparent`,
        `dark:${statusStyle.borderDark} dark:bg-transparent`
      )}>
        <div className={getThemeClasses(
          statusStyle.textLight,
          `dark:${statusStyle.textDark}`
        )}>
          {icon}
        </div>
        <h3 className={getThemeClasses(
          `font-semibold ${statusStyle.textLight}`,
          `dark:${statusStyle.textDark}`
        )}>
          {statusName}
        </h3>
        <span className={getThemeClasses(
          `ml-auto px-2 py-1 text-xs rounded-full border ${statusStyle.borderLight}`,
          `dark:${statusStyle.textDark} dark:${statusStyle.borderDark}`
        )}>
          {tasksInStatus.length}
        </span>
      </div>
      <div className={getThemeClasses(
        `p-3 flex-1 ${columnScrollClass} bg-transparent`,
        'dark:bg-transparent'
      )}>
        {/* Add New Task Button (only for Not Assigned column) */}
        {statusCode === 1 && addTaskButton && (
          <div className="mb-4">
            {addTaskButton}
          </div>
        )}
        {/* Task Cards */}
        {tasksInStatus.map(task => (
          <TaskCard
            key={task.TaskID}
            task={task}
            statusCode={statusCode}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            isTaskAssignedToUser={isTaskAssignedToUser}
            bgColor={statusStyle.light}
          />
        ))}
        {addTaskButton && statusCode !== 1 && addTaskButton}
        {tasksInStatus.length === 0 && (
          <div className={getThemeClasses(
            'flex flex-col items-center justify-center h-full text-gray-400',
            'dark:text-gray-500'
          )}>
            <FaTasks className="mb-2" size={24} />
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

export default KanbanColumn; 