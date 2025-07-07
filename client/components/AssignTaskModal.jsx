import { useState, useEffect } from 'react';
import Modal from './Modal';
import { taskService } from '../services/api';
import { useToast } from '../context/ToastContext';

const AssignTaskModal = ({ isOpen, onClose, task, projectId, onAssignTask }) => {
  const { showToast } = useToast();
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-2">
        <h3 className="text-xl font-semibold mb-4">Assign Task to Team Member</h3>
        <p className="text-gray-600 mb-6">
          You're moving a task from "Not Assigned" to another status. 
          Please select a team member to assign this task to.
        </p>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-1">Task Details</h4>
            <p className="text-blue-700 font-medium">{task?.Name}</p>
            <p className="text-sm text-blue-600 mt-1">{task?.Description}</p>
          </div>
        </div>

        {loading && teamMembers.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : teamMembers.length === 0 ? (
          <div className="text-yellow-700 bg-yellow-50 p-4 rounded-lg mb-4">
            No team members found for this project. Please add team members first.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Assign to Team Member<span className="text-red-500">*</span>
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {teamMembers.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.fullName} {member.team ? `(${member.team.teamName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
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