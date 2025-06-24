import { useTheme } from '../context/ThemeContext';

const SimpleCharts = ({ stats, theme }) => {
  if (!stats?.charts) {
    return null;
  }

  const charts = stats.charts;

  const renderProgressBar = (percentage, color) => (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${theme === 'dark' ? 'bg-[#424242]' : 'bg-gray-200'}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  const renderDonutChart = (data, title, colors) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const items = Object.entries(data).map(([key, value], index) => ({
      label: key,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: colors[index % colors.length]
    }));

    return (
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>{title}</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>
                  {item.value}
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = (data, title, colors) => {
    const maxValue = Math.max(...Object.values(data));
    const items = Object.entries(data).map(([key, value], index) => ({
      label: key,
      value,
      percentage: maxValue > 0 ? (value / maxValue) * 100 : 0,
      color: colors[index % colors.length]
    }));

    return (
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>{title}</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>
                  {item.value}
                </span>
              </div>
              <div className={`w-full bg-gray-200 rounded-full h-2 ${theme === 'dark' ? 'bg-[#424242]' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTimelineChart = (data, title) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxValue = Math.max(...data.projectsCreated, ...data.tasksCompleted);

    return (
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>{title}</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Projects Created</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {data.projectsCreated.map((value, index) => (
                <div key={index} className="text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>
                    {monthNames[index]}
                  </div>
                  <div className={`w-full bg-blue-500 rounded-t transition-all duration-300 ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'}`}
                       style={{ height: `${maxValue > 0 ? (value / maxValue) * 60 : 0}px` }}>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Tasks Completed</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {data.tasksCompleted.map((value, index) => (
                <div key={index} className="text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>
                    {monthNames[index]}
                  </div>
                  <div className={`w-full bg-green-500 rounded-t transition-all duration-300 ${theme === 'dark' ? 'bg-green-600' : 'bg-green-500'}`}
                       style={{ height: `${maxValue > 0 ? (value / maxValue) * 60 : 0}px` }}>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Project Status and Task Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border p-6`}>
          {renderDonutChart(
            charts.projectStatusDistribution,
            'Project Status Distribution',
            ['#6B7280', '#3B82F6', '#F59E0B', '#8B5CF6', '#F97316', '#6366F1', '#EC4899', '#10B981']
          )}
        </div>

        {/* Task Type Distribution */}
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border p-6`}>
          {renderBarChart(
            charts.taskTypeDistribution,
            'Task Type Distribution',
            ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#6366F1', '#6B7280']
          )}
        </div>
      </div>

      {/* Monthly Activity Timeline */}
      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border p-6`}>
        {renderTimelineChart(charts.monthlyActivity, 'Monthly Activity Overview')}
      </div>

      {/* Team Performance */}
      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Team Performance Overview</h3>
        <div className="space-y-4">
          {charts.teamPerformance.map((team, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>
                  {team.teamName}
                </span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                    Members: {team.memberCount}
                  </span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                    Projects: {team.activeProjects}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>Members</span>
                  </div>
                  {renderProgressBar(team.memberCount * 10, 'bg-blue-500')}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>Active Projects</span>
                  </div>
                  {renderProgressBar(team.activeProjects * 20, 'bg-green-500')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Completion Summary */}
      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Task Completion Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-[#232323]' : 'bg-blue-50'}`}>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {charts.totalTasks}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Total Tasks</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-[#232323]' : 'bg-green-50'}`}>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              {charts.completedTasks}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Completed Tasks</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-[#232323]' : 'bg-yellow-50'}`}>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {charts.activeTasks}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Active Tasks</div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Completion Rate</span>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>
              {charts.totalTasks > 0 ? Math.round((charts.completedTasks / charts.totalTasks) * 100) : 0}%
            </span>
          </div>
          {renderProgressBar(
            charts.totalTasks > 0 ? (charts.completedTasks / charts.totalTasks) * 100 : 0,
            'bg-gradient-to-r from-blue-500 to-green-500'
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCharts; 