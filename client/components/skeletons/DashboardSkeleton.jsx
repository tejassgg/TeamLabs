import { useTheme } from '../../context/ThemeContext';

const Card = ({ children, className = '' }) => {
  const { theme } = useTheme();
  return (
    <div className={`${theme === 'dark' ? 'bg-transparent border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

const Bar = ({ w = 'w-full', h = 'h-4' }) => {
  const { theme } = useTheme();
  return <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} ${h} ${w} rounded`} />;
};

const Circle = ({ size = 'h-10 w-10' }) => {
  const { theme } = useTheme();
  return <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} ${size} rounded-full`} />;
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
    <div className={`${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'} ${pulse} space-y-6`}>
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
          <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} h-2 rounded-full w-full`}>
            <div className={`${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} h-2 rounded-full w-1/2`} />
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
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} w-8 h-24 rounded`} />
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} w-8 h-40 rounded`} />
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} w-8 h-16 rounded`} />
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} w-8 h-28 rounded`} />
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} w-8 h-20 rounded`} />
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
              <div key={i} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} w-full rounded`} style={{ height: `${20 + (i % 6) * 8}px` }} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardSkeleton;


