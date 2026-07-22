import { useRouter } from 'next/router';
import { FaUsers, FaCalendarAlt, FaChevronRight, FaProjectDiagram, FaRegHandshake } from 'react-icons/fa';
import { getProjectStatusStyle } from '../project/ProjectStatusBadge';
import { getTaskStatusLabel } from '../task/TaskTypeBadge';
import StatusPill from '../shared/StatusPill';
import { teamService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useGlobal } from '../../context/GlobalContext';
import { useState } from 'react';

const TeamCard = ({ team, theme, onRequestSent }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { userDetails, getInitials, getAvatarColor } = useGlobal();
  const [isRequesting, setIsRequesting] = useState(false);


  const handleCardClick = () => {
    router.push(`/team/${team.TeamID}`);
  };

  const handleRequestToJoin = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click
    setIsRequesting(true);

    try {
      await teamService.requestToJoinTeam(team.TeamID, userDetails._id);
      showToast('Join request sent successfully!', 'success');
      if (onRequestSent) {
        onRequestSent(team.TeamID);
      }
    } catch (error) {
      console.error('Error requesting to join team:', error);
      showToast(error.message || 'Failed to send join request', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  // Get team type color based on TeamType
  const getTeamTypeColor = (teamType) => {
    const colorMap = {
      1: 'bg-blue-100 text-primary border-blue-200', // Development
      2: 'bg-green-100 text-green-800 border-green-200', // Quality Analysis
      3: 'bg-purple-100 text-purple-800 border-purple-200', // Code Verification
      4: 'bg-amber-100 text-amber-800 border-amber-200', // Deployment
      5: 'bg-cyan-100 text-cyan-800 border-cyan-200', // Service Integration
      6: 'bg-indigo-100 text-indigo-800 border-indigo-200', // InHouse
      7: 'bg-red-100 text-red-800 border-red-200' // Support
    };
    return colorMap[teamType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTeamTypeColorDark = (teamType) => {
    const colorMap = {
      1: 'bg-blue-900/30 text-blue-300 border-blue-600', // Development
      2: 'bg-green-900/30 text-green-300 border-green-600', // Quality Analysis
      3: 'bg-purple-900/30 text-purple-300 border-purple-600', // Code Verification
      4: 'bg-amber-900/30 text-amber-300 border-amber-600', // Deployment
      5: 'bg-cyan-900/30 text-cyan-300 border-cyan-600', // Service Integration
      6: 'bg-indigo-900/30 text-indigo-300 border-indigo-600', // InHouse
      7: 'bg-red-900/30 text-red-300 border-red-600' // Support
    };
    return colorMap[teamType] || 'bg-gray-900/30 text-gray-300 border-gray-600';
  };

  // Get team type text based on TeamType
  const getTeamTypeText = (teamType) => {
    const typeMap = {
      1: 'Development',
      2: 'Quality Analysis',
      3: 'Code Verification',
      4: 'Deployment',
      5: 'Service Integration',
      6: 'InHouse',
      7: 'Support'
    };
    return typeMap[teamType] || 'General';
  };

  // Get project status text based on ProjectStatusID
  const getProjectStatusText = (statusId) => {
    return getTaskStatusLabel(statusId);
  };


  return (
    <div
      className="bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl px-6 pt-6 pb-3 cursor-pointer hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between">
        {/* Team Name and Description */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {team.TeamName}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Team Type Badge and Active Status */}
          <div className="flex items-center gap-2">
            {/* Active Status Pill */}
            <StatusPill status={team.IsActive ? 'Active' : 'InActive'} theme={theme} showPulseOnActive />

            {/* Team Type Badge */}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${theme === 'dark' ? getTeamTypeColorDark(team.TeamType) : getTeamTypeColor(team.TeamType)}`}>
              <FaProjectDiagram size={10} />
              {getTeamTypeText(team.TeamType)}
            </span>
          </div>
          <FaChevronRight className="text-gray-400 dark:text-gray-500" size={14} />
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {team.TeamDescription || 'No description available'}
      </p>

      {/* Team Projects */}
      {team.projects && team.projects.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Active Projects ({team.projects.length})
          </div>

          {/* Compact Project List */}
          <div className="space-y-1">
            {team.projects.slice(0, 3).map((project) => {
              const statusStyle = getProjectStatusStyle(project.ProjectStatusID);
              const StatusIcon = statusStyle.icon;

              return (
                <div key={project.ProjectID} className="group flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-hover/50 transition-colors duration-150">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {project.Name}
                      </div>
                      {project.Description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {project.Description}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusStyle.bgColor} ${statusStyle.textColor} ${statusStyle.borderColor}`}>
                    <StatusIcon className={statusStyle.iconColor} size={8} />
                    {getProjectStatusText(project.ProjectStatusID)}
                  </span>
                </div>
              );
            })}

            {/* Additional Projects Indicator */}
            {team.projects.length > 3 && (
              <div className="pb-2 rounded-md bg-gray-50/50 dark:bg-gray-800/30">
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  +{team.projects.length - 3} more projects
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: Created Date and Navigation */}
      <div className="mt-auto">
        {/* Team Members and Created Date */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
          {team.members && team.members.length > 0 && (
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {team.members.slice(0, 4).map((member, index) => {
                  const initials = getInitials(member.firstName, member.lastName);
                  const avatarColor = getAvatarColor(member.firstName + member.lastName);

                  return (
                    <div
                      key={member._id}
                      className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-medium shadow-sm border-2 border-white dark:border-gray-800 relative z-${index + 1}`}
                      title={`${member.firstName} ${member.lastName}`}
                      style={{ zIndex: 10 - index }}
                    >
                      {initials}
                    </div>
                  );
                })}
                {team.members.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium shadow-sm border-2 border-white dark:border-gray-800">
                    +{team.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400 dark:text-gray-500" size={12} />
            <span className="text-xs text-gray-900 dark:text-gray-400">
              Created {team.CreatedDate ? new Date(team.CreatedDate).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>

        {/* Request to Join Button - Show for non-members */}
        {team.userRelationship && team.userRelationship.canRequestJoin && (
          <div
            className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleRequestToJoin}
              disabled={isRequesting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaRegHandshake size={16} />
              {isRequesting ? 'Sending...' : 'Request to Join'}
            </button>
          </div>
        )}

        {/* Pending Request Status */}
        {team.userRelationship && team.userRelationship.hasPendingRequest && (
          <div
            className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg border border-yellow-200 dark:border-yellow-600">
              <FaRegHandshake size={14} />
              Request Pending
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;
