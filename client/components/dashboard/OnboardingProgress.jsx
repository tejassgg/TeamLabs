import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { FaUser, FaBuilding, FaUsers, FaFolder, FaCheck, FaTimes } from 'react-icons/fa';

const OnboardingProgress = ({ onComplete }) => {
  const { theme } = useTheme();
  const { onboardingData, userDetails, organization, teams, projects } = useGlobal();

  const steps = [
    {
      id: 'profile',
      title: 'Complete Profile',
      icon: <FaUser size={16} />,
      completed: onboardingData.onboardingProgress.profileComplete,
      required: true
    },
    {
      id: 'organization',
      title: 'Organization Setup',
      icon: <FaBuilding size={16} />,
      completed: onboardingData.onboardingProgress.organizationComplete,
      required: true
    },
    {
      id: 'team',
      title: 'Create Team',
      icon: <FaUsers size={16} />,
      completed: onboardingData.onboardingProgress.teamCreated,
      required: false
    },
    {
      id: 'project',
      title: 'Create Project',
      icon: <FaFolder size={16} />,
      completed: onboardingData.onboardingProgress.projectCreated,
      required: false
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  if (onboardingData.onboardingCompleted) {
    return null;
  }

  return (
    <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Complete Your Setup
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {completedSteps} of {totalSteps} steps completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-24 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium">{progressPercentage}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div 
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              step.completed 
                ? theme === 'dark' 
                  ? 'bg-green-900/30 border-green-600' 
                  : 'bg-green-50 border-green-200'
                : theme === 'dark'
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-white border-gray-200'
            } border`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step.completed 
                ? 'bg-green-500 text-white' 
                : theme === 'dark' 
                  ? 'bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 text-gray-600'
            }`}>
              {step.completed ? <FaCheck size={12} /> : step.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  step.completed 
                    ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
                    : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {step.title}
                </span>
                {step.required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>
              <div className={`text-xs ${
                step.completed 
                  ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {step.completed ? 'Completed' : step.required ? 'Required' : 'Optional'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {progressPercentage === 100 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <FaCheck size={14} />
            Complete Setup
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingProgress; 