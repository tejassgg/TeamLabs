import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const MyTasksSkeleton = () => {
  const { theme } = useTheme();
  const getThemeClasses = (lightClass, darkClass) => (theme === 'dark' ? darkClass : lightClass);

  const TaskRow = ({ index }) => (
    <tr className={getThemeClasses('border-b border-gray-100', 'border-b border-gray-800')}>
      <td className="py-3 px-4">
        <div className={getThemeClasses('w-4 h-4 bg-gray-200 rounded', 'w-4 h-4 bg-gray-700 rounded')}></div>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={getThemeClasses('h-4 bg-gray-200 rounded w-48', 'h-4 bg-gray-700 rounded w-48')}></div>
            <div className={getThemeClasses('h-5 bg-gray-200 rounded w-20', 'h-5 bg-gray-700 rounded w-20')}></div>
          </div>
          <div className={getThemeClasses('h-3 bg-gray-200 rounded w-64', 'h-3 bg-gray-700 rounded w-64')}></div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('w-8 h-8 bg-gray-200 rounded-full', 'w-8 h-8 bg-gray-700 rounded-full')}></div>
          <div className="flex flex-col">
            <div className={getThemeClasses('h-3 bg-gray-200 rounded w-24 mb-1', 'h-3 bg-gray-700 rounded w-24 mb-1')}></div>
            <div className={getThemeClasses('h-3 bg-gray-200 rounded w-16', 'h-3 bg-gray-700 rounded w-16')}></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('w-8 h-8 bg-gray-200 rounded-full', 'w-8 h-8 bg-gray-700 rounded-full')}></div>
          <div className="flex flex-col">
            <div className={getThemeClasses('h-3 bg-gray-200 rounded w-24 mb-1', 'h-3 bg-gray-700 rounded w-24 mb-1')}></div>
            <div className={getThemeClasses('h-3 bg-gray-200 rounded w-16', 'h-3 bg-gray-700 rounded w-16')}></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className={getThemeClasses('h-4 bg-gray-200 rounded w-32', 'h-4 bg-gray-700 rounded w-32')}></div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className={getThemeClasses('h-5 bg-gray-200 rounded w-16', 'h-5 bg-gray-700 rounded w-16')}></div>
      </td>
      <td className="py-3 px-4">
        <div className={getThemeClasses('h-5 bg-gray-200 rounded w-20', 'h-5 bg-gray-700 rounded w-20')}></div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('w-8 h-8 bg-gray-200 rounded-full', 'w-8 h-8 bg-gray-700 rounded-full')}></div>
          <div className={getThemeClasses('w-8 h-8 bg-gray-200 rounded-full', 'w-8 h-8 bg-gray-700 rounded-full')}></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className={getThemeClasses('bg-white', 'bg-[#18181b]')}>
      {/* Top Bar - Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 lg:max-w-md">
            <div className={getThemeClasses('h-12 bg-gray-200 rounded-lg', 'h-12 bg-gray-700 rounded-lg')}></div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-row gap-3">
            <div className={getThemeClasses('h-12 w-32 bg-gray-200 rounded-lg', 'h-12 w-32 bg-gray-700 rounded-lg')}></div>
            <div className={getThemeClasses('h-12 w-36 bg-gray-200 rounded-lg', 'h-12 w-36 bg-gray-700 rounded-lg')}></div>
            <div className={getThemeClasses('h-12 w-36 bg-gray-200 rounded-lg', 'h-12 w-36 bg-gray-700 rounded-lg')}></div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={getThemeClasses('bg-white border border-gray-200 rounded-xl p-4', 'bg-transparent border border-gray-700 rounded-xl p-4')}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className={getThemeClasses('h-3 bg-gray-200 rounded w-16 mb-2', 'h-3 bg-gray-700 rounded w-16 mb-2')}></div>
                  <div className={getThemeClasses('h-8 bg-gray-200 rounded w-12', 'h-8 bg-gray-700 rounded w-12')}></div>
                </div>
                <div className={getThemeClasses('w-10 h-10 rounded-xl bg-gray-200', 'w-10 h-10 rounded-xl bg-gray-700')}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Table */}
      <div className={getThemeClasses('bg-white border border-gray-200 rounded-xl', 'bg-transparent border border-gray-700 rounded-xl')}>
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={getThemeClasses('h-6 bg-gray-200 rounded w-32', 'h-6 bg-gray-700 rounded w-32')}></div>
            <div className={getThemeClasses('h-6 bg-gray-200 rounded w-16', 'h-6 bg-gray-700 rounded w-16')}></div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={getThemeClasses('border-b border-gray-200', 'border-b border-gray-700')}>
                <th className="py-3 px-4 w-12">
                  <div className={getThemeClasses('w-4 h-4 bg-gray-200 rounded', 'w-4 h-4 bg-gray-700 rounded')}></div>
                </th>
                <th className="py-3 px-4 text-left">
                  <div className="flex items-center gap-1">
                    <div className={getThemeClasses('h-4 bg-gray-200 rounded w-16', 'h-4 bg-gray-700 rounded w-16')}></div>
                    <div className={getThemeClasses('w-3 h-3 bg-gray-200 rounded', 'w-3 h-3 bg-gray-700 rounded')}></div>
                  </div>
                </th>
                <th className="py-3 px-4 text-left hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <div className={getThemeClasses('h-4 bg-gray-200 rounded w-20', 'h-4 bg-gray-700 rounded w-20')}></div>
                    <div className={getThemeClasses('w-3 h-3 bg-gray-200 rounded', 'w-3 h-3 bg-gray-700 rounded')}></div>
                  </div>
                </th>
                <th className="py-3 px-4 text-left hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <div className={getThemeClasses('h-4 bg-gray-200 rounded w-20', 'h-4 bg-gray-700 rounded w-20')}></div>
                    <div className={getThemeClasses('w-3 h-3 bg-gray-200 rounded', 'w-3 h-3 bg-gray-700 rounded')}></div>
                  </div>
                </th>
                <th className="py-3 px-4 text-left hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <div className={getThemeClasses('h-4 bg-gray-200 rounded w-24', 'h-4 bg-gray-700 rounded w-24')}></div>
                    <div className={getThemeClasses('w-3 h-3 bg-gray-200 rounded', 'w-3 h-3 bg-gray-700 rounded')}></div>
                  </div>
                </th>
                <th className="py-3 px-4 text-left hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <div className={getThemeClasses('h-4 bg-gray-200 rounded w-16', 'h-4 bg-gray-700 rounded w-16')}></div>
                    <div className={getThemeClasses('w-3 h-3 bg-gray-200 rounded', 'w-3 h-3 bg-gray-700 rounded')}></div>
                  </div>
                </th>
                <th className="py-3 px-4 text-left">
                  <div className="flex items-center gap-1">
                    <div className={getThemeClasses('h-4 bg-gray-200 rounded w-16', 'h-4 bg-gray-700 rounded w-16')}></div>
                    <div className={getThemeClasses('w-3 h-3 bg-gray-200 rounded', 'w-3 h-3 bg-gray-700 rounded')}></div>
                  </div>
                </th>
                <th className="py-3 px-4 text-left">
                  <div className={getThemeClasses('h-4 bg-gray-200 rounded w-16', 'h-4 bg-gray-700 rounded w-16')}></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 9 }).map((_, index) => (
                <TaskRow key={index} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyTasksSkeleton;


