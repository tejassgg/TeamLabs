import { useState, useEffect } from 'react';
import Modal from './Modal';
import { commonTypeService } from '../services/api';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { getTaskTypeBadge, getPriorityBadge } from './TaskTypeBadge';

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
    badgeType === 'taskType' ? opt.Value === value : opt === value
  );

  const handleSelect = (option) => {
    const optionValue = badgeType === 'taskType' ? option.Value : option;
    onChange(optionValue);
    setIsOpen(false);
  };

  const renderBadge = (option) => {
    const optionValue = badgeType === 'taskType' ? option.Value : option;
    if (badgeType === 'taskType') {
      return getTaskTypeBadge(optionValue);
    } else {
      return getPriorityBadge(optionValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={getThemeClasses(
          `w-full px-4 py-2.5 rounded-xl bg-white text-left flex items-center justify-between`,
          `dark:bg-[#232323] dark:text-gray-100`
        )}
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
        <div className={getThemeClasses(
          'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-auto',
          'dark:bg-[#232323] dark:border-gray-600'
        )}>
          {options.map((option, index) => {
            const optionValue = badgeType === 'taskType' ? option.Value : option;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option)}
                className={getThemeClasses(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl',
                  'dark:hover:bg-gray-700'
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

const AddTaskModal = ({ isOpen, onClose, onAddTask, onUpdateTask, mode = 'fromSideBar', projectIdDefault, userStories, editingTask = null, addTaskTypeMode = 'task' }) => {
  const { projects, userDetails } = useGlobal();
  const { theme } = useTheme();
  
  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [typeOptions, setTypeOptions] = useState([]);
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState(userDetails?._id || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectId, setProjectId] = useState(projectIdDefault || '');
  const [parentId, setParentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [createdDate] = useState(new Date());
  const [assignedDate] = useState('');
  const [createdBy] = useState(userDetails?._id || '');
  const [error, setError] = useState('');

  // Check if we're in edit mode
  const isEditMode = !!editingTask;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Task Name is required');
      return;
    }
    if (!type) {
      setError('Task Type is required');
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

    const taskData = {
      Name: name.trim(),
      Description: description.trim(),
      Type: type,
      Priority: type !== 'User Story' ? priority : undefined,
      Assignee: assignee,
      ProjectID_FK: projectId,
      ParentID: mode === 'fromProject' && type !== 'User Story' ? parentId : null,
      CreatedBy: createdBy
    };

    if (isEditMode) {
      // Call update function
      onUpdateTask(editingTask.TaskID, taskData);
    } else {
      // Call add function
      onAddTask(taskData).catch(error => {
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
          setError('Failed to add task. Please try again.');
        }
      });
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
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = isEditMode
    ? (mode === 'fromSideBar' ? 'Edit User Story' : 'Edit Task')
    : (mode === 'fromSideBar' ? 'Add User Story' : 'Add New Task');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={getThemeClasses(
            'block text-sm font-medium mb-1 text-gray-700',
            'dark:text-gray-300'
          )}>Task Name<span className="text-red-500">*</span></label>
                      <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={getThemeClasses(
                'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500',
                'dark:bg-[#232323] dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
              maxLength={50}
              required
            />
        </div>
        <div>
          <label className={getThemeClasses(
            'block text-sm font-medium mb-1 text-gray-700',
            'dark:text-gray-300'
          )}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={getThemeClasses(
              'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500',
              'dark:bg-[#232323] dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400'
            )}
            maxLength={100}
            rows={3}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className={getThemeClasses(
              'block text-sm font-medium mb-1 text-gray-700',
              'dark:text-gray-300'
            )}>Type<span className="text-red-500">*</span></label>
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
          {type !== 'User Story' && (
            <div className="flex-1">
              <label className={getThemeClasses(
                'block text-sm font-medium mb-1 text-gray-700',
                'dark:text-gray-300'
              )}>Priority<span className="text-red-500">*</span></label>
              <BadgeDropdown
                value={priority}
                onChange={setPriority}
                options={['High', 'Medium', 'Low']}
                placeholder="Select Priority"
                required
                badgeType="priority"
              />
            </div>
          )}
        </div>
        {mode === 'fromSideBar' && (
          <div>
            <label className={getThemeClasses(
              'block text-sm font-medium mb-1 text-gray-700',
              'dark:text-gray-300'
            )}>Project<span className="text-red-500">*</span></label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className={getThemeClasses(
                'w-full px-4 py-2.5 rounded-xl bg-white text-gray-900',
                'dark:bg-[#232323] dark:text-gray-100 '
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
          <div className="flex-1">
            <label className={getThemeClasses(
              'block text-sm font-medium mb-1 text-gray-700',
              'dark:text-gray-300'
            )}>User Story<span className="text-red-500">*</span></label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className={getThemeClasses(
                'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900',
                'dark:bg-[#232323] dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
              required
              disabled={userStories && userStories.length === 1}
            >
              <option value="">Select User Story</option>
              {userStories && userStories.map(story => (
                <option key={story.TaskID} value={story.TaskID}>{story.Name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Assignee and AssignedTo can be extended to user dropdowns if needed */}
        {error && <div className={getThemeClasses(
          'text-red-500 text-sm',
          'dark:text-red-400'
        )}>{error}</div>}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className={getThemeClasses(
              'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors',
              'dark:text-gray-400 dark:hover:bg-gray-700 dark:border-gray-600'
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={getThemeClasses(
              'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-colors',
              'dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800'
            )}
          >
            {isEditMode ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal; 