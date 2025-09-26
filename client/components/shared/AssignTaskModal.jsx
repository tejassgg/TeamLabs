import { useState, useEffect } from 'react';
import Modal from './Modal';
import { taskService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import CustomDropdown from './CustomDropdown';
import { useTheme } from '../../context/ThemeContext';

const AssignTaskModal = ({ isOpen, onClose, task, projectId, onAssignTask }) => {
  const { showToast } = useToast();
  const { theme } = useTheme();
  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? darkClasses : lightClasses;
  };
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch team members when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      setError('');
      taskService.getTeamMembersByProject(projectId)
        .then(members => {
          setTeamMembers(members);
          if (members.length > 0) {
            setSelectedMember(members[0]._id);
          }
        })
        .catch(err => {
          setError('Failed to load team members');
          showToast('Failed to load team members', 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Please select a team member');
      return;
    }

    try {
      setLoading(true);
      const updatedTask = await taskService.assignTask(task.TaskID, selectedMember);
      showToast('Task assigned successfully', 'success'); 
      onAssignTask(updatedTask);
      onClose();
    } catch (err) {
      setError('Failed to assign task');
      showToast('Failed to assign task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Task">
      <div className={getThemeClasses('', 'text-white')}>
        <p className={getThemeClasses("text-gray-600 mb-4", "text-gray-50 mb-4")}>
          You're moving a task from "Not Assigned" to another status. 
          Please select a team member to assign this task to.
        </p>

        <div className="mb-6">
          <div className={getThemeClasses("bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4", "bg-[#18181b] border border-[#232323] rounded-lg p-4 mb-4")}>  
            <h4 className={getThemeClasses("font-medium text-blue-800 mb-1", "font-medium text-white mb-1")}>Task Details</h4>
            <p className={getThemeClasses("text-blue-700 font-medium", "text-gray-200 font-medium")}>{task?.Name}</p>
            <p className={getThemeClasses("text-sm text-blue-600 mt-1", "text-sm text-gray-400 mt-1")}>{task?.Description}</p>
          </div>
        </div>

        {loading && teamMembers.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className={getThemeClasses("text-red-600 mb-4", "text-red-400 mb-4")}>{error}</div>
        ) : teamMembers.length === 0 ? (
          <div className={getThemeClasses("text-yellow-700 bg-yellow-50 p-4 rounded-lg mb-4", "text-yellow-300 bg-[#3a2f1d] border border-yellow-700/40 p-4 rounded-lg mb-4") }>
            No team members found for this project. Please add team members first.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={getThemeClasses("block text-sm font-medium mb-1 text-gray-700", "block text-sm font-medium mb-1 text-gray-50")}>
                Assign to Team Member<span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                value={selectedMember}
                onChange={setSelectedMember}
                options={teamMembers.map(member => {
                  const fullName = member.fullName || [member.firstName, member.lastName].filter(Boolean).join(' ');
                  const initials = (fullName || 'M').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return ({
                    value: member._id,
                    label: `${fullName}${member.team ? ` (${member.team.teamName})` : ''}`,
                    icon: (
                      <span className={getThemeClasses(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200',
                        'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30'
                      )}>{initials}</span>
                    )
                  });
                })}
                placeholder="Select a team member"
                variant="filled"
                size="md"
                width="w-full"
                showSearch={true}
                required={true}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={getThemeClasses("px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200", "px-4 py-2.5 text-gray-300 hover:bg-[#2a2a2a] rounded-xl border border-gray-600")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={getThemeClasses(
                  'px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium',
                  'px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium'
                )}
                disabled={loading || teamMembers.length === 0}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Assigning...
                  </span>
                ) : (
                  'Assign Task'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AssignTaskModal; 