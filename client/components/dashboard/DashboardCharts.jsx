import { useEffect, useState, useMemo } from 'react';
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
import TimeTrackerWidget from './TimeTrackerWidget';
import BurndownWidget from './BurndownWidget';
import commonTypes from '../../data/commonTypes.json';

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

const DashboardCharts = ({ stats, theme, userDetails, tasks, setTasks }) => {
  const chartData = useMemo(() => {
    if (!stats?.charts) return null;

    const charts = stats.charts;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Project Status Distribution
    const projectStatusLabels = commonTypes
      .filter(item => item.MasterType === 'ProjectStatus')
      .sort((a, b) => a.Code - b.Code)
      .map(item => item.Value);
    const projectStatusValues = projectStatusLabels.map(label => charts.projectStatusDistribution[label] || 0);
    const projectStatusData = {
      labels: projectStatusLabels,
      datasets: [{
        data: projectStatusValues,
        backgroundColor: [
          '#64748b', // Slate - Not Assigned
          '#6366f1', // Indigo - Assigned
          '#f59e0b', // Amber - In Progress
          '#a855f7', // Purple - QA
          '#ec4899', // Pink - Deployment
          '#10b981', // Emerald - Completed
        ],
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#232323' : '#ffffff',
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
          '#6366f1', // User Story
          '#10b981', // Task
          '#f43f5e', // Bug
          '#a855f7', // Feature
          '#f59e0b', // Improvement
          '#06b6d4', // Documentation
          '#64748b', // Maintenance
        ].slice(0, taskTypeLabels.length),
        borderWidth: 1,
        borderColor: theme === 'dark' ? '#424242' : '#e5e7eb',
        maxBarThickness: 20,
        borderRadius: 6
      }]
    };

    // Monthly Activity Timeline (-3 & +2 months from current month)
    const currentMonth = new Date().getMonth();
    const last6MonthNames = [];
    const last6ProjectsCreated = [];
    const last6TasksCompleted = [];
    const projectsCreatedSource = charts.monthlyActivity?.projectsCreated || [];
    const tasksCompletedSource = charts.monthlyActivity?.tasksCompleted || [];

    for (let offset = -3; offset <= 2; offset++) {
      const monthIndex = (currentMonth + offset + 12) % 12;
      last6MonthNames.push(monthNames[monthIndex]);
      last6ProjectsCreated.push(projectsCreatedSource[monthIndex] || 0);
      last6TasksCompleted.push(tasksCompletedSource[monthIndex] || 0);
    }

    const monthlyActivityData = {
      labels: last6MonthNames,
      datasets: [
        {
          label: 'Projects Created',
          data: last6ProjectsCreated,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.04)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#a855f7',
          pointHoverRadius: 6,
        },
        {
          label: 'Tasks Completed',
          data: last6TasksCompleted,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.04)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#06b6d4',
          pointHoverRadius: 6,
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
          backgroundColor: '#6366f1',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Active Projects',
          data: charts.teamPerformance.map(team => team.activeProjects),
          backgroundColor: '#06b6d4',
          borderColor: 'rgba(6, 182, 212, 0.2)',
          borderWidth: 1,
          borderRadius: 6,
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
          '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7',
          '#06b6d4', '#ec4899', '#64748b', '#f97316', '#059669'
        ].slice(0, activityLabels.length),
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#232323' : '#ffffff',
      }]
    };

    return {
      projectStatus: projectStatusData,
      taskType: taskTypeData,
      monthlyActivity: monthlyActivityData,
      teamPerformance: teamPerformanceData,
      activityOverview: activityData,
    };
  }, [stats, theme]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#475569',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 11,
            weight: '600'
          },
          usePointStyle: true,
          padding: 22,
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? 'rgba(35, 35, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        bodyColor: theme === 'dark' ? '#cbd5e1' : '#334155',
        borderColor: theme === 'dark' ? '#424242' : 'rgba(0, 0, 0, 0.06)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: true,
        backdropFilter: 'blur(8px)',
      }
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? 'rgba(66, 66, 66, 0.2)' : 'rgba(0, 0, 0, 0.03)',
          drawBorder: false,
          borderDash: [5, 5]
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'monospace',
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(66, 66, 66, 0.2)' : 'rgba(0, 0, 0, 0.03)',
          drawBorder: false,
          borderDash: [5, 5]
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'monospace',
            size: 10
          }
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
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  const projectStatusChartOptions = {
    ...chartOptions,
    cutout: '75%',
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom',
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  if (!chartData || !stats?.charts) {
    return <DashboardSkeleton />;
  }

  // Calculate project completion percent
  const completedPercent = stats.charts.totalTasks > 0
    ? Math.round((stats.charts.completedTasks / stats.charts.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6 mb-8">
      {/* 1. Task Completion Summary & Task Burndown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Task Completion Summary */}
        <div className={`rounded-2xl border p-6 transition-all duration-300 backdrop-blur-md h-full flex flex-col justify-between ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'}`}>
          <div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Task Completion & Velocity</h2>
              <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Active organization workflows</p>
            </div>

            <div className="grid grid-cols-3 gap-4 my-6">
              <div className={`text-center p-4 rounded-xl border ${theme === 'dark' ? 'bg-dark-bg/40 border-dark-border/40' : 'bg-slate-50 border-slate-200/50'}`}>
                <div className={`text-2xl sm:text-3xl font-extrabold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.charts.totalTasks}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Total</div>
              </div>
              <div className={`text-center p-4 rounded-xl border ${theme === 'dark' ? 'bg-dark-bg/40 border-dark-border/40' : 'bg-slate-50 border-slate-200/50'}`}>
                <div className={`text-2xl sm:text-3xl font-extrabold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.charts.completedTasks}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Done</div>
              </div>
              <div className={`text-center p-4 rounded-xl border ${theme === 'dark' ? 'bg-dark-bg/40 border-dark-border/40' : 'bg-slate-50 border-slate-200/50'}`}>
                <div className={`text-2xl sm:text-3xl font-extrabold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{stats.charts.activeTasks}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Active</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
              <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-505 text-slate-500'}>PROGRESS VELOCITY</span>
              <span className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}>{completedPercent}% COMPLETED</span>
            </div>
            <div className={`w-full rounded-full h-3 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} p-0.5 border ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 shadow-md shadow-blue-500/10"
                style={{ width: `${completedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Task Burndown */}
        <BurndownWidget
          organizationId={userDetails?.organizationID}
          theme={theme}
          tasks={tasks}
        />
      </div>

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Projects Card */}
        <div className={`h-32 rounded-2xl border p-4 transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/30 shadow-md hover:border-slate-300'}`}>
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <FaProjectDiagram className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} size={15} />
            </div>
            <span className="text-2xl font-bold">{stats?.totalProjects || 0}</span>
          </div>
          <p className={`text-xs font-semibold uppercase tracking-wider mt-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Projects</p>
        </div>

        {/* Teams Card */}
        <div className={`rounded-2xl border p-4 transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/30 shadow-md hover:border-slate-300'}`}>
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <FaUsers className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} size={15} />
            </div>
            <span className="text-2xl font-bold">{stats?.totalTeams || 0}</span>
          </div>
          <p className={`text-xs font-semibold uppercase tracking-wider mt-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Teams</p>
        </div>

        {/* Deadlines Card */}
        <div className={`rounded-2xl border p-4 transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/30 shadow-md hover:border-slate-300'}`}>
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
              <FaClock className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} size={15} />
            </div>
            <span className="text-2xl font-bold">{stats?.upcomingDeadlines || 0}</span>
          </div>
          <p className={`text-xs font-semibold uppercase tracking-wider mt-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Deadlines</p>
        </div>

        {/* People Card */}
        <div className={`rounded-2xl border p-4 transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/30 shadow-md hover:border-slate-300'}`}>
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
              <FaUserFriends className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} size={15} />
            </div>
            <span className="text-2xl font-bold">{stats?.totalUsers || 0}</span>
          </div>
          <p className={`text-xs font-semibold uppercase tracking-wider mt-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>People</p>
        </div>
      </div>

      {/* 2. Project Status, Task Type Distribution, and Personal Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Project Status */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'}`}>
          <div className="pb-4 mb-4">
            <h2 className="text-lg font-bold tracking-tight">Project Status</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Distribution across org</p>
          </div>
          <div className="p-2">
            <div className="h-80 relative flex items-center justify-center">
              <Doughnut data={chartData.projectStatus} options={projectStatusChartOptions} />
            </div>
          </div>
        </div>

        {/* Task Type Distribution */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'}`}>
          <div className="pb-4 mb-4">
            <h2 className="text-lg font-bold tracking-tight">Task Type Distribution</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Breakdown of different category and epic types</p>
          </div>
          <div className="p-2">
            <div className="h-80">
              <Bar data={chartData.taskType} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Personal Time Tracker */}
        <TimeTrackerWidget
          userDetails={userDetails}
          theme={theme}
          tasks={tasks}
          setTasks={setTasks}
        />
      </div>

      {/* 3. Monthly Activity, Team Performance, and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Activity Timeline */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'}`}>
          <div className="pb-4 mb-4">
            <h2 className="text-lg font-bold tracking-tight">Monthly Activity Timeline</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Track and cross-compare project creations and task completion trends</p>
          </div>
          <div className="p-2">
            <div className="h-80">
              <Line data={chartData.monthlyActivity} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'}`}>
          <div className="pb-4 mb-4">
            <h2 className="text-lg font-bold tracking-tight">Team Performance Overview</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Breakdown of member counts and active sprint pipelines per team</p>
          </div>
          <div className="p-2">
            <div className="h-80">
              <Bar data={chartData.teamPerformance} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${theme === 'dark' ? 'bg-dark-bg border-zinc-800/80' : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'}`}>
          <div className="pb-4 mb-4">
            <h2 className="text-lg font-bold tracking-tight">Recent Activity Overview</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>User activity breakdown over the last 30 operational days</p>
          </div>
          <div className="p-2">
            <div className="h-80 relative flex items-center justify-center">
              <Pie data={chartData.activityOverview} options={pieChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;