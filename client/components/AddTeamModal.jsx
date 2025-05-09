import { useState, useEffect } from 'react';
import { commonTypeService } from '../services/api';
import { authService } from '../services/api';

const AddTeamModal = ({ isOpen, onClose, onAddTeam }) => {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamType, setTeamType] = useState('');
  const [teamTypeOptions, setTeamTypeOptions] = useState([]);
  const [error, setError] = useState('');

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (isOpen) {
      commonTypeService.getTeamTypes()
        .then((types) => {
          setTeamTypeOptions(types);
          if (types.length > 0) setTeamType(types[0].Code);
        })
        .catch(() => setTeamTypeOptions([]));
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Team Name is required');
      return;
    }
    onAddTeam({
      TeamName: teamName.trim(),
      TeamDescription: teamDescription.trim(),
      TeamType: teamType,
      OwnerID: currentUser?._id
    });
    setTeamName('');
    setTeamDescription('');
    setTeamType(teamTypeOptions[0]?.Code || '');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Add New Team</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Team Name<span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              maxLength={50}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={teamDescription}
              onChange={e => setTeamDescription(e.target.value)}
              maxLength={100}
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Team Type</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={teamType}
              onChange={e => setTeamType(e.target.value)}
              required
            >
              {teamTypeOptions.length === 0 && <option value="">Loading...</option>}
              {teamTypeOptions.map(option => (
                <option key={option.Code} value={option.Code}>{option.Value}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Add Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamModal; 