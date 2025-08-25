import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { 
  FaUser, 
  FaBuilding, 
  FaUsers, 
  FaFolder, 
  FaCheck, 
  FaArrowRight,
  FaTimes,
  FaLightbulb,
  FaRocket,
  FaCog,
  FaHome
} from 'react-icons/fa';

const OnboardingGuide = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { onboardingData } = useGlobal();
  const [currentStep, setCurrentStep] = useState(0);

  const guideSteps = [
    {
      id: 'welcome',
      title: 'Welcome to TeamLabs',
      description: 'Let\'s get you started with the basics of TeamLabs.',
      icon: <FaRocket className="text-blue-500" size={24} />,
      content: (
        <div className="space-y-3">
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            TeamLabs is your AI-powered project management platform. Here's what you can do:
          </p>
          <ul className={`space-y-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            <li className="flex items-center gap-2">
              <FaCheck className="text-green-500 flex-shrink-0" size={12} />
              Create and manage teams
            </li>
            <li className="flex items-center gap-2">
              <FaCheck className="text-green-500 flex-shrink-0" size={12} />
              Organize projects with Kanban boards
            </li>
            <li className="flex items-center gap-2">
              <FaCheck className="text-green-500 flex-shrink-0" size={12} />
              Track progress with analytics
            </li>
            <li className="flex items-center gap-2">
              <FaCheck className="text-green-500 flex-shrink-0" size={12} />
              Get help from our AI assistant
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your personal information to get started.',
      icon: <FaUser className="text-green-500" size={24} />,
      content: (
        <div className="space-y-3">
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            A complete profile helps your team members know who you are and how to contact you.
          </p>
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-2 text-sm">Required Information:</h4>
            <ul className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• First and Last Name</li>
              <li>• Email Address</li>
              <li>• Phone Number</li>
              <li>• Address Information</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FaLightbulb className="text-yellow-500 flex-shrink-0" size={12} />
            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              You can update your profile anytime from the Profile page.
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'organization',
      title: 'Organization Setup',
      description: 'Set up your organization details.',
      icon: <FaBuilding className="text-purple-500" size={24} />,
      content: (
        <div className="space-y-3">
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            Your organization is the workspace where you and your team will collaborate.
          </p>
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-2 text-sm">Organization Features:</h4>
            <ul className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Centralized project management</li>
              <li>• Team collaboration tools</li>
              <li>• Shared analytics and insights</li>
              <li>• Member management</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'team',
      title: 'Create Your First Team',
      description: 'Start collaborating with your team members.',
      icon: <FaUsers className="text-orange-500" size={24} />,
      content: (
        <div className="space-y-3">
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            Teams are groups of people working together on projects. You can create multiple teams for different purposes.
          </p>
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-2 text-sm">Team Benefits:</h4>
            <ul className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Assign team members to projects</li>
              <li>• Track team performance</li>
              <li>• Manage team permissions</li>
              <li>• Team-specific analytics</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FaLightbulb className="text-yellow-500 flex-shrink-0" size={12} />
            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              You can create teams from the sidebar or dashboard.
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'project',
      title: 'Create Your First Project',
      description: 'Begin managing your projects effectively.',
      icon: <FaFolder className="text-indigo-500" size={24} />,
      content: (
        <div className="space-y-3">
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            Projects are where you organize and track your work. Each project can have multiple tasks and team members.
          </p>
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-2 text-sm">Project Features:</h4>
            <ul className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Kanban board for task management</li>
              <li>• Task assignment and tracking</li>
              <li>• Project analytics and reports</li>
              <li>• GitHub integration</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FaLightbulb className="text-yellow-500 flex-shrink-0" size={12} />
            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Start with a simple project to get familiar with the workflow.
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Your workspace is ready. Start exploring TeamLabs.',
      icon: <FaCheck className="text-green-500" size={24} />,
      content: (
        <div className="space-y-3">
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
            Congratulations! You've completed the basic setup. Here are some next steps:
          </p>
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-2 text-sm">What's Next:</h4>
            <ul className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Explore the dashboard analytics</li>
              <li>• Try the AI assistant for help</li>
              <li>• Invite team members to your organization</li>
              <li>• Set up GitHub integration for your projects</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FaLightbulb className="text-yellow-500 flex-shrink-0" size={12} />
            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              You can always access this guide from the dashboard.
            </span>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Onboarding Guide</h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Step {currentStep + 1} of {guideSteps.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
          <div className="flex items-center justify-between">
            {guideSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : theme === 'dark' 
                    ? 'bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? <FaCheck size={10} /> : index + 1}
                </div>
                {index < guideSteps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep 
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

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="text-center mb-4 flex-shrink-0">
            <div className="mb-3">{guideSteps[currentStep].icon}</div>
            <h2 className="text-xl font-bold mb-2">{guideSteps[currentStep].title}</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
              {guideSteps[currentStep].description}
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto flex-1 flex items-center">
            {guideSteps[currentStep].content}
          </div>
        </div>

        {/* Navigation */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 text-sm ${
                currentStep === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Previous
            </button>
            
            <div className="flex gap-3">
              {currentStep < guideSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  Next
                  <FaArrowRight size={12} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  <FaCheck size={12} />
                  Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide; 