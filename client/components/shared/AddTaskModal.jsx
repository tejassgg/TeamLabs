import { useState, useEffect, useRef } from 'react';
import CustomModal from './CustomModal';
import SearchableDropdown from './SearchableDropdown';
import { commonTypeService, taskService } from '../../services/api';
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
  const isDark = theme === 'dark';

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
        <span className={isDark ? 'text-white' : 'text-gray-900'}>
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
          `w-full px-0 py-2 border-0 border-b-2 bg-transparent focus:outline-none flex items-center justify-between ${
            isDark
              ? 'border-gray-600 focus:border-gray-600 text-white'
              : 'border-gray-200 focus:border-gray-200 text-gray-900'
          }`
        }
      >
        <div className="flex items-center gap-2">
          {selectedOption !== undefined && selectedOption !== null ? (
            renderBadge(selectedOption)
          ) : (
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
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
        <div className={`absolute z-50 w-full mt-1 border rounded-xl shadow-lg overflow-auto ${
          isDark ? 'bg-dark-bg border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {options.map((option, index) => {
            const optionKey = badgeType === 'taskType' ? index : badgeType === 'userStory' ? option.TaskID : index;
            return (
              <button
                key={optionKey}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2 ${
                  isDark ? 'hover:bg-dark-hover text-white' : 'hover:bg-gray-50 text-gray-900'
                }`}
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

const AddTaskModal = ({ isOpen, onClose, onAddTask, onUpdateTask, mode = 'fromSideBar', projectIdDefault, parentIdDefault = '', userStories, editingTask = null, addTaskTypeMode = 'task', projectMembers = [] }) => {
  const { projects, userDetails } = useGlobal();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isAnimating, setIsAnimating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [typeOptions, setTypeOptions] = useState([]);
  const [priority, setPriority] = useState(2);
  const [priorityOptions, setPriorityOptions] = useState([0, 1, 2, 3]);
  const [assignee, setAssignee] = useState(userDetails?._id || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectId, setProjectId] = useState(projectIdDefault || '');
  const [parentId, setParentId] = useState("");
  const [dueDate, setDueDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [createdDate] = useState(new Date());
  const [assignedDate] = useState('');
  const [createdBy] = useState(userDetails?._id || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextTaskNumber, setNextTaskNumber] = useState('');
  const [fetchedMembers, setFetchedMembers] = useState([]);
  const [fetchedUserStories, setFetchedUserStories] = useState([]);

  const userStoriesToUse = (userStories && userStories.length > 0) ? userStories : fetchedUserStories;
  const projectMembersToUse = (projectMembers && projectMembers.length > 0) ? projectMembers : fetchedMembers;

  useEffect(() => {
    const needsFetch = isOpen && projectId && (
      mode === 'fromSideBar' ||
      (!projectMembers || projectMembers.length === 0) ||
      (!userStories || userStories.length === 0)
    );

    if (needsFetch) {
      taskService.getKanbanData(projectId)
        .then(res => {
          setFetchedMembers(res?.projectMembers || []);
          setFetchedUserStories(res?.userStories || []);
        })
        .catch(err => {
          console.error('Failed to load project kanban data:', err);
          setFetchedMembers([]);
          setFetchedUserStories([]);
        });
    } else {
      setFetchedMembers([]);
      setFetchedUserStories([]);
    }
  }, [projectId, projectMembers, userStories, mode, isOpen]);

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

  // Load next sequential task number when opening modal in add mode
  useEffect(() => {
    if (isOpen && !isEditMode) {
      taskService.getNextTaskNumber()
        .then(number => {
          setNextTaskNumber(number);
        })
        .catch(err => {
          console.error('Failed to load next task number:', err);
        });
    }
  }, [isOpen, isEditMode]);

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

      let pVal = editingTask.Priority;
      if (pVal === 'Critical') pVal = 0;
      else if (pVal === 'High') pVal = 1;
      else if (pVal === 'Medium') pVal = 2;
      else if (pVal === 'Low') pVal = 3;
      setPriority(pVal !== undefined && pVal !== null ? pVal : 2);

      setAssignee(editingTask.Assignee || userDetails?._id || '');
      setAssignedTo(editingTask.AssignedTo || '');
      setProjectId(editingTask.ProjectID_FK || projectIdDefault || '');
      setParentId(editingTask.ParentID || '');
      setIsActive(editingTask.IsActive !== undefined ? editingTask.IsActive : true);
      setDueDate(editingTask.DueDate ? new Date(editingTask.DueDate).toISOString().split('T')[0] : '');
    } else if (isOpen && !editingTask) {
      setName('');
      setDescription('');
      setPriority(2);
      setAssignee(userDetails?._id || '');
      setAssignedTo('');
      if (projectIdDefault) {
        setProjectId(projectIdDefault);
      } else if (projects && projects.length > 0) {
        setProjectId(projects[0].ProjectID || projects[0]._id);
      } else {
        setProjectId('');
      }
      setParentId(parentIdDefault || '');
      setIsActive(true);
      if (addTaskTypeMode === 'userStory') {
        setType('User Story');
      } else {
        setType('');
      }
      setDueDate('');
    }
  }, [isOpen, editingTask, projectIdDefault, userDetails, addTaskTypeMode, projects]);

  useEffect(() => {
    if (isOpen && !isEditMode && userStoriesToUse && userStoriesToUse.length === 1) {
      setParentId(userStoriesToUse[0].TaskID || userStoriesToUse[0]._id);
    }
  }, [isOpen, isEditMode, userStoriesToUse]);

  const prevProjectIdRef = useRef(projectId);

  // Reset user story selection and assignment when project changes
  useEffect(() => {
    if (isOpen) {
      if (!isEditMode && prevProjectIdRef.current && prevProjectIdRef.current !== projectId) {
        setParentId('');
        setAssignedTo('');
      }
      prevProjectIdRef.current = projectId;
    } else {
      prevProjectIdRef.current = '';
    }
  }, [projectId, isOpen, isEditMode]);


  useEffect(() => {
    if (isOpen) {
      commonTypeService.getTaskTypes()
        .then((types) => {
          let filteredTypes = types;
          if (addTaskTypeMode === 'task') {
            filteredTypes = types.filter(t => t.Value !== 'User Story');
          }
          if (isEditMode && editingTask?.Type === 'Support') {
            const hasSupport = filteredTypes.some(t => t.Value === 'Support');
            if (!hasSupport) {
              filteredTypes = [...filteredTypes, { Value: 'Support', Code: 8, MasterType: 'TaskType' }];
            }
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

      commonTypeService.getPriorityTypes()
        .then((types) => {
          if (Array.isArray(types) && types.length > 0) {
            const sorted = types
              .sort((a, b) => Number(a.Code) - Number(b.Code))
              .map(t => Number(t.Code));
            setPriorityOptions(sorted);
          }
        })
        .catch((err) => console.error('Failed to fetch priority types from DB:', err));

      if (projectIdDefault && !isEditMode) setProjectId(projectIdDefault);
    }
  }, [isOpen, mode, projectIdDefault, isEditMode, addTaskTypeMode]);

  // Set default due date for All Task Type except User Story as Selected user Story's due date
  useEffect(() => {
    if (isOpen && !isEditMode && type && type !== 'User Story' && parentId && Array.isArray(userStoriesToUse)) {
      const selectedUserStory = userStoriesToUse.find(us => us.TaskID === parentId || us._id === parentId);
      if (selectedUserStory && selectedUserStory.DueDate) {
        setDueDate(new Date(selectedUserStory.DueDate).toISOString().split('T')[0]);
      }
    }
  }, [parentId, type, userStoriesToUse, isOpen, isEditMode]);

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
    // Validate User Story selection if task type is not 'User Story'
    if (type !== 'User Story' && !parentId) {
      setError('User Story is required');
      return;
    }

    if (dueDate) {
      const selectedDueDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const originalDueDateStr = editingTask?.DueDate ? new Date(editingTask.DueDate).toISOString().split('T')[0] : '';
      const isDueDateUnchanged = isEditMode && (dueDate === originalDueDateStr);

      if (!isDueDateUnchanged && selectedDueDate < today) {
        setError('Due Date cannot be in the past');
        return;
      }
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
      ParentID: type !== 'User Story' ? parentId : null,
      AssignedTo: type !== 'User Story' ? (assignedTo || undefined) : undefined,
      DueDate: dueDate ? new Date(dueDate) : undefined,
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
      setPriority(2);
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
    ? (mode === 'fromSideBar' || editingTask?.Type === 'User Story'
      ? `Edit User Story ${(editingTask?.TaskNumber || editingTask?.TicketNumber) ? `(#${editingTask.TaskNumber || editingTask.TicketNumber})` : ''}`
      : `Edit Task ${(editingTask?.TaskNumber || editingTask?.TicketNumber) ? `(#${editingTask.TaskNumber || editingTask.TicketNumber})` : ''}`)
    : (mode === 'fromSideBar'
      ? `Add User Story ${nextTaskNumber ? `(#${nextTaskNumber})` : ''}`
      : (addTaskTypeMode === 'userStory'
        ? `Add New User Story ${nextTaskNumber ? `(#${nextTaskNumber})` : ''}`
        : `Add New Task ${nextTaskNumber ? `(#${nextTaskNumber})` : ''}`));

  const labelClass = `text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`;
  const inputClass = `w-full px-0 py-2 border-0 border-b-2 focus:outline-none bg-transparent ${
    isDark
      ? 'border-gray-600 focus:border-gray-600 text-white placeholder-gray-500'
      : 'border-gray-200 focus:border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-2xl border-l p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
        isDark
          ? 'bg-dark-bg text-white border-dark-card'
          : 'bg-white text-gray-900 border-gray-200'
      } ${isAnimating ? 'translate-x-full' : 'translate-x-0'}`}>

        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{modalTitle}</h3>
          <button
            onClick={handleClose}
            className={`text-2xl font-bold transition-colors ${
              isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaTasks className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
              <label className={labelClass}>
                Name<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <div className="flex-1 flex flex-col">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
                maxLength={100}
                required
                placeholder="Enter task name"
              />
              <span className={`text-xs text-right mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {(name || '').length} / 100
              </span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[120px] pt-2">
              <FaAlignLeft className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
              <label className={labelClass}>
                Description<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`flex-1 px-0 py-2 border-0 border-b-2 focus:outline-none bg-transparent resize-none ${
                isDark
                  ? 'border-gray-600 focus:border-gray-600 text-white placeholder-gray-500'
                  : 'border-gray-200 focus:border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              rows={5}
              required
              placeholder="Enter task description"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaTag className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
              <label className={labelClass}>
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
                disabled={addTaskTypeMode === 'userStory'}
                badgeType="taskType"
              />
            </div>
          </div>

          {type !== 'User Story' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaExclamationTriangle className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
                <label className={labelClass}>
                  Priority<span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <div className="flex-1">
                <BadgeDropdown
                  value={priority}
                  onChange={setPriority}
                  options={priorityOptions}
                  placeholder="Select Priority"
                  required
                  badgeType="priority"
                />
              </div>
            </div>
          )}
          {type && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaCalendarAlt className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
                <label className={labelClass}>
                  Due Date{type === 'User Story' && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toLocaleDateString('en-CA')}
                className={`flex-1 px-0 py-2 border-0 border-b-2 focus:outline-none bg-transparent ${
                  isDark
                    ? 'border-gray-600 focus:border-gray-600 text-white'
                    : 'border-gray-200 focus:border-gray-200 text-gray-900'
                }`}
                required={type === 'User Story'}
              />
            </div>
          )}

          {mode === 'fromSideBar' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaFolder className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
                <label className={labelClass}>
                  Project<span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <div className="flex-1">
                <SearchableDropdown
                  value={projectId}
                  onChange={val => setProjectId(val)}
                  options={projects.map(proj => ({
                    value: proj.ProjectID,
                    label: proj.Name
                  }))}
                  placeholder="Select Project"
                  required
                />
              </div>
            </div>
          )}

          {/* User Story Dropdown (only for tasks, not user stories) */}
          {(mode === 'fromProject' || mode === 'fromSideBar') && type !== 'User Story' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaList className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
                <label className={labelClass}>
                  User Story<span className="text-red-500 ml-1">*</span>
                </label>
              </div>
              <div className="flex-1">
                <BadgeDropdown
                  value={parentId}
                  onChange={setParentId}
                  options={userStoriesToUse || []}
                  placeholder={!projectId ? "Select Project First" : "Select User Story"}
                  required
                  disabled={!projectId || (userStoriesToUse && userStoriesToUse.length === 1)}
                  badgeType="userStory"
                />
              </div>
            </div>
          )}

          {/* Team member dropdown for assignment (hide for User Story) */}
          {type !== 'User Story' && Array.isArray(projectMembersToUse) && projectMembersToUse.length > 0 && (
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <FaUsers className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
                <label className={labelClass}>
                  Assign To
                </label>
              </div>
              <div className="flex-1">
                <SearchableDropdown
                  value={assignedTo}
                  onChange={setAssignedTo}
                  options={projectMembersToUse.map((m) => {
                    const id = m._id || m.id;
                    const fullName = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.fullName || m.email || 'Member';
                    const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const initialsBadge = (
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border ${
                        isDark
                          ? 'bg-blue-900/40 text-blue-300 border-blue-800/40'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {initials}
                      </span>
                    );
                    return { value: id, label: fullName, initialsBadge };
                  })}
                  placeholder="Select member"
                  renderSelected={(opt) => (
                    <div className="flex items-center gap-2">
                      {opt.initialsBadge}
                      <span className="truncate">{opt.label}</span>
                    </div>
                  )}
                  renderOption={(opt) => (
                    <div className="flex items-center gap-2">
                      {opt.initialsBadge}
                      <span className="truncate">{opt.label}</span>
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          {error && <div className={`text-sm mt-4 ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</div>}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className={`px-6 py-2.5 rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'text-gray-300 hover:bg-dark-hover border-gray-600'
                  : 'text-gray-600 hover:bg-gray-50 border-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
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