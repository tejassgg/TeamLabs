import { useState, useEffect } from 'react';
import { commonTypeService } from '../../services/api';
import { authService } from '../../services/api';
import { FaCircle } from 'react-icons/fa';

const AddTeamModal = ({ isOpen, onClose, onAddTeam }) => {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamType, setTeamType] = useState('');
  const [teamColor, setTeamColor] = useState('#3B82F6');
  const [teamTypeOptions, setTeamTypeOptions] = useState([]);
  const [error, setError] = useState('');

  // Predefined colors from Team model
  const teamColors = [
    { value: '#3B82F6', name: 'Blue' },
    { value: '#10B981', name: 'Green' },
    { value: '#F59E0B', name: 'Amber' },
    { value: '#EF4444', name: 'Red' },
    { value: '#8B5CF6', name: 'Purple' },
    { value: '#EC4899', name: 'Pink' },
    { value: '#6B7280', name: 'Gray' },
  ];

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (isOpen) {
      commonTypeService.getTeamTypes()
        .then((types) => {
          console.log(types);
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
    if (!teamColors.some(color => color.value === teamColor)) {
      setError('Please select a valid team color');
      return;
    }
    onAddTeam({
      TeamName: teamName.trim(),
      TeamDescription: teamDescription.trim(),
      TeamType: teamType,
      TeamColor: teamColor,
      OwnerID: currentUser?._id
    });
    setTeamName('');
    setTeamDescription('');
    setTeamType(teamTypeOptions[0]?.Code || '');
    setTeamColor('#3B82F6');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Add New Team</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              maxLength={50}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={teamDescription}
              onChange={e => setTeamDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              maxLength={100}
              rows={3}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Type
              </label>
              <select
                value={teamType}
                onChange={e => setTeamType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              >
                {teamTypeOptions.length === 0 && <option value="">Loading...</option>}
                {teamTypeOptions.map(option => (
                  <option key={option.Code} value={option.Code}>{option.Value}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Color<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 p-2 border border-gray-200 rounded-xl">
                {teamColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTeamColor(color.value)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      teamColor === color.value 
                        ? 'ring-2 ring-offset-2 ring-gray-400' 
                        : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {teamColor === color.value && (
                      <FaCircle className="text-white text-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
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