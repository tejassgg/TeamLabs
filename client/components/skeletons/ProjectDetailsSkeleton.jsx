import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ProjectDetailsSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const skeletonClass = isDark ? 'animate-pulse bg-gray-700 rounded' : 'animate-pulse bg-gray-200 rounded';
  const cardClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-gray-300' : 'text-gray-900';
  const secondaryTextClass = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="mx-auto">
      {/* Tab Navigation Skeleton */}
      <div className="mb-6">
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="-mb-px flex items-center justify-between">
            <nav className="flex space-x-8">
              {/* Active "Manage Project" tab */}
              <div className="flex items-center gap-2 py-4 px-1 border-b-2 border-blue-600">
                <div className={`w-4 h-4 bg-blue-600 rounded ${skeletonClass}`}></div>
                <div className={`h-4 w-28 bg-blue-600 ${skeletonClass}`}></div>
              </div>
              {/* Inactive tabs */}
              {['Board', 'Timeline', 'Files', 'Repo'].map((tab, index) => (
                <div key={index} className="flex items-center gap-2 py-4 px-1">
                  <div className={`w-4 h-4 bg-gray-400 rounded ${skeletonClass}`}></div>
                  <div className={`h-4 w-20 bg-gray-400 ${skeletonClass}`}></div>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <div className={`h-8 w-8 rounded-full bg-gray-400 ${skeletonClass}`}></div>
              <div className={`h-8 w-8 rounded-full bg-gray-400 ${skeletonClass}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Description - Enhanced UI Skeleton */}
      <div className={`flex w-full items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm mb-6 ${isDark ? 'dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700/50 dark:shadow-none' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center ${isDark ? 'dark:bg-blue-900/50' : ''}`}>
            <div className={`w-4 h-4 bg-blue-600 rounded-full ${skeletonClass}`}></div>
          </div>
          <div className="flex-1">
            <div className={`h-5 w-40 mb-2 bg-blue-800 ${skeletonClass}`}></div>
            <div className={`h-4 w-96 bg-blue-700 ${skeletonClass}`}></div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* "27 Days Left" Status Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 border border-green-200 ${isDark ? 'dark:bg-green-900/30 dark:border-green-700' : ''}`}>
            <div className={`w-2 h-2 bg-green-500 rounded-full ${skeletonClass}`}></div>
            <div className={`h-4 w-20 bg-green-600 ${skeletonClass}`}></div>
          </div>
          {/* "Deployment" Status Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 border border-pink-200 ${isDark ? 'dark:bg-pink-900/30 dark:border-pink-700' : ''}`}>
            <div className={`w-4 h-4 bg-pink-500 rounded ${skeletonClass}`}></div>
            <div className={`h-4 w-20 bg-pink-600 ${skeletonClass}`}></div>
          </div>
          {/* Team Member Avatars Skeleton */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full bg-gray-300 border-2 border-white ${skeletonClass}`}></div>
            <div className={`w-8 h-8 rounded-full bg-purple-500 border-2 border-white -ml-2 ${skeletonClass}`}></div>
            <div className={`w-8 h-8 rounded-full bg-purple-500 border-2 border-white -ml-2 ${skeletonClass}`}></div>
            <div className={`w-8 h-8 rounded-full bg-gray-200 border-2 border-white -ml-2 flex items-center justify-center ${isDark ? 'dark:bg-gray-600' : ''}`}>
              <div className={`h-3 w-4 bg-gray-500 ${skeletonClass}`}></div>
            </div>
          </div>
          {/* GitHub Icon Skeleton */}
          <div className={`w-6 h-6 rounded-full bg-gray-400 ${skeletonClass}`}></div>
          {/* Refresh/Sync Icon Skeleton */}
          <div className={`w-6 h-6 rounded-full bg-gray-400 ${skeletonClass}`}></div>
        </div>
      </div>

      {/* Teams Assigned + User Stories side-by-side (2:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Teams Assigned cards (span 2) */}
        <div className="lg:col-span-2">
          <div className={`h-6 w-36 mb-3 ${skeletonClass}`}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-xl border ${cardClass} p-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${skeletonClass}`}></div>
                    <div className="flex flex-col">
                      <div className={`h-4 w-28 ${skeletonClass}`}></div>
                      <div className={`h-3 w-32 mt-1 ${skeletonClass}`}></div>
                    </div>
                  </div>
                  <div className={`h-6 w-16 rounded-full ${skeletonClass}`}></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-14 ${skeletonClass}`}></div>
                    <div className={`h-3 w-24 ${skeletonClass}`}></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${skeletonClass}`}></div>
                    <div className={`w-6 h-6 rounded-full ${skeletonClass}`}></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${skeletonClass}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: User Stories panel */}
        <div className={`rounded-xl border ${cardClass} overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className={`h-6 w-24 ${skeletonClass}`}></div>
              <div className={`h-8 w-20 ${skeletonClass}`}></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-gray-200 ${isDark ? 'border-gray-700' : ''}`}>
                  <th className="py-3 px-4 text-left"><div className={`h-4 w-24 ${skeletonClass}`}></div></th>
                  <th className="py-3 px-4 text-left"><div className={`h-4 w-24 ${skeletonClass}`}></div></th>
                  <th className="py-3 px-4 text-left"><div className={`h-4 w-20 ${skeletonClass}`}></div></th>
                  <th className="py-3 px-4 text-center"><div className={`h-4 w-20 ${skeletonClass}`}></div></th>
                </tr>
              </thead>
              <tbody>
                {[1].map((i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-b-0 ${isDark ? 'border-gray-700' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className={`h-4 w-32 ${skeletonClass}`}></div>
                        <div className={`h-3 w-24 ${skeletonClass}`}></div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className={`h-4 w-24 ${skeletonClass}`}></div></td>
                    <td className="py-3 px-4"><div className={`h-6 w-20 rounded-full ${skeletonClass}`}></div></td>
                    <td className="py-3 px-4 text-center"><div className={`h-6 w-16 rounded-full ${skeletonClass}`}></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tasks Table Skeleton - Full Width */}
      <div className="mb-8">
        <div className={`rounded-xl border ${cardClass} overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className={`h-6 w-16 ${skeletonClass}`}></div>
              <div className={`h-8 w-24 ${skeletonClass}`}></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-gray-200 ${isDark ? 'border-gray-700' : ''}`}>
                  <th className="py-3 px-4 text-center w-[50px]">
                    <div className={`h-4 w-4 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <div className={`h-4 w-24 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-b-0 ${isDark ? 'border-gray-700' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <div className={`h-4 w-4 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-4 w-32 ${skeletonClass}`}></div>
                          <div className={`h-5 w-16 rounded-full ${skeletonClass}`}></div>
                        </div>
                        <div className={`h-3 w-24 ${skeletonClass}`}></div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-blue-100 ${skeletonClass}`}></div>
                        <div className="flex flex-col">
                          <div className={`h-4 w-24 ${skeletonClass}`}></div>
                          <div className={`h-3 w-16 ${skeletonClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-green-100 ${skeletonClass}`}></div>
                        <div className="flex flex-col">
                          <div className={`h-4 w-24 ${skeletonClass}`}></div>
                          <div className={`h-3 w-16 ${skeletonClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col">
                        <div className={`h-4 w-20 ${skeletonClass}`}></div>
                        <div className={`h-3 w-16 ${skeletonClass}`}></div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`h-5 w-16 rounded-full ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className={`h-6 w-20 rounded-full ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                        <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProjectDetailsSkeleton; 