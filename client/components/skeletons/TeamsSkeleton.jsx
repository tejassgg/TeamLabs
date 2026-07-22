
const TeamCardSkeleton = ({ delay = 0 }) => {

  return (
    <div
      className={'bg-white border border-gray-200 rounded-xl p-6 flex flex-col h-full relative overflow-hidden dark:bg-transparent dark:border dark:border-gray-700 dark:rounded-xl dark:p-6 dark:flex dark:flex-col dark:h-full dark:relative dark:overflow-hidden'}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shimmer Effect */}
      <div className={'absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:absolute dark:inset-0 dark:-translate-x-full dark:animate-shimmer dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent'}></div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={'w-10 h-10 bg-gray-200 rounded-lg dark:w-10 dark:h-10 dark:bg-gray-700 dark:rounded-lg'}></div>
          <div className="flex-1">
            <div className={'h-5 bg-gray-200 rounded w-40 mb-2 dark:h-5 dark:bg-gray-700 dark:rounded dark:w-40 dark:mb-2'}></div>
            <div className={'h-3 bg-gray-200 rounded w-56 dark:h-3 dark:bg-gray-700 dark:rounded dark:w-56'}></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={'h-6 w-16 bg-gray-200 rounded-full dark:h-6 dark:w-16 dark:bg-gray-700 dark:rounded-full'}></div>
          <div className={'h-6 w-24 bg-gray-200 rounded-full dark:h-6 dark:w-24 dark:bg-gray-700 dark:rounded-full'}></div>
        </div>
      </div>

      {/* Active Projects header */}
      <div className="mb-3 relative z-10">
        <div className={'h-4 bg-gray-200 rounded w-32 dark:h-4 dark:bg-gray-700 dark:rounded dark:w-32'}></div>
      </div>

      {/* Project list */}
      <div className="space-y-3 relative z-10">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <div className={'w-2 h-2 mt-1.5 bg-gray-300 rounded-full dark:w-2 dark:h-2 dark:mt-1.5 dark:bg-gray-700 dark:rounded-full'}></div>
              <div>
                <div className={'h-3.5 bg-gray-200 rounded w-56 mb-1 dark:h-3.5 dark:bg-gray-700 dark:rounded dark:w-56 dark:mb-1'}></div>
                <div className={'h-3 bg-gray-200 rounded w-40 dark:h-3 dark:bg-gray-700 dark:rounded dark:w-40'}></div>
              </div>
            </div>
            <div className={'h-6 w-20 bg-gray-200 rounded-full dark:h-6 dark:w-20 dark:bg-gray-700 dark:rounded-full'}></div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between relative z-10">
        <div className="flex -space-x-2">
          {[1,2,3,4].map(i => (
            <div key={i} className={'w-7 h-7 rounded-full bg-gray-200 border-2 border-white dark:w-7 dark:h-7 dark:rounded-full dark:bg-gray-700 dark:border-2 dark:border-[#111214]'}></div>
          ))}
          <div className={'w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs dark:w-7 dark:h-7 dark:rounded-full dark:bg-gray-700 dark:flex dark:items-center dark:justify-center dark:text-xs'}></div>
        </div>
        <div className="flex items-center gap-2">
          <div className={'w-3 h-3 bg-gray-200 rounded dark:w-3 dark:h-3 dark:bg-gray-700 dark:rounded'}></div>
          <div className={'h-3 bg-gray-200 rounded w-28 dark:h-3 dark:bg-gray-700 dark:rounded dark:w-28'}></div>
        </div>
      </div>
    </div>
  );
};

const TeamsSkeleton = () => {
  
  ;

  return (
    <div className={'mx-auto bg-white text-gray-900 dark:mx-auto dark:bg-dark-bg dark:text-white'}>
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* Description Skeleton */}
            <div className={'h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse dark:h-4 dark:bg-gray-700 dark:rounded dark:w-64 dark:mt-2 dark:animate-pulse'}></div>
          </div>
        </div>

        {/* Search Bar and Add Button Skeleton */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-2xl">
            {/* Search Input Skeleton */}
            <div className={'w-full h-10 bg-gray-200 rounded-lg animate-pulse dark:w-full dark:h-10 dark:bg-gray-700 dark:rounded-lg dark:animate-pulse'}></div>
          </div>
          {/* Add Team Button Skeleton */}
          <div className={'w-28 h-10 bg-gray-200 rounded-lg animate-pulse dark:w-28 dark:h-10 dark:bg-gray-700 dark:rounded-lg dark:animate-pulse'}></div>
        </div>
      </div>

      {/* Teams Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {Array.from({ length: 6 }).map((_, index) => (
          <TeamCardSkeleton 
            key={index} 
            delay={index * 100} // Stagger animation delays
          />
        ))}
      </div>
    </div>
  );
};

export default TeamsSkeleton;
