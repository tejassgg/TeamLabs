import React from 'react';

const KanbanSkeleton = ({ embedded = false }) => {


  // Render a mock skeleton task card
  const SkeletonTaskCard = ({ hasSubtasks = false, progress = '30%' }) => (
    <div
      className={`p-4 rounded-xl border mb-3 flex flex-col gap-3 shadow-sm ${'bg-white border-gray-200 dark:bg-[#1e1e24] dark:border-zinc-800/80'}`}
    >
      {/* Category and Priority Header */}
      <div className="flex items-center justify-between">
        <div className={'h-5 bg-gray-200 rounded w-20 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded dark:w-20 dark:animate-pulse'}></div>
        <div className={'h-5 bg-gray-100 rounded w-16 animate-pulse dark:h-5 dark:bg-zinc-800/50 dark:rounded dark:w-16 dark:animate-pulse'}></div>
      </div>

      {/* Task Title */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className={'h-4 bg-gray-250 bg-gray-200 rounded w-full animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-full dark:animate-pulse'}></div>
        <div className={'h-4 bg-gray-200 rounded w-2/3 animate-pulse dark:h-4 dark:bg-zinc-800/80 dark:rounded dark:w-2/3 dark:animate-pulse'}></div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1 mt-1">
        <div className={'h-3 bg-gray-100 rounded w-11/12 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-11/12 dark:animate-pulse'}></div>
        <div className={'h-3 bg-gray-100 rounded w-10/12 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-10/12 dark:animate-pulse'}></div>
      </div>

      {/* Mock Subtasks */}
      {hasSubtasks && (
        <div className="flex flex-col gap-2 mt-1 border-t border-gray-50 dark:border-zinc-800/40 pt-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={'w-3.5 h-3.5 bg-gray-200 rounded animate-pulse dark:w-3.5 dark:h-3.5 dark:bg-zinc-800 dark:rounded dark:animate-pulse'}></div>
              <div className={'h-3 bg-gray-100 rounded w-24 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-24 dark:animate-pulse'}></div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="flex flex-col gap-1.5 mt-2">
        <div className="flex justify-between items-center text-xs">
          <div className={'h-3 bg-gray-100 rounded w-10 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-10 dark:animate-pulse'}></div>
          <div className={'h-3 bg-gray-100 rounded w-6 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-6 dark:animate-pulse'}></div>
        </div>
        <div className={'w-full h-1.5 bg-gray-100 rounded-full overflow-hidden dark:w-full dark:h-1.5 dark:bg-zinc-800 dark:rounded-full dark:overflow-hidden'}>
          <div
            className={'h-full bg-gray-300 rounded-full animate-pulse dark:h-full dark:bg-zinc-700 dark:rounded-full dark:animate-pulse'}
            style={{ width: progress }}
          ></div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-zinc-800/60">
        {/* Left: Due Date */}
        <div className="flex items-center gap-1.5">
          <div className={'w-3 h-3 bg-gray-200 rounded-full animate-pulse dark:w-3 dark:h-3 dark:bg-zinc-800 dark:rounded-full dark:animate-pulse'}></div>
          <div className={'h-3 bg-gray-100 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800/60 dark:rounded dark:w-16 dark:animate-pulse'}></div>
        </div>

        {/* Right: Comments Count & Avatar */}
        <div className="flex items-center gap-2">
          <div className={'w-3.5 h-3.5 bg-gray-100 rounded animate-pulse dark:w-3.5 dark:h-3.5 dark:bg-zinc-800/50 dark:rounded dark:animate-pulse'}></div>
          <div className={'w-5 h-5 bg-gray-200 rounded-full animate-pulse dark:w-5 dark:h-5 dark:bg-zinc-800 dark:rounded-full dark:animate-pulse'}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4">
      {/* Currently Viewing Banner Skeleton */}
      {!embedded && (
        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row mb-6">
          <div
            className={`flex-1 p-4 rounded-xl border flex items-center gap-3 w-full ${'bg-blue-50/50 border-blue-100/80 dark:bg-blue-950/10 dark:border-blue-900/30'}`}
          >
            <div className={'w-5 h-5 bg-blue-200 rounded-full animate-pulse dark:w-5 dark:h-5 dark:bg-blue-900/50 dark:rounded-full dark:animate-pulse'}></div>
            <div className="flex flex-col gap-1.5">
              <div className={'h-3 bg-blue-100 rounded w-48 animate-pulse dark:h-3 dark:bg-blue-900/40 dark:rounded dark:w-48 dark:animate-pulse'}></div>
              <div className={'h-3 bg-blue-50/50 rounded w-64 animate-pulse dark:h-3 dark:bg-blue-900/20 dark:rounded dark:w-64 dark:animate-pulse'}></div>
            </div>
          </div>
          {/* Project Selector Dropdown mock */}
          <div className={'h-11 w-full sm:w-64 bg-gray-200 rounded-xl animate-pulse dark:h-11 dark:w-full dark:sm:w-64 dark:bg-zinc-800 dark:rounded-xl dark:animate-pulse'}></div>
        </div>
      )}

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {/* Column 1: Not Assigned */}
        <div className="flex flex-col h-full min-h-[500px]">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full bg-gray-300 animate-pulse dark:w-2 dark:h-2 dark:rounded-full dark:bg-zinc-600 dark:animate-pulse'}></div>
              <div className={'h-4 bg-gray-200 rounded w-20 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-20 dark:animate-pulse'}></div>
            </div>
            <div className={'h-5 bg-gray-100 rounded-full w-8 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded-full dark:w-8 dark:animate-pulse'}></div>
          </div>

          {/* Add New Task button template */}
          <div className={`p-4 rounded-xl border border-dashed text-center mb-3 flex items-center justify-center ${'border-gray-300 text-gray-400 bg-gray-50/20 dark:border-zinc-800 dark:text-zinc-600 dark:bg-transparent'}`}>
            <div className={'h-4 bg-gray-205 bg-gray-200 rounded w-24 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-24 dark:animate-pulse'}></div>
          </div>

          {/* No tasks placeholder */}
          <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
            <div className={'w-10 h-10 bg-gray-200 rounded mb-2 animate-pulse dark:w-10 dark:h-10 dark:bg-zinc-800 dark:rounded dark:mb-2 dark:animate-pulse'}></div>
            <div className={'h-3 bg-gray-200 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-16 dark:animate-pulse'}></div>
          </div>
        </div>

        {/* Column 2: Assigned */}
        <div className="flex flex-col h-full min-h-[500px]">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <div className={'h-4 bg-gray-200 rounded w-16 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-16 dark:animate-pulse'}></div>
            </div>
            <div className={'h-5 bg-gray-100 rounded-full w-8 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded-full dark:w-8 dark:animate-pulse'}></div>
          </div>

          <SkeletonTaskCard hasSubtasks={false} progress="20%" />
          <SkeletonTaskCard hasSubtasks={true} progress="20%" />
        </div>

        {/* Column 3: In Progress */}
        <div className="flex flex-col h-full min-h-[500px]">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <div className={'h-4 bg-gray-200 rounded w-20 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-20 dark:animate-pulse'}></div>
            </div>
            <div className={'h-5 bg-gray-100 rounded-full w-8 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded-full dark:w-8 dark:animate-pulse'}></div>
          </div>

          <SkeletonTaskCard hasSubtasks={false} progress="50%" />
        </div>

        {/* Column 4: QA */}
        <div className="flex flex-col h-full min-h-[500px]">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <div className={'h-4 bg-gray-200 rounded w-12 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-12 dark:animate-pulse'}></div>
            </div>
            <div className={'h-5 bg-gray-100 rounded-full w-8 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded-full dark:w-8 dark:animate-pulse'}></div>
          </div>

          <SkeletonTaskCard hasSubtasks={false} progress="70%" />
        </div>

        {/* Column 5: Deployment */}
        <div className="flex flex-col h-full min-h-[500px]">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
              <div className={'h-4 bg-gray-200 rounded w-24 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-24 dark:animate-pulse'}></div>
            </div>
            <div className={'h-5 bg-gray-100 rounded-full w-8 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded-full dark:w-8 dark:animate-pulse'}></div>
          </div>

          <SkeletonTaskCard hasSubtasks={false} progress="85%" />
          <SkeletonTaskCard hasSubtasks={true} progress="85%" />
        </div>

        {/* Column 6: Completed */}
        <div className="flex flex-col h-full min-h-[500px]">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <div className={'h-4 bg-gray-200 rounded w-20 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-20 dark:animate-pulse'}></div>
            </div>
            <div className={'h-5 bg-gray-100 rounded-full w-8 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded-full dark:w-8 dark:animate-pulse'}></div>
          </div>

          <SkeletonTaskCard hasSubtasks={false} progress="100%" />
          <SkeletonTaskCard hasSubtasks={false} progress="100%" />
          <SkeletonTaskCard hasSubtasks={true} progress="100%" />
        </div>
      </div>
    </div>
  );
};

export default KanbanSkeleton;
