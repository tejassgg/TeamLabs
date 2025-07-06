import { useState, useEffect } from 'react';
import Modal from './Modal';
import { commonTypeService } from '../services/api';
import { useGlobal } from '../context/GlobalContext';

const AddTaskModal = ({ isOpen, onClose, onAddTask, onUpdateTask, mode = 'fromSideBar', projectIdDefault, userStories, editingTask = null }) => {
  const { projects, userDetails } = useGlobal();
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
      // Reset form for add mode
      setName('');
      setDescription('');
      setType('');
      setPriority('Medium');
      setAssignee(userDetails?._id || '');
      setAssignedTo('');
      setProjectId(projectIdDefault || '');
      setParentId('');
      setIsActive(true);
    }
  }, [isOpen, editingTask, projectIdDefault, userDetails]);

  useEffect(() => {
    if (isOpen) {
      commonTypeService.getTaskTypes()
        .then((types) => {
          // if (mode === 'fromSideBar') {
          //   const fromSideBarType = types.find(t => t.Value === 'User Story');
          //   setTypeOptions(fromSideBarType ? [fromSideBarType] : []);
          //   if (fromSideBarType && !isEditMode) setType(fromSideBarType.Value);
          // }
          setTypeOptions(types);
          if (types.length > 0 && !isEditMode) setType(types[0].Value);
        })
        .catch(() => setTypeOptions([]));
      if (projectIdDefault && !isEditMode) setProjectId(projectIdDefault);
    }
  }, [isOpen, mode, projectIdDefault, isEditMode]);

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

    const taskData = {
      Name: name.trim(),
      Description: description.trim(),
      Type: type,
      Priority: type !== 'User Story' ? priority : undefined,
      Assignee: assignee,
      ProjectID_FK: projectId,
      ParentID: mode === 'fromProject' ? parentId : null,
      CreatedBy: createdBy
    };

    if (isEditMode) {
      // Call update function
      onUpdateTask(editingTask.TaskID, taskData);
    } else {
      // Call add function
      onAddTask(taskData);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-4">
        {isEditMode
          ? (mode === 'fromSideBar' ? 'Edit User Story' : 'Edit Task')
          : (mode === 'fromSideBar' ? 'Add User Story' : 'Add New Task')
        }
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Task Name<span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={50}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={100}
            rows={3}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Type<span className="text-red-500">*</span></label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={mode === 'fromSideBar'}
            >
              {typeOptions.map(opt => (
                <option key={opt._id} value={opt.Value}>{opt.Value}</option>
              ))}
            </select>
          </div>
          {type !== 'User Story' && (
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Priority<span className="text-red-500">*</span></label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          )}
        </div>
        {mode === 'fromSideBar' && (
          <div>
            <label className="block text-sm font-medium mb-1">Project<span className="text-red-500">*</span></label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Project</option>
              {projects.map(proj => (
                <option key={proj._id} value={proj.ProjectID}>{proj.Name}</option>
              ))}
            </select>
          </div>
        )}
        {mode === 'fromProject' && (
          <div>
            <label className="block text-sm font-medium mb-1">User Story<span className="text-red-500">*</span></label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select User Story</option>
              {userStories.map(fromSideBar => (
                <option key={fromSideBar._id} value={fromSideBar._id}>{fromSideBar.Name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Assignee and AssignedTo can be extended to user dropdowns if needed */}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
          >
            {isEditMode ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal; 