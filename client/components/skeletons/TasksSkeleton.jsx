import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const TasksSkeleton = () => {
  const { theme } = useTheme();
  
  const getThemeClasses = (lightClass, darkClass) => 
    theme === 'dark' ? darkClass : lightClass;

  const TaskRow = () => (
    <tr className={getThemeClasses('border-b border-gray-100', 'border-b border-zinc-800/60')}>
      <td className="py-3 pl-4 text-center">
        <div className={getThemeClasses('w-4 h-4 bg-gray-250 bg-gray-200 rounded mx-auto animate-pulse', 'w-4 h-4 bg-zinc-800 rounded mx-auto animate-pulse')}></div>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={getThemeClasses('h-4 bg-gray-200 rounded w-48 animate-pulse', 'h-4 bg-zinc-800 rounded w-48 animate-pulse')}></div>
            <div className={getThemeClasses('h-5 bg-gray-100 rounded w-20 animate-pulse', 'h-5 bg-zinc-800/60 rounded w-20 animate-pulse')}></div>
          </div>
          <div className={getThemeClasses('h-3 bg-gray-200 rounded w-64 animate-pulse', 'h-3 bg-zinc-800 rounded w-64 animate-pulse')}></div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('w-8 h-8 bg-gray-200 rounded-full animate-pulse', 'w-8 h-8 bg-zinc-800 rounded-full animate-pulse')}></div>
          <div className="flex flex-col gap-1.5">
            <div className={getThemeClasses('h-3 bg-gray-200 rounded w-20 animate-pulse', 'h-3 bg-zinc-800 rounded w-20 animate-pulse')}></div>
            <div className={getThemeClasses('h-3 bg-gray-100 rounded w-16 animate-pulse', 'h-3 bg-zinc-800/50 rounded w-16 animate-pulse')}></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('w-8 h-8 bg-gray-200 rounded-full animate-pulse', 'w-8 h-8 bg-zinc-800 rounded-full animate-pulse')}></div>
          <div className="flex flex-col gap-1.5">
            <div className={getThemeClasses('h-3 bg-gray-200 rounded w-20 animate-pulse', 'h-3 bg-zinc-800 rounded w-20 animate-pulse')}></div>
            <div className={getThemeClasses('h-3 bg-gray-100 rounded w-16 animate-pulse', 'h-3 bg-zinc-800/50 rounded w-16 animate-pulse')}></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell text-center">
        <div className={getThemeClasses('h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse', 'h-3 bg-zinc-800 rounded w-20 mx-auto animate-pulse')}></div>
        <div className={getThemeClasses('h-3 bg-gray-100 rounded w-12 mx-auto mt-1.5 animate-pulse', 'h-3 bg-zinc-800/50 rounded w-12 mx-auto mt-1.5 animate-pulse')}></div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className={getThemeClasses('h-5 bg-gray-200 rounded w-16 animate-pulse', 'h-5 bg-zinc-800 rounded w-16 animate-pulse')}></div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className={getThemeClasses('h-6 bg-gray-200 rounded-full w-20 animate-pulse', 'h-6 bg-zinc-800 rounded-full w-20 animate-pulse')}></div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('w-7 h-7 bg-gray-200 rounded-lg animate-pulse', 'w-7 h-7 bg-zinc-800 rounded-lg animate-pulse')}></div>
          <div className={getThemeClasses('w-7 h-7 bg-gray-200 rounded-lg animate-pulse', 'w-7 h-7 bg-zinc-800 rounded-lg animate-pulse')}></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className={getThemeClasses('text-2xl font-bold text-gray-900', 'text-2xl font-bold text-white')}>Tasks</h1>
      </div>

      {/* Stats Hero Card Skeleton */}
      <div className="w-full mb-6">
        <div className={`border rounded-2xl p-6 max-w-5xl ${getThemeClasses(
          "bg-white border-gray-200 shadow-sm",
          "dark:bg-dark-bg dark:border-zinc-800/80 dark:shadow-none"
        )}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
            {/* Left Column: Cards (lg:col-span-4) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 w-full lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
              {/* Total Tasks Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${getThemeClasses(
                'border-gray-100 bg-gray-50/50',
                'border-zinc-800/85 bg-zinc-900/30'
              )}`}>
                <div className="flex items-center justify-between">
                  <div className={getThemeClasses('h-3 bg-gray-200 rounded w-16 animate-pulse', 'h-3 bg-zinc-800 rounded w-16 animate-pulse')}></div>
                  <div className={getThemeClasses('w-5 h-5 bg-gray-100 rounded animate-pulse', 'w-5 h-5 bg-zinc-800/60 rounded animate-pulse')}></div>
                </div>
                <div className={getThemeClasses('h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse', 'h-6 bg-zinc-800 rounded w-10 mt-3 animate-pulse')}></div>
              </div>

              {/* Completed Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${getThemeClasses(
                'border-gray-100 bg-gray-50/50',
                'border-zinc-800/85 bg-zinc-900/30'
              )}`}>
                <div className="flex items-center justify-between">
                  <div className={getThemeClasses('h-3 bg-gray-200 rounded w-16 animate-pulse', 'h-3 bg-zinc-800 rounded w-16 animate-pulse')}></div>
                  <div className={getThemeClasses('w-5 h-5 bg-gray-100 rounded animate-pulse', 'w-5 h-5 bg-zinc-800/60 rounded animate-pulse')}></div>
                </div>
                <div className={getThemeClasses('h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse', 'h-6 bg-zinc-800 rounded w-10 mt-3 animate-pulse')}></div>
              </div>

              {/* Overdue Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${getThemeClasses(
                'border-gray-100 bg-gray-50/50',
                'border-zinc-800/85 bg-zinc-900/30'
              )}`}>
                <div className="flex items-center justify-between">
                  <div className={getThemeClasses('h-3 bg-gray-200 rounded w-16 animate-pulse', 'h-3 bg-zinc-800 rounded w-16 animate-pulse')}></div>
                  <div className={getThemeClasses('w-5 h-5 bg-gray-100 rounded animate-pulse', 'w-5 h-5 bg-zinc-800/60 rounded animate-pulse')}></div>
                </div>
                <div className={getThemeClasses('h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse', 'h-6 bg-zinc-800 rounded w-10 mt-3 animate-pulse')}></div>
              </div>

              {/* High Priority Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${getThemeClasses(
                'border-gray-100 bg-gray-50/50',
                'border-zinc-800/85 bg-zinc-900/30'
              )}`}>
                <div className="flex items-center justify-between">
                  <div className={getThemeClasses('h-3 bg-gray-200 rounded w-16 animate-pulse', 'h-3 bg-zinc-800 rounded w-16 animate-pulse')}></div>
                  <div className={getThemeClasses('w-5 h-5 bg-gray-100 rounded animate-pulse', 'w-5 h-5 bg-zinc-800/60 rounded animate-pulse')}></div>
                </div>
                <div className={getThemeClasses('h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse', 'h-6 bg-zinc-800 rounded w-10 mt-3 animate-pulse')}></div>
              </div>
            </div>

            {/* Middle Column: Progress Ring (lg:col-span-2) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
              <div className={getThemeClasses('w-20 h-20 rounded-full border-8 border-gray-100 animate-pulse bg-transparent flex items-center justify-center', 'w-20 h-20 rounded-full border-8 border-zinc-800 animate-pulse bg-transparent flex items-center justify-center')}>
                <div className={getThemeClasses('h-4 bg-gray-200 rounded w-8 animate-pulse', 'h-4 bg-zinc-800 rounded w-8 animate-pulse')}></div>
              </div>
              <div className={getThemeClasses('h-5 bg-gray-200 rounded w-16 mt-1.5 animate-pulse', 'h-5 bg-zinc-800 rounded w-16 mt-1.5 animate-pulse')}></div>
              <div className={getThemeClasses('h-3 bg-gray-100 rounded w-24 mt-1 animate-pulse', 'h-3 bg-zinc-800/50 rounded w-24 mt-1 animate-pulse')}></div>
            </div>

            {/* Right Column: Search & Controls (lg:col-span-6) */}
            <div className="lg:col-span-6 flex flex-col gap-3 w-full h-full justify-end">
              {/* Search input mock */}
              <div className={getThemeClasses('h-9 bg-gray-100 rounded-lg w-full animate-pulse', 'h-9 bg-zinc-900/40 rounded-lg w-full animate-pulse')}></div>
              {/* Filter controls mock */}
              <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                <div className={getThemeClasses('h-8 w-24 bg-gray-200 rounded-lg animate-pulse', 'h-8 w-24 bg-zinc-800 rounded-lg animate-pulse')}></div>
                <div className={getThemeClasses('h-8 w-20 bg-gray-200 rounded-lg animate-pulse', 'h-8 w-20 bg-zinc-800 rounded-lg animate-pulse')}></div>
                <div className={getThemeClasses('h-8 w-16 bg-gray-200 rounded-lg animate-pulse', 'h-8 w-16 bg-zinc-800 rounded-lg animate-pulse')}></div>
                <div className={getThemeClasses('h-8 w-28 bg-gray-200 rounded-lg animate-pulse', 'h-8 w-28 bg-zinc-800 rounded-lg animate-pulse')}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Header Skeleton */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <div className={getThemeClasses('h-6 bg-gray-200 rounded w-40 animate-pulse', 'h-6 bg-zinc-800 rounded w-40 animate-pulse')}></div>
        <div className="flex items-center gap-3">
          <div className={getThemeClasses('h-8 w-28 bg-gray-200 rounded-lg animate-pulse', 'h-8 w-28 bg-zinc-800 rounded-lg animate-pulse')}></div>
          <div className={getThemeClasses('h-8 w-24 bg-gray-200 rounded-lg animate-pulse', 'h-8 w-24 bg-zinc-800 rounded-lg animate-pulse')}></div>
        </div>
      </div>

      {/* Task Table Skeleton */}
      <div className={getThemeClasses('bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm', 'bg-transparent border border-zinc-800 rounded-xl overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className={getThemeClasses('bg-gray-50 border-b border-gray-200', 'bg-zinc-800/40 border-b border-zinc-700/80')}>
                <th className="py-3 pl-4 text-center w-[50px]">
                  <div className={getThemeClasses('w-4 h-4 bg-gray-200 rounded mx-auto', 'w-4 h-4 bg-zinc-800 rounded mx-auto')}></div>
                </th>
                <th className="py-3 px-4 text-left w-[42%]">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-16', 'h-4 bg-zinc-800 rounded w-16')}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[12%]">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-20', 'h-4 bg-zinc-800 rounded w-20')}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[12%]">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-16', 'h-4 bg-zinc-800 rounded w-16')}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-center w-[11%]">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-20 mx-auto', 'h-4 bg-zinc-800 rounded w-20 mx-auto')}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[8%]">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-14', 'h-4 bg-zinc-800 rounded w-14')}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[9%]">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-12', 'h-4 bg-zinc-800 rounded w-12')}></div>
                </th>
                <th className="py-3 px-4 text-left w-[6%]">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-10', 'h-4 bg-zinc-800 rounded w-10')}></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 9 }).map((_, index) => (
                <TaskRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TasksSkeleton;
