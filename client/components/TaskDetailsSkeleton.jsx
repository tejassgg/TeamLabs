import React from 'react';
import { useTheme } from '../context/ThemeContext';

const TaskDetailsSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const skeletonClass = isDark ? 'animate-pulse bg-gray-700 rounded' : 'animate-pulse bg-gray-200 rounded';
  const lightSkeletonClass = isDark ? 'animate-pulse bg-gray-600 rounded' : 'animate-pulse bg-gray-100 rounded';

  return (
    <div className="mx-auto">
      {/* Main Content Area - Left Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className={`h-4 w-16 ${lightSkeletonClass}`}></div>
            <span>›</span>
            <div className={`h-4 w-32 ${lightSkeletonClass}`}></div>
            <span>›</span>
            <div className={`h-4 w-48 ${lightSkeletonClass}`}></div>
          </div>

          {/* Task Header */}
          <div className="space-y-4">
            {/* Title with Edit Icon */}
            <div className="flex items-start gap-3">
              <div className={`h-8 w-96 flex-1 ${skeletonClass}`}></div>
              <div className={`h-6 w-6 ${lightSkeletonClass}`}></div>
            </div>

            {/* Status Badge and Actions */}
            <div className="flex items-center gap-3">
              <div className={`h-8 w-24 ${lightSkeletonClass}`}></div>
              <div className={`h-8 w-6 ${lightSkeletonClass}`}></div>
            </div>
          </div>

          {/* Task Type Badge */}
          <div className="flex items-center gap-2">
            <div className={`h-6 w-16 rounded-full ${lightSkeletonClass}`}></div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <div className={`h-6 w-24 ${skeletonClass}`}></div>
            <div className={`h-20 w-full ${lightSkeletonClass}`}></div>
          </div>

          {/* Assigned To Section */}
          <div className="space-y-3">
            <div className={`h-5 w-20 ${skeletonClass}`}></div>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${skeletonClass}`}></div>
              <div className={`h-5 w-32 ${skeletonClass}`}></div>
              <div className={`h-4 w-4 ${lightSkeletonClass}`}></div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <div className={`h-5 w-24 ${skeletonClass}`}></div>
            <div className={`h-32 w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-3 ${lightSkeletonClass}`}>
              <div className={`h-8 w-8 ${skeletonClass}`}></div>
              <div className={`h-4 w-40 ${skeletonClass}`}></div>
              <div className={`h-3 w-48 ${lightSkeletonClass}`}></div>
              <div className={`h-3 w-32 ${lightSkeletonClass}`}></div>
            </div>
            <div className={`h-4 w-32 ${lightSkeletonClass}`}></div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <div className={`h-5 w-20 ${skeletonClass}`}></div>
            
            {/* Comment Input */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-full ${skeletonClass}`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-12 w-full rounded-lg ${lightSkeletonClass}`}></div>
                  <div className={`h-3 w-64 ${lightSkeletonClass}`}></div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className={`h-8 w-24 rounded ${lightSkeletonClass}`}></div>
              </div>
            </div>

            {/* Existing Comments */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-full ${skeletonClass}`}></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-20 ${skeletonClass}`}></div>
                    <span className="text-gray-400">•</span>
                    <div className={`h-4 w-20 ${lightSkeletonClass}`}></div>
                  </div>
                  <div className={`h-4 w-48 ${skeletonClass}`}></div>
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 ${lightSkeletonClass}`}></div>
                    <div className={`h-4 w-4 ${lightSkeletonClass}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Task Dates Section */}
          <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <div className={`h-5 w-5 ${lightSkeletonClass}`}></div>
              <div className={`h-5 w-24 ${skeletonClass}`}></div>
            </div>
            <div className="flex items-center justify-between gap-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Created Date:</span>
                <div className={`h-4 w-32 ${lightSkeletonClass}`}></div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Assigned Date:</span>
                <div className={`h-4 w-32 ${lightSkeletonClass}`}></div>
              </div>
            </div>
          </div>

          {/* Project Information Section */}
          <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <div className={`h-5 w-5 ${lightSkeletonClass}`}></div>
              <div className={`h-5 w-32 ${skeletonClass}`}></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Project Name:</span>
                <div className={`h-4 w-28 ${lightSkeletonClass}`}></div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                <div className={`h-4 w-32 ${lightSkeletonClass}`}></div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Project Deadline:</span>
                <div className={`h-4 w-20 ${lightSkeletonClass}`}></div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className={`rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <div className={`h-5 w-5 ${lightSkeletonClass}`}></div>
              <div className={`h-5 w-16 ${skeletonClass}`}></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <div className={`h-4 w-full ${skeletonClass}`}></div>
                  <div className={`h-3 w-32 ${lightSkeletonClass}`}></div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className={`h-6 w-12 ${lightSkeletonClass}`}></div>
              <div className={`h-6 w-24 ${lightSkeletonClass}`}></div>
              <div className={`h-6 w-12 ${lightSkeletonClass}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsSkeleton;
