import React, { useState, useEffect } from 'react';

import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { releaseNotificationService } from '../../services/api';
import { 
  FaRocket, 
  FaTag, 
  FaAlignLeft, 
  FaFlag, 
  FaUsers, 
  FaCalendar,
  FaDownload,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaRocket as FaRocketIcon,
  FaBug,
  FaInfoCircle,
  FaCodeBranch,
  FaCog,
  FaFileAlt
} from 'react-icons/fa';

// Utility function to fetch the latest version file
const fetchLatestVersionData = async () => {
  try {
    // Known version files - in a real implementation, this could be dynamically fetched
    const knownVersionFiles = ['v1.0.1.json'];
    
    if (knownVersionFiles.length === 0) {
      return null;
    }
    
    // Sort versions and get the latest
    const sortedVersions = knownVersionFiles.sort((a, b) => {
      const versionA = a.replace('.json', '').replace('v', '');
      const versionB = b.replace('.json', '').replace('v', '');
      return versionB.localeCompare(versionA, undefined, { numeric: true });
    });
    
    const latestVersionFile = sortedVersions[0];
    const versionResponse = await fetch(`/static/versions/${latestVersionFile}`);
    
    if (!versionResponse.ok) {
      throw new Error(`Failed to fetch version data: ${versionResponse.status}`);
    }
    
    const versionData = await versionResponse.json();
    return versionData;
  } catch (error) {
    console.error('Error fetching latest version data:', error);
    return null;
  }
};

const AddReleaseModal = ({ isOpen, onClose, onAddRelease, onUpdateRelease, editingRelease = null }) => {
  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const getThemeClasses = (lightClasses, darkClasses) => {
    return theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;
  };

  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingVersionData, setLoadingVersionData] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    description: '',
    features: [{ title: '', description: '' }],
    improvements: [{ title: '', description: '' }],
    bugFixes: [{ title: '', description: '' }],
    releaseNotes: [{ title: '', description: '' }],
    priority: 'medium',
    targetAudience: 'all',
    compatibility: {
      minVersion: '',
      maxVersion: '',
      supportedBrowsers: [],
      requirements: []
    },
    metadata: {
      releaseType: 'minor',
      buildNumber: '',
      releaseChannel: 'stable'
    }
  });

  // Check if we're in edit mode
  const isEditMode = !!editingRelease;

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
      resetForm();
    }, 300); // Match the transition duration
  };

  // Load editing release data when modal opens
  useEffect(() => {
    if (isOpen && editingRelease) {
      setFormData({
        version: editingRelease.version || '',
        title: editingRelease.title || '',
        description: editingRelease.description || '',
        features: editingRelease.features?.length ? editingRelease.features : [{ title: '', description: '' }],
        improvements: editingRelease.improvements?.length ? editingRelease.improvements : [{ title: '', description: '' }],
        bugFixes: editingRelease.bugFixes?.length ? editingRelease.bugFixes : [{ title: '', description: '' }],
        releaseNotes: editingRelease.releaseNotes?.length ? editingRelease.releaseNotes : [{ title: '', description: '' }],
        priority: editingRelease.priority || 'medium',
        targetAudience: editingRelease.targetAudience || 'all',
        
        compatibility: {
          minVersion: editingRelease.compatibility?.minVersion || '',
          maxVersion: editingRelease.compatibility?.maxVersion || '',
          supportedBrowsers: editingRelease.compatibility?.supportedBrowsers || [],
          requirements: editingRelease.compatibility?.requirements || []
        },
        metadata: {
          releaseType: editingRelease.metadata?.releaseType || 'minor',
          buildNumber: editingRelease.metadata?.buildNumber || '',
          releaseChannel: editingRelease.metadata?.releaseChannel || 'stable'
        }
      });
    } else if (isOpen && !editingRelease) {
      // Fetch latest version data and autofill fields for new release
      const loadLatestVersionData = async () => {
        setLoadingVersionData(true);
        try {
          const versionData = await fetchLatestVersionData();
          if (versionData) {
            // Transform version data to match form structure
            const transformedData = {
              version: versionData.version || '',
              title: versionData.title || '',
              description: versionData.description || '',
              features: versionData.features?.map(feature => ({
                title: typeof feature === 'string' ? feature : feature.title || '',
                description: typeof feature === 'string' ? '' : feature.description || ''
              })) || [{ title: '', description: '' }],
            improvements: versionData.improvements_bug_fixes?.map(improvement => ({
              title: typeof improvement === 'string' ? improvement : improvement.title || '',
              description: typeof improvement === 'string' ? '' : improvement.description || ''
            })) || [{ title: '', description: '' }],
            bugFixes: [{ title: '', description: '' }], // Keep empty for manual entry
            releaseNotes: versionData.release_notes?.map(note => ({
              title: typeof note === 'string' ? note : note.title || '',
              description: typeof note === 'string' ? '' : note.description || ''
            })) || [{ title: '', description: '' }],
            priority: 'medium',
            targetAudience: 'all',
              compatibility: {
                minVersion: '',
                maxVersion: '',
                supportedBrowsers: [],
                requirements: []
              },
              metadata: {
                releaseType: 'minor',
                buildNumber: '',
                releaseChannel: 'stable'
              }
            };
            
            setFormData(transformedData);
            showToast('Form pre-filled with latest version data', 'info');
          } else {
            resetForm();
          }
        } catch (error) {
          console.error('Error loading version data:', error);
          resetForm();
        } finally {
          setLoadingVersionData(false);
        }
      };
      
      loadLatestVersionData();
    }
  }, [isOpen, editingRelease, showToast]);

  const resetForm = () => {
    setFormData({
      version: '',
      title: '',
      description: '',
      features: [{ title: '', description: '' }],
      improvements: [{ title: '', description: '' }],
      bugFixes: [{ title: '', description: '' }],
      releaseNotes: [{ title: '', description: '' }],
      priority: 'medium',
      targetAudience: 'all',
      
      compatibility: {
        minVersion: '',
        maxVersion: '',
        supportedBrowsers: [],
        requirements: []
      },
      metadata: {
        releaseType: 'minor',
        buildNumber: '',
        releaseChannel: 'stable'
      }
    });
    setError('');
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayFieldChange = (field, index, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      )
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], { title: '', description: '' }]
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.version.trim()) {
      setError('Version is required');
      return;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const releaseData = {
        ...formData
      };

      if (editingRelease) {
        await releaseNotificationService.updateReleaseNotification(editingRelease._id, releaseData);
        showToast('Release notification updated successfully', 'success');
        onUpdateRelease?.(editingRelease._id, releaseData);
      } else {
        await releaseNotificationService.createReleaseNotification(releaseData);
        showToast('Release notification created successfully', 'success');
        onAddRelease?.(releaseData);
      }

      handleClose();
    } catch (error) {
      setError(error.message || 'Failed to save release notification');
      console.error('Error saving release:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = isEditMode ? 'Edit Release Notification' : 'Create New Release Notification';

  const renderArrayField = (fieldName, fieldLabel, items, icon) => {
    // Hide section if no items have data
    const hasData = items.some(item => item.title.trim() || item.description.trim());
    if (!hasData && items.length === 1 && !items[0].title.trim() && !items[0].description.trim()) {
      return null;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-[120px]">
            {icon}
            <label className={getThemeClasses(
              'text-sm font-medium text-gray-700',
              'text-sm font-medium text-white'
            )}>
              {fieldLabel}
            </label>
          </div>
          <button
            type="button"
            onClick={() => addArrayField(fieldName)}
            className={getThemeClasses(
              'flex items-center p-1.5 text-xs rounded-full transition-colors bg-blue-500 hover:bg-blue-600 text-white',
              'flex items-center p-1.5 text-xs rounded-full transition-colors bg-blue-500 hover:bg-blue-600 text-white'
            )}
          >
            <FaPlus size={14} />
          </button>
        </div>
        {items.map((item, index) => (
          <div key={index} className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {fieldLabel.slice(0, -1)} {index + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField(fieldName, index)}
                  className={`p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors`}
                >
                  <FaTrash size={12} />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Title"
                value={item.title}
                onChange={(e) => handleArrayFieldChange(fieldName, index, 'title', e.target.value)}
                className={getThemeClasses(
                  'w-full px-2 py-1 text-sm rounded border transition-colors bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500',
                  'w-full px-2 py-1 text-sm rounded border transition-colors bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                )}
              />
              <textarea
                placeholder="Description"
                value={item.description}
                onChange={(e) => handleArrayFieldChange(fieldName, index, 'description', e.target.value)}
                rows={2}
                className={getThemeClasses(
                  'w-full px-2 py-1 text-sm rounded border transition-colors bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 resize-none',
                  'w-full px-2 py-1 text-sm rounded border transition-colors bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 resize-none'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      <div className={`absolute right-0 top-16 bottom-0 w-full lg:max-w-2xl ${theme === 'dark' ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-[#232323]' : 'border-gray-200'} p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isAnimating ? 'translate-x-full' : 'translate-x-0'}`}>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className={getThemeClasses(
              'text-xl font-semibold text-gray-900',
              'text-xl font-semibold text-white'
            )}>{modalTitle}</h3>
            {loadingVersionData && (
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Loading version data...</span>
              </div>
            )}
          </div>
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
          {/* Basic Information */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaTag className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
              )}>
                Version<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                className={getThemeClasses(
                  'w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                  'w-full px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                )}
                required
                placeholder="e.g., 1.2.0"
              />
              {formData.version && !editingRelease && (
                <div className="mt-1 text-xs text-blue-500 flex items-center gap-1">
                  <FaInfoCircle size={10} />
                  <span>Pre-filled from latest version data</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaRocket className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
              )}>
                Title<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={getThemeClasses(
                  'w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                  'w-full px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                )}
                required
                placeholder="Release title"
              />
              {formData.title && !editingRelease && (
                <div className="mt-1 text-xs text-blue-500 flex items-center gap-1">
                  <FaInfoCircle size={10} />
                  <span>Pre-filled from latest version data</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[120px] pt-2">
              <FaAlignLeft className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
              )}>
                Description<span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <div className="flex-1">
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={getThemeClasses(
                  'w-full px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 resize-none',
                  'w-full px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500 resize-none'
                )}
                rows={3}
                required
                placeholder="Brief description of the release"
              />
              {formData.description && !editingRelease && (
                <div className="mt-1 text-xs text-blue-500 flex items-center gap-1">
                  <FaInfoCircle size={10} />
                  <span>Pre-filled from latest version data</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaFlag className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
              )}>
                Priority
              </label>
            </div>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
              )}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <FaUsers className={getThemeClasses(
                'text-gray-500',
                'text-gray-400'
              )} size={16} />
              <label className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
              )}>
                Target Audience
              </label>
            </div>
            <select
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              className={getThemeClasses(
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
              )}
            >
              <option value="all">All Users</option>
              <option value="admin">Admin Only</option>
              <option value="premium">Premium Users</option>
              <option value="beta">Beta Users</option>
            </select>
          </div>


          {/* Features */}
          {renderArrayField('features', 'Features', formData.features, 
            <FaCheckCircle className={getThemeClasses('text-gray-500', 'text-gray-400')} size={16} />
          )}

          {/* Improvements */}
          {renderArrayField('improvements', 'Improvements', formData.improvements,
            <FaRocketIcon className={getThemeClasses('text-gray-500', 'text-gray-400')} size={16} />
          )}

          {/* Bug Fixes */}
          {renderArrayField('bugFixes', 'Bug Fixes', formData.bugFixes,
            <FaBug className={getThemeClasses('text-gray-500', 'text-gray-400')} size={16} />
          )}

          {/* Release Notes */}
          {renderArrayField('releaseNotes', 'Release Notes', formData.releaseNotes,
            <FaFileAlt className={getThemeClasses('text-gray-500', 'text-gray-400')} size={16} />
          )}

          

          {/* Metadata Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FaCodeBranch className={getThemeClasses('text-gray-500', 'text-gray-400')} size={16} />
              <h4 className={getThemeClasses(
                'text-sm font-medium text-gray-700',
                'text-sm font-medium text-white'
              )}>
                Metadata (Optional)
              </h4>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <label className={getThemeClasses(
                  'text-sm font-medium text-gray-700',
                  'text-sm font-medium text-white'
                )}>
                  Release Type
                </label>
              </div>
              <select
                value={formData.metadata.releaseType}
                onChange={(e) => handleInputChange('metadata.releaseType', e.target.value)}
                className={getThemeClasses(
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900',
                  'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white'
                )}
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="patch">Patch</option>
                <option value="hotfix">Hotfix</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <label className={getThemeClasses(
                  'text-sm font-medium text-gray-700',
                  'text-sm font-medium text-white'
                )}>
                  Build Number
                </label>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.metadata.buildNumber}
                  onChange={(e) => handleInputChange('metadata.buildNumber', e.target.value)}
                  className={getThemeClasses(
                    'flex-1 px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                    'flex-1 px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                  )}
                  placeholder="Auto-generated on save"
                  disabled={!isEditMode}
                />
                {!isEditMode && (
                  <div className="mt-1 text-xs text-blue-500 flex items-center gap-1">
                    <FaInfoCircle size={10} />
                    <span>Build number will be auto-generated when saving</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {error && <div className={getThemeClasses(
            'text-red-500 text-sm mt-4',
            'text-red-400 text-sm mt-4'
          )}>{error}</div>}

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
              className={getThemeClasses(
                'px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200',
                'px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200'
              )}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Release' : 'Create Release')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReleaseModal;
