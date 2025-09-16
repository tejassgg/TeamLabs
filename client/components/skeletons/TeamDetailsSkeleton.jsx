import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const TeamDetailsSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const skeletonClass = isDark 
    ? 'animate-pulse bg-gray-700 rounded' 
    : 'animate-pulse bg-gray-200 rounded';

  return (
    <div className="mx-auto">
      {/* Top Info Card */}
      <div className={`rounded-xl ${isDark ? 'bg-[#0f1729]/40 border border-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'} p-4 mb-4`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className={`h-4 w-40 ${skeletonClass} mb-2`}></div>
            <div className={`h-5 w-72 ${skeletonClass}`}></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-7 w-16 ${skeletonClass}`}></div>
            <div className={`h-7 w-24 ${skeletonClass}`}></div>
            <div className={`h-8 w-8 ${skeletonClass}`}></div>
          </div>
        </div>
      </div>

      {/* Search Member */}
      <div className="mb-4">
        <div className={`h-10 w-full ${skeletonClass}`}></div>
      </div>

      {/* Join Requests */}
      <div className={`rounded-xl ${isDark ? 'border border-gray-700' : 'border border-gray-200'} mb-4`}>
        <div className={`px-4 py-3 ${isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
          <div className={`h-5 w-32 ${skeletonClass}`}></div>
        </div>
        <div className="p-4">
          <div className={`h-4 w-56 ${skeletonClass}`}></div>
        </div>
      </div>

      {/* Team Meetings */}
      <div className="mb-4">
        <div className={`h-6 w-40 ${skeletonClass} mb-3`}></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className={`rounded-xl ${isDark ? 'border border-gray-700' : 'border border-gray-200'} p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className={`h-4 w-56 ${skeletonClass} mb-2`}></div>
                  <div className={`h-3 w-44 ${skeletonClass}`}></div>
                </div>
                <div className={`h-8 w-8 ${skeletonClass}`}></div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-4 w-4 ${skeletonClass}`}></div>
                <div className={`h-4 w-64 ${skeletonClass}`}></div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-8 w-24 ${skeletonClass}`}></div>
                <div className={`h-6 w-16 ${skeletonClass}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members and Projects Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members Table Skeleton */}
        <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              {/* Table Title Skeleton */}
              <div className={`h-6 w-32 ${skeletonClass}`}></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  {/* Checkbox Column Skeleton */}
                  <th className="py-3 px-4 text-center w-[50px]">
                    <div className={`h-4 w-4 mx-auto ${skeletonClass}`}></div>
                  </th>
                  {/* Name Column Skeleton */}
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  {/* Email Column Skeleton */}
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                  {/* Role Column Skeleton */}
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  {/* Status Column Skeleton */}
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  {/* Actions Column Skeleton */}
                  <th className="py-3 px-4 text-center">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Member Row Skeletons */}
                {[1, 2, 3, 4].map((index) => (
                  <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-3 px-4 text-center">
                      <div className={`h-4 w-4 mx-auto ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar Skeleton */}
                        <div className={`h-8 w-8 rounded-full ${skeletonClass}`}></div>
                        <div className="flex flex-col gap-1">
                          {/* Name Skeleton */}
                          <div className={`h-4 w-24 ${skeletonClass}`}></div>
                          {/* User ID Skeleton */}
                          <div className={`h-3 w-16 ${skeletonClass}`}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`h-4 w-32 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`h-4 w-20 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`h-6 w-16 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`h-6 w-6 ${skeletonClass}`}></div>
                        <div className={`h-6 w-6 ${skeletonClass}`}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Projects Table Skeleton */}
        <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              {/* Table Title Skeleton */}
              <div className={`h-6 w-36 ${skeletonClass}`}></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  {/* Checkbox Column Skeleton */}
                  <th className="py-3 px-4 text-center w-[50px]">
                    <div className={`h-4 w-4 mx-auto ${skeletonClass}`}></div>
                  </th>
                  {/* Project Name Column Skeleton */}
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                  {/* Status Column Skeleton */}
                  <th className="py-3 px-4 text-left">
                    <div className={`h-4 w-16 ${skeletonClass}`}></div>
                  </th>
                  {/* Actions Column Skeleton */}
                  <th className="py-3 px-4 text-center">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Project Row Skeletons */}
                {[1, 2, 3].map((index) => (
                  <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-3 px-4 text-center">
                      <div className={`h-4 w-4 mx-auto ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {/* Project Name Skeleton */}
                        <div className={`h-4 w-32 ${skeletonClass}`}></div>
                        {/* Project Description Skeleton */}
                        <div className={`h-3 w-24 ${skeletonClass}`}></div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`h-6 w-20 ${skeletonClass}`}></div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`h-6 w-6 mx-auto ${skeletonClass}`}></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center gap-3">
        <div className={`h-10 w-28 ${skeletonClass}`}></div>
        <div className={`h-10 w-24 ${skeletonClass}`}></div>
      </div>
    </div>
  );
};

export default TeamDetailsSkeleton; 