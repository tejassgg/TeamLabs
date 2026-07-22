import React from 'react';

const TaskDetailsSkeleton = () => {
  const skeletonClass = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';
  const lightSkeletonClass = 'animate-pulse bg-gray-100 dark:bg-gray-800 rounded';

  return (
    <div className="mx-auto">
      {/* Desktop & Tablet Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">

        {/* Left Column - Main Content (Takes 3 columns) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className={`h-4 w-16 ${lightSkeletonClass}`}></div>
            <span>›</span>
            <div className={`h-4 w-32 ${lightSkeletonClass}`}></div>
            <span>›</span>
            <div className={`h-4 w-48 ${lightSkeletonClass}`}></div>
          </div>

          {/* Task Progress Bar Card */}
          <div className="p-6 rounded-xl border border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-5 w-5 rounded ${lightSkeletonClass}`}></div>
                <div className={`h-5 w-36 ${skeletonClass}`}></div>
              </div>
              <div className={`h-6 w-12 rounded-full ${lightSkeletonClass}`}></div>
            </div>

            {/* Progress Bar steps */}
            <div className="relative flex items-center justify-between w-full pt-2">
              <div className="relative flex items-center justify-between w-full pt-2">
                <div className="absolute left-0 right-0 h-1 bg-gray-300 dark:bg-gray-700 -z-10"></div>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-2 px-1">
                    <div className={`h-6 w-6 rounded-full ${skeletonClass}`}></div>
                    <div className={`h-3 w-12 ${lightSkeletonClass} hidden sm:block`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Description Card */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded ${lightSkeletonClass}`}></div>
                <div className={`h-5 w-32 ${skeletonClass}`}></div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`h-5 w-5 rounded ${lightSkeletonClass} mt-1`}></div>
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-full ${lightSkeletonClass}`}></div>
                <div className={`h-4 w-5/6 ${lightSkeletonClass}`}></div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className={`h-6 w-16 rounded-full ${lightSkeletonClass}`}></div>
              <div className={`h-6 w-16 rounded-full ${lightSkeletonClass}`}></div>
              <div className={`h-6 w-16 rounded-full ${lightSkeletonClass}`}></div>
            </div>
          </div>

          {/* Assigned To Section */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Assigned To:</span>
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full ${skeletonClass}`}></div>
              <div className={`h-4 w-32 ${skeletonClass}`}></div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-24 ${skeletonClass}`}></div>
            </div>
            <div className="h-32 w-full border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-3 bg-gray-50/50 dark:bg-zinc-900/10">
              <div className={`h-8 w-8 ${skeletonClass}`}></div>
              <div className={`h-4 w-40 ${skeletonClass}`}></div>
              <div className={`h-3 w-48 ${lightSkeletonClass}`}></div>
              <div className={`h-3 w-32 ${lightSkeletonClass}`}></div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-24 ${skeletonClass}`}></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded border border-gray-300 dark:border-zinc-800"></div>
                <div className={`h-4 w-64 ${lightSkeletonClass}`}></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded border border-gray-300 dark:border-zinc-800"></div>
                <div className={`h-4 w-48 ${lightSkeletonClass}`}></div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-24 ${skeletonClass}`}></div>
            </div>

            {/* Comment Input */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-full ${skeletonClass}`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-12 w-full rounded-lg ${lightSkeletonClass}`}></div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className={`h-8 w-24 rounded ${lightSkeletonClass}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Task Dates (Takes 1 column) */}
        <div className="lg:col-span-1 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded ${lightSkeletonClass}`}></div>
              <div className={`h-5 w-24 ${skeletonClass}`}></div>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                <div className={`h-3 w-14 ${lightSkeletonClass}`}></div>
                <div className={`h-4 w-20 ${skeletonClass}`}></div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                <div className={`h-3 w-14 ${lightSkeletonClass}`}></div>
                <div className={`h-4 w-20 ${skeletonClass}`}></div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`h-3 w-14 ${lightSkeletonClass}`}></div>
                <div className={`h-4 w-20 ${skeletonClass}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Project Info, Development, History (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Project Info Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded ${lightSkeletonClass}`}></div>
              <div className={`h-5 w-28 ${skeletonClass}`}></div>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
              <div className={`h-5 w-40 ${skeletonClass}`}></div>
              <div className={`h-12 w-full ${lightSkeletonClass}`}></div>
              <div className="space-y-1 pt-1">
                <div className={`h-3 w-28 ${lightSkeletonClass}`}></div>
                <div className={`h-4 w-24 ${skeletonClass}`}></div>
              </div>
            </div>
          </div>

          {/* Development Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded ${lightSkeletonClass}`}></div>
              <div className={`h-5 w-28 ${skeletonClass}`}></div>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className={`h-8 w-8 rounded ${lightSkeletonClass}`}></div>
                <div className="flex-1 space-y-1.5">
                  <div className={`h-3 w-full ${lightSkeletonClass}`}></div>
                  <div className={`h-3 w-3/4 ${lightSkeletonClass}`}></div>
                </div>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full ${lightSkeletonClass}`}></div>
                  <div className={`h-4 w-40 ${lightSkeletonClass}`}></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full ${lightSkeletonClass}`}></div>
                  <div className={`h-4 w-32 ${lightSkeletonClass}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded ${lightSkeletonClass}`}></div>
              <div className={`h-5 w-16 ${skeletonClass}`}></div>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1 pb-2 border-b border-gray-100 dark:border-zinc-800 last:border-b-0 last:pb-0">
                  <div className={`h-4 w-full ${skeletonClass}`}></div>
                  <div className={`h-3 w-24 ${lightSkeletonClass}`}></div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
                <div className={`h-6 w-12 ${lightSkeletonClass}`}></div>
                <div className={`h-4 w-20 ${lightSkeletonClass}`}></div>
                <div className={`h-6 w-12 ${lightSkeletonClass}`}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskDetailsSkeleton;
