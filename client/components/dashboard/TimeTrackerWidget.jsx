import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaPlay, FaPause, FaStop, FaClock, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import api from '../../services/api';
import { timesheetService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import CustomDropdown from '../shared/CustomDropdown';
import { getTaskTypeStyle } from '../task/TaskTypeBadge';

const TimeTrackerWidget = ({ userDetails, theme }) => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [loading, setLoading] = useState(false);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Fetch tasks assigned to this user
  useEffect(() => {
    const fetchUserTasks = async () => {
      if (!userDetails?.organizationID) return;
      setFetchingTasks(true);
      try {
        const response = await api.get(`/task-details/all?organizationId=${userDetails.organizationID}`);
        const allTasks = response.data?.tasks || [];
        // Filter tasks assigned to this user that are not completed (Status !== 6)
        const myTasks = allTasks.filter(t => t.AssignedTo === userDetails._id && t.Status !== 6);
        setTasks(myTasks);
      } catch (err) {
        console.error('Failed to fetch user tasks for tracker:', err);
      } finally {
        setFetchingTasks(false);
      }
    };
    fetchUserTasks();
  }, [userDetails]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - time * 1000;
      timerRef.current = setInterval(() => {
        setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleLogTime = async () => {
    if (time < 10) {
      showToast('Tracked time must be at least 10 seconds to log.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toLocaleDateString().replaceAll('/', '-');
      let punchId = null;

      // 1. Fetch timesheet history for today to see if user is clocked in
      let historyRes;
      try {
        historyRes = await timesheetService.getTimeSheetHistory(today);
      } catch (err) {
        console.log('Timesheet history fetch returned error (expected if not clocked in)', err);
      }

      if (historyRes?.punchData?._id) {
        punchId = historyRes.punchData._id;
      } else {
        // 2. Not clocked in - automatically punch in
        showToast('Not Clocked In. Clocking you in automatically...', 'info');
        const punchRes = await timesheetService.punchIn();
        if (punchRes?.punchIn?._id) {
          punchId = punchRes.punchIn._id;
        } else {
          throw new Error('Failed to Clock In automatically.');
        }
      }

      // 3. Log timesheet entry
      const selectedTask = tasks.find(t => t.TaskID === selectedTaskId);
      const logDesc = description.trim() || (selectedTask ? `Worked on task: ${selectedTask.Name}` : 'Personal time tracking entry');
      
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - time * 1000);

      await timesheetService.postTimeSheet({
        Description: logDesc,
        StartTime: startTime.toISOString(),
        EndTime: endTime.toISOString(),
        PunchDate: today,
        PunchID: punchId
      });

      showToast('Time logged successfully to timesheet!', 'success');
      handleReset();
      setDescription('');
    } catch (err) {
      console.error('Failed to log time:', err);
      showToast(err.message || 'Failed to log tracked time.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const dropdownOptions = useMemo(() => {
    return [
      {
        value: '',
        label: 'General / No Specific Task',
        icon: <FaClock className="text-slate-400" size={12} />
      },
      ...tasks.map(t => {
        const style = getTaskTypeStyle(t.Type);
        return {
          value: t.TaskID,
          label: t.Name,
          icon: style?.icon ? (
            <span className={`${style.textColor} flex-shrink-0 flex items-center`}>
              {style.icon}
            </span>
          ) : null
        };
      })
    ];
  }, [tasks]);

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md h-full flex flex-col justify-between ${
      theme === 'dark' 
        ? 'bg-slate-950/70 border-white/10 shadow-slate-950/65 shadow-2xl' 
        : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'
    }`}>
      <div className="pb-4 mb-4 border-b border-slate-200/10">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <FaClock className="text-indigo-500 animate-spin-slow" style={{ animationDuration: '8s' }} />
          <span>Personal Time Tracker</span>
        </h2>
        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Track and punch time directly to your timesheet
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {/* Stopwatch display */}
        <div className="text-center py-2">
          <span className={`text-4xl font-mono font-bold tracking-wider ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {formatTime(time)}
          </span>
        </div>

        {/* Task selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">LINK TO ASSIGNED TASK</label>
          <CustomDropdown
            value={selectedTaskId}
            onChange={(val) => {
              setSelectedTaskId(val);
              const task = tasks.find(t => t.TaskID === val);
              if (task) {
                setDescription(`Worked on: ${task.Name}`);
              } else {
                setDescription('');
              }
            }}
            options={dropdownOptions}
            disabled={fetchingTasks}
            placeholder="General / No Specific Task"
            size="sm"
            className="text-xs"
          />
          {fetchingTasks && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
              <FaSpinner className="animate-spin" /> Fetching tasks...
            </span>
          )}
        </div>

        {/* Description input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">WHAT ARE YOU WORKING ON?</label>
          <input
            type="text"
            placeholder="Log details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
              theme === 'dark' 
                ? 'bg-slate-900 border-white/10 text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleStartPause}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-white shadow-md transition-all ${
              isRunning 
                ? 'bg-amber-500 hover:bg-amber-600' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRunning ? (
              <>
                <FaPause size={10} /> Pause
              </>
            ) : (
              <>
                <FaPlay size={10} /> Start Timer
              </>
            )}
          </button>

          {time > 0 && (
            <button
              onClick={handleReset}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                theme === 'dark' 
                  ? 'border-white/10 hover:bg-slate-800 text-slate-400' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
              title="Reset Timer"
            >
              <FaStop size={10} />
            </button>
          )}

          {time > 0 && (
            <button
              onClick={handleLogTime}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md transition-all"
            >
              {loading ? (
                <FaSpinner className="animate-spin" size={10} />
              ) : (
                <FaCheckCircle size={10} />
              )}
              Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTrackerWidget;
