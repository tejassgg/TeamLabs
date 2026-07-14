import React, { useEffect, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { FaFire, FaSync } from 'react-icons/fa';
import api from '../../services/api';

const BurndownWidget = ({ organizationId, theme, tasks: propTasks, tasksLoading }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    if (propTasks !== undefined && propTasks !== null) {
      setTasks(propTasks);
      setLoading(tasksLoading);
      return;
    }
    if (!organizationId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/task-details/all?organizationId=${organizationId}`);
      setTasks(response.data?.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks for burndown:', err);
      setError('Could not load chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [organizationId, propTasks, tasksLoading]);

  const burndownData = useMemo(() => {
    if (tasks.length === 0) return null;

    // We will build a burndown for the last 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(23, 59, 59, 999);
      dates.push(d);
    }

    const labels = dates.map(d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

    const actualRemaining = [];
    const idealRemaining = [];

    // Calculate total tasks and completed tasks for each day
    dates.forEach((date, index) => {
      let totalCreated = 0;
      let totalCompleted = 0;

      tasks.forEach(task => {
        const createdDate = new Date(task.CreatedDate);
        if (createdDate <= date) {
          totalCreated++;
        }

        // Check if task is completed (status 6 or 4 depending on system; in taskDetailsRoutes we saw Status === 6 is Completed)
        if (task.Status === 6 && task.ModifiedDate) {
          const completedDate = new Date(task.ModifiedDate);
          if (completedDate <= date) {
            totalCompleted++;
          }
        }
      });

      const remaining = Math.max(0, totalCreated - totalCompleted);
      actualRemaining.push(remaining);
    });

    // Ideal burndown slope starting from the first day's actual remaining tasks down to 0
    const startingTasks = actualRemaining[0] || 10;
    dates.forEach((_, index) => {
      const ideal = Math.max(0, startingTasks - (startingTasks / 6) * index);
      idealRemaining.push(Math.round(ideal * 10) / 10);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Actual Remaining Tasks',
          data: actualRemaining,
          borderColor: '#f43f5e', // Rose
          backgroundColor: 'rgba(244, 63, 94, 0.05)',
          fill: true,
          tension: 0.3,
          borderWidth: 3,
          pointBackgroundColor: '#f43f5e',
          pointHoverRadius: 6,
        },
        {
          label: 'Ideal Trendline',
          data: idealRemaining,
          borderColor: theme === 'dark' ? '#475569' : '#cbd5e1',
          borderDash: [5, 5],
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
        }
      ]
    };
  }, [tasks, theme]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#475569',
          font: { size: 10, weight: '500' },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        bodyColor: theme === 'dark' ? '#cbd5e1' : '#334155',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 9 } }
      },
      y: {
        grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' },
        ticks: { color: '#64748b', font: { size: 9 }, stepSize: 1 }
      }
    }
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md h-full flex flex-col justify-between ${
      theme === 'dark' 
        ? 'bg-slate-950/70 border-white/10 shadow-slate-950/65 shadow-2xl' 
        : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'
    }`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/10">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FaFire className="text-rose-500 animate-bounce" />
            <span>Task Burndown</span>
          </h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Task velocity over the last 7 days
          </p>
        </div>
        <button 
          onClick={fetchTasks} 
          disabled={loading}
          className={`p-2 rounded-lg transition-all ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Refresh chart"
        >
          <FaSync size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 min-h-[220px] relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-rose-500"></div>
            <span className="text-xs text-slate-500">Loading chart...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            No tasks found in organization.
          </div>
        )}

        {!loading && !error && burndownData && (
          <div className="h-64">
            <Line data={burndownData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BurndownWidget;
