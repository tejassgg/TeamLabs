import React from 'react';
import { FaCheck, FaCircle, FaTasks } from 'react-icons/fa';

const SubtaskDisplay = ({ subtasks, theme }) => {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const completedCount = subtasks.filter(subtask => subtask.IsCompleted).length;
  const totalCount = subtasks.length;

  const getThemeClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  return (
    <div className={`mt-2 p-2 rounded-lg border ${getThemeClasses('bg-gray-50 border-gray-200', 'bg-gray-800/50 border-gray-700')}`}>
      <div className="flex items-center gap-2 mb-2">
        <FaTasks size={12} className={getThemeClasses('text-gray-500', 'text-gray-400')} />
        <span className={`text-xs font-medium ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
          Subtasks ({completedCount}/{totalCount})
        </span>
      </div>
      
      <div className="space-y-1">
        {subtasks.slice(0, 3).map((subtask) => (
          <div key={subtask.SubtaskID} className="flex items-center gap-2">
            {subtask.IsCompleted ? (
              <FaCheck size={10} className="text-green-500" />
            ) : (
              <FaCircle size={8} className={getThemeClasses('text-gray-400', 'text-gray-500')} />
            )}
            <span className={`text-xs truncate ${getThemeClasses(
              subtask.IsCompleted ? 'text-gray-500 line-through' : 'text-gray-700',
              subtask.IsCompleted ? 'text-gray-500 line-through' : 'text-gray-300'
            )}`}>
              {subtask.Name}
            </span>
          </div>
        ))}
        
        {subtasks.length > 3 && (
          <div className={`text-xs ${getThemeClasses('text-gray-500', 'text-gray-400')}`}>
            +{subtasks.length - 3} more subtasks
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtaskDisplay;
