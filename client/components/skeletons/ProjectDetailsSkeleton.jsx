import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ProjectDetailsSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const skeletonClass = isDark ? 'animate-pulse bg-zinc-800 rounded-lg' : 'animate-pulse bg-gray-200 rounded-lg';
  const skeletonSubClass = isDark ? 'animate-pulse bg-zinc-700/50 rounded-lg' : 'animate-pulse bg-gray-100 rounded-lg';
  const cardClass = isDark ? 'bg-dark-bg border-zinc-800/80 shadow-none' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className="mx-auto select-none">
      {/* Tab Navigation Skeleton */}
      <div className="mb-6">
        <div className={`border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
          <div className="-mb-px flex items-center justify-between">
            <nav className="flex space-x-8">
              {/* Active "Manage Project" tab */}
              <div className="flex items-center gap-2 py-4 px-1 border-b-2 border-blue-600">
                <div className="w-4 h-4 bg-blue-500/30 rounded-full animate-pulse"></div>
                <div className="h-4 w-28 bg-blue-500/20 rounded-md animate-pulse"></div>
              </div>
              {/* Inactive tabs */}
              {['Board', 'Timeline', 'List', 'Files', 'Knowledge Base', 'Releases'].map((tab, index) => (
                <div key={index} className={`${tab === 'Board' ? 'hidden sm:flex' : 'flex'} items-center gap-2 py-4 px-1`}>
                  <div className={`w-4 h-4 rounded-full ${skeletonClass}`}></div>
                  <div className={`h-4 w-16 ${skeletonSubClass}`}></div>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full ${skeletonClass}`}></div>
              <div className={`h-8 w-8 rounded-full ${skeletonClass}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Top Layout Hero Banner (Details + KPI Progress + Goals) */}
      <div className={`mb-6 border rounded-2xl p-6 ${cardClass} relative overflow-hidden`}>
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          {/* Left Section: Details */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-4 min-w-0 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
            <div className="space-y-4">
              {/* Top Row: Statuses */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Status pill mock */}
                  <div className={`h-6 w-24 rounded-full ${isDark ? 'bg-blue-900/20 border border-blue-800/40' : 'bg-blue-50 border border-blue-100'} animate-pulse flex items-center px-2.5`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                    <div className={`h-2.5 w-12 ${isDark ? 'bg-blue-800' : 'bg-blue-200'} rounded`}></div>
                  </div>
                  {/* Priority badge mock */}
                  <div className={`h-6 w-16 rounded-full ${isDark ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-100'} animate-pulse flex items-center px-2.5`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                    <div className={`h-2.5 w-8 ${isDark ? 'bg-red-800' : 'bg-red-200'} rounded`}></div>
                  </div>
                </div>
                {/* Deadline status mock */}
                <div className={`h-6 w-28 rounded-full ${isDark ? 'bg-green-900/20 border border-green-800/40' : 'bg-green-50 border border-green-100'} animate-pulse flex items-center px-2.5`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                  <div className={`h-2.5 w-16 ${isDark ? 'bg-green-800' : 'bg-green-200'} rounded`}></div>
                </div>
              </div>

              {/* Middle Row: Name & Description */}
              <div className="space-y-3">
                <div className={`h-7 w-2/3 ${skeletonClass}`}></div>
                <div className="space-y-2 pt-1">
                  <div className={`h-3.5 w-full ${skeletonSubClass}`}></div>
                  <div className={`h-3.5 w-11/12 ${skeletonSubClass}`}></div>
                  <div className={`h-3.5 w-4/5 ${skeletonSubClass}`}></div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Members & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800/60">
              {/* Avatars stacked */}
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] ${skeletonClass}`}></div>
                  <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] flex items-center justify-center text-xs font-bold ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>+5</div>
                </div>
                <div className={`h-3 w-20 ${skeletonSubClass}`}></div>
              </div>
              {/* Action buttons (Edit & Share) */}
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl border ${isDark ? 'border-zinc-800' : 'border-gray-200'} ${skeletonClass}`}></div>
                <div className={`w-9 h-9 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} animate-pulse`}></div>
              </div>
            </div>
          </div>

          {/* Middle Section: Circular Progress */}
          <div className="lg:col-span-1 flex flex-col justify-between gap-4 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              {/* Circular progress path placeholder */}
              <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" className={isDark ? 'text-zinc-800' : 'text-gray-100'} strokeWidth="10" stroke="currentColor" fill="transparent" />
                  <circle cx="64" cy="64" r="54" className="text-emerald-500/20 animate-pulse" strokeWidth="10" strokeDasharray="339.3" strokeDashoffset="80" strokeLinecap="round" stroke="currentColor" fill="transparent" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <div className={`text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white ${skeletonClass} h-6 w-12 mb-1.5`}></div>
                  <div className={`text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-1 ${skeletonSubClass} h-3.5 w-16`}></div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className={`h-5 w-16 rounded-full ${skeletonClass}`}></div>
                <div className={`h-3.5 w-32 ${skeletonSubClass}`}></div>
              </div>
            </div>
            {/* Stats counts grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-800/30' : 'bg-gray-50'}`}>
                <div className={`h-3 w-12 mb-2 ${skeletonSubClass}`}></div>
                <div className={`h-5 w-6 ${skeletonClass}`}></div>
              </div>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-800/30' : 'bg-gray-50'}`}>
                <div className={`h-3 w-16 mb-2 ${skeletonSubClass}`}></div>
                <div className={`h-5 w-6 ${skeletonClass}`}></div>
              </div>
            </div>
          </div>

          {/* Right Section: Goals Tracker */}
          <div className="lg:col-span-1 flex flex-col justify-between gap-4">
            <div>
              {/* Inline Goals Title Badge */}
              <div className="flex items-center gap-1.5 mb-4 border-b border-gray-100 dark:border-zinc-800/80 pb-3">
                <div className={`w-3.5 h-3.5 rounded-full ${skeletonClass}`}></div>
                <div className={`h-3 w-20 ${skeletonSubClass}`}></div>
              </div>
              {/* Goals List */}
              <div className="space-y-3.5 pr-1">
                {[1, 2, 3, 4].map((g) => (
                  <div key={g} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${isDark ? 'border-zinc-700 bg-zinc-800/40' : 'border-gray-300 bg-white'} ${skeletonClass}`}></div>
                    <div className={`h-3.5 flex-1 ${skeletonSubClass}`} style={{ width: g === 1 ? '75%' : g === 2 ? '60%' : g === 3 ? '80%' : '50%' }}></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Add goal placeholder */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/60 flex gap-2">
              <div className={`h-8 flex-1 ${skeletonSubClass}`}></div>
              <div className={`h-8 w-12 ${skeletonClass}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Assigned & User Stories Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Left: Teams Assigned (lg:col-span-3) */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className={`h-6 w-20 ${skeletonClass}`}></div>
            <div className={`h-8 w-64 ${skeletonSubClass}`}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-2xl border p-4 ${cardClass} relative overflow-hidden shadow-sm`}>
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5 pointer-events-none"></div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Team Avatar (w-10 h-10) */}
                    <div className={`w-10 h-10 rounded-full ${skeletonClass} flex-shrink-0`}></div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      {/* Team Name */}
                      <div className={`h-3.5 w-24 ${skeletonClass}`}></div>
                      {/* Team Description */}
                      <div className={`h-2.5 w-28 ${skeletonSubClass}`}></div>
                      {/* Created: Date */}
                      <div className={`h-2.5 w-32 ${skeletonSubClass} mt-1`}></div>
                    </div>
                  </div>
                  {/* Status Pill (Active / Inactive) */}
                  <div className={`h-5 w-14 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} animate-pulse flex-shrink-0`}></div>
                </div>
                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-3">
                  {/* Members Stack */}
                  <div className="flex items-center -space-x-2">
                    <div className={`w-7 h-7 rounded-full border border-white dark:border-zinc-800 ${skeletonClass}`}></div>
                    <div className={`w-7 h-7 rounded-full border border-white dark:border-zinc-800 ${skeletonClass}`}></div>
                    <div className={`w-7 h-7 rounded-full border border-white dark:border-zinc-800 ${skeletonClass}`}></div>
                  </div>
                  {/* Action Button */}
                  <div className={`w-6 h-6 rounded-full ${skeletonClass}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: User Stories (lg:col-span-2) */}
        <div className={`lg:col-span-2 rounded-xl border ${cardClass} overflow-hidden shadow-sm relative overflow-hidden`}>
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5 pointer-events-none"></div>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className={`h-5 w-24 ${skeletonClass}`}></div>
              <div className={`h-7 w-16 ${skeletonClass}`}></div>
            </div>
          </div>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-gray-200 ${isDark ? 'border-gray-700' : ''}`}>
                  <th className="py-2 px-3 text-left w-[180px]"><div className={`h-3 w-10 ${skeletonClass}`}></div></th>
                  <th className="py-2 px-3 text-left w-[100px]"><div className={`h-3 w-14 ${skeletonClass}`}></div></th>
                  <th className="py-2 px-3 text-center w-[90px]"><div className={`h-3 w-12 ${skeletonClass}`}></div></th>
                  <th className="py-2 px-3 text-center w-[70px]"><div className={`h-3 w-12 ${skeletonClass}`}></div></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2].map((i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-b-0 ${isDark ? 'border-zinc-800/60' : ''}`}>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <div className={`h-3.5 w-28 ${skeletonClass}`}></div>
                        <div className={`h-2.5 w-16 ${skeletonSubClass}`}></div>
                      </div>
                    </td>
                    <td className="py-3 px-3"><div className={`h-3 w-20 ${skeletonSubClass}`}></div></td>
                    <td className="py-3 px-3 text-center"><div className={`h-5 w-16 rounded-full mx-auto ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} animate-pulse`}></div></td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-5 h-5 rounded ${skeletonClass}`}></div>
                        <div className={`w-5 h-5 rounded ${skeletonClass}`}></div>
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
        <div className={`rounded-xl border ${cardClass} overflow-hidden shadow-sm relative overflow-hidden`}>
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5 pointer-events-none"></div>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className={`h-5 w-12 ${skeletonClass}`}></div>
              <div className={`h-8 w-24 ${skeletonClass}`}></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-gray-200 ${isDark ? 'border-gray-700' : ''}`}>
                  <th className="py-3 px-4 text-center w-[50px]">
                    <div className={`h-4 w-4 mx-auto ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-3 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-3 w-20 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-3 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <div className={`h-3 w-24 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-3 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-3 w-16 ${skeletonClass}`}></div>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <div className={`h-3 w-20 ${skeletonClass}`}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-b-0 ${isDark ? 'border-zinc-800/60' : ''}`}>
                    <td className="py-4 px-4 text-center">
                      <div className={`h-4 w-4 mx-auto border ${isDark ? 'border-zinc-700 bg-zinc-800/40' : 'border-gray-300 bg-white'} ${skeletonClass}`}></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-3.5 w-40 ${skeletonClass}`}></div>
                          <div className={`h-4 w-14 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} animate-pulse`}></div>
                        </div>
                        <div className={`h-2.5 w-24 ${skeletonSubClass}`}></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full ${skeletonClass}`}></div>
                        <div className="flex flex-col gap-1">
                          <div className={`h-3 w-20 ${skeletonClass}`}></div>
                          <div className={`h-2 w-12 ${skeletonSubClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full ${skeletonClass}`}></div>
                        <div className="flex flex-col gap-1">
                          <div className={`h-3 w-20 ${skeletonClass}`}></div>
                          <div className={`h-2 w-12 ${skeletonSubClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col gap-1 mx-auto w-fit">
                        <div className={`h-3 w-16 ${skeletonClass}`}></div>
                        <div className={`h-2.5 w-10 ${skeletonSubClass} mx-auto`}></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`h-5 w-16 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} animate-pulse`}></div>
                    </td>
                    <td className="py-4 px-4 text-left">
                      <div className={`h-6 w-20 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} animate-pulse`}></div>
                    </td>
                    <td className="py-4 px-4 text-left">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-lg ${skeletonClass}`}></div>
                        <div className={`w-7 h-7 rounded-lg ${skeletonClass}`}></div>
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