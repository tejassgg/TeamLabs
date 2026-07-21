import React from 'react';

const ProjectPriorityBadge = ({ priority = 2, size = 'sm', showLabel = false, className = '' }) => {

  // 0: Critical (Rose/Purple), 1: High (Red), 2: Medium (Amber/Yellow), 3: Low (Emerald/Green)
  const label = priority === 0 ? 'Critical' : priority === 1 ? 'High' : priority === 2 ? 'Medium' : 'Low';

  const activeColor =
    priority === 0
      ? 'bg-rose-600 dark:bg-rose-500 animate-pulse'
      : priority === 1
        ? 'bg-red-500 dark:bg-red-500'
        : priority === 2
          ? 'bg-amber-500 dark:bg-amber-400'
          : 'bg-emerald-500 dark:bg-emerald-400';

  const inactiveColor = 'bg-gray-300 dark:bg-dark-border';

  const textColor =
    priority === 0
      ? 'text-rose-700'
      : priority === 1
        ? 'text-red-700'
        : priority === 2
          ? 'text-amber-500'
          : 'text-emerald-700';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`} title={`Priority: ${label}`}>
      <div className={`w-5 h-5 rounded-md bg-gray-100 dark:bg-dark-card border flex items-end justify-center gap-[2px] p-[3px] flex-shrink-0 shadow-2xs ${priority === 0 ? 'border-rose-300 dark:border-rose-800' : 'border-gray-200/80 dark:border-dark-border'}`}>
        {/* Bar 1 (Short - 35%) */}
        <span className={`w-[3px] h-[35%] rounded-2xs transition-colors ${activeColor}`} />
        {/* Bar 2 (Medium - 65%) */}
        <span className={`w-[3px] h-[65%] rounded-2xs transition-colors ${priority <= 2 ? activeColor : inactiveColor}`} />
        {/* Bar 3 (Tall - 100%) */}
        <span className={`w-[3px] h-[100%] rounded-2xs transition-colors ${priority <= 1 ? activeColor : inactiveColor}`} />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold px-2 py-0.5 ${textColor}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default ProjectPriorityBadge;
