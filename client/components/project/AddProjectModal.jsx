import { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FaProjectDiagram, FaAlignLeft, FaCalendarAlt } from 'react-icons/fa';

const AddProjectModal = ({ isOpen, onClose, onAddProject, organizationId, projectOwner }) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project Name is required');
      return;
    }
    
    try {
      await onAddProject({
        Name: name.trim(),
        Description: description.trim(),
        FinishDate: finishDate ? new Date(finishDate) : null,
        ProjectOwner: projectOwner,
        OrganizationID: organizationId,
        IsActive: false
      });
      setName('');
      setDescription('');
      setFinishDate('');
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
    }
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
              maxLength={100}
              rows={3}
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
                Finish Date
              </label>
            </div>
            <input
              type="date"
              value={finishDate}
              onChange={e => setFinishDate(e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
              )}
              autoComplete="off"
            />
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal; 