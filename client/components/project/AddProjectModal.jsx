import { useState } from 'react';
import { authService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const AddProjectModal = ({ isOpen, onClose, onAddProject, organizationId, projectOwner }) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [error, setError] = useState('');

  const getThemeClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? darkClass : lightClass;
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
      onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={getThemeClasses(
        'bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-lg border border-gray-100',
        'bg-[#232323] rounded-xl p-6 max-w-2xl w-full mx-4 shadow-lg border border-gray-700'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={getThemeClasses(
            'text-xl font-semibold text-gray-900',
            'text-xl font-semibold text-white'
          )}>Add New Project</h3>
          <button
            onClick={onClose}
            className={getThemeClasses(
              'text-gray-400 hover:text-gray-600 text-2xl font-bold',
              'text-gray-400 hover:text-gray-300 text-2xl font-bold'
            )}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label className={getThemeClasses(
              'block text-sm font-medium text-gray-700 mb-1',
              'block text-sm font-medium text-gray-300 mb-1'
            )}>
              Project Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={getThemeClasses(
                'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900',
                'w-full px-4 py-2.5 rounded-xl border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-[#18181b] text-white'
              )}
              maxLength={50}
              required
              autoComplete="project-name"
            />
          </div>
          <div>
            <label className={getThemeClasses(
              'block text-sm font-medium text-gray-700 mb-1',
              'block text-sm font-medium text-gray-300 mb-1'
            )}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={getThemeClasses(
                'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900',
                'w-full px-4 py-2.5 rounded-xl border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-[#18181b] text-white'
              )}
              maxLength={100}
              rows={3}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={getThemeClasses(
              'block text-sm font-medium text-gray-700 mb-1',
              'block text-sm font-medium text-gray-300 mb-1'
            )}>
              Finish Date
            </label>
            <input
              type="date"
              value={finishDate}
              onChange={e => setFinishDate(e.target.value)}
              className={getThemeClasses(
                'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900',
                'w-full px-4 py-2.5 rounded-xl border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-[#18181b] text-white'
              )}
              autoComplete="off"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={getThemeClasses(
                'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                'px-4 py-2.5 text-gray-300 hover:bg-[#424242] rounded-xl border border-gray-600 transition-all duration-200'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200"
            >
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal; 