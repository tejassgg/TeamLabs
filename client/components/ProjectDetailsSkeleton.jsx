import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ProjectDetailsSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const skeletonClass = isDark ? 'animate-pulse bg-gray-700 rounded' : 'animate-pulse bg-gray-200 rounded';

  return (
    <div className="mx-auto">
      {/* Project Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className={`h-8 w-96 mb-2 ${skeletonClass}`}></div>
          <div className={`h-5 w-80 ${skeletonClass}`}></div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`h-8 w-28 ${skeletonClass}`}></div>
          <div className={`h-8 w-36 ${skeletonClass}`}></div>
        </div>
      </div>

      {/* Navigation Tabs/Links */}
      <div className="flex items-center gap-4 mb-4 mt-2">
        <div className={`h-6 w-32 ${skeletonClass}`}></div>
        <div className={`h-6 w-24 ${skeletonClass}`}></div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className={`h-5 w-80 mb-2 ${skeletonClass}`}></div>
        <div className={`h-10 w-96 ${skeletonClass}`}></div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Teams Assigned Card */}
        <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}> 
          <div className={`h-6 w-40 mb-4 ${skeletonClass}`}></div>
          {/* Table header */}
          <div className="flex gap-4 mb-2">
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-20 ${skeletonClass}`}></div>
            <div className={`h-4 w-20 ${skeletonClass}`}></div>
            <div className={`h-4 w-20 ${skeletonClass}`}></div>
          </div>
          {/* Team rows */}
          {[1,2].map(i => (
            <div key={i} className="flex items-center gap-4 mb-3">
              <div className={`h-10 w-10 rounded-full ${skeletonClass}`}></div>
              <div className="flex flex-col gap-1">
                <div className={`h-4 w-32 ${skeletonClass}`}></div>
                <div className={`h-3 w-24 ${skeletonClass}`}></div>
              </div>
              <div className={`h-4 w-20 ${skeletonClass}`}></div>
              <div className={`h-6 w-16 ${skeletonClass}`}></div>
              <div className={`h-6 w-10 ${skeletonClass}`}></div>
            </div>
          ))}
        </div>
        {/* User Stories Card */}
        <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className={`h-6 w-32 mb-4 ${skeletonClass}`}></div>
          {/* Table header */}
          <div className="flex gap-4 mb-2">
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-20 ${skeletonClass}`}></div>
            <div className={`h-4 w-20 ${skeletonClass}`}></div>
          </div>
          {/* User story rows */}
          {[1].map(i => (
            <div key={i} className="flex items-center gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <div className={`h-4 w-32 ${skeletonClass}`}></div>
                <div className={`h-3 w-24 ${skeletonClass}`}></div>
              </div>
              <div className={`h-4 w-20 ${skeletonClass}`}></div>
              <div className={`h-6 w-16 ${skeletonClass}`}></div>
              <div className={`h-6 w-10 ${skeletonClass}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Table */}
      <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`h-6 w-32 ${skeletonClass}`}></div>
          <div className={`h-8 w-24 ${skeletonClass}`}></div>
        </div>
        {/* Table header */}
        <div className="flex gap-4 mb-2">
          <div className={`h-4 w-6 ${skeletonClass}`}></div>
          <div className={`h-4 w-32 ${skeletonClass}`}></div>
          <div className={`h-4 w-24 ${skeletonClass}`}></div>
          <div className={`h-4 w-24 ${skeletonClass}`}></div>
          <div className={`h-4 w-24 ${skeletonClass}`}></div>
          <div className={`h-4 w-24 ${skeletonClass}`}></div>
          <div className={`h-4 w-20 ${skeletonClass}`}></div>
          <div className={`h-4 w-20 ${skeletonClass}`}></div>
          <div className={`h-4 w-20 ${skeletonClass}`}></div>
        </div>
        {/* Task rows */}
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-4 mb-3">
            <div className={`h-4 w-6 ${skeletonClass}`}></div>
            <div className="flex flex-col gap-1">
              <div className={`h-4 w-32 ${skeletonClass}`}></div>
              <div className={`h-3 w-24 ${skeletonClass}`}></div>
            </div>
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-24 ${skeletonClass}`}></div>
            <div className={`h-6 w-20 ${skeletonClass}`}></div>
            <div className={`h-6 w-20 ${skeletonClass}`}></div>
            <div className={`h-6 w-20 ${skeletonClass}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetailsSkeleton; 