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
  FaFileAlt,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaUser
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

const calculateNextVersion = (baseVersion, type) => {
  if (!baseVersion) return '1.0.0';

  const hasV = baseVersion.startsWith('v') || baseVersion.startsWith('V');
  const cleanVersion = baseVersion.replace(/^v/i, '').trim();

  // Try to parse standard semantic version: major.minor.patch
  const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:\-([\w\.\-]+))?$/);
  if (!match) {
    return baseVersion;
  }

  let major = parseInt(match[1], 10);
  let minor = parseInt(match[2], 10);
  let patch = parseInt(match[3], 10);
  const prerelease = match[4] || '';

  let nextVersion = '';

  switch (type) {
    case 'major':
      nextVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      nextVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      nextVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case 'hotfix':
      if (prerelease && prerelease.toLowerCase().includes('hotfix')) {
        const hotfixMatch = prerelease.match(/hotfix\.(\d+)/i);
        if (hotfixMatch) {
          const nextHotfixNum = parseInt(hotfixMatch[1], 10) + 1;
          nextVersion = `${major}.${minor}.${patch}-hotfix.${nextHotfixNum}`;
        } else {
          nextVersion = `${major}.${minor}.${patch}-hotfix.1`;
        }
      } else {
        nextVersion = `${major}.${minor}.${patch}-hotfix.1`;
      }
      break;
    default:
      nextVersion = `${major}.${minor}.${patch + 1}`;
  }

  return hasV ? `v${nextVersion}` : nextVersion;
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
  const [markdownInput, setMarkdownInput] = useState('');
  const [modalView, setModalView] = useState('edit'); // 'edit' or 'preview'
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [baseVersion, setBaseVersion] = useState('');

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
      setBaseVersion(editingRelease.version || '');
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
          let baseVer = '1.0.0';

          const versionData = await fetchLatestVersionData();
          if (versionData) {
            baseVer = versionData.version || '1.0.0';
          } else {
            // Fallback: fetch from database using releaseNotificationService
            const response = await releaseNotificationService.getLatestReleaseNotification('all');
            if (response && response.data) {
              baseVer = response.data.version || '1.0.0';
            }
          }

          setBaseVersion(baseVer);

          const transformedData = {
            version: calculateNextVersion(baseVer, 'minor'),
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
          };

          setFormData(transformedData);
          showToast('Form initialized with auto-generated version number', 'info');
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
    setMarkdownInput('');
    setModalView('edit');
    setPreviewExpanded(true);
    setBaseVersion('');
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const updated = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };

        // Auto-generate version based on release type if we're not in edit mode
        if (field === 'metadata.releaseType' && !isEditMode && baseVersion) {
          updated.version = calculateNextVersion(baseVersion, value);
        }

        return updated;
      });
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'high':
        return <FaFlag className="text-orange-500" />;
      case 'medium':
        return <FaInfoCircle className="text-blue-500" />;
      case 'low':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaRocket className="text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getFeatureIcon = (type) => {
    switch (type) {
      case 'feature':
        return <FaCheckCircle className="text-green-500" />;
      case 'improvement':
        return <FaRocketIcon className="text-blue-500" />;
      case 'bugfix':
        return <FaBug className="text-orange-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const handleMarkdownPaste = (text) => {
    setMarkdownInput(text);
    if (!text.trim()) return;

    let version = '';
    let title = '';
    let description = '';

    const lines = text.split('\n');
    let currentSection = ''; // 'features', 'improvements', 'bugFixes', 'releaseNotes', 'description'

    const parsedFeatures = [];
    const parsedImprovements = [];
    const parsedBugFixes = [];
    const parsedReleaseNotes = [];
    const descriptionLines = [];

    const parseListItem = (line) => {
      const cleanLine = line.replace(/^[\s\-\*\+\d\.\)]+/, '').trim();

      const boldPattern = cleanLine.match(/^\*\*(.*?)\*\*(?:\:?\s*|\s+\-\s*)(.*)$/);
      if (boldPattern) {
        return {
          title: boldPattern[1].trim(),
          description: boldPattern[2].trim()
        };
      }

      const colonPattern = cleanLine.match(/^(.*?)\:\s+(.*)$/);
      if (colonPattern) {
        return {
          title: colonPattern[1].trim(),
          description: colonPattern[2].trim()
        };
      }

      const dashPattern = cleanLine.match(/^(.*?)\s+\-\s+(.*)$/);
      if (dashPattern) {
        return {
          title: dashPattern[1].trim(),
          description: dashPattern[2].trim()
        };
      }

      return {
        title: cleanLine,
        description: ''
      };
    };

    let titleLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#')) {
        titleLineIndex = i;
        const cleanHeader = line.replace(/^#+\s*/, '').trim();

        const versionMatch = cleanHeader.match(/(v?\d+\.\d+\.\d+(?:\-\w+)?)/i);
        if (versionMatch) {
          version = versionMatch[1];
          title = cleanHeader
            .replace(version, '')
            .replace(/^[:\-\s]+|[:\-\s]+$/g, '')
            .trim();
        } else {
          title = cleanHeader;
        }
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (i === titleLineIndex) continue;

      if (line.startsWith('#')) {
        const headerText = line.replace(/^#+\s*/, '').toLowerCase();
        if (headerText.includes('feature')) {
          currentSection = 'features';
        } else if (headerText.includes('improvement') || headerText.includes('enhancement')) {
          currentSection = 'improvements';
        } else if (headerText.includes('bug') || headerText.includes('fix')) {
          currentSection = 'bugFixes';
        } else if (headerText.includes('note') || headerText.includes('changelog')) {
          currentSection = 'releaseNotes';
        } else {
          currentSection = 'description';
        }
        continue;
      }

      if (!line) continue;

      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
        const item = parseListItem(line);
        if (currentSection === 'features') {
          parsedFeatures.push(item);
        } else if (currentSection === 'improvements') {
          parsedImprovements.push(item);
        } else if (currentSection === 'bugFixes') {
          parsedBugFixes.push(item);
        } else if (currentSection === 'releaseNotes') {
          parsedReleaseNotes.push(item);
        } else {
          descriptionLines.push(line);
        }
      } else {
        if (currentSection === '' || currentSection === 'description') {
          const versionLineMatch = line.match(/version:?\s*(v?\d+\.\d+\.\d+(?:\-\w+)?)/i);
          if (versionLineMatch && !version) {
            version = versionLineMatch[1];
          } else {
            descriptionLines.push(line);
          }
        }
      }
    }

    description = descriptionLines.join('\n').trim();

    const features = parsedFeatures.length ? parsedFeatures : [{ title: '', description: '' }];
    const improvements = parsedImprovements.length ? parsedImprovements : [{ title: '', description: '' }];
    const bugFixes = parsedBugFixes.length ? parsedBugFixes : [{ title: '', description: '' }];
    const releaseNotes = parsedReleaseNotes.length ? parsedReleaseNotes : [{ title: '', description: '' }];

    setFormData(prev => ({
      ...prev,
      version: version || prev.version,
      title: title || prev.title,
      description: description || prev.description,
      features,
      improvements,
      bugFixes,
      releaseNotes
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
      const cleanArray = (arr) => {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.filter(item => item.title?.trim() || item.description?.trim());
      };

      const releaseData = {
        ...formData,
        features: cleanArray(formData.features),
        improvements: cleanArray(formData.improvements),
        bugFixes: cleanArray(formData.bugFixes),
        releaseNotes: cleanArray(formData.releaseNotes)
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
          <div key={index} className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
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
                rows={5}
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

        {/* Modal View Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-zinc-800 pb-3">
          <button
            type="button"
            onClick={() => setModalView('edit')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${modalView === 'edit'
              ? theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            Form Editor
          </button>
          <button
            type="button"
            onClick={() => setModalView('preview')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${modalView === 'preview'
              ? theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            Live Preview
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {modalView === 'edit' ? (
            <>
              {/* Markdown Import Box */}
              <div className={`p-4 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-[#1e1e24] border-zinc-800' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className={getThemeClasses(
                    'block text-sm font-semibold text-gray-700',
                    'block text-sm font-semibold text-white'
                  )}>
                    Quick Import / Paste Markdown (.md)
                  </label>
                  {markdownInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setMarkdownInput('');
                        resetForm();
                      }}
                      className="text-xs text-red-500 hover:text-red-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="Paste your release notes markdown here (e.g.,&#10;# Release v1.1.0&#10;## Features&#10;- Added something...)"
                  value={markdownInput}
                  onChange={(e) => handleMarkdownPaste(e.target.value)}
                  rows={4}
                  className={getThemeClasses(
                    'w-full px-3 py-2.5 text-sm rounded-xl border bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none',
                    'w-full px-3 py-2.5 text-sm rounded-xl border bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none'
                  )}
                />
                <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  Supports parsing headers like `# Release v1.1.0`, general descriptions, and bullet lists under headers like `### Features`, `### Improvements`, and `### Bug Fixes`.
                </p>
              </div>

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
            </>
          ) : (
            /* Live Preview View */
            <div className="space-y-6">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#1e1e24] border-zinc-800' : 'bg-gray-50 border-gray-200'
                }`}>
                <p className={`text-sm mb-4 font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  Simulated Banner Notification Preview:
                </p>
                <div className={`relative border-l-4 rounded-r-xl overflow-hidden shadow-md ${getPriorityColor(formData.priority)} ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                  {/* Banner Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getPriorityIcon(formData.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                              New Release Available
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                              }`}>
                              v{formData.version || '1.0.0'}
                            </span>
                          </div>
                          <h4 className={`text-base font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                            {formData.title || 'Untitled Release'}
                          </h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                            {formData.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewExpanded(!previewExpanded)}
                          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600'
                            }`}
                        >
                          {previewExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Meta information */}
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <FaCalendar className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaUser className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          {userDetails?.firstName ? `${userDetails.firstName} ${userDetails.lastName || ''}` : 'Organization Admin'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Banner Expanded content */}
                  {previewExpanded && (
                    <div className={`border-t p-4 space-y-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                      {/* Release Notes */}
                      {formData.releaseNotes && formData.releaseNotes.some(n => n.title.trim() || n.description.trim()) && (
                        <div>
                          <h5 className={`font-semibold text-sm mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            Release Notes
                          </h5>
                          <div className={`p-3 rounded-lg space-y-2 ${theme === 'dark' ? 'bg-gray-700/60' : 'bg-gray-100/80'
                            }`}>
                            {formData.releaseNotes.map((note, index) => (
                              note.title.trim() || note.description.trim() ? (
                                <div key={index} className="text-sm">
                                  {note.title.trim() && <strong className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>{note.title}: </strong>}
                                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{note.description}</span>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      {formData.features && formData.features.some(f => f.title.trim() || f.description.trim()) && (
                        <div>
                          <h5 className={`font-semibold text-sm mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            New Features
                          </h5>
                          <div className="space-y-3">
                            {formData.features.map((feature, index) => (
                              feature.title.trim() || feature.description.trim() ? (
                                <div key={index} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                  }`}>
                                  <div className="flex items-start gap-3">
                                    {getFeatureIcon('feature')}
                                    <div>
                                      <h6 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {feature.title}
                                      </h6>
                                      {feature.description.trim() && (
                                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                          }`}>
                                          {feature.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improvements */}
                      {formData.improvements && formData.improvements.some(imp => imp.title.trim() || imp.description.trim()) && (
                        <div>
                          <h5 className={`font-semibold text-sm mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            Improvements
                          </h5>
                          <div className="space-y-3">
                            {formData.improvements.map((improvement, index) => (
                              improvement.title.trim() || improvement.description.trim() ? (
                                <div key={index} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                  }`}>
                                  <div className="flex items-start gap-3">
                                    {getFeatureIcon('improvement')}
                                    <div>
                                      <h6 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {improvement.title}
                                      </h6>
                                      {improvement.description.trim() && (
                                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                          }`}>
                                          {improvement.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bug Fixes */}
                      {formData.bugFixes && formData.bugFixes.some(bf => bf.title.trim() || bf.description.trim()) && (
                        <div>
                          <h5 className={`font-semibold text-sm mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            Bug Fixes
                          </h5>
                          <div className="space-y-3">
                            {formData.bugFixes.map((bugFix, index) => (
                              bugFix.title.trim() || bugFix.description.trim() ? (
                                <div key={index} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                  }`}>
                                  <div className="flex items-start gap-3">
                                    {getFeatureIcon('bugfix')}
                                    <div>
                                      <h6 className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {bugFix.title}
                                      </h6>
                                      {bugFix.description.trim() && (
                                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                          }`}>
                                          {bugFix.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
