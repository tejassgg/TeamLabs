import { useTheme } from '../../context/ThemeContext';

const ProjectCardSkeleton = ({ theme, delay = 0 }) => {
  const getThemeClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  return (
    <div
      className={getThemeClasses(
        'bg-white border border-gray-200 rounded-xl p-6 flex flex-col h-full relative overflow-hidden',
        'bg-transparent border border-gray-700 rounded-xl p-6 flex flex-col h-full relative overflow-hidden'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shimmer Effect */}
      <div className={getThemeClasses(
        'absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent',
        'absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent'
      )}></div>
      
      {/* Project Header Skeleton */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          {/* Project Icon Skeleton */}
          <div className={getThemeClasses(
            'w-12 h-12 bg-gray-200 rounded-lg',
            'w-12 h-12 bg-gray-700 rounded-lg'
          )}></div>
          <div className="flex-1">
            {/* Project Title Skeleton */}
            <div className={getThemeClasses(
              'h-5 bg-gray-200 rounded mb-2 w-3/4',
              'h-5 bg-gray-700 rounded mb-2 w-3/4'
            )}></div>
            {/* Project Description Skeleton */}
            <div className={getThemeClasses(
              'h-4 bg-gray-200 rounded w-full',
              'h-4 bg-gray-700 rounded w-full'
            )}></div>
          </div>
        </div>
        {/* Status Badge Skeleton */}
        <div className={getThemeClasses(
          'w-20 h-6 bg-gray-200 rounded-full',
          'w-20 h-6 bg-gray-700 rounded-full'
        )}></div>
      </div>

      {/* Project Stats Skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className={getThemeClasses(
              'h-8 bg-gray-200 rounded mb-1',
              'h-8 bg-gray-700 rounded mb-1'
            )}></div>
            <div className={getThemeClasses(
              'h-3 bg-gray-200 rounded w-12 mx-auto',
              'h-3 bg-gray-700 rounded w-12 mx-auto'
            )}></div>
          </div>
        ))}
      </div>

      {/* Bottom Section Skeleton */}
      <div className="space-y-3 mt-auto relative z-10">
        {/* Progress Bar Skeleton */}
        <div>
          <div className={getThemeClasses(
            'w-full bg-gray-200 rounded-full h-2',
            'w-full bg-gray-700 rounded-full h-2'
          )}>
            <div className={getThemeClasses(
              'h-2 bg-gray-300 rounded-full w-1/3',
              'h-2 bg-gray-600 rounded-full w-1/3'
            )}></div>
          </div>
        </div>

        {/* Created Date and Navigation Skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className={getThemeClasses(
              'w-3 h-3 bg-gray-200 rounded',
              'w-3 h-3 bg-gray-700 rounded'
            )}></div>
            <div className={getThemeClasses(
              'h-3 bg-gray-200 rounded w-24',
              'h-3 bg-gray-700 rounded w-24'
            )}></div>
          </div>
          <div className={getThemeClasses(
            'w-3 h-3 bg-gray-200 rounded',
            'w-3 h-3 bg-gray-700 rounded'
          )}></div>
        </div>
      </div>
    </div>
  );
};

const ProjectsSkeleton = () => {
  const { theme } = useTheme();

  const getThemeClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  return (
    <div className={getThemeClasses(
      'mx-auto bg-white text-gray-900',
      'mx-auto bg-[#18181b] text-white'
    )}>
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* Description Skeleton */}
            <div className={getThemeClasses(
              'h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse',
              'h-4 bg-gray-700 rounded w-64 mt-2 animate-pulse'
            )}></div>
          </div>
        </div>

        {/* Search Bar and Add Button Skeleton */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-2xl">
            {/* Search Input Skeleton */}
            <div className={getThemeClasses(
              'w-full h-10 bg-gray-200 rounded-lg animate-pulse',
              'w-full h-10 bg-gray-700 rounded-lg animate-pulse'
            )}></div>
          </div>
          {/* Add Project Button Skeleton */}
          <div className={getThemeClasses(
            'w-32 h-10 bg-gray-200 rounded-lg animate-pulse',
            'w-32 h-10 bg-gray-700 rounded-lg animate-pulse'
          )}></div>
        </div>
      </div>

      {/* Projects Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {Array.from({ length: 8 }).map((_, index) => (
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
