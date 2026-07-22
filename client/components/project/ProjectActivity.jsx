import React, { useEffect, useState } from 'react';
import { FaSpinner, FaUserCircle, FaInfoCircle, FaTasks, FaProjectDiagram, FaCheckCircle, FaCommentDots, FaUsers, FaCog, FaExclamationTriangle, FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaFileAlt, FaFileArchive, FaFileCsv, FaFileCode } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';

const typeIconMap = {
  'login': <FaUserCircle className="text-blue-400" />, 'logout': <FaUserCircle className="text-gray-400" />, 'profile_update': <FaCog className="text-blue-400" />, 'team_create': <FaUsers className="text-green-500" />, 'team_update': <FaUsers className="text-yellow-500" />, 'team_delete': <FaUsers className="text-red-500" />, 'team_join': <FaUsers className="text-green-400" />, 'team_leave': <FaUsers className="text-red-400" />, 'project_create': <FaProjectDiagram className="text-purple-500" />, 'project_update': <FaProjectDiagram className="text-yellow-500" />, 'project_delete': <FaProjectDiagram className="text-red-500" />, 'project_settings_update': <FaCog className="text-blue-400" />, 'task_create': <FaTasks className="text-blue-500" />, 'task_update': <FaTasks className="text-yellow-500" />, 'task_delete': <FaTasks className="text-red-500" />, 'task_complete': <FaCheckCircle className="text-green-500" />, 'task_assign': <FaTasks className="text-blue-400" />, 'user_story_create': <FaTasks className="text-blue-400" />, 'user_story_update': <FaTasks className="text-yellow-400" />, 'user_story_delete': <FaTasks className="text-red-400" />, 'comment_added': <FaCommentDots className="text-blue-400" />, 'comment_updated': <FaCommentDots className="text-yellow-400" />, 'comment_deleted': <FaCommentDots className="text-red-400" />, 'error': <FaExclamationTriangle className="text-red-500" />, 'project_team_add': <FaUsers className="text-blue-400" />, 'repository_linked': <FaProjectDiagram className="text-green-400" />, 'repository_unlinked': <FaProjectDiagram className="text-red-400" />
};

function formatDay(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  // Use short weekday (Mon, Tue, etc.)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) return <FaFileImage className="text-blue-400" />;
  if (["pdf"].includes(ext)) return <FaFilePdf className="text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FaFileWord className="text-blue-600" />;
  if (["xls", "xlsx"].includes(ext)) return <FaFileExcel className="text-green-600" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FaFileArchive className="text-yellow-600" />;
  if (["csv"].includes(ext)) return <FaFileCsv className="text-green-500" />;
  if (["txt", "md", "rtf"].includes(ext)) return <FaFileAlt className="text-gray-500" />;
  if (["js", "ts", "json", "xml", "html", "css", "jsx", "tsx"].includes(ext)) return <FaFileCode className="text-purple-500" />;
  return <FaFile className="text-gray-400" />;
}

const ProjectActivity = ({ projectId, activity, projectCreatedDate, hasMore = false, onLoadMore = () => { }, loadingMore = false }) => {
  const { theme } = useTheme();
  const { formatFileSize } = useGlobal();
  const [activities, setActivities] = useState(activity || []);
  const [loading, setLoading] = useState(!activity);
  const [error, setError] = useState(null);

  // Sync activities state with activity prop when it changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setActivities(activity || []);
    setLoading(!activity);
  }, [projectId, activity]);

  // Group activities by day
  const grouped = activities.reduce((acc, act) => {
    const date = new Date(act.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(act);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className={"relative px-2 py-6 relative px-2 py-6"}>
      <h2 className={"text-2xl font-bold mb-8 text-gray-900 text-2xl font-bold mb-8 dark:text-gray-100"}>Latest Activity</h2>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className={"animate-spin text-blue-500 animate-spin text-blue-400"} size={32} />
        </div>
      ) : error ? (
        <div className={"text-center text-red-500 py-8 text-center text-red-400 py-8"}>{error}</div>
      ) : days.length === 0 ? (
        <div className={"text-center text-gray-400 py-8 flex flex-col items-center text-center text-gray-500 py-8 flex flex-col items-center"}>
          <FaInfoCircle size={32} className="mb-2" />
          No activity yet for this project.
        </div>
      ) : (
        <>
          {/* Mobile list view */}
          <div className="md:hidden">
            <div className="space-y-6">
              {days.map((date) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={"text-sm font-semibold text-gray-700 text-sm font-semibold text-gray-200"}>{formatDay(date)}</span>
                    <div className={"h-px flex-1 ml-3 bg-gray-200 h-px flex-1 ml-3 bg-gray-700"} />
                  </div>
                  <div className="space-y-3">
                    {grouped[date].map((act, j) => (
                      <MobileActivityRow key={j} act={act} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className={"px-2 py-1 text-xs font-medium border border-gray-200 hover:border-blue-500 bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-dark-bg dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-blue-400"}
                >
                  {loadingMore && <FaSpinner className="animate-spin text-blue-500" />}
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>

          {/* Desktop timeline view */}
          <div className="hidden md:block">
            <div className="relative mx-auto max-w-5xl">
              <div className="relative">
                {/* Vertical timeline line */}
                <div className={"absolute left-1/2 top-0 w-1 h-full bg-gradient-to-b from-gray-200 via-blue-200 to-gray-200 rounded-full -translate-x-1/2 z-0 absolute left-1/2 top-0 w-1 h-full bg-gradient-to-b from-gray-800 via-blue-900 to-gray-800 rounded-full -translate-x-1/2 z-0"} />
                {days.map((date, i) => (
                  <div key={date} className="mb-4 flex w-full min-h-[120px] relative items-center">
                    {/* Centered day/date label */}
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center w-48">
                      <span className={"text-sm px-4 py-1 rounded-full shadow font-semibold text-base border " + "bg-white text-gray-700 border-gray-200 bg-[#23272F] text-gray-100 border-gray-700 shadow-none"}>{formatDay(date)}</span>
                    </div>
                    {/* Timeline sides */}
                    {i % 2 === 0 ? (
                      <>
                        {/* Left side */}
                        <div className="w-1/2 pr-8 flex flex-col items-end">
                          <div className="min-w-[600px] max-w-5xl border-t border-gray-200 dark:border-gray-700">
                            {/* Big card for the day */}
                            <div className={"px-6 py-4 " + " space-y-6"}>
                              {grouped[date].map((act, j) => (
                                <ActivityRow key={j} act={act} theme={theme} align="right" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="w-1/2" />
                      </>
                    ) : (
                      <>
                        <div className="w-1/2" />
                        {/* Right side */}
                        <div className="w-1/2 pl-8 flex flex-col items-start">
                          <div className="min-w-[600px] max-w-5xl border-t">
                            {/* Big card for the day */}
                            <div className={"px-6 py-4 " + " space-y-6"}>
                              {grouped[date].map((act, j) => (
                                <ActivityRow key={j} act={act} theme={theme} align="left" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {hasMore && (
                  <div className="flex justify-center my-6 relative z-10">
                    <button
                      onClick={onLoadMore}
                      disabled={loadingMore}
                      className={"px-2 py-1 text-xs font-medium border border-gray-200 hover:border-blue-500 bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-dark-bg dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-blue-400"}
                    >
                      {loadingMore && <FaSpinner className="animate-spin text-blue-500" />}
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
                {/* Project Created Date at the end of the timeline */}
                {projectCreatedDate && (
                  <div className="flex w-full justify-center items-center mt-8">
                    <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center w-96">
                      <span className={"px-4 py-1 rounded-full shadow font-semibold text-base border " + "bg-white text-gray-500 border-gray-200 bg-[#23272F] text-gray-400 border-gray-700 shadow-none"}>Project Created: {new Date(projectCreatedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function ActivityRow({ act, theme, align }) {
  const { formatFileSize } = useGlobal();
  // Helper to render details with task name as link if present
  const renderDetailsWithTaskLink = () => {
    if (act.metadata && act.metadata.taskId && act.details) {
      // Look for quoted task name in details
      const match = act.details.match(/"([^"]+)"/);
      if (match) {
        const before = act.details.slice(0, match.index);
        const taskName = match[1];
        const after = act.details.slice(match.index + match[0].length);
        return <>
          {before}
          <a
            href={`/task/${act.metadata.taskId}`}
            className={"text-blue-600 hover:underline font-semibold dark:text-blue-400 hover:underline font-semibold"}
            target="_blank"
            rel="noopener noreferrer"
          >
            {taskName}
          </a>
          {after}
        </>;
      }
    }
    return act.details;
  };

  // Helper to render details with project name as link if present
  const renderDetailsWithProjectLink = () => {
    if (act.metadata && act.metadata.projectId && act.details) {
      // Look for quoted project name in details
      const match = act.details.match(/"([^"]+)"/);
      if (match) {
        const before = act.details.slice(0, match.index);
        const projectName = match[1];
        const after = act.details.slice(match.index + match[0].length);
        return <>
          {before}
          <a
            href={`/project/${act.metadata.projectId}`}
            className={"text-purple-600 hover:underline font-semibold dark:text-purple-400 hover:underline font-semibold"}
            target="_blank"
            rel="noopener noreferrer"
          >
            {projectName}
          </a>
          {after}
        </>;
      }
    }
    return act.details;
  };

  // Helper to render details with appropriate link based on activity type
  const renderDetailsWithLink = () => {
    // Check if it's a project-related activity
    const projectRelatedTypes = ['project_create', 'project_update', 'project_delete', 'project_settings_update', 'project_team_add'];
    if (projectRelatedTypes.includes(act.type) && act.metadata?.projectId) {
      return renderDetailsWithProjectLink();
    }
    // Check if it's a task-related activity
    const taskRelatedTypes = ['task_create', 'task_update', 'task_delete', 'task_complete', 'task_assign', 'user_story_create', 'user_story_update', 'user_story_delete'];
    if (taskRelatedTypes.includes(act.type) && act.metadata?.taskId) {
      return renderDetailsWithTaskLink();
    }
    // Default to regular details
    return act.details;
  };
  // Second row content
  let secondRow = null;
  if (act.type === 'comment_added' && act.metadata && act.metadata.comment) {
    secondRow = (
      <div className={"text-gray-700 text-sm mt-1 dark:text-gray-200 text-sm mt-1"}>
        {act.metadata.comment}
      </div>
    );
  } else if (act.type === 'attachment_added' && act.metadata && act.metadata.fileName) {
    secondRow = (
      <div className="flex items-center gap-2 mt-1">
        {getFileIcon(act.metadata.fileName)}
        <a
          href={act.metadata.fileUrl}
          className={"text-blue-600 hover:underline font-medium dark:text-blue-400 hover:underline font-medium"}
          target="_blank"
          rel="noopener noreferrer"
        >
          {act.metadata.fileName}
        </a>
        <span className={"text-xs text-gray-400 ml-2 text-xs text-gray-500 ml-2"}>{formatFileSize(act.metadata.fileSize)}</span>
      </div>
    );
  }
  // Layout for left and right
  if (align === 'left') {
    return (
      <div className="flex items-start gap-4 w-full">
        <span className={"text-xs text-gray-400 text-right  text-xs text-gray-500 text-right"}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {/* Details and time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-between gap-2">
            {/* Image */}
            <div className="flex-shrink-0">
              {act.user?.profileImage ? (
                <img src={act.user.profileImage} alt="avatar" className={"w-8 h-8 rounded-full object-cover border border-gray-200 w-8 h-8 rounded-full object-cover border border-gray-700"} />
              ) : (
                <div className={"w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-lg"}>
                  {(act.user?.firstName && act.user?.lastName) ? act.user.firstName[0] + act.user.lastName[0] : 'UN'}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className={"text-sm text-gray-900 font-medium text-base dark:text-gray-100 font-medium text-base w-[90%]"}>{renderDetailsWithLink()}</div>
              {secondRow}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // align === 'right'
    return (
      <div className="flex items-center gap-2 w-full ">
        {/* Image */}
        <div className="flex-shrink-0">
          {act.user?.profileImage ? (
            <img src={act.user.profileImage} alt="avatar" className={"w-8 h-8 rounded-full object-cover border border-gray-200 w-8 h-8 rounded-full object-cover border border-gray-700"} />
          ) : (
            <div className={"w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-lg"}>
              {(act.user?.firstName && act.user?.lastName) ? act.user.firstName[0] + act.user.lastName[0] : 'UN'}
            </div>
          )}
        </div>
        {/* Details and time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-between gap-2">
            <div className="flex flex-col">
              <div className={"text-sm text-gray-900 font-medium text-base dark:text-gray-100 font-medium text-base w-[90%]"}>{renderDetailsWithLink()}</div>
              {secondRow}
            </div>
            <span className={"text-xs text-gray-400 text-right whitespace-nowrap text-xs text-gray-500 text-right whitespace-nowrap "}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    );
  }
}

export default ProjectActivity;

// Mobile-friendly compact activity row
function MobileActivityRow({ act }) {
  const { formatFileSize } = useGlobal();
  const timeText = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderDetailsWithTaskLink = () => {
    if (act.metadata && act.metadata.taskId && act.details) {
      const match = act.details.match(/"([^"]+)"/);
      if (match) {
        const before = act.details.slice(0, match.index);
        const taskName = match[1];
        const after = act.details.slice(match.index + match[0].length);
        return (
          <>
            {before}
            <a
              href={`/task/${act.metadata.taskId}`}
              className={"text-blue-600 hover:underline font-semibold dark:text-blue-400 hover:underline font-semibold"}
              target="_blank"
              rel="noopener noreferrer"
            >
              {taskName}
            </a>
            {after}
          </>
        );
      }
    }
    return act.details;
  };

  const renderDetailsWithProjectLink = () => {
    if (act.metadata && act.metadata.projectId && act.details) {
      const match = act.details.match(/"([^"]+)"/);
      if (match) {
        const before = act.details.slice(0, match.index);
        const projectName = match[1];
        const after = act.details.slice(match.index + match[0].length);
        return (
          <>
            {before}
            <a
              href={`/project/${act.metadata.projectId}`}
              className={"text-purple-600 hover:underline font-semibold dark:text-purple-400 hover:underline font-semibold"}
              target="_blank"
              rel="noopener noreferrer"
            >
              {projectName}
            </a>
            {after}
          </>
        );
      }
    }
    return act.details;
  };

  const renderDetailsWithLink = () => {
    // Check if it's a project-related activity
    const projectRelatedTypes = ['project_create', 'project_update', 'project_delete', 'project_settings_update', 'project_team_add'];
    if (projectRelatedTypes.includes(act.type) && act.metadata?.projectId) {
      return renderDetailsWithProjectLink();
    }
    // Check if it's a task-related activity
    const taskRelatedTypes = ['task_create', 'task_update', 'task_delete', 'task_complete', 'task_assign', 'user_story_create', 'user_story_update', 'user_story_delete'];
    if (taskRelatedTypes.includes(act.type) && act.metadata?.taskId) {
      return renderDetailsWithTaskLink();
    }
    // Default to regular details
    return act.details;
  };

  let secondRow = null;
  if (act.type === 'comment_added' && act.metadata && act.metadata.comment) {
    secondRow = (
      <div className={"text-gray-700 text-xs mt-1 dark:text-gray-200 text-xs mt-1"}>
        {act.metadata.comment}
      </div>
    );
  } else if (act.type === 'attachment_added' && act.metadata && act.metadata.fileName) {
    secondRow = (
      <div className="flex items-center gap-2 mt-1">
        {getFileIcon(act.metadata.fileName)}
        <a
          href={act.metadata.fileUrl}
          className={"text-blue-600 hover:underline font-medium text-xs dark:text-blue-400 hover:underline font-medium text-xs"}
          target="_blank"
          rel="noopener noreferrer"
        >
          {act.metadata.fileName}
        </a>
        {typeof act.metadata.fileSize === 'number' && (
          <span className={"text-xs text-gray-400 text-xs text-gray-500"}>{formatFileSize(act.metadata.fileSize)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={"p-3 rounded-xl border flex items-start gap-3 " + "bg-white border-gray-200 bg-dark-bg border-zinc-800/80"}>
      <div className="flex-shrink-0">
        {act.user?.profileImage ? (
          <img src={act.user.profileImage} alt="avatar" className={"w-10 h-10 rounded-full object-cover border border-gray-200 w-10 h-10 rounded-full object-cover border border-gray-700"} />
        ) : (
          <div className={"w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold"}>
            {(act.user?.firstName && act.user?.lastName) ? act.user.firstName[0] + act.user.lastName[0] : 'UN'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={"text-gray-900 text-sm text-gray-100 text-sm"}>{renderDetailsWithLink()}</div>
        {secondRow}
        <div className={"text-xs text-gray-500 mt-1 text-xs text-gray-400 mt-1"}>{timeText}</div>
      </div>
    </div>
  );
}