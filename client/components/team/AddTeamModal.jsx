import { useState, useEffect } from 'react';
import { commonTypeService } from '../../services/api';
import { authService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FaCircle, FaUsers, FaAlignLeft, FaTag, FaPalette } from 'react-icons/fa';

const AddTeamModal = ({ isOpen, onClose, onAddTeam }) => {
  const { theme } = useTheme();
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamType, setTeamType] = useState('');
  const [teamColor, setTeamColor] = useState('#3B82F6');
  const [teamTypeOptions, setTeamTypeOptions] = useState([]);
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

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
    handleClose();
  };

  if (!isOpen) return null;

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
          )}>Add New Team</h3>
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
              <FaUsers className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-gray-300'
              )}>
                Team Name<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
              )}
              maxLength={50}
              required
              placeholder="Enter team name"
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
              value={teamDescription}
              onChange={e => setTeamDescription(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 resize-none',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500 resize-none'
              )}
              maxLength={100}
              rows={3}
              placeholder="Enter team description"
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
                'text-sm font-medium text-gray-300'
              )}>
                Team Type
              </label>
            </div>
            <select
              value={teamType}
              onChange={e => setTeamType(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
              )}
              required
            >
              {teamTypeOptions.length === 0 && <option value="">Loading...</option>}
              {teamTypeOptions.map(option => (
                <option key={option.Code} value={option.Code}>{option.Value}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[120px] pt-2">
              <FaPalette className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-gray-300'
              )}>
                Team Color<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <div className="flex-1">
              <div className={getThemeClasses(
                'flex gap-2 p-2 border-0 border-b-2 border-gray-200',
                'flex gap-2 p-2 border-0 border-b-2 border-gray-600'
              )}>
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
          
          {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
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