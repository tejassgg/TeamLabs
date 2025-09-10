import { useRouter } from 'next/router';
import { FaUsers, FaCalendarAlt, FaChevronRight, FaUserPlus, FaProjectDiagram, FaFolder, FaFlag, FaTasks, FaClipboardList } from 'react-icons/fa';
import { getProjectStatusStyle } from '../project/ProjectStatusBadge';

const TeamCard = ({ team, theme }) => {
  const router = useRouter();
  const getThemeClasses = (lightClass, darkClass) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  const handleCardClick = () => {
    router.push(`/team/${team.TeamID}`);
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

  // Get project status text based on ProjectStatusID
  const getProjectStatusText = (statusId) => {
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

  // Generate initials from name
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  // Generate random color for avatar
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400',
      'bg-indigo-400', 'bg-yellow-400', 'bg-red-400', 'bg-teal-400'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div
      className={getThemeClasses(
        'bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-full',
        'bg-transparent border border-gray-700 hover:bg-gray-800/30 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-full'
      )}
      onClick={handleCardClick}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Team Name and Description */}
          <div>
            <h3 className={getThemeClasses(
              'text-lg font-semibold text-gray-900',
              'text-lg font-semibold text-white'
            )}>
              {team.TeamName}
            </h3>
            <p className={getThemeClasses(
              'text-sm text-gray-600',
              'text-sm text-gray-400'
            )}>
              {team.TeamDescription || 'No description available'}
            </p>
          </div>
          {/* Team Type Badge and Active Status */}
          <div className="flex items-center gap-2">
            {/* Active Status Badge */}
            <span className={getThemeClasses(
              `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${team.IsActive
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`,
              `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${team.IsActive
                ? 'bg-green-900/30 text-green-300 border border-green-600'
                : 'bg-gray-900/30 text-gray-400 border border-gray-600'
              }`
            )}>
              <div className={getThemeClasses(
                `w-2 h-2 rounded-full ${team.IsActive ? 'bg-green-500' : 'bg-gray-400'}`,
                `w-2 h-2 rounded-full ${team.IsActive ? 'bg-green-400' : 'bg-gray-500'}`
              )}></div>
              {team.IsActive ? 'Active' : 'Inactive'}
            </span>

            {/* Team Type Badge */}
            <span className={getThemeClasses(
              `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getTeamTypeColor(team.TeamType)}`,
              `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getTeamTypeColorDark(team.TeamType)}`
            )}>
              <FaProjectDiagram size={10} />
              {getTeamTypeText(team.TeamType)}
            </span>
          </div>
        </div>
        <FaChevronRight className={getThemeClasses('text-gray-400', 'text-gray-500')} size={14} />
      </div>

      {/* Team Stats - Rectangular Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Members Card */}
        <div className={getThemeClasses(
          'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-all duration-200',
          'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-lg p-3 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200'
        )}>
          <div className="flex items-center gap-2 mb-1">
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
            'text-xl font-bold text-blue-900',
            'text-xl font-bold text-blue-100'
          )}>
            {team.membersCount || 0}
          </div>
        </div>

        {/* Projects Card */}
        <div className={getThemeClasses(
          'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all duration-200',
          'bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-700/50 rounded-lg p-3 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-200'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <div className={getThemeClasses(
              'p-1.5 bg-green-500 rounded-md',
              'p-1.5 bg-green-400 rounded-md'
            )}>
              <FaFolder className="text-white" size={12} />
            </div>
            <span className={getThemeClasses(
              'text-xs font-medium text-green-700',
              'text-xs font-medium text-green-300'
            )}>
              Projects
            </span>
          </div>
          <div className={getThemeClasses(
            'text-xl font-bold text-green-900',
            'text-xl font-bold text-green-100'
          )}>
            {team.projectsCount || 0}
          </div>
        </div>

        {/* Tasks Card */}
        <div className={getThemeClasses(
          'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-all duration-200',
          'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-700/50 rounded-lg p-3 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200'
        )}>
          <div className="flex items-center gap-2 mb-1">
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
            {team.tasksCount || 0}
          </div>
        </div>
      </div>

      {/* Team Projects */}
      {team.projects && team.projects.length > 0 && (
        <div className="mb-6">
          <div className={getThemeClasses(
            'text-sm font-medium text-gray-700 mb-3',
            'text-sm font-medium text-gray-300 mb-3'
          )}>
            Active Projects ({team.projects.length})
          </div>

          {/* Compact Project List */}
          <div className="space-y-1">
            {team.projects.slice(0, 3).map((project) => {
              const statusStyle = getProjectStatusStyle(project.ProjectStatusID);
              const StatusIcon = statusStyle.icon;

              return (
                <div key={project.ProjectID} className={getThemeClasses(
                  'group flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 transition-colors duration-150',
                  'group flex items-center justify-between p-2 rounded-xl hover:bg-gray-700/50 transition-colors duration-150'
                )}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={getThemeClasses(
                      'w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0',
                      'w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0'
                    )}></div>
                    <div className="flex-1 min-w-0">
                      <div className={getThemeClasses(
                        'text-sm font-medium text-gray-900 truncate',
                        'text-sm font-medium text-white truncate'
                      )}>
                        {project.Name}
                      </div>
                      {project.Description && (
                        <div className={getThemeClasses(
                          'text-xs text-gray-600 truncate',
                          'text-xs text-gray-400 truncate'
                        )}>
                          {project.Description}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={getThemeClasses(
                    `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusStyle.bgColor} ${statusStyle.textColor} ${statusStyle.borderColor}`,
                    `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusStyle.bgColor.replace('50', '900/30').replace('100', '900/30')} ${statusStyle.textColor.replace('700', '300')} ${statusStyle.borderColor.replace('200', '600')}`
                  )}>
                    <StatusIcon className={getThemeClasses(statusStyle.iconColor, statusStyle.iconColor.replace('500', '400'))} size={8} />
                    {getProjectStatusText(project.ProjectStatusID)}
                  </span>
                </div>
              );
            })}

            {/* Additional Projects Indicator */}
            {team.projects.length > 3 && (
              <div className={'flex items-center justify-center gap-2 p-2 rounded-md' + getThemeClasses(
                'bg-gray-50/50',
                'bg-gray-800/30'
              )}>
                <span className={getThemeClasses(
                  'text-xs text-gray-500',
                  'text-xs text-gray-400'
                )}>
                  +{team.projects.length - 3} more projects
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: Created Date and Navigation */}
      <div className="space-y-3 mt-auto">
        {/* Team Members and Created Date */}
        <div className="flex items-center justify-between pt-2">
          {team.members && team.members.length > 0 && (
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {team.members.slice(0, 4).map((member, index) => {
                  const initials = getInitials(member.firstName, member.lastName);
                  const avatarColor = getAvatarColor(member.firstName + member.lastName);

                  return (
                    <div
                      key={member._id}
                      className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-medium shadow-sm border-2 ${getThemeClasses('border-white', 'border-gray-800')} relative z-${index + 1}`}
                      title={`${member.firstName} ${member.lastName}`}
                      style={{ zIndex: 10 - index }}
                    >
                      {initials}
                    </div>
                  );
                })}
                {team.members.length > 4 && (
                  <div className={getThemeClasses(
                    'w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium shadow-sm border-2 border-white',
                    'w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-medium shadow-sm border-2 border-gray-800'
                  )}>
                    +{team.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FaCalendarAlt className={getThemeClasses('text-gray-400', 'text-gray-500')} size={12} />
            <span className={getThemeClasses(
              'text-sm text-gray-600',
              'text-sm text-gray-400'
            )}>
              Created {team.CreatedDate ? new Date(team.CreatedDate).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
