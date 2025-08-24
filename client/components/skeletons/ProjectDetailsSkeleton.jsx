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
      {/* Project Description - Enhanced UI Skeleton */}
      <div className={`flex w-full items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm mb-6 ${isDark ? 'dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700/50 dark:shadow-none' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center ${isDark ? 'dark:bg-blue-900/50' : ''}`}>
            <div className={`w-4 h-4 ${skeletonClass}`}></div>
          </div>
          <div className="flex-1">
            <div className={`h-4 w-32 mb-2 ${skeletonClass}`}></div>
            <div className={`h-4 w-80 ${skeletonClass}`}></div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Deadline Status Skeleton */}
          <div className={`h-7 w-24 ${skeletonClass}`}></div>
          {/* Project Status Skeleton */}
          <div className={`h-7 w-20 ${skeletonClass}`}></div>
          {/* Team Member Avatars Skeleton */}
          <div className="flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
            <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
            <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
            <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
          </div>
          {/* Settings Button Skeleton */}
          <div className={`w-6 h-6 rounded-full ${skeletonClass}`}></div>
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="mb-6">
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="-mb-px flex space-x-8">
            {['Manage Project', 'Board', 'Files', 'Repo'].map((tab, index) => (
              <div key={index} className="flex items-center gap-2 py-4 px-1">
                <div className={`w-4 h-4 ${skeletonClass}`}></div>
                <div className={`h-4 w-24 ${skeletonClass}`}></div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Search for a Team Skeleton */}
      <div className="mb-6">
        <div className={`h-5 w-80 mb-2 ${skeletonClass}`}></div>
        <div className={`h-10 w-96 ${skeletonClass}`}></div>
      </div>

      {/* Teams Assigned and User Stories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Teams Assigned Table Skeleton */}
        <div className={`rounded-xl border ${cardClass} overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`h-6 w-32 ${skeletonClass}`}></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-gray-200 ${isDark ? 'border-gray-700' : ''}`}>
                  <th className="py-3 px-4 text-left w-[300px]">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                  <th className="hidden md:table-cell py-3 px-4 text-left w-[200px]">
                    <div className={`h-4 w-24 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-center w-[150px]">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-center w-[150px]">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2].map((i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-b-0 ${isDark ? 'border-gray-700' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                        <div className="flex flex-col">
                          <div className={`h-4 w-24 ${skeletonClass}`}></div>
                          <div className={`h-3 w-20 ${skeletonClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      <div className={`h-4 w-20 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`h-6 w-16 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-center">
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

        {/* User Stories Table Skeleton */}
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
                  <th className="py-3 px-4 text-left w-[300px]">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="hidden md:table-cell py-3 px-4 text-left w-[200px]">
                    <div className={`h-4 w-24 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-center w-[150px]">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-center w-[150px]">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
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
                    <td className="hidden md:table-cell py-3 px-4">
                      <div className={`h-4 w-20 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`h-6 w-20 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-center">
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
                  <th className="hidden md:table-cell py-3 px-4 text-left">
                    <div className={`h-4 w-24 ${skeletonClass}`}></div>
                  </th>
                  <th className="hidden md:table-cell py-3 px-4 text-left">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                  <th className="hidden md:table-cell py-3 px-4 text-center">
                    <div className={`h-4 w-24 ${skeletonClass}`}></div>
                  </th>
                  <th className="hidden md:table-cell py-3 px-4 text-left">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
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
                {[1, 2, 3].map((i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-b-0 ${isDark ? 'border-gray-700' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <div className={`h-4 w-4 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-4 w-32 ${skeletonClass}`}></div>
                          <div className={`h-5 w-16 ${skeletonClass}`}></div>
                        </div>
                        <div className={`h-3 w-24 ${skeletonClass}`}></div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                        <div className="flex flex-col">
                          <div className={`h-4 w-24 ${skeletonClass}`}></div>
                          <div className={`h-3 w-16 ${skeletonClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${skeletonClass}`}></div>
                        <div className="flex flex-col">
                          <div className={`h-4 w-24 ${skeletonClass}`}></div>
                          <div className={`h-3 w-16 ${skeletonClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4 text-center">
                      <div className={`h-4 w-20 ${skeletonClass}`}></div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      <div className={`h-5 w-16 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className={`h-6 w-20 ${skeletonClass}`}></div>
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

      {/* Project Activity Timeline Skeleton */}
      <div className="mb-8">
        <div className={`rounded-xl border ${cardClass} p-6`}>
          <div className={`h-6 w-32 mb-6 ${skeletonClass}`}></div>
          <div className="relative mx-auto max-w-5xl">
            <div className="relative">
              {/* Vertical timeline line */}
              <div className={`absolute left-1/2 top-0 w-1 h-full rounded-full -translate-x-1/2 z-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              {[0, 1, 2].map((i) => (
                <div key={i} className="mb-16 flex w-full min-h-[120px] relative items-center">
                  {/* Centered day/date label */}
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center w-48">
                    <div className={`px-4 py-1 rounded-full shadow border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                      <div className={`h-4 w-24 ${skeletonClass}`}></div>
                    </div>
                  </div>
                  {i % 2 === 0 ? (
                    <>
                      {/* Left side */}
                      <div className="w-1/2 pr-8 flex flex-col items-end">
                        <div className="min-w-[600px] max-w-5xl border-t">
                          <div className="px-6 py-4 space-y-6">
                            {/* Activity card */}
                            <div className="flex items-start gap-4 w-full">
                              <div className={`w-10 h-10 rounded-full ${skeletonClass}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-2">
                                  <div className={`h-4 w-2/3 ${skeletonClass}`} />
                                  <div className={`h-3 w-1/2 ${skeletonClass}`} />
                                </div>
                              </div>
                              <div className={`h-3 w-10 ${skeletonClass}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-1/2" />
                    </>
                  ) : (
                    <>
                      <div className="w-1/2" />
                      {/* Right side */}
                      <div className="w-1/2 pl-8 flex flex-col items-start">
                        <div className="min-w-[600px] max-w-5xl border-t">
                          <div className="px-6 py-4 space-y-6">
                            {/* Activity card */}
                            <div className="flex items-start gap-4 w-full">
                              <div className={`w-10 h-10 rounded-full ${skeletonClass}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-2">
                                  <div className={`h-4 w-2/3 ${skeletonClass}`} />
                                  <div className={`h-3 w-1/2 ${skeletonClass}`} />
                                </div>
                              </div>
                              <div className={`h-3 w-10 ${skeletonClass}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsSkeleton; 