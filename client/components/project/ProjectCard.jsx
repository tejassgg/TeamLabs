import { useRouter } from 'next/router';
import { FaFolder, FaCalendarAlt, FaChevronRight, FaGithub, FaClock, FaUsers, FaClipboardList, FaChartLine } from 'react-icons/fa';
import { getProjectStatusStyle } from './ProjectStatusBadge';
import { getDeadlineStatus, calculateDeadlineText } from '../shared/DeadlineStatusBadge';

const ProjectCard = ({ project, theme }) => {
  const router = useRouter();
  const getThemeClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  const handleCardClick = () => {
    router.push(`/project/${project.ProjectID || project._id}`);
  };

  const progress = project.progress || 0;

  // Get project status text based on ProjectStatusID
  const getStatusText = (statusId) => {
    const statusMap = {
      1: 'Not Assigned',
      2: 'Assigned',
      3: 'In Progress',
      4: 'QA',
      5: 'Deployment',
      6: 'Completed'
    };
    return statusMap[statusId] || 'Unknown';
  };

  // Calculate deadline text using system logic
  const deadlineText = calculateDeadlineText(project.FinishDate);

  // Get team type text based on TeamType
  const getTeamTypeText = (teamType) => {
    const typeMap = {
      1: 'Development',
      2: 'Design',
      3: 'Marketing',
      4: 'Sales',
      5: 'Support',
      6: 'Management'
    };
    return typeMap[teamType] || 'General';
  };

  // Get team type color based on TeamType
  const getTeamTypeColor = (teamType) => {
    const colorMap = {
      1: 'bg-blue-100 text-blue-800 border-blue-200', // Development
      2: 'bg-green-100 text-green-800 border-green-200', // Design
      3: 'bg-purple-100 text-purple-800 border-purple-200', // Marketing
      4: 'bg-yellow-100 text-yellow-800 border-yellow-200', // Sales
      5: 'bg-red-100 text-red-800 border-red-200', // Support
      6: 'bg-indigo-100 text-indigo-800 border-indigo-200' // Management
    };
    return colorMap[teamType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTeamTypeColorDark = (teamType) => {
    const colorMap = {
      1: 'bg-blue-900/30 text-blue-300 border-blue-600', // Development
      2: 'bg-green-900/30 text-green-300 border-green-600', // Design
      3: 'bg-purple-900/30 text-purple-300 border-purple-600', // Marketing
      4: 'bg-yellow-900/30 text-yellow-300 border-yellow-600', // Sales
      5: 'bg-red-900/30 text-red-300 border-red-600', // Support
      6: 'bg-indigo-900/30 text-indigo-300 border-indigo-600' // Management
    };
    return colorMap[teamType] || 'bg-gray-900/30 text-gray-300 border-gray-600';
  };

  return (
    <div
      className={getThemeClasses(
        'bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-full',
        'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-full'
      )}
      onClick={handleCardClick}
    >
      {/* Project Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Project Name and Description */}
        <div>
          <h3 className={getThemeClasses(
            'text-lg font-semibold text-gray-900',
            'text-lg font-semibold text-white'
          )}>
            {project.Name}
          </h3>
          <p className={getThemeClasses(
            'text-sm text-gray-600',
            'text-sm text-gray-400'
          )}>
            {project.Description.slice(0, 40) + '...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Project Status Badge and Days Left Badge */}
          <div className="flex flex-col items-center gap-2">
            {/* Project Status Badge */}
            {(() => {
              const statusStyle = getProjectStatusStyle(project.ProjectStatusID);
              const StatusIcon = statusStyle.icon;

              return (
                <span className={getThemeClasses(
                  `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.bgColor} ${statusStyle.textColor} ${statusStyle.borderColor}`,
                  `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.bgColor.replace('50', '900/30').replace('100', '900/30')} ${statusStyle.textColor.replace('700', '300')} ${statusStyle.borderColor.replace('200', '600')}`
                )}>
                  <StatusIcon className={getThemeClasses(statusStyle.iconColor, statusStyle.iconColor.replace('500', '400'))} size={10} />
                  {getStatusText(project.ProjectStatusID)}
                </span>
              );
            })()}
          </div>
          <FaChevronRight className={getThemeClasses('text-gray-400', 'text-gray-500')} size={14} />
        </div>
      </div>

      {/* Project Stats - Rectangular Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Tasks Card */}
        <div className={ getThemeClasses(
          'flex items-center justify-between gap-2  bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-all duration-200',
          'flex items-center justify-between gap-2 bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-700/50 rounded-lg p-3 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200'
        )}>
          <div className="flex flex-col items-start gap-2 mb-1">
            <div className={getThemeClasses(
              'p-1.5 bg-purple-500 rounded-md',
              'p-1.5 bg-purple-400 rounded-md'
            )}>
              <FaClipboardList className="text-white" size={12} />
            </div>
            <span className={getThemeClasses(
              'text-xs font-medium text-purple-700',
              'text-xs font-medium text-purple-300'
            )}>
              Tasks
            </span>
          </div>
          <div className={getThemeClasses(
            'text-xl font-bold text-purple-900',
            'text-xl font-bold text-purple-100'
          )}>
            {project.tasksCount || 0}
          </div>
        </div>

        {/* Members Card */}
        <div className={getThemeClasses(
          'flex items-center justify-between gap-2 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-all duration-200',
          'flex items-center justify-between gap-2 bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-lg p-3 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200'
        )}>
          <div className="flex flex-col items-start gap-2 mb-1">
            <div className={getThemeClasses(
              'p-1.5 bg-blue-500 rounded-md',
              'p-1.5 bg-blue-400 rounded-md'
            )}>
              <FaUsers className="text-white" size={12} />
            </div>
            <span className={getThemeClasses(
              'text-xs font-medium text-blue-700',
              'text-xs font-medium text-blue-300'
            )}>
              Members
            </span>
          </div>
          <div className={getThemeClasses(
            'ml-2 text-xl font-bold text-blue-900',
            'ml-2 text-xl font-bold text-blue-100'
          )}>
            {project.membersCount || 0}
          </div>
        </div>

        {/* Progress Card */}
        <div className={getThemeClasses(
          'flex items-center justify-between gap-2 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all duration-200',
          'flex items-center justify-between gap-2 bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-700/50 rounded-lg p-3 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-200'
        )}>
          <div className="flex flex-col items-start gap-2 mb-1">
            <div className={getThemeClasses(
              'p-1.5 bg-green-500 rounded-md',
              'p-1.5 bg-green-400 rounded-md'
            )}>
              <FaChartLine className="text-white" size={12} />
            </div>
            <span className={getThemeClasses(
              'text-xs font-medium text-green-700',
              'text-xs font-medium text-green-300'
            )}>
              Progress
            </span>
          </div>
          <div className={getThemeClasses(
            'text-xl font-bold text-green-900',
            'text-xl font-bold text-green-100'
          )}>
            {progress}%
          </div>
        </div>
      </div>

      {/* Assigned Teams */}
      {project.teams && project.teams.length > 0 && (
        <div className="mb-6">
          <div className={getThemeClasses(
            'text-sm font-medium text-gray-700 mb-3',
            'text-sm font-medium text-gray-300 mb-3'
          )}>
            Assigned Teams ({project.teams.length})
          </div>

          {/* Compact Team List */}
          <div className="space-y-1">
            {project.teams.slice(0, 3).map((team) => (
              <div key={team.TeamID} className={getThemeClasses(
                'group flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 transition-colors duration-150',
                'group flex items-center justify-between p-2 rounded-xl hover:bg-gray-700/50 transition-colors duration-150'
              )}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={getThemeClasses(
                    'w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0',
                    'w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0'
                  )}></div>
                  <div className="flex-1 min-w-0">
                    <div className={getThemeClasses(
                      'text-sm font-medium text-gray-900 truncate',
                      'text-sm font-medium text-white truncate'
                    )}>
                      {team.Name}
                    </div>
                    {team.Description && (
                      <div className={getThemeClasses(
                        'text-xs text-gray-600 truncate',
                        'text-xs text-gray-400 truncate'
                      )}>
                        {team.Description}
                      </div>
                    )}
                  </div>
                </div>
                <span className={getThemeClasses(
                  `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTeamTypeColor(team.TeamType)}`,
                  `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTeamTypeColorDark(team.TeamType)}`
                )}>
                  <FaUsers size={8} />
                  {getTeamTypeText(team.TeamType)}
                </span>
              </div>
            ))}

            {/* Additional Teams Indicator */}
            {project.teams.length > 3 && (
              <div className={getThemeClasses(
                'flex items-center justify-center gap-2 p-2 rounded-md bg-gray-50/50',
                'flex items-center justify-center gap-2 p-2 rounded-md bg-gray-800/30'
              )}>
                <span className={getThemeClasses(
                  'text-xs text-gray-500',
                  'text-xs text-gray-400'
                )}>
                  +{project.teams.length - 3} more teams
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: Progress Bar and Created Date */}
      <div className="space-y-3 mt-auto">
        {/* Progress Bar */}
        <div>
          <div className={getThemeClasses(
            'w-full bg-gray-200 rounded-full h-2',
            'w-full bg-gray-700 rounded-full h-2'
          )}>
            <div
              className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-green-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Created Date and GitHub Repository */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className={getThemeClasses('text-gray-400', 'text-gray-500')} size={12} />
            <span className={getThemeClasses(
              'text-sm text-gray-600',
              'text-sm text-gray-400'
            )}>
              Created {project.CreatedDate ? new Date(project.CreatedDate).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {project.githubRepository?.connected && (
              <div className={getThemeClasses(
                'flex items-center gap-1 text-sm text-gray-900',
                'flex items-center gap-1 text-sm text-gray-100'
              )}>
                <FaGithub size={10} />
                <span>
                  {project.githubRepository?.repositoryName || 'GitHub'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
