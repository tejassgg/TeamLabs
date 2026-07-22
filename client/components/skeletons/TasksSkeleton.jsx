import React from 'react';

const TasksSkeleton = () => {
    
  
  const TaskRow = () => (
    <tr className={'border-b border-gray-100 dark:border-b dark:border-zinc-800/60'}>
      <td className="py-3 pl-4 text-center">
        <div className={'w-4 h-4 bg-gray-250 bg-gray-200 rounded mx-auto animate-pulse dark:w-4 dark:h-4 dark:bg-zinc-800 dark:rounded dark:mx-auto dark:animate-pulse'}></div>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={'h-4 bg-gray-200 rounded w-48 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-48 dark:animate-pulse'}></div>
            <div className={'h-5 bg-gray-100 rounded w-20 animate-pulse dark:h-5 dark:bg-zinc-800/60 dark:rounded dark:w-20 dark:animate-pulse'}></div>
          </div>
          <div className={'h-3 bg-gray-200 rounded w-64 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-64 dark:animate-pulse'}></div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className={'w-8 h-8 bg-gray-200 rounded-full animate-pulse dark:w-8 dark:h-8 dark:bg-zinc-800 dark:rounded-full dark:animate-pulse'}></div>
          <div className="flex flex-col gap-1.5">
            <div className={'h-3 bg-gray-200 rounded w-20 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-20 dark:animate-pulse'}></div>
            <div className={'h-3 bg-gray-100 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-16 dark:animate-pulse'}></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className={'w-8 h-8 bg-gray-200 rounded-full animate-pulse dark:w-8 dark:h-8 dark:bg-zinc-800 dark:rounded-full dark:animate-pulse'}></div>
          <div className="flex flex-col gap-1.5">
            <div className={'h-3 bg-gray-200 rounded w-20 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-20 dark:animate-pulse'}></div>
            <div className={'h-3 bg-gray-100 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-16 dark:animate-pulse'}></div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell text-center">
        <div className={'h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-20 dark:mx-auto dark:animate-pulse'}></div>
        <div className={'h-3 bg-gray-100 rounded w-12 mx-auto mt-1.5 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-12 dark:mx-auto dark:mt-1.5 dark:animate-pulse'}></div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className={'h-5 bg-gray-200 rounded w-16 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded dark:w-16 dark:animate-pulse'}></div>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className={'h-6 bg-gray-200 rounded-full w-20 animate-pulse dark:h-6 dark:bg-zinc-800 dark:rounded-full dark:w-20 dark:animate-pulse'}></div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className={'w-7 h-7 bg-gray-200 rounded-lg animate-pulse dark:w-7 dark:h-7 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
          <div className={'w-7 h-7 bg-gray-200 rounded-lg animate-pulse dark:w-7 dark:h-7 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className={'text-2xl font-bold text-gray-900 dark:text-2xl dark:font-bold dark:text-white'}>Tasks</h1>
      </div>

      {/* Stats Hero Card Skeleton */}
      <div className="w-full mb-6">
        <div className={`border rounded-2xl p-6 max-w-5xl ${"bg-white border-gray-200 shadow-sm dark:bg-dark-bg dark:border-zinc-800/80 dark:shadow-none"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
            {/* Left Column: Cards (lg:col-span-4) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 w-full lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
              {/* Total Tasks Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${'border-gray-100 bg-gray-50/50 dark:border-zinc-800/85 dark:bg-zinc-900/30'}`}>
                <div className="flex items-center justify-between">
                  <div className={'h-3 bg-gray-200 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-16 dark:animate-pulse'}></div>
                  <div className={'w-5 h-5 bg-gray-100 rounded animate-pulse dark:w-5 dark:h-5 dark:bg-zinc-800/60 dark:rounded dark:animate-pulse'}></div>
                </div>
                <div className={'h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse dark:h-6 dark:bg-zinc-800 dark:rounded dark:w-10 dark:mt-3 dark:animate-pulse'}></div>
              </div>

              {/* Completed Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${'border-gray-100 bg-gray-50/50 dark:border-zinc-800/85 dark:bg-zinc-900/30'}`}>
                <div className="flex items-center justify-between">
                  <div className={'h-3 bg-gray-200 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-16 dark:animate-pulse'}></div>
                  <div className={'w-5 h-5 bg-gray-100 rounded animate-pulse dark:w-5 dark:h-5 dark:bg-zinc-800/60 dark:rounded dark:animate-pulse'}></div>
                </div>
                <div className={'h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse dark:h-6 dark:bg-zinc-800 dark:rounded dark:w-10 dark:mt-3 dark:animate-pulse'}></div>
              </div>

              {/* Overdue Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${'border-gray-100 bg-gray-50/50 dark:border-zinc-800/85 dark:bg-zinc-900/30'}`}>
                <div className="flex items-center justify-between">
                  <div className={'h-3 bg-gray-200 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-16 dark:animate-pulse'}></div>
                  <div className={'w-5 h-5 bg-gray-100 rounded animate-pulse dark:w-5 dark:h-5 dark:bg-zinc-800/60 dark:rounded dark:animate-pulse'}></div>
                </div>
                <div className={'h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse dark:h-6 dark:bg-zinc-800 dark:rounded dark:w-10 dark:mt-3 dark:animate-pulse'}></div>
              </div>

              {/* High Priority Card */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${'border-gray-100 bg-gray-50/50 dark:border-zinc-800/85 dark:bg-zinc-900/30'}`}>
                <div className="flex items-center justify-between">
                  <div className={'h-3 bg-gray-200 rounded w-16 animate-pulse dark:h-3 dark:bg-zinc-800 dark:rounded dark:w-16 dark:animate-pulse'}></div>
                  <div className={'w-5 h-5 bg-gray-100 rounded animate-pulse dark:w-5 dark:h-5 dark:bg-zinc-800/60 dark:rounded dark:animate-pulse'}></div>
                </div>
                <div className={'h-6 bg-gray-200 rounded w-10 mt-3 animate-pulse dark:h-6 dark:bg-zinc-800 dark:rounded dark:w-10 dark:mt-3 dark:animate-pulse'}></div>
              </div>
            </div>

            {/* Middle Column: Progress Ring (lg:col-span-2) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 lg:border-r border-gray-100 dark:border-zinc-800/85 pb-6 lg:pb-0 lg:pr-6">
              <div className={'w-20 h-20 rounded-full border-8 border-gray-100 animate-pulse bg-transparent flex items-center justify-center dark:w-20 dark:h-20 dark:rounded-full dark:border-8 dark:border-zinc-800 dark:animate-pulse dark:bg-transparent dark:flex dark:items-center dark:justify-center'}>
                <div className={'h-4 bg-gray-200 rounded w-8 animate-pulse dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-8 dark:animate-pulse'}></div>
              </div>
              <div className={'h-5 bg-gray-200 rounded w-16 mt-1.5 animate-pulse dark:h-5 dark:bg-zinc-800 dark:rounded dark:w-16 dark:mt-1.5 dark:animate-pulse'}></div>
              <div className={'h-3 bg-gray-100 rounded w-24 mt-1 animate-pulse dark:h-3 dark:bg-zinc-800/50 dark:rounded dark:w-24 dark:mt-1 dark:animate-pulse'}></div>
            </div>

            {/* Right Column: Search & Controls (lg:col-span-6) */}
            <div className="lg:col-span-6 flex flex-col gap-3 w-full h-full justify-end">
              {/* Search input mock */}
              <div className={'h-9 bg-gray-100 rounded-lg w-full animate-pulse dark:h-9 dark:bg-zinc-900/40 dark:rounded-lg dark:w-full dark:animate-pulse'}></div>
              {/* Filter controls mock */}
              <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                <div className={'h-8 w-24 bg-gray-200 rounded-lg animate-pulse dark:h-8 dark:w-24 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
                <div className={'h-8 w-20 bg-gray-200 rounded-lg animate-pulse dark:h-8 dark:w-20 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
                <div className={'h-8 w-16 bg-gray-200 rounded-lg animate-pulse dark:h-8 dark:w-16 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
                <div className={'h-8 w-28 bg-gray-200 rounded-lg animate-pulse dark:h-8 dark:w-28 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Header Skeleton */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <div className={'h-6 bg-gray-200 rounded w-40 animate-pulse dark:h-6 dark:bg-zinc-800 dark:rounded dark:w-40 dark:animate-pulse'}></div>
        <div className="flex items-center gap-3">
          <div className={'h-8 w-28 bg-gray-200 rounded-lg animate-pulse dark:h-8 dark:w-28 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
          <div className={'h-8 w-24 bg-gray-200 rounded-lg animate-pulse dark:h-8 dark:w-24 dark:bg-zinc-800 dark:rounded-lg dark:animate-pulse'}></div>
        </div>
      </div>

      {/* Task Table Skeleton */}
      <div className={'bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm dark:bg-transparent dark:border dark:border-zinc-800 dark:rounded-xl dark:overflow-hidden'}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className={'bg-gray-50 border-b border-gray-200 dark:bg-zinc-800/40 dark:border-b dark:border-zinc-700/80'}>
                <th className="py-3 pl-4 text-center w-[50px]">
                  <div className={'w-4 h-4 bg-gray-200 rounded mx-auto dark:w-4 dark:h-4 dark:bg-zinc-800 dark:rounded dark:mx-auto'}></div>
                </th>
                <th className="py-3 px-4 text-left w-[42%]">
                  <div className={'h-4 bg-gray-200 rounded w-16 dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-16'}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[12%]">
                  <div className={'h-4 bg-gray-200 rounded w-20 dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-20'}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[12%]">
                  <div className={'h-4 bg-gray-200 rounded w-16 dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-16'}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-center w-[11%]">
                  <div className={'h-4 bg-gray-200 rounded w-20 mx-auto dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-20 dark:mx-auto'}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[8%]">
                  <div className={'h-4 bg-gray-200 rounded w-14 dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-14'}></div>
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left w-[9%]">
                  <div className={'h-4 bg-gray-200 rounded w-12 dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-12'}></div>
                </th>
                <th className="py-3 px-4 text-left w-[6%]">
                  <div className={'h-4 bg-gray-200 rounded w-10 dark:h-4 dark:bg-zinc-800 dark:rounded dark:w-10'}></div>
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
