import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { useRouter } from 'next/router';
import { 
  FaUsers, 
  FaFolder, 
  FaRocket, 
  FaPlus, 
  FaLightbulb,
  FaChartBar,
  FaCog,
  FaArrowRight,
  FaStar,
  FaCheckCircle
} from 'react-icons/fa';
import { teamService, projectService } from '../../services/api';
import AddTeamModal from '../team/AddTeamModal';
import AddProjectModal from '../project/AddProjectModal';

const AdminWelcomeMessage = ({ onOpenSetupGuide, onOpenInvite }) => {
  const { theme } = useTheme();
  const { userDetails, teams, projects, setTeams, setProjects } = useGlobal();
  const router = useRouter();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const handleCreateTeam = async (teamData) => {
    setCreatingTeam(true);
    try {
      const { team } = await teamService.addTeam({
        ...teamData,
        OwnerID: userDetails?._id,
        organizationID: userDetails?.organizationID
      });
      setTeams(prev => [...prev, team]);
      setShowTeamModal(false);
    } catch (err) {
      console.error('Error creating team:', err);
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    setCreatingProject(true);
    try {
      const project = await projectService.addProject({
        ...projectData,
        ProjectOwner: userDetails?._id,
        OrganizationID: userDetails?.organizationID
      });
      setProjects(prev => [...prev, project]);
      setShowProjectModal(false);
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setCreatingProject(false);
    }
  };

  const actionCards = [
    {
      id: 'create-team',
      title: 'Create Your First Team',
      description: 'Set up a team to collaborate with your colleagues and manage projects together.',
      icon: <FaUsers className="text-blue-500" size={28} />,
      action: () => router.push('/teams?addTeam=1'),
      buttonText: 'Create Team',
      buttonColor: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      features: ['Team collaboration', 'Member management', 'Project assignment'],
      gradient: 'from-blue-50 to-blue-100',
      darkGradient: 'from-blue-900/20 to-blue-800/20'
    },
    {
      id: 'create-project',
      title: 'Create Your First Project',
      description: 'Start a new project to organize tasks, track progress, and achieve your goals.',
      icon: <FaFolder className="text-green-500" size={28} />,
      action: () => router.push('/projects?addProject=1'),
      buttonText: 'Create Project',
      buttonColor: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      features: ['Task management', 'Progress tracking', 'Deadline management'],
      gradient: 'from-green-50 to-green-100',
      darkGradient: 'from-green-900/20 to-green-800/20'
    },
    {
      id: 'invite-people',
      title: 'Invite People',
      description: 'Bring your teammates on board to start collaborating right away with them.',
      icon: <FaPlus className="text-purple-500" size={28} />,
      action: () => onOpenInvite && onOpenInvite(),
      buttonText: 'Invite',
      buttonColor: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      features: ['Email invites', 'Role assignment', 'Instant collaboration'],
      gradient: 'from-purple-50 to-purple-100',
      darkGradient: 'from-purple-900/20 to-purple-800/20'
    },
    {
      id: 'setup-guide',
      title: 'Setup Guide',
      description: 'Get step-by-step guidance on how to set up and use TeamLabs effectively.',
      icon: <FaLightbulb className="text-yellow-500" size={28} />,
      action: () => onOpenSetupGuide && onOpenSetupGuide(),
      buttonText: 'View Guide',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      features: ['Onboarding tips', 'Best practices', 'Feature tutorials'],
      gradient: 'from-yellow-50 to-yellow-100',
      darkGradient: 'from-yellow-900/20 to-yellow-800/20'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className={`relative text-center py-12 overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full blur-xl"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-purple-500 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-green-500 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-yellow-500 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <div className="relative inline-block">
              <FaRocket className={`mx-auto ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} animate-bounce`} size={56} />
              <FaStar className={`absolute -top-2 -right-2 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} animate-pulse`} size={16} />
            </div>
          </div>
          <h1 className={`text-5xl font-bold mb-6 bg-gradient-to-r ${theme === 'dark' ? 'from-blue-400 via-purple-400 to-blue-400' : 'from-blue-600 via-purple-600 to-blue-600'} bg-clip-text text-transparent`}>
            Welcome to TeamLabs!
          </h1>
          <p className={`text-2xl mb-6 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>
            You're all set up as an Admin
          </p>
          <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}>
            Let's get your workspace organized and start collaborating with your team. Choose an action below to get started, or explore our features to see what TeamLabs can do for you.
          </p>
          
          {/* Decorative Elements */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'} animate-pulse`}></div>
            <div className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'} animate-pulse`} style={{ animationDelay: '0.5s' }}></div>
            <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-green-400' : 'bg-green-500'} animate-pulse`} style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {actionCards.map((card, index) => (
          <div
            key={card.id}
            className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-102 hover:-translate-y-2 ${
              theme === 'dark' 
                ? `bg-gradient-to-br ${card.darkGradient} border-gray-700 hover:border-gray-600` 
                : `bg-gradient-to-br ${card.gradient} border-gray-200 hover:border-gray-300`
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Card Background Pattern */}
            <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
              <div className="absolute top-4 right-4 w-16 h-16 bg-current rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-current rounded-full blur-xl"></div>
            </div>
            
            <div className="relative">
              {/* Icon Container */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/70'} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} group-hover:text-opacity-90 transition-all duration-300`}>
                {card.title}
              </h3>
              
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                {card.description}
              </p>
              
              {/* Features List */}
              <ul className={`space-y-2 mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {card.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="text-sm flex items-center gap-3 group-hover:text-opacity-80 transition-all duration-300">
                    <FaCheckCircle className="text-green-500 flex-shrink-0" size={12} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={card.action}
                className={`w-full py-3 px-6 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${card.buttonColor} shadow-md`}
              >
                <span className="flex items-center justify-center gap-2">
                  {card.buttonText}
                  <FaArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
            
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        ))}
      </div>
      {/* Modals */}
      <AddTeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onAddTeam={handleCreateTeam}
      />
      
      <AddProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onAddProject={handleCreateProject}
        organizationId={userDetails?.organizationID}
        projectOwner={userDetails?._id}
      />
    </div>
  );
};

export default AdminWelcomeMessage;
