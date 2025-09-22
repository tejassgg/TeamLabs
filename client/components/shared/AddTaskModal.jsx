import { useState, useEffect } from 'react';
import CustomModal from './CustomModal';
import CustomDropdown from './CustomDropdown';
import { commonTypeService } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { getTaskTypeBadge, getPriorityBadge } from '../task/TaskTypeBadge';
import { FaTasks, FaAlignLeft, FaTag, FaExclamationTriangle, FaFolder, FaList, FaUsers, FaCalendarAlt } from 'react-icons/fa';

// Custom Badge Dropdown Component
const BadgeDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  badgeType = 'taskType', // 'taskType' or 'priority'
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  const selectedOption = options.find(opt =>
    badgeType === 'taskType' ? opt.Value === value : badgeType === 'userStory' ? opt.TaskID === value : opt === value
  );

  const handleSelect = (option) => {
    const optionValue = badgeType === 'taskType' ? option.Value : badgeType === 'userStory' ? option.TaskID : option;
    onChange(optionValue);
    setIsOpen(false);
  };

  const renderBadge = (option) => {
    if (badgeType === 'taskType') {
      const optionValue = option.Value;
      return getTaskTypeBadge(optionValue);
    } else if (badgeType === 'userStory') {
      return (
        <span className={getThemeClasses(
          'text-gray-900',
          'text-white'
        )}>
          {option.Name}
        </span>
      );
    } else {
      return getPriorityBadge(option);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={
          `w-full px-0 py-2 border-0 border-b-2 
          ${theme === 'dark' ? 'bg-[#232323]' : 'bg-white'} 
          ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} 
          ${theme === 'dark' ? 'focus:border-gray-600' : 'focus:border-gray-200'} focus:outline-none bg-transparent 
          ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center justify-between`
        }
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            renderBadge(selectedOption)
          ) : (
            <span className={getThemeClasses(
              'text-gray-500',
              'dark:text-gray-400'
            )}>
              {placeholder}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 ${theme === 'dark' ? 'bg-[#18181b] border-gray-600' : 'bg-white border-gray-200'} border rounded-xl shadow-lg overflow-auto`}>
          {options.map((option, index) => {
            const optionKey = badgeType === 'taskType' ? index : badgeType === 'userStory' ? option.TaskID : index;
            return (
              <button
                key={optionKey}
                type="button"
                onClick={() => handleSelect(option)}
                className={getThemeClasses(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2',
                  'w-full px-4 py-3 text-left hover:bg-[#424242] transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2'
                )}
              >
                {renderBadge(option)}
              </button>
            );
          })}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const AddTaskModal = ({ isOpen, onClose, onAddTask, onUpdateTask, mode = 'fromSideBar', projectIdDefault, userStories, editingTask = null, addTaskTypeMode = 'task', projectMembers = [] }) => {
  const { projects, userDetails } = useGlobal();
  const { theme } = useTheme();

  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  const [isAnimating, setIsAnimating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [typeOptions, setTypeOptions] = useState([]);
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState(userDetails?._id || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectId, setProjectId] = useState(projectIdDefault || '');
  const [parentId, setParentId] = useState("");
  const [dueDate, setDueDate] = useState('');
  // projectMembers are now passed from parent; no fetching here
  const [isActive, setIsActive] = useState(true);
  const [createdDate] = useState(new Date());
  const [assignedDate] = useState('');
  const [createdBy] = useState(userDetails?._id || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if we're in edit mode
  const isEditMode = !!editingTask;

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

  // Load editing task data when modal opens
  useEffect(() => {
    if (isOpen && editingTask) {
      setName(editingTask.Name || '');
      setDescription(editingTask.Description || '');
      setType(editingTask.Type || '');
      setPriority(editingTask.Priority || 'Medium');
      setAssignee(editingTask.Assignee || userDetails?._id || '');
      setAssignedTo(editingTask.AssignedTo || '');
      setProjectId(editingTask.ProjectID_FK || projectIdDefault || '');
      setParentId(editingTask.ParentID || '');
      setIsActive(editingTask.IsActive !== undefined ? editingTask.IsActive : true);
      setDueDate(editingTask.DueDate ? new Date(editingTask.DueDate).toISOString().split('T')[0] : '');
    } else if (isOpen && !editingTask) {
      setName('');
      setDescription('');
      setPriority('Medium');
      setAssignee(userDetails?._id || '');
      setAssignedTo('');
      setProjectId(projectIdDefault || '');
      // If only one user story, preselect it
      if (userStories && userStories.length === 1) {
        setParentId(userStories[0].TaskID);
      } else {
        setParentId('');
      }
      setIsActive(true);
      if (addTaskTypeMode === 'userStory') {
        setType('User Story');
      } else {
        setType('');
      }
      setDueDate('');
    }
  }, [isOpen, editingTask, projectIdDefault, userDetails, addTaskTypeMode, userStories]);

  useEffect(() => {
    if (isOpen) {
      commonTypeService.getTaskTypes()
        .then((types) => {
          let filteredTypes = types;
          if (addTaskTypeMode === 'task') {
            filteredTypes = types.filter(t => t.Value !== 'User Story');
          }
          setTypeOptions(filteredTypes);
          if (!isEditMode) {
            if (addTaskTypeMode === 'userStory') {
              setType('User Story');
            } else if (filteredTypes.length > 0) {
              setType(filteredTypes[0].Value);
            }
          }
        })
        .catch(() => setTypeOptions([]));
      if (projectIdDefault && !isEditMode) setProjectId(projectIdDefault);
    }
  }, [isOpen, mode, projectIdDefault, isEditMode, addTaskTypeMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Task Name is required');
      return;
    }
    if (!type) {
      setError('Task Type is required');
      return;
    }
    if (type === 'User Story' && !dueDate) {
      setError('Due Date is required for User Story');
      return;
    }
    if (!projectId) {
      setError('Project is required');
      return;
    }
    // Only validate User Story selection if task type is not 'User Story' and mode is 'fromProject'
    if (mode === 'fromProject' && type !== 'User Story' && !parentId) {
      setError('User Story is required');
      return;
    }

    setLoading(true);
    setError('');

    const taskData = {
      Name: name.trim(),
      Description: description.trim(),
      Type: type,
      Priority: type !== 'User Story' ? priority : undefined,
      Assignee: assignee,
      ProjectID_FK: projectId,
      ParentID: mode === 'fromProject' && type !== 'User Story' ? parentId : null,
      AssignedTo: mode === 'fromProject' && type !== 'User Story' ? (assignedTo || undefined) : undefined,
      DueDate: type === 'User Story' && dueDate ? new Date(dueDate) : undefined,
      CreatedBy: createdBy
    };

    try {
      if (isEditMode) {
        // Call update function
        await onUpdateTask(editingTask.TaskID, taskData);
      } else {
        // Call add function
        await onAddTask(taskData);
      }

      // Reset form
      setName('');
      setDescription('');
      setType(typeOptions[0]?.Value || '');
      setPriority('Medium');
      setAssignee(userDetails?._id || '');
      setAssignedTo('');
      setProjectId('');
      setParentId('');
      setIsActive(true);
      setError('');
      handleClose();
    } catch (error) {
      console.error('Error in task operation:', error);
      // Handle premium limit errors
      if (error?.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.type === 'userStory') {
          setError(`You have reached the maximum number of user stories (${errorData.limit}) for free users. Please upgrade to premium for unlimited user stories.`);
        } else if (errorData.type === 'task') {
          setError(`You have reached the maximum number of tasks (${errorData.limit}) per user story for free users. Please upgrade to premium for unlimited tasks.`);
        } else {
          setError(errorData.message || 'Limit reached. Please upgrade to premium.');
        }
      } else {
        setError(isEditMode ? 'Failed to update task. Please try again.' : 'Failed to add task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = isEditMode
    ? (mode === 'fromSideBar' ? 'Edit User Story' : name)
    : (mode === 'fromSideBar' ? 'Add User Story' : (addTaskTypeMode === 'userStory' ? 'Add New User Story' : 'Add New Task'));

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-lg ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isAnimating ? 'translate-x-full' : 'translate-x-0'}`}>

        <div className="flex items-center justify-between mb-6">
          <h3 className={getThemeClasses(
            'text-xl font-semibold text-gray-900',
            'text-xl font-semibold text-white'
          )}>{modalTitle}</h3>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaTasks className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
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
              maxLength={150}
              required
              placeholder="Enter task name"
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
                'text-sm font-medium text-white'
              )}>
                Description<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 resize-none',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500 resize-none'
              )}
              rows={3}
              required
              placeholder="Enter task description"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaTag className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
              )}>
                Type<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <div className="flex-1">
              <BadgeDropdown
                value={type}
                onChange={setType}
                options={typeOptions}
                placeholder="Select Task Type"
                required
                disabled={mode === 'fromSideBar' || addTaskTypeMode === 'userStory'}
                badgeType="taskType"
              />
            </div>
          </div>

          {type !== 'User Story' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaExclamationTriangle className={getThemeClasses(
                  'text-gray-500',
                  'text-gray-400'
                )} size={16} />
                <label className={getThemeClasses(
                  'text-sm font-medium text-gray-700',
                  'text-sm font-medium text-white'
                )}>
                  Priority<span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <div className="flex-1">
                <BadgeDropdown
                  value={priority}
                  onChange={setPriority}
                  options={['High', 'Medium', 'Low']}
                  placeholder="Select Priority"
                  required
                  badgeType="priority"
                />
              </div>
            </div>
          )}
          {type === 'User Story' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaCalendarAlt className={getThemeClasses(
                  'text-gray-500',
                  'text-gray-400'
                )} size={16} />
                <label className={getThemeClasses(
                  'text-sm font-medium text-gray-700',
                  'text-sm font-medium text-white'
                )}>
                  Due Date<span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={getThemeClasses(
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                )}
                required
              />
            </div>
          )}

          {mode === 'fromSideBar' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaFolder className={getThemeClasses(
                  'text-gray-500',
                  'text-gray-400'
                )} size={16} />
                <label className={getThemeClasses(
                  'text-sm font-medium text-gray-700',
                  'text-sm font-medium text-white'
                )}>
                  Project<span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className={getThemeClasses(
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                )}
                required
              >
                <option value="">Select Project</option>
                {projects.map(proj => (
                  <option key={proj._id} value={proj.ProjectID}>{proj.Name}</option>
                ))}
              </select>
            </div>
          )}

          {/* User Story Dropdown (only for tasks, not user stories) */}
          {mode === 'fromProject' && type !== 'User Story' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaList className={getThemeClasses(
                  'text-gray-500',
                  'text-gray-400'
                )} size={16} />
                <label className={getThemeClasses(
                  'text-sm font-medium text-gray-700',
                  'text-sm font-medium text-white'
                )}>
                  User Story<span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <div className="flex-1">
                <BadgeDropdown
                  value={parentId}
                  onChange={setParentId}
                  options={userStories || []}
                  placeholder="Select User Story"
                  required
                  disabled={userStories && userStories.length === 1}
                  badgeType="userStory"
                />
              </div>
            </div>
          )}

          {/* Team member dropdown for assignment (hide for User Story) */}
          {type !== 'User Story' && Array.isArray(projectMembers) && projectMembers.length > 0 && (
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaUsers className={getThemeClasses('text-gray-500', 'text-gray-400')} size={16} />
                <label className={getThemeClasses('text-sm font-medium text-gray-700', 'text-sm font-medium text-white')}>
                  Assign To
                </label>
              </div>
              <div className="flex-1">
                <CustomDropdown
                  value={assignedTo}
                  onChange={setAssignedTo}
                  options={projectMembers.map((m) => {
                    const id = m._id || m.id;
                    const fullName = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.fullName || m.email || 'Member';
                    const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const icon = (
                      <span className={getThemeClasses(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200',
                        'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/40 text-blue-300 text-xs font-medium border border-blue-800/40'
                      )}>{initials}</span>
                    );
                    return { value: id, label: fullName, icon };
                  })}
                  placeholder="Select member"
                  variant="outline"
                  size="md"
                  width="w-full"
                  showSearch={true}
                  className="border-b-2"
                />
              </div>
            </div>
          )}

          {error && <div className={getThemeClasses(
            'text-red-500 text-sm mt-4',
            'text-red-400 text-sm mt-4'
          )}>{error}</div>}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className={getThemeClasses(
                'px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                'px-6 py-2.5 text-gray-300 hover:bg-[#424242] rounded-xl border border-gray-600 transition-all duration-200'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={getThemeClasses(
                'px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200',
                'px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200'
              )}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal; 