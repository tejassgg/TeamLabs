import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { FaProjectDiagram, FaUsers, FaClock, FaUserFriends } from 'react-icons/fa';
import DashboardSkeleton from '../skeletons/DashboardSkeleton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardCharts = ({ stats, theme }) => {
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stats?.charts) {
      prepareChartData();
      setLoading(false);
    }
  }, [stats, theme]);

  const prepareChartData = () => {
    const charts = stats.charts;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const color = (lightHex, darkHex) => (theme === 'dark' ? darkHex : lightHex);

    // Project Status Distribution
    const projectStatusLabels = Object.keys(charts.projectStatusDistribution);
    const projectStatusValues = Object.values(charts.projectStatusDistribution);
    const projectStatusData = {
      labels: projectStatusLabels,
      datasets: [{
        data: projectStatusValues,
        backgroundColor: [
          color('#6B7280', '#4B5563'), // Gray - Not Assigned
          color('#3B82F6', '#2563EB'), // Blue - Assigned
          color('#F59E0B', '#D97706'), // Yellow - In Progress
          color('#6366F1', '#4F46E5'), // Indigo - QA
          color('#EC4899', '#DB2777'), // Pink - Deployment
          color('#10B981', '#059669'), // Green - Completed
          color('#EF4444', '#DC2626'), // Red - Other
        ].slice(0, projectStatusLabels.length),
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#424242' : '#ffffff',
      }]
    };

    // Task Type Distribution
    const taskTypeLabels = Object.keys(charts.taskTypeDistribution);
    const taskTypeValues = Object.values(charts.taskTypeDistribution);
    const taskTypeData = {
      labels: taskTypeLabels,
      datasets: [{
        label: 'Number of Tasks',
        data: taskTypeValues,
        backgroundColor: [
          '#3B82F6', // User Story
          '#10B981', // Task
          '#EF4444', // Bug
          '#8B5CF6', // Feature
          '#F59E0B', // Improvement
          '#6366F1', // Documentation
          '#6B7280', // Maintenance
        ].slice(0, taskTypeLabels.length),
        borderWidth: 1,
        borderColor: theme === 'dark' ? '#424242' : '#e5e7eb',
      }]
    };

    // Monthly Activity Timeline
    const monthlyActivityData = {
      labels: monthNames,
      datasets: [
        {
          label: 'Projects Created',
          data: charts.monthlyActivity.projectsCreated,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Tasks Completed',
          data: charts.monthlyActivity.tasksCompleted,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };

    // Team Performance
    const teamPerformanceData = {
      labels: charts.teamPerformance.map(team => team.teamName),
      datasets: [
        {
          label: 'Team Members',
          data: charts.teamPerformance.map(team => team.memberCount),
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1,
        },
        {
          label: 'Active Projects',
          data: charts.teamPerformance.map(team => team.activeProjects),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1,
        }
      ]
    };

    // Activity Overview (Pie Chart)
    const activityLabels = Object.keys(charts.activityByType);
    const activityValues = Object.values(charts.activityByType);
    const activityData = {
      labels: activityLabels.map(label => label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
      datasets: [{
        data: activityValues,
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#6366F1', '#EC4899', '#6B7280', '#F97316', '#059669'
        ].slice(0, activityLabels.length),
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#424242' : '#ffffff',
      }]
    };

    setChartData({
      projectStatus: projectStatusData,
      taskType: taskTypeData,
      monthlyActivity: monthlyActivityData,
      teamPerformance: teamPerformanceData,
      activityOverview: activityData,
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#F3F6FA' : '#374151',
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1F1F1F' : '#ffffff',
        titleColor: theme === 'dark' ? '#F3F6FA' : '#111827',
        bodyColor: theme === 'dark' ? '#B0B8C1' : '#6B7280',
        borderColor: theme === 'dark' ? '#424242' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? '#424242' : '#e5e7eb',
        },
        ticks: {
          color: theme === 'dark' ? '#B0B8C1' : '#6B7280',
        }
      },
      y: {
        grid: {
          color: theme === 'dark' ? '#424242' : '#e5e7eb',
        },
        ticks: {
          color: theme === 'dark' ? '#B0B8C1' : '#6B7280',
        }
      }
    }
  };

  const pieChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'right',
      }
    }
  };

  if (loading || !stats?.charts) {
    return (
      <>
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Statistics Cards and Task Completion Summary - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        {/* Statistics Cards - 2x2 Grid (1/4th width) */}
        <div className="lg:col-span-2">
          <div className="h-full grid grid-cols-2 gap-4">
            {/* Projects Card */}
            <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border p-4' : 'bg-white text-gray-900 border-gray-100 rounded-xl shadow-sm p-4 border'} transition-all duration-200`}>
              <div className="grid grid-cols-2 items-center h-full">
                <div className='flex flex-col justify-between h-full'>
                  <div className={`w-8 h-8 p-2 flex flex-col items-start rounded-lg ${theme === 'dark' ? 'bg-[#232323]' : 'bg-gradient-to-r from-blue-50 to-blue-100'}`}>
                    <FaProjectDiagram className={theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} size={18} />
                  </div>
                  <p className={`text-md font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total Projects</p>
                </div>
                <div className='flex items-center justify-center'>
                  <h1 className={`text-4xl text-center font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{stats?.totalProjects || 0}</h1>
                </div>
              </div>
            </div>

            {/* Teams Card */}
            <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border p-4' : 'bg-white text-gray-900 border-gray-100 rounded-xl shadow-sm p-4 border'} transition-all duration-200`}>
              <div className="grid grid-cols-2 items-center h-full">
                <div className='flex flex-col justify-between h-full w-[60%]'>
                  <div className={`w-8 h-8 p-2 flex flex-col items-start rounded-lg ${theme === 'dark' ? 'bg-[#232323]' : 'bg-gradient-to-r from-green-50 to-green-100'}`}>
                    <FaUsers className={theme === 'dark' ? 'text-green-400' : 'text-green-500'} size={18} />
                  </div>
                  <p className={`text-md font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total Teams</p>
                </div>
                <div className='flex items-center justify-center'>
                  <h1 className={`text-4xl text-center font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{stats?.totalTeams || 0}</h1>
                </div>
              </div>
            </div>

            {/* Deadlines Card */}
            <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border p-4' : 'bg-white text-gray-900 border-gray-100 rounded-xl shadow-sm p-4 border'} transition-all duration-200`}>
              <div className="grid grid-cols-2 items-center h-full">
                <div className='flex flex-col justify-between h-full'>
                  <div className={`w-8 h-8 p-2 flex flex-col items-start rounded-lg ${theme === 'dark' ? 'bg-[#232323]' : 'bg-gradient-to-r from-yellow-50 to-yellow-100'}`}>
                    <FaClock className={theme === 'dark' ? 'text-yellow-300' : 'text-yellow-500'} size={18} />
                  </div>
                  <p className={`text-md font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Upcoming Deadlines</p>
                </div>
                <div className='flex items-center justify-center'>
                  <h1 className={`text-4xl text-center font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{stats?.upcomingDeadlines || 0}</h1>
                </div>
              </div>
            </div>

            {/* People Card */}
            <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border p-4' : 'bg-white text-gray-900 border-gray-100 rounded-xl shadow-sm p-4 border'} transition-all duration-200`}>
              <div className="grid grid-cols-2 items-center h-full">
                <div className='flex flex-col justify-between h-full'>
                  <div className={`w-8 h-8 p-2 flex flex-col items-start rounded-lg ${theme === 'dark' ? 'bg-[#232323]' : 'bg-gradient-to-r from-purple-50 to-purple-100'}`}>
                    <FaUserFriends className={theme === 'dark' ? 'text-purple-300' : 'text-purple-500'} size={18} />
                  </div>
                  <p className={`text-md font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total People</p>
                </div>
                <div className='flex items-center justify-center'>
                  <h1 className={`text-4xl text-center font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{stats?.totalUsers || 0}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Completion Summary - 3/4th width */}
        <div className="lg:col-span-6">
          <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border' : 'bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border'}`}>
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Task Completion Summary</h2>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>Overview of task progress and completion rates</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-transparent border border-gray-700 text-[#F3F6FA]' : 'bg-blue-50'} ${theme === 'dark' ? '' : 'border-none'} `}>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{stats.charts.totalTasks}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Total Tasks</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-transparent border border-gray-700 text-[#F3F6FA]' : 'bg-green-50'} ${theme === 'dark' ? '' : 'border-none'} `}>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{stats.charts.completedTasks}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Completed Tasks</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-transparent border border-gray-700 text-[#F3F6FA]' : 'bg-yellow-50'} ${theme === 'dark' ? '' : 'border-none'} `}>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.charts.activeTasks}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Active Tasks</div>
                </div>
              </div>
              <div className="mt-6">
                <div className={`w-full bg-gray-200 rounded-full h-2 ${theme === 'dark' ? 'bg-[#424242]' : 'bg-gray-200'}`}>
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.charts.totalTasks > 0 ? (stats.charts.completedTasks / stats.charts.totalTasks) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className={`text-sm mt-2 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                  Completed: {stats.charts.totalTasks > 0 ? Math.round((stats.charts.completedTasks / stats.charts.totalTasks) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Status and Task Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border' : 'bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border'}`}>
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Project Status Distribution</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>Overview of project status across the organization</p>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Doughnut data={chartData.projectStatus} options={pieChartOptions} />
            </div>
          </div>
        </div>

        {/* Task Type Distribution */}
        <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border' : 'bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border'}`}>
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Task Type Distribution</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>Breakdown of different task types</p>
          </div>
          <div className="p-4">
            <div className="h-64">
              <Bar data={chartData.taskType} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Activity Timeline */}
      <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border' : 'bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border'}`}>
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Monthly Activity Overview</h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>Track project creation and task completion trends</p>
        </div>
        <div className="p-4">
          <div className="h-80">
            <Line data={chartData.monthlyActivity} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Team Performance and Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border' : 'bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border'}`}>
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Team Performance Overview</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>Team member counts and active projects</p>
          </div>
          <div className="p-4">
            <div className="h-80">
              <Bar data={chartData.teamPerformance} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className={`${theme === 'dark' ? 'bg-transparent text-[#F3F6FA] border-gray-700 rounded-xl border' : 'bg-white text-gray-900 border-gray-200 rounded-xl shadow-sm border'}`}>
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Recent Activity Overview</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>User activity breakdown (last 30 days)</p>
          </div>
          <div className="p-4">
            <div className="h-80">
              <Pie data={chartData.activityOverview} options={pieChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts; 