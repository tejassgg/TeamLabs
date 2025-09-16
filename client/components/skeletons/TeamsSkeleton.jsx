import { useTheme } from '../../context/ThemeContext';

const TeamCardSkeleton = ({ theme, delay = 0 }) => {
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
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={getThemeClasses('w-10 h-10 bg-gray-200 rounded-lg','w-10 h-10 bg-gray-700 rounded-lg')}></div>
          <div className="flex-1">
            <div className={getThemeClasses('h-5 bg-gray-200 rounded w-40 mb-2','h-5 bg-gray-700 rounded w-40 mb-2')}></div>
            <div className={getThemeClasses('h-3 bg-gray-200 rounded w-56','h-3 bg-gray-700 rounded w-56')}></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('h-6 w-16 bg-gray-200 rounded-full','h-6 w-16 bg-gray-700 rounded-full')}></div>
          <div className={getThemeClasses('h-6 w-24 bg-gray-200 rounded-full','h-6 w-24 bg-gray-700 rounded-full')}></div>
        </div>
      </div>

      {/* Active Projects header */}
      <div className="mb-3 relative z-10">
        <div className={getThemeClasses('h-4 bg-gray-200 rounded w-32','h-4 bg-gray-700 rounded w-32')}></div>
      </div>

      {/* Project list */}
      <div className="space-y-3 relative z-10">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <div className={getThemeClasses('w-2 h-2 mt-1.5 bg-gray-300 rounded-full','w-2 h-2 mt-1.5 bg-gray-700 rounded-full')}></div>
              <div>
                <div className={getThemeClasses('h-3.5 bg-gray-200 rounded w-56 mb-1','h-3.5 bg-gray-700 rounded w-56 mb-1')}></div>
                <div className={getThemeClasses('h-3 bg-gray-200 rounded w-40','h-3 bg-gray-700 rounded w-40')}></div>
              </div>
            </div>
            <div className={getThemeClasses('h-6 w-20 bg-gray-200 rounded-full','h-6 w-20 bg-gray-700 rounded-full')}></div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between relative z-10">
        <div className="flex -space-x-2">
          {[1,2,3,4].map(i => (
            <div key={i} className={getThemeClasses('w-7 h-7 rounded-full bg-gray-200 border-2 border-white','w-7 h-7 rounded-full bg-gray-700 border-2 border-[#111214]')}></div>
          ))}
          <div className={getThemeClasses('w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs','w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs')}></div>
        </div>
        <div className="flex items-center gap-2">
          <div className={getThemeClasses('w-3 h-3 bg-gray-200 rounded','w-3 h-3 bg-gray-700 rounded')}></div>
          <div className={getThemeClasses('h-3 bg-gray-200 rounded w-28','h-3 bg-gray-700 rounded w-28')}></div>
        </div>
      </div>
    </div>
  );
};

const TeamsSkeleton = () => {
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
          {/* Add Team Button Skeleton */}
          <div className={getThemeClasses(
            'w-28 h-10 bg-gray-200 rounded-lg animate-pulse',
            'w-28 h-10 bg-gray-700 rounded-lg animate-pulse'
          )}></div>
        </div>
      </div>

      {/* Teams Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {Array.from({ length: 6 }).map((_, index) => (
          <TeamCardSkeleton 
            key={index} 
            theme={theme} 
            delay={index * 100} // Stagger animation delays
          />
        ))}
      </div>
    </div>
  );
};

export default TeamsSkeleton;
