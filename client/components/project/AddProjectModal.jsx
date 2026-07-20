import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaProjectDiagram, FaAlignLeft, FaCalendarAlt, FaCheck, FaSignal } from 'react-icons/fa';
import ProjectPriorityBadge from '../shared/ProjectPriorityBadge';
import CustomDropdown from '../shared/CustomDropdown';
import { commonTypeService } from '../../services/api';

const AddProjectModal = ({ isOpen, onClose, onAddProject, organizationId, projectOwner }) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState(2); // Default to Medium
  const [priorityOptions, setPriorityOptions] = useState([
    { value: 0, label: 'Critical' },
    { value: 1, label: 'High' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'Low' }
  ]);
  const [goals, setGoals] = useState([]);
  const [goalInput, setGoalInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const types = await commonTypeService.getPriorityTypes();
        if (Array.isArray(types) && types.length > 0) {
          const formatted = types
            .sort((a, b) => Number(a.Code) - Number(b.Code))
            .map(t => ({
              value: Number(t.Code),
              label: t.Value
            }));
          setPriorityOptions(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch priority types from DB:', err);
      }
    };
    if (isOpen) {
      fetchPriorities();
    }
  }, [isOpen]);

  const getThemeClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  // Handle animation when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(false);
    } else {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the transition duration
  };

  const handleAddGoal = () => {
    if (goalInput.trim()) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const handleRemoveGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) {
      setError('Project Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddProject({
        Name: name.trim(),
        Description: description.trim(),
        DueDate: dueDate ? new Date(dueDate) : null,
        ProjectOwner: projectOwner,
        OrganizationID: organizationId,
        IsActive: false,
        Priority: Number(priority),
        Goals: goals
      });
      setName('');
      setDescription('');
      setDueDate('');
      setPriority(2);
      setGoals([]);
      setGoalInput('');
      setError('');
      handleClose();
    } catch (error) {
      console.log('error', error.response);
      // Handle premium limit errors
      if (error?.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.type === 'project') {
          setError(`You have reached the maximum number of projects (${errorData.limit}) for free users. Please upgrade to premium for unlimited projects.`);
        } else {
          setError(errorData.message || 'Limit reached. Please upgrade to premium.');
        }
      } else {
        setError('Failed to add project. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-lg ${theme === 'dark' ? 'bg-dark-bg text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-dark-card' : 'border-gray-200'} p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isAnimating ? 'translate-x-full' : 'translate-x-0'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={getThemeClasses(
            'text-xl font-semibold text-gray-900',
            'text-xl font-semibold text-white'
          )}>Create New Project</h3>
          <button
            onClick={handleClose}
            className={getThemeClasses(
              'text-gray-400 hover:text-gray-600 text-2xl font-bold',
              'text-gray-400 hover:text-gray-300 text-2xl font-bold'
            )}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaProjectDiagram className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-gray-300'
              )}>
                Name<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
              )}
              maxLength={50}
              required
              autoComplete="project-name"
              placeholder="Enter project name"
            />
          </div>

          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[120px] pt-2">
              <FaAlignLeft className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-gray-300'
              )}>
                Description
              </label>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 resize-none',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500 resize-none'
              )}
              rows={5}
              autoComplete="off"
              placeholder="Enter project description"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaCalendarAlt className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-gray-300'
              )}>
                Due Date
              </label>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
              )}
            />
          </div>

          {/* Priority Custom Dropdown */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaSignal className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-gray-300'
              )}>
                Priority
              </label>
            </div>
            <div className="flex-1">
              <CustomDropdown
                value={priority}
                onChange={(val) => setPriority(Number(val))}
                options={priorityOptions}
                placeholder="Select Priority"
                variant="outlined"
                renderOption={(option) => (
                  <div className="flex items-center gap-2 py-0.5">
                    <ProjectPriorityBadge priority={option.value} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                )}
                renderSelected={(option) => (
                  <div className="flex items-center gap-2">
                    <ProjectPriorityBadge priority={option ? option.value : priority} showLabel={true} />
                  </div>
                )}
              />
            </div>
          </div>

          {/* Goals Input Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FaCheck className={getThemeClasses('text-gray-500', 'text-gray-400')} size={14} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-gray-300'
              )}>
                Project Goals
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGoal(); } }}
                className={getThemeClasses(
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                )}
                placeholder="Add a key project goal..."
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className={getThemeClasses(
                  "px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors",
                  "px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
                )}
              >
                Add
              </button>
            </div>

            {/* List of current goals */}
            {goals.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pt-2">
                {goals.map((goal, idx) => (
                  <div key={idx} className={getThemeClasses(
                    "flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl",
                    "flex items-center justify-between p-2.5 bg-[#1f1f23] border border-[#2b2b30] rounded-xl"
                  )}>
                    <span className="text-xs font-medium truncate max-w-[85%]">{goal}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-1.5"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className={getThemeClasses(
                'px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                'px-6 py-2.5 text-gray-300 hover:bg-dark-hover rounded-xl border border-gray-600 transition-all duration-200'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal; 