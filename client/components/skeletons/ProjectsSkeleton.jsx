
const ProjectCardSkeleton = ({ theme, delay = 0 }) => {
  ;

  return (
    <div
      className={'bg-white border border-gray-200 rounded-xl p-6 flex flex-col h-full relative overflow-hidden dark:bg-transparent dark:border dark:border-gray-700 dark:rounded-xl dark:p-6 dark:flex dark:flex-col dark:h-full dark:relative dark:overflow-hidden'}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shimmer Effect */}
      <div className={'absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:absolute dark:inset-0 dark:-translate-x-full dark:animate-shimmer dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent'}></div>
      
      {/* Project Header Skeleton */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        {/* Project Name and Description */}
        <div className="flex-1">
          {/* Project Title Skeleton */}
          <div className={'h-6 bg-gray-200 rounded mb-2 w-3/4 dark:h-6 dark:bg-gray-700 dark:rounded dark:mb-2 dark:w-3/4'}></div>
          {/* Project Description Skeleton */}
          <div className={'h-4 bg-gray-200 rounded w-full mb-1 dark:h-4 dark:bg-gray-700 dark:rounded dark:w-full dark:mb-1'}></div>
          <div className={'h-4 bg-gray-200 rounded w-2/3 dark:h-4 dark:bg-gray-700 dark:rounded dark:w-2/3'}></div>
        </div>
        
        {/* Status Badge and Arrow Skeleton */}
        <div className="flex items-center gap-2">
          <div className={'w-20 h-6 bg-gray-200 rounded-full dark:w-20 dark:h-6 dark:bg-gray-700 dark:rounded-full'}></div>
          <div className={'w-4 h-4 bg-gray-200 rounded dark:w-4 dark:h-4 dark:bg-gray-700 dark:rounded'}></div>
        </div>
      </div>

      {/* Assigned Teams Skeleton */}
      <div className="mb-6 relative z-10">
        <div className={'text-sm font-medium text-gray-700 mb-3 h-4 bg-gray-200 rounded w-24 dark:text-sm dark:font-medium dark:text-gray-300 dark:mb-3 dark:h-4 dark:bg-gray-700 dark:rounded dark:w-24'}></div>
        
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={'w-2 h-2 bg-gray-200 rounded-full dark:w-2 dark:h-2 dark:bg-gray-700 dark:rounded-full'}></div>
              <div className={'h-4 bg-gray-200 rounded w-32 dark:h-4 dark:bg-gray-700 dark:rounded dark:w-32'}></div>
              <div className={'h-5 bg-gray-200 rounded-full w-16 dark:h-5 dark:bg-gray-700 dark:rounded-full dark:w-16'}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={'h-4 bg-gray-200 rounded w-16 dark:h-4 dark:bg-gray-700 dark:rounded dark:w-16'}></div>
          <div className={'h-4 bg-gray-200 rounded w-8 dark:h-4 dark:bg-gray-700 dark:rounded dark:w-8'}></div>
        </div>
        <div className={'w-full bg-gray-200 rounded-full h-2 dark:w-full dark:bg-gray-700 dark:rounded-full dark:h-2'}>
          <div className={'h-2 bg-gray-300 rounded-full w-1/3 dark:h-2 dark:bg-gray-600 dark:rounded-full dark:w-1/3'}></div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between mt-auto relative z-10">
        {/* Member Avatars Skeleton */}
        <div className="flex items-center -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={'w-8 h-8 bg-gray-200 rounded-full border-2 border-white dark:w-8 dark:h-8 dark:bg-gray-700 dark:rounded-full dark:border-2 dark:border-gray-800'}></div>
          ))}
          <div className={'w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center dark:w-8 dark:h-8 dark:bg-gray-700 dark:rounded-full dark:border-2 dark:border-gray-800 dark:flex dark:items-center dark:justify-center'}>
            <div className={'h-3 bg-gray-300 rounded w-4 dark:h-3 dark:bg-gray-600 dark:rounded dark:w-4'}></div>
          </div>
        </div>
        
        {/* Created Date Skeleton */}
        <div className="flex items-center gap-2">
          <div className={'w-3 h-3 bg-gray-200 rounded dark:w-3 dark:h-3 dark:bg-gray-700 dark:rounded'}></div>
          <div className={'h-3 bg-gray-200 rounded w-20 dark:h-3 dark:bg-gray-700 dark:rounded dark:w-20'}></div>
        </div>
      </div>
    </div>
  );
};

const ProjectsSkeleton = () => {
  
  ;

  return (
    <div className={'mx-auto bg-white text-gray-900 dark:mx-auto dark:bg-dark-bg dark:text-white'}>
      {/* Page Header Skeleton */}
      <div className="mb-8">
        {/* Title and Search Bar Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Page Title Skeleton */}
          <div>
            <div className={'h-8 bg-gray-200 rounded w-80 mb-2 animate-pulse dark:h-8 dark:bg-gray-700 dark:rounded dark:w-80 dark:mb-2 dark:animate-pulse'}></div>
            <div className={'h-4 bg-gray-200 rounded w-64 animate-pulse dark:h-4 dark:bg-gray-700 dark:rounded dark:w-64 dark:animate-pulse'}></div>
          </div>
          
          {/* Search Bar and Add Button Skeleton */}
          <div className="flex items-center gap-4">
            {/* Search Input Skeleton */}
            <div className="relative">
              <div className={'w-80 h-10 bg-gray-200 rounded-lg animate-pulse dark:w-80 dark:h-10 dark:bg-gray-700 dark:rounded-lg dark:animate-pulse'}></div>
            </div>
            {/* Add Project Button Skeleton */}
            <div className={'w-20 h-10 bg-gray-200 rounded-lg animate-pulse dark:w-20 dark:h-10 dark:bg-gray-700 dark:rounded-lg dark:animate-pulse'}></div>
          </div>
        </div>
      </div>

      {/* Projects Grid Skeleton - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {Array.from({ length: 4 }).map((_, index) => (
          <ProjectCardSkeleton 
            key={index} 
            theme={theme} 
            delay={index * 100} // Stagger animation delays
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectsSkeleton;
