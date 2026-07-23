import { useTheme } from '../../context/ThemeContext';

const Card = ({ children, className = '' }) => {
  const { theme } = useTheme();
  return (
    <div className={`bg-white border border-gray-200 shadow-sm dark:bg-transparent dark:border dark:border-gray-700 rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

const Bar = ({ w = 'w-full', h = 'h-4' }) => {
  const { theme } = useTheme();
  return <div className={`bg-gray-200 dark:bg-gray-700 ${h} ${w} rounded`} />;
};

const Circle = ({ size = 'h-10 w-10' }) => {
  const { theme } = useTheme();
  return <div className={`bg-gray-200 dark:bg-gray-700 ${size} rounded-full`} />;
};

const KPI = () => (
  <Card>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Circle size="h-8 w-8" />
        <Bar w="w-24" h="h-3" />
      </div>
      <Bar w="w-8" h="h-6" />
    </div>
  </Card>
);

const DashboardSkeleton = () => {
  const { theme } = useTheme();
  const pulse = 'animate-pulse';

  return (
    <div className={`text-gray-900 dark:text-[#F3F6FA] ${pulse}`}>
      {/* Tab Navigation Skeleton */}
      <div className="border-b border-gray-200 dark:border-zinc-800 mb-6">
        <div className="-mb-px flex items-center justify-between">
          <div className="flex-1 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-2 min-w-max ml-2 mt-2 pb-3 -mb-px">
              {/* Active "What's Up" tab */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white dark:bg-zinc-900 border-zinc-700/80 shadow-xs text-blue-600 relative animate-pulse">
                <div className="w-4 h-4 bg-blue-500/30 rounded-full animate-pulse"></div>
                <div className="h-4 w-20 bg-blue-500/20 rounded-md animate-pulse"></div>
                <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
              </div>
              {/* Inactive tabs */}
              {['Metrics & Widgets', 'Manage Board'].map((tab, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 border border-transparent text-gray-405">
                  <div className={`w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700`}></div>
                  <div className={`h-4 w-24 bg-gray-150 dark:bg-gray-700/50 rounded`}></div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Grid Content Wrapper */}
      <div className="px-4 space-y-6">
        {/* Top KPIs: Total Projects, Teams, Upcoming Deadlines, People */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPI />
          <KPI />
          <KPI />
          <KPI />
        </div>

      {/* Task Completion Summary: three metrics + progress bar */}
      <Card>
        <div className="mb-4">
          <Bar w="w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="p-4">
            <Bar w="w-24" />
            <div className="mt-2">
              <Bar w="w-12" h="h-8" />
            </div>
          </Card>
          <Card className="p-4">
            <Bar w="w-24" />
            <div className="mt-2">
              <Bar w="w-12" h="h-8" />
            </div>
          </Card>
          <Card className="p-4">
            <Bar w="w-24" />
            <div className="mt-2">
              <Bar w="w-12" h="h-8" />
            </div>
          </Card>
        </div>
        <div>
          <div className={`bg-gray-200 dark:bg-gray-700 h-2 rounded-full w-full`}>
            <div className={`bg-gray-300 dark:bg-gray-600 h-2 rounded-full w-1/2`} />
          </div>
          <div className="mt-2 flex justify-end">
            <Bar w="w-24" h="h-3" />
          </div>
        </div>
      </Card>

      {/* Middle row: Project Status Distribution and Task Type Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="mb-4">
            <Bar w="w-64" />
            <Bar w="w-80" h="h-3" />
          </div>
          <div className="flex items-center justify-center h-64">
            <Circle size="h-40 w-40" />
          </div>
        </Card>
        <Card>
          <div className="mb-4">
            <Bar w="w-64" />
            <Bar w="w-80" h="h-3" />
          </div>
          <div className="h-64">
            <div className="flex items-end gap-3 h-full">
              <div className={`bg-gray-200 dark:bg-gray-700 w-8 h-24 rounded`} />
              <div className={`bg-gray-200 dark:bg-gray-700 w-8 h-40 rounded`} />
              <div className={`bg-gray-200 dark:bg-gray-700 w-8 h-16 rounded`} />
              <div className={`bg-gray-200 dark:bg-gray-700 w-8 h-28 rounded`} />
              <div className={`bg-gray-200 dark:bg-gray-700 w-8 h-20 rounded`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Activity Overview chart */}
      <Card>
        <div className="mb-4">
          <Bar w="w-64" />
          <Bar w="w-96" h="h-3" />
        </div>
        <div className="h-72">
          <div className="grid grid-cols-12 gap-2 h-full items-end">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`bg-gray-200 dark:bg-gray-700 w-full rounded`} style={{ height: `${20 + (i % 6) * 8}px` }} />
            ))}
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default DashboardSkeleton;


