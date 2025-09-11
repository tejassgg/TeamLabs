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
      <div className="flex items-center justify-between mb-6 relative z-10">
        {/* Project Name and Description */}
        <div className="flex-1">
          {/* Project Title Skeleton */}
          <div className={getThemeClasses(
            'h-6 bg-gray-200 rounded mb-2 w-3/4',
            'h-6 bg-gray-700 rounded mb-2 w-3/4'
          )}></div>
          {/* Project Description Skeleton */}
          <div className={getThemeClasses(
            'h-4 bg-gray-200 rounded w-full mb-1',
            'h-4 bg-gray-700 rounded w-full mb-1'
          )}></div>
          <div className={getThemeClasses(
            'h-4 bg-gray-200 rounded w-2/3',
            'h-4 bg-gray-700 rounded w-2/3'
          )}></div>
        </div>
        
        {/* Status Badge and Arrow Skeleton */}
        <div className="flex items-center gap-2">
          <div className={getThemeClasses(
            'w-20 h-6 bg-gray-200 rounded-full',
            'w-20 h-6 bg-gray-700 rounded-full'
          )}></div>
          <div className={getThemeClasses(
            'w-4 h-4 bg-gray-200 rounded',
            'w-4 h-4 bg-gray-700 rounded'
          )}></div>
        </div>
      </div>

      {/* Assigned Teams Skeleton */}
      <div className="mb-6 relative z-10">
        <div className={getThemeClasses(
          'text-sm font-medium text-gray-700 mb-3 h-4 bg-gray-200 rounded w-24',
          'text-sm font-medium text-gray-300 mb-3 h-4 bg-gray-700 rounded w-24'
        )}></div>
        
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={getThemeClasses(
                'w-2 h-2 bg-gray-200 rounded-full',
                'w-2 h-2 bg-gray-700 rounded-full'
              )}></div>
              <div className={getThemeClasses(
                'h-4 bg-gray-200 rounded w-32',
                'h-4 bg-gray-700 rounded w-32'
              )}></div>
              <div className={getThemeClasses(
                'h-5 bg-gray-200 rounded-full w-16',
                'h-5 bg-gray-700 rounded-full w-16'
              )}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={getThemeClasses(
            'h-4 bg-gray-200 rounded w-16',
            'h-4 bg-gray-700 rounded w-16'
          )}></div>
          <div className={getThemeClasses(
            'h-4 bg-gray-200 rounded w-8',
            'h-4 bg-gray-700 rounded w-8'
          )}></div>
        </div>
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

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between mt-auto relative z-10">
        {/* Member Avatars Skeleton */}
        <div className="flex items-center -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={getThemeClasses(
              'w-8 h-8 bg-gray-200 rounded-full border-2 border-white',
              'w-8 h-8 bg-gray-700 rounded-full border-2 border-gray-800'
            )}></div>
          ))}
          <div className={getThemeClasses(
            'w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center',
            'w-8 h-8 bg-gray-700 rounded-full border-2 border-gray-800 flex items-center justify-center'
          )}>
            <div className={getThemeClasses(
              'h-3 bg-gray-300 rounded w-4',
              'h-3 bg-gray-600 rounded w-4'
            )}></div>
          </div>
        </div>
        
        {/* Created Date Skeleton */}
        <div className="flex items-center gap-2">
          <div className={getThemeClasses(
            'w-3 h-3 bg-gray-200 rounded',
            'w-3 h-3 bg-gray-700 rounded'
          )}></div>
          <div className={getThemeClasses(
            'h-3 bg-gray-200 rounded w-20',
            'h-3 bg-gray-700 rounded w-20'
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
        {/* Title and Search Bar Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Page Title Skeleton */}
          <div>
            <div className={getThemeClasses(
              'h-8 bg-gray-200 rounded w-80 mb-2 animate-pulse',
              'h-8 bg-gray-700 rounded w-80 mb-2 animate-pulse'
            )}></div>
            <div className={getThemeClasses(
              'h-4 bg-gray-200 rounded w-64 animate-pulse',
              'h-4 bg-gray-700 rounded w-64 animate-pulse'
            )}></div>
          </div>
          
          {/* Search Bar and Add Button Skeleton */}
          <div className="flex items-center gap-4">
            {/* Search Input Skeleton */}
            <div className="relative">
              <div className={getThemeClasses(
                'w-80 h-10 bg-gray-200 rounded-lg animate-pulse',
                'w-80 h-10 bg-gray-700 rounded-lg animate-pulse'
              )}></div>
            </div>
            {/* Add Project Button Skeleton */}
            <div className={getThemeClasses(
              'w-20 h-10 bg-gray-200 rounded-lg animate-pulse',
              'w-20 h-10 bg-gray-700 rounded-lg animate-pulse'
            )}></div>
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
