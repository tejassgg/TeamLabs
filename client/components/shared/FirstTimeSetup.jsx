import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  FaUser,
  FaBuilding,
  FaUsers,
  FaFolder,
  FaCheck,
  FaArrowRight,
  FaRocket,
  FaLightbulb,
  FaHome,
  FaClock,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { authService, commonTypeService, organizationService, teamService, projectService } from '../../services/api';
import { calculateOnboardingProgress } from '../../utils/onboardingUtils';
import CompleteProfileForm from '../profile/CompleteProfileForm';
import CustomModal from './CustomModal';
import AddTeamModal from '../team/AddTeamModal';
import AddProjectModal from '../project/AddProjectModal';

// Helper function to get team join request status styling
const getJoinRequestStatusStyle = (status) => {
  const styles = {
    'pending': {
      bgColor: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: FaClock,
      iconColor: 'text-yellow-600'
    },
    'accepted': {
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: FaCheckCircle,
      iconColor: 'text-green-600'
    },
    'rejected': {
      bgColor: 'from-red-50 to-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: FaTimes,
      iconColor: 'text-red-600'
    }
  };

  return styles[status] || styles['pending'];
};

// Helper function to render status badge
const renderStatusBadge = (status, theme) => {
  const statusStyle = getJoinRequestStatusStyle(status);
  const StatusIcon = statusStyle.icon;
  
  // Enhanced dark theme support
  const darkThemeClasses = theme === 'dark' ? {
    'pending': 'dark:from-yellow-900/50 dark:to-yellow-800/50 dark:text-yellow-200 dark:border-yellow-700',
    'accepted': 'dark:from-green-900/50 dark:to-green-800/50 dark:text-green-200 dark:border-green-700',
    'rejected': 'dark:from-red-900/50 dark:to-red-800/50 dark:text-red-200 dark:border-red-700'
  } : {};
  
  const darkThemeClass = darkThemeClasses[status] || '';
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${statusStyle.bgColor} ${statusStyle.textColor} border ${statusStyle.borderColor} ${darkThemeClass} transition-all duration-200`}>
      <StatusIcon className={`${statusStyle.iconColor} ${theme === 'dark' ? 'dark:text-current' : ''}`} size={12} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// OrganizationDropdown: Custom dropdown for organizations
const OrganizationDropdown = ({ value, onChange, options, placeholder = 'Select Organization', required = false, disabled = false, className = '', onCreateOrg, setDropdownOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (setDropdownOpen) setDropdownOpen(isOpen);
  }, [isOpen, setDropdownOpen]);

  const getThemeClasses = (light, dark) => theme === 'dark' ? `${light} ${dark}` : light;
  const selectedOption = options.find(org => org.OrganizationID?.toString() === value?.toString());
  const filteredOptions = options.filter(org => org.Name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={getThemeClasses(
          'w-full px-4 py-2.5 rounded-xl bg-white text-left flex items-center justify-between border border-gray-200',
          'dark:bg-[#232323] dark:text-gray-100 dark:border-gray-600'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <span>{selectedOption.Name}</span>
          ) : (
            <span className={getThemeClasses('text-gray-500', 'dark:text-gray-400')}>{placeholder}</span>
          )}
        </div>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className={getThemeClasses(
          'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-auto',
          'dark:bg-[#232323] dark:border-gray-600'
        )}>
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search organizations..."
              className={getThemeClasses(
                'w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:bg-[#232323] dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setSearch(''); onCreateOrg && onCreateOrg(); }}
            className={getThemeClasses(
              'w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-t-xl font-medium',
              'dark:text-blue-300 dark:hover:bg-[#232345]'
            )}
          >
            + Create Your Organization
          </button>
          {filteredOptions.length === 0 && (
            <div className={getThemeClasses('px-4 py-2 text-gray-500', 'dark:text-gray-400')}>No organizations found</div>
          )}
          {filteredOptions.map((org, idx) => (
            <button
              key={org._id}
              type="button"
              onClick={() => { onChange(org.OrganizationID?.toString()); setIsOpen(false); setSearch(''); }}
              className={getThemeClasses(
                `w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${idx === filteredOptions.length - 1 ? 'last:rounded-b-xl' : ''} ${value?.toString() === org.OrganizationID?.toString() ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`,
                'dark:hover:bg-gray-700 dark:text-gray-100 dark:bg-transparent dark:font-normal'
              )}
            >
              {org.Name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FirstTimeSetup = ({ isOpen, onComplete }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { userDetails, organization, teams, projects, setUserDetails, setTeams, setProjects, setOrganization } = useGlobal();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [setupProgress, setSetupProgress] = useState({
    profileComplete: false,
    organizationComplete: false,
    teamCreated: false,
    projectCreated: false,
    onboardingComplete: false
  });
  const [loading, setLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [orgOptions, setOrgOptions] = useState([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgError, setOrgError] = useState('');

  // Setup steps configuration
  const setupSteps = [
    {
      id: 'welcome',
      title: 'Welcome to TeamLabs!',
      description: 'Let\'s get you started with your workspace setup.',
      icon: <FaRocket className="text-blue-500" size={24} />,
      component: WelcomeStep,
      required: false
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your personal information to get started.',
      icon: <FaUser className="text-green-500" size={24} />,
      component: ProfileStep,
      required: true
    },
    {
      id: 'organization',
      title: 'Organization Setup',
      description: 'Set up your organization details.',
      icon: <FaBuilding className="text-purple-500" size={24} />,
      component: OrganizationStep,
      required: true
    },
    {
      id: 'team',
      title: 'Create Your First Team',
      description: 'Start collaborating with your team members.',
      icon: <FaUsers className="text-orange-500" size={24} />,
      component: TeamStep,
      required: false
    },
    {
      id: 'project',
      title: 'Create Your First Project',
      description: 'Begin managing your projects effectively.',
      icon: <FaFolder className="text-indigo-500" size={24} />,
      component: ProjectStep,
      required: false
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Your workspace is ready. Start exploring TeamLabs.',
      icon: <FaCheck className="text-green-500" size={24} />,
      component: CompleteStep,
      required: false
    }
  ];

  // Check setup progress on mount
  useEffect(() => {
    checkSetupProgress();
  }, [userDetails, organization, teams, projects]);

  // Update onboarding data when dependencies change
  useEffect(() => {
    if (userDetails) {
      const newOnboardingData = calculateOnboardingProgress(userDetails, organization, teams, projects);
      setSetupProgress(newOnboardingData.onboardingProgress);
    }
  }, [userDetails, organization, teams, projects]);

  const checkSetupProgress = () => {
    const progress = {
      profileComplete: isProfileComplete(userDetails),
      organizationComplete: !!organization,
      teamCreated: teams.length > 0,
      projectCreated: projects.length > 0,
      onboardingComplete: false
    };
    setSetupProgress(progress);
  };

  const isProfileComplete = (profile) => {
    if (!profile) return false;
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'country'];
    return requiredFields.every(field => profile[field] && profile[field].toString().trim() !== '');
  };

  const handleNext = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Calculate the final onboarding progress
      const finalProgress = {
        profileComplete: setupProgress.profileComplete,
        organizationComplete: setupProgress.organizationComplete,
        teamCreated: setupProgress.teamCreated,
        projectCreated: setupProgress.projectCreated,
        onboardingComplete: true
      };
      
      // Mark onboarding as complete
      await authService.updateOnboardingStatus(true, 'complete', finalProgress);
      setSetupProgress(prev => ({ ...prev, onboardingComplete: true }));
      
      // Refresh user data in global context to ensure all data is up to date
      try {
        const overview = await authService.getUserOverview();
        if (overview) {
          setUserDetails(overview.user);
          setTeams(overview.teams);
          setProjects(overview.projects);
          setOrganization(overview.organization);
        }
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
      }
      
      showToast('Setup completed successfully!', 'success');
      onComplete();
      router.push('/dashboard');
    } catch (error) {
      showToast('Failed to complete setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = Object.values(setupProgress).filter(Boolean).length;
    return Math.round((completedSteps / Object.keys(setupProgress).length) * 100);
  };

  const CurrentStepComponent = setupSteps[currentStep].component;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] sm:h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">First Time Setup</h1>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Step {currentStep + 1} of {setupSteps.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-32 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <span className="text-sm font-medium">{getProgressPercentage()}%</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
          <div className="flex items-center justify-between">
            {setupSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                      ? 'bg-blue-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                  {index + 1}
                </div>
                {index < setupSteps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${index < currentStep
                      ? 'bg-green-500'
                      : theme === 'dark'
                        ? 'bg-gray-600'
                        : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 min-h-0">
          <div className="h-full flex flex-col">
            <CurrentStepComponent
              step={setupSteps[currentStep]}
              setupProgress={setupProgress}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
              onComplete={handleComplete}
              loading={loading}
              selectedOrganization={selectedOrganization}
              setSelectedOrganization={setSelectedOrganization}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep = ({ step, onNext, onPrevious }) => {
  const { theme } = useTheme();

  return (
    <div className="p-8 text-center">
      <div className="mb-6">
        {step.icon}
      </div>
      <h2 className="text-3xl font-bold mb-4">{step.title}</h2>
      <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        {step.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <FaUser className="text-blue-500 mx-auto mb-2" size={24} />
          <h3 className="font-semibold mb-2">Complete Profile</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Add your personal information
          </p>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <FaBuilding className="text-purple-500 mx-auto mb-2" size={24} />
          <h3 className="font-semibold mb-2">Organization</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Set up your workspace
          </p>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <FaUsers className="text-orange-500 mx-auto mb-2" size={24} />
          <h3 className="font-semibold mb-2">Team & Projects</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Start collaborating
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
      >
        Get Started
        <FaArrowRight size={16} />
      </button>
    </div>
  );
};

// Profile Step Component
const ProfileStep = ({ step, setupProgress, onNext, onPrevious, onSkip, selectedOrganization, setSelectedOrganization }) => {
  const { theme } = useTheme();
  const [profileCompleted, setProfileCompleted] = useState(setupProgress.profileComplete);

  // When profile is completed, allow continue
  const handleProfileComplete = (data) => {
    setProfileCompleted(true);
    // Save organization data if available
    if (data && data.organizationID) {
      setSelectedOrganization({
        id: data.organizationID,
        name: data.organization.name
      });
    }
    if (onNext) onNext();
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="mb-4">{step.icon}</div>
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>
      </div>
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Profile Information</h3>
          {profileCompleted && (
            <span className="text-green-500 flex items-center gap-1">
              <FaCheck size={12} />
              Complete
            </span>
          )}
        </div>
        <CompleteProfileForm onComplete={handleProfileComplete} onCancel={() => { }} />
                {profileCompleted && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={onNext}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Organization Step Component
const OrganizationStep = ({ step, setupProgress, onNext, onPrevious, onSkip, selectedOrganization, setSelectedOrganization }) => {
  const { theme } = useTheme();
  const { setUserDetails } = useGlobal();
  const [orgOptions, setOrgOptions] = useState([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(selectedOrganization?.id || '');
  const [savingOrg, setSavingOrg] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { organizations } = await commonTypeService.getDropdownData();
        setOrgOptions(organizations);
      } catch (err) {
        setOrgOptions([]);
      }
    };
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      setOrgError('Organization name is required');
      return;
    }
    setCreatingOrg(true);
    setOrgError('');
    try {
      const { org, updatedUser } = await organizationService.createOrganization({ Name: newOrgName });
      // Update userDetails in global context
      setUserDetails(prev => ({
        ...prev,
        ...updatedUser,
        role: updatedUser.role,
        organizationID: org.OrganizationID
      }));
      setOrgOptions(prev => [...prev, org].sort((a, b) => a.Name.localeCompare(b.Name)));
      setSelectedOrgId(org.OrganizationID?.toString());
      setSelectedOrganization({
        id: org.OrganizationID?.toString(),
        name: org.Name
      });
      setShowOrgModal(false);
      setNewOrgName('');
    } catch (err) {
      setOrgError(err.message || 'Failed to create organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleOrgSelect = (orgId) => {
    setSelectedOrgId(orgId);
    const selectedOrg = orgOptions.find(org => org.OrganizationID?.toString() === orgId?.toString());
    if (selectedOrg) {
      setSelectedOrganization({
        id: orgId,
        name: selectedOrg.Name
      });
    }
  };

  const handleContinue = async () => {
    if (!selectedOrganization) return;

    setSavingOrg(true);
    try {
      // Update user's organizationID in the backend
      await authService.completeProfile({
        organizationID: selectedOrganization.id,
        needsUpdate: 'organizationID'
      });

      // Calculate the current onboarding progress
      const currentProgress = {
        profileComplete: setupProgress.profileComplete,
        organizationComplete: true, // This step is being completed
        teamCreated: setupProgress.teamCreated,
        projectCreated: setupProgress.projectCreated,
        onboardingComplete: false
      };

      // Update onboarding status to mark organization step as complete
      await authService.updateOnboardingStatus(false, 'team', currentProgress);

      onNext();
    } catch (error) {
      console.error('Failed to save organization:', error);
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-2">
        <div className="mb-4">{step.icon}</div>
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {step.description}
        </p>
      </div>

      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Organization Details</h3>
          {setupProgress.organizationComplete && (
            <span className="text-green-500 flex items-center gap-1">
              <FaCheck size={12} />
              Complete
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Select Organization
            </label>
            <OrganizationDropdown
              value={selectedOrgId}
              onChange={handleOrgSelect}
              options={orgOptions}
              placeholder="Select Organization"
              required
              disabled={creatingOrg || savingOrg}
              onCreateOrg={() => setShowOrgModal(true)}
              setDropdownOpen={setDropdownOpen}
            />
          </div>
          {selectedOrganization && (
            <div className="flex items-center gap-3">
              <FaBuilding className="text-purple-500" size={16} />
              <span>Organization Name</span>
              <span className={`ml-2 px-3 py-1 rounded-lg text-sm font-medium ${theme === 'dark'
                  ? 'bg-purple-900 text-purple-200'
                  : 'bg-purple-100 text-purple-700'
                }`}>
                {selectedOrganization.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3" style={{ marginTop: '250px' }}>
          <button
            onClick={onPrevious}
            className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
              theme === 'dark' 
                ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedOrganization || savingOrg}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingOrg ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Organization Creation Modal */}
      <CustomModal isOpen={showOrgModal} onClose={() => setShowOrgModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Organization</h2>
          <input
            type="text"
            className={`w-full px-4 py-2 rounded-lg border border-gray-300 mb-4 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900'}`}
            placeholder="Organization Name"
            value={newOrgName}
            onChange={e => setNewOrgName(e.target.value)}
            disabled={creatingOrg}
          />
          {orgError && <div className="text-red-500 mb-2">{orgError}</div>}
          <div className="flex justify-end gap-2">
            <button
              className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setShowOrgModal(false)}
              disabled={creatingOrg}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleCreateOrg}
              disabled={creatingOrg}
            >
              {creatingOrg ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

// TeamDropdown: Custom dropdown for teams
const TeamDropdown = ({ value, onChange, options, placeholder = 'Select Team', required = false, disabled = false, className = '', onCreateTeam, setDropdownOpen, requestedTeams, setRequestedTeams, onRequestSent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);
  const { user } = useAuth();
  const { showToast } = useToast ? useToast() : { showToast: () => {} };
  // const [requestedTeams, setRequestedTeams] = useState([]); // <-- moved up

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (setDropdownOpen) setDropdownOpen(isOpen);
  }, [isOpen, setDropdownOpen]);

  const getThemeClasses = (light, dark) => theme === 'dark' ? `${light} ${dark}` : light;
  const selectedOption = options.find(team => team.TeamID?.toString() === value?.toString());
  const filteredOptions = options.filter(team => team.TeamName.toLowerCase().includes(search.toLowerCase()));

  const handleRequestToJoin = async (team) => {
    try {
      await teamService.requestToJoinTeam(team.TeamID, user._id);
      setRequestedTeams(prev => [...prev, team.TeamID]);
      showToast && showToast('Request sent!', 'success');
      // Refresh the pending requests table
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (err) {
      showToast && showToast(err.message || 'Failed to send request', 'error');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={getThemeClasses(
          'w-full px-4 py-2.5 rounded-xl bg-white text-left flex items-center justify-between border border-gray-200',
          'dark:bg-[#232323] dark:text-gray-100 dark:border-gray-600'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <span>{selectedOption.TeamName}</span>
          ) : (
            <span className={getThemeClasses('text-gray-500', 'dark:text-gray-400')}>{placeholder}</span>
          )}
        </div>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className={getThemeClasses(
          'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-auto',
          'dark:bg-[#232323] dark:border-gray-600'
        )}>
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teams..."
              className={getThemeClasses(
                'w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:bg-[#232323] dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setSearch(''); onCreateTeam && onCreateTeam(); }}
            className={getThemeClasses(
              'w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-t-xl font-medium',
              'dark:text-blue-300 dark:hover:bg-[#232345]'
            )}
          >
            + Create Your Team
          </button>
          {filteredOptions.length === 0 && (
            <div className={getThemeClasses('px-4 py-2 text-gray-500', 'dark:text-gray-400')}>No teams found</div>
          )}
          {filteredOptions.map((team, idx) => {
            const alreadyRequested = requestedTeams.includes(team.TeamID);
            return (
              <div
                key={team._id}
                className={`flex items-center justify-between p-4 border-b last:border-b-0 bg-white hover:bg-blue-50 rounded-lg transition-colors`}
                style={{ minWidth: 300 }}
              >
                <div>
                  <div className="font-bold text-lg">{team.TeamName}</div>
                  <div className="text-gray-600 text-sm">{team.TeamDescription}</div>
                  <div className="text-xs text-gray-400 mt-1">ID: {team.TeamID}</div>
                </div>
                <button
                  className={`ml-4 px-4 py-2 rounded-lg font-semibold transition ${alreadyRequested ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  onClick={() => handleRequestToJoin(team)}
                  disabled={alreadyRequested}
                >
                  {alreadyRequested ? 'Requested' : 'Request to Join'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Team Step Component
const TeamStep = ({ step, setupProgress, onNext, onPrevious, onSkip, selectedOrganization }) => {
  const { theme } = useTheme();
  const { teams, userDetails, setTeams } = useGlobal();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [requestedTeams, setRequestedTeams] = useState([]); // <-- moved up
  const [userTeamMemberships, setUserTeamMemberships] = useState([]); // <-- new state for fetched memberships
  const [pendingRequests, setPendingRequests] = useState([]); // <-- new state for full request details

  // Fetch user's pending join requests
  const fetchUserPendingRequests = async () => {
    if (!userDetails?._id) return;
    
    try {
      const response = await teamService.getUserPendingRequests(userDetails._id);
      const teamIds = response.teamIds || [];
      const requests = response.pendingRequests || [];
      setRequestedTeams(teamIds);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error fetching user pending requests:', error);
      setRequestedTeams([]);
      setPendingRequests([]);
    }
  };

  // Fetch teams for the selected organization with members
  const fetchTeamsByOrganization = async (selectedOrg) => {
    const organizationId = selectedOrg?.OrganizationID || selectedOrg?.id;
    if (!organizationId) {
      setTeamOptions([]);
      setUserTeamMemberships([]);
      return;
    }

    setLoadingTeams(true);
    try {
      const teams = await teamService.getTeamsByOrganization(organizationId);
      
      // Filter out teams where user is already a member
      const availableTeams = teams.filter(team => {
        if (!team) return false;
        
        // Check if user is a member of this team
        if (team.members && Array.isArray(team.members)) {
          return !team.members.some(m => m.MemberID === userDetails?._id);
        }
        // Fallback: check if user is the owner
        return team.OwnerID !== userDetails?._id;
      });
      
      // Get teams where user is a member
      const userTeams = teams.filter(team => {
        if (!team) return false;
        
        if (team.members && Array.isArray(team.members)) {
          return team.members.some(m => m.MemberID === userDetails?._id);
        }
        return team.OwnerID === userDetails?._id;
      });
      
      setTeamOptions(availableTeams);
      setUserTeamMemberships(userTeams);
    } catch (error) {
      console.error('Error fetching teams by organization:', error);
      setTeamOptions([]);
      setUserTeamMemberships([]);
    } finally {
      setLoadingTeams(false);
    }
  };
  
  useEffect(() => {
    fetchTeamsByOrganization(selectedOrganization);
  }, [selectedOrganization]);

  useEffect(() => {
    fetchUserPendingRequests();
  }, [userDetails]);

  const handleCreateTeam = () => {
    setShowTeamModal(true);
  };

  const handleAddTeam = async (teamData) => {
    setCreatingTeam(true);
    try {
      const organizationId = selectedOrganization?.OrganizationID || selectedOrganization?.id;

      // Add team via API
      const { team } = await teamService.addTeam({
        ...teamData,
        OwnerID: userDetails?._id,
        organizationID: organizationId
      });

      // Refresh the teams list for the organization
      await fetchTeamsByOrganization(selectedOrganization);
      setTeams(prev => [...prev, team]);
      setSelectedTeamId(team.TeamID?.toString());
      setShowTeamModal(false);
    } catch (err) {
      console.error('Error creating team:', err);
      setShowTeamModal(false);
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleTeamSelect = (teamId) => {
    setSelectedTeamId(teamId);
  };

  // Check if user is a member of any team
  const isMemberOfAnyTeam = userTeamMemberships.length > 0;

  // New: check if user has requested to join any team
  const hasRequestedToJoinAnyTeam = requestedTeams.length > 0;

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="mb-4">{step.icon}</div>
        <h2 className="text-2xl font-bold mb-2">Join an Existing Team or Create Your Own</h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>
      </div>
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}> 
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Team Selection</h3>
          {setupProgress.teamCreated && (
            <span className="text-green-500 flex items-center gap-1">
              <FaCheck size={12} />
              Complete
            </span>
          )}
        </div>
        <div className="space-y-4">
          {isMemberOfAnyTeam ? (
            <>
              <div className="mb-4">
                <div className="font-medium mb-2">You are already a member of the following team(s):</div>
                <ul className="space-y-2">
                  {userTeamMemberships.map(team => (
                    <li key={team.TeamID} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="font-bold text-lg">{team.TeamName}</div>
                      <div className="text-gray-600 text-sm">{team.TeamDescription}</div>
                      <div className="text-xs text-gray-400 mt-1">ID: {team.TeamID}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex gap-3 justify-between" style={{ marginTop: '250px' }}>
                <button
                  onClick={onPrevious}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Back
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={onSkip}
                    className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                      theme === 'dark' 
                        ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={onNext}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {selectedOrganization && (
                <div className="flex items-center gap-3 mb-4">
                  <FaBuilding className="text-purple-500" size={16} />
                  <span>Organization:</span>
                  <span className={`ml-2 px-3 py-1 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>{selectedOrganization.name || selectedOrganization.Name}</span>
                </div>
              )}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Select Team</label>
                {loadingTeams ? (
                  <div className={`w-full px-4 py-2.5 rounded-xl border ${theme === 'dark' ? 'bg-[#232323] border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>Loading teams...</div>
                ) : (
                  <TeamDropdown
                    value={selectedTeamId}
                    onChange={handleTeamSelect}
                    options={teamOptions}
                    placeholder={selectedOrganization ? "Select Team" : "Please complete organization setup first"}
                    required
                    disabled={creatingTeam || !selectedOrganization}
                    onCreateTeam={handleCreateTeam}
                    setDropdownOpen={setDropdownOpen}
                    requestedTeams={requestedTeams}
                    setRequestedTeams={setRequestedTeams}
                    onRequestSent={fetchUserPendingRequests}
                  />
                )}
              </div>
              {selectedTeamId && (
                <div className="flex items-center gap-3">
                  <FaUsers className="text-orange-500" size={16} />
                  <span>Selected Team</span>
                  <span className={`ml-2 px-3 py-1 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-700'}`}>{teamOptions.find(t => t.TeamID?.toString() === selectedTeamId)?.TeamName}</span>
                </div>
              )}

              {/* Pending Requests Table */}
              {pendingRequests.length > 0 && (
                <div className="mt-6">
                  <h4 className={`font-medium mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    Pending Join Requests ({pendingRequests.length})
                  </h4>
                  <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    {/* Desktop Table Header */}
                    <div className={`hidden md:block ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                        <div className="col-span-4">Team Name</div>
                        <div className="col-span-4">Description</div>
                        <div className="col-span-2">Requested</div>
                        <div className="col-span-2">Status</div>
                      </div>
                    </div>
                    <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-200'}`}>
                      {pendingRequests.map((request, index) => (
                        <div key={request._id || index} className="px-4 py-3">
                          {/* Desktop Layout */}
                          <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4">
                              <div className="font-medium">
                                {request.teamDetails?.TeamName || 'Unknown Team'}
                              </div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                ID: {request.teamId}
                              </div>
                            </div>
                            <div className="col-span-4">
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {request.teamDetails?.TeamDescription || 'No description available'}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {new Date(request.requestedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="col-span-2">
                              {renderStatusBadge(request.status, theme)}
                            </div>
                          </div>
                          
                          {/* Mobile Layout */}
                          <div className="md:hidden space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {request.teamDetails?.TeamName || 'Unknown Team'}
                                </div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ID: {request.teamId}
                                </div>
                              </div>
                              {renderStatusBadge(request.status, theme)}
                            </div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              {request.teamDetails?.TeamDescription || 'No description available'}
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3 justify-between" style={{ marginTop: pendingRequests.length > 0 ? '24px' : '250px' }}>
                <button
                  onClick={onPrevious}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Back
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={onSkip}
                    className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                      theme === 'dark' 
                        ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={onNext}
                    disabled={!(selectedTeamId || hasRequestedToJoinAnyTeam)}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <AddTeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onAddTeam={handleAddTeam}
      />
    </div>
  );
};

// ProjectDropdown: Custom dropdown for projects
const ProjectDropdown = ({ value, onChange, options, placeholder = 'Select Project', required = false, disabled = false, className = '', onCreateProject, setDropdownOpen, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (setDropdownOpen) setDropdownOpen(isOpen);
  }, [isOpen, setDropdownOpen]);

  const getThemeClasses = (light, dark) => theme === 'dark' ? `${light} ${dark}` : light;
  const selectedOption = options.find(project => project.ProjectID?.toString() === value?.toString());
  const filteredOptions = options.filter(project => project.Name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={getThemeClasses(
          'w-full px-4 py-2.5 rounded-xl bg-white text-left flex items-center justify-between border border-gray-200',
          'dark:bg-[#232323] dark:text-gray-100 dark:border-gray-600'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <span>{selectedOption.Name}</span>
          ) : (
            <span className={getThemeClasses('text-gray-500', 'dark:text-gray-400')}>{placeholder}</span>
          )}
        </div>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className={getThemeClasses(
          'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-auto',
          'dark:bg-[#232323] dark:border-gray-600'
        )}>
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className={getThemeClasses(
                'w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'dark:bg-[#232323] dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
              )}
            />
          </div>
          {userRole === 'Admin' && (
            <button
              type="button"
              onClick={() => { setIsOpen(false); setSearch(''); onCreateProject && onCreateProject(); }}
              className={getThemeClasses(
                'w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-t-xl font-medium',
                'dark:text-blue-300 dark:hover:bg-[#232345]'
              )}
            >
              + Create New Project
            </button>
          )}
          {filteredOptions.length === 0 && (
            <div className={getThemeClasses('px-4 py-2 text-gray-500', 'dark:text-gray-400')}>No projects found</div>
          )}
          {filteredOptions.map((project, idx) => (
            <button
              key={project._id}
              type="button"
              onClick={() => { onChange(project.ProjectID?.toString()); setIsOpen(false); setSearch(''); }}
              className={getThemeClasses(
                `w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${idx === filteredOptions.length - 1 ? 'last:rounded-b-xl' : ''} ${value?.toString() === project.ProjectID?.toString() ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`,
                'dark:hover:bg-gray-700 dark:text-gray-100 dark:bg-transparent dark:font-normal'
              )}
            >
              {project.Name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Project Step Component
const ProjectStep = ({ step, setupProgress, onNext, onPrevious, onSkip }) => {
  const { theme } = useTheme();
  const { projects, userDetails, setProjects } = useGlobal();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);
  const [createdProject, setCreatedProject] = useState(null);

  const handleCreateProject = () => {
    setShowProjectModal(true);
  };

  const handleAddProject = async (projectData) => {
    setCreatingProject(true);
    try {
      // Add project via API
      const project = await projectService.addProject({
        ...projectData,
        ProjectOwner: userDetails?._id,
        OrganizationID: userDetails?.organizationID
      });
      setProjects(prev => [...prev, project]);
      setCreatedProject(project);
      setProjectCreated(true);
      setShowProjectModal(false);
    } catch (err) {
      // Handle error (show toast, etc.)
      setShowProjectModal(false);
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="mb-4">{step.icon}</div>
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}> 
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Create Your First Project</h3>
          {(setupProgress.projectCreated || projectCreated) && (
            <span className="text-green-500 flex items-center gap-1">
              <FaCheck size={12} />
              Complete
            </span>
          )}
        </div>
        
        <div className="space-y-6">
          {projectCreated && createdProject ? (
            // Show created project
            <div className={`p-4 rounded-lg border-2 border-green-500 ${theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <FaFolder className="text-green-500" size={20} />
                <div>
                  <h4 className="font-bold text-lg">{createdProject.Name}</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {createdProject.Description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <FaCheck className="text-green-500" size={14} />
                <span className="text-green-500 font-medium">Project created successfully!</span>
              </div>
            </div>
          ) : (
            // Show create project option
            <div className={`text-center p-8 rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
              <FaFolder className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} size={48} />
              <h4 className="font-semibold mb-2">Start Your First Project</h4>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Create your first project to organize tasks and collaborate with your team
              </p>
              <button
                onClick={handleCreateProject}
                disabled={creatingProject}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {creatingProject ? (
                  <>Creating...</>
                ) : (
                  <>
                    <FaFolder size={16} />
                    Create Project
                  </>
                )}
              </button>
            </div>
          )}

          {/* Benefits section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-2">
                <FaUsers className="text-blue-500" size={20} />
                <h5 className="font-medium">Team Collaboration</h5>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Organize tasks and collaborate with team members
              </p>
            </div>
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-2">
                <FaRocket className="text-purple-500" size={20} />
                <h5 className="font-medium">Project Management</h5>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Track progress and manage project milestones
              </p>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3 justify-between">
          <button
            onClick={onPrevious}
            className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
              theme === 'dark' 
                ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Back
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Skip for Now
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
      
      <AddProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onAddProject={handleAddProject}
        organizationId={userDetails?.organizationID}
        projectOwner={userDetails?._id}
      />
    </div>
  );
};

// Complete Step Component
const CompleteStep = ({ step, onComplete, onPrevious, loading }) => {
  const { theme } = useTheme();

  return (
    <div className="p-8 text-center">
      <div className="mb-6">
        {step.icon}
      </div>
      <h2 className="text-3xl font-bold mb-4">{step.title}</h2>
      <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        {step.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <FaHome className="text-blue-500 mx-auto mb-2" size={24} />
          <h3 className="font-semibold mb-2">Dashboard</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            View your workspace overview
          </p>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <FaLightbulb className="text-yellow-500 mx-auto mb-2" size={24} />
          <h3 className="font-semibold mb-2">Tips & Tricks</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Learn how to use TeamLabs effectively
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onPrevious}
          className={`px-6 py-3 rounded-lg transition-colors duration-200 ${
            theme === 'dark' 
              ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={loading}
          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Completing...' : 'Get Started with TeamLabs'}
          <FaRocket size={16} />
        </button>
      </div>
    </div>
  );
};

export default FirstTimeSetup; 