import React, { useEffect, useState } from 'react';
import { FaSpinner, FaUserCircle, FaInfoCircle, FaTasks, FaProjectDiagram, FaCheckCircle, FaCommentDots, FaUsers, FaCog, FaExclamationTriangle, FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaFileAlt, FaFileArchive, FaFileCsv, FaFileCode } from 'react-icons/fa';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const getThemeClasses = (theme, light, dark) => theme === 'dark' ? `${light} ${dark}` : light;

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
function formatFileSize(size) {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const ProjectActivity = ({ projectId, activity, projectCreatedDate }) => {
    const { theme } = useTheme();
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
      <div className={getThemeClasses(theme, "relative px-2 py-6", "relative px-2 py-6")}> 
        <h2 className={getThemeClasses(theme, "text-2xl font-bold mb-8 text-gray-900", "dark:text-gray-100")}>Latest Activity</h2>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className={getThemeClasses(theme, "animate-spin text-blue-500", "animate-spin text-blue-400")} size={32} />
          </div>
        ) : error ? (
          <div className={getThemeClasses(theme, "text-center text-red-500 py-8", "text-center text-red-400 py-8")}>{error}</div>
        ) : days.length === 0 ? (
          <div className={getThemeClasses(theme, "text-center text-gray-400 py-8 flex flex-col items-center", "text-center text-gray-500 py-8 flex flex-col items-center")}> 
            <FaInfoCircle size={32} className="mb-2" />
            No activity yet for this project.
          </div>
        ) : (
          <div className="relative mx-auto max-w-5xl">
            <div className="relative">
              {/* Vertical timeline line */}
              <div className={getThemeClasses(theme, "absolute left-1/2 top-0 w-1 h-full bg-gradient-to-b from-gray-200 via-blue-200 to-gray-200 rounded-full -translate-x-1/2 z-0", "absolute left-1/2 top-0 w-1 h-full bg-gradient-to-b from-gray-800 via-blue-900 to-gray-800 rounded-full -translate-x-1/2 z-0")} />
              {days.map((date, i) => (
                <div key={date} className="mb-16 flex w-full min-h-[120px] relative items-center">
                  {/* Centered day/date label */}
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center w-48">
                    <span className={getThemeClasses(theme, "bg-white px-4 py-1 rounded-full shadow text-gray-700 font-semibold text-base border border-gray-200", "dark:bg-[#23272F] dark:text-gray-100 dark:border-gray-700 dark:shadow-lg")}>{formatDay(date)}</span>
                  </div>
                  {/* Timeline sides */}
                  {i % 2 === 0 ? (
                    <>
                      {/* Left side */}
                      <div className="w-1/2 pr-8 flex flex-col items-end">
                        <div className="min-w-[600px] max-w-5xl border-t">
                          {/* Big card for the day */}
                          <div className={getThemeClasses(theme, "px-6 py-4", "") + " space-y-6"}>
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
                          <div className={getThemeClasses(theme, "px-6 py-4", "") + " space-y-6"}>
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
              {/* Project Created Date at the end of the timeline */}
              {projectCreatedDate && (
                <div className="flex w-full justify-center items-center mt-8">
                  <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center w-64">
                    <span className={getThemeClasses(theme, "bg-white px-4 py-1 rounded-full shadow text-gray-500 font-semibold text-base border border-gray-200", "dark:bg-[#23272F] dark:text-gray-400 dark:border-gray-700 dark:shadow-lg")}>Project Created: {new Date(projectCreatedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
};

function ActivityRow({ act, theme, align }) {
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
                        className={getThemeClasses(
                            "text-blue-600 hover:underline font-semibold",
                            "dark:text-blue-400 hover:underline font-semibold"
                        )}
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
    // Second row content
    let secondRow = null;
    if (act.type === 'comment_added' && act.metadata && act.metadata.comment) {
        secondRow = (
            <div className={getThemeClasses(theme, "text-gray-700 text-sm mt-1", "dark:text-gray-200 text-sm mt-1")}>
                {act.metadata.comment}
            </div>
        );
    } else if (act.type === 'attachment_added' && act.metadata && act.metadata.fileName) {
        secondRow = (
            <div className="flex items-center gap-2 mt-1">
                {getFileIcon(act.metadata.fileName)}
                <a
                    href={act.metadata.fileUrl}
                    className={getThemeClasses(
                        "text-blue-600 hover:underline font-medium",
                        "dark:text-blue-400 hover:underline font-medium"
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {act.metadata.fileName}
                </a>
                <span className={getThemeClasses(theme, "text-xs text-gray-400 ml-2", "text-xs text-gray-500 ml-2")}>{formatFileSize(act.metadata.fileSize)}</span>
            </div>
        );
    }
    // Layout for left and right
    if (align === 'left') {
        return (
            <div className="flex items-start gap-4 w-full">
                <span className={getThemeClasses(theme, "text-xs text-gray-400 text-right ", "text-xs text-gray-500 text-right")}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {/* Details and time */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start">
                        {/* Image */}
                        <div className="flex-shrink-0">
                            {act.user?.profileImage ? (
                                <img src={act.user.profileImage} alt="avatar" className={getThemeClasses(theme, "w-10 h-10 rounded-full object-cover border border-gray-200", "w-10 h-10 rounded-full object-cover border border-gray-700")} />
                            ) : (
                                <div className={getThemeClasses(theme, "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg", "w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-lg")}>
                                    {(act.user?.firstName && act.user?.lastName) ? act.user.firstName[0] + act.user.lastName[0] : 'UN'}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className={getThemeClasses(theme, "text-gray-900 font-medium text-base w-[90%]", "dark:text-gray-100 font-medium text-base w-[90%]")}>{renderDetailsWithTaskLink()}</div>
                            {secondRow}
                        </div>
                    </div>  
                </div>
            </div>
        );
    } else {
        // align === 'right'
        return (
            <div className="flex items-start gap-2 w-full ">
                {/* Image */}
                <div className="flex-shrink-0">
                    {act.user?.profileImage ? (
                        <img src={act.user.profileImage} alt="avatar" className={getThemeClasses(theme, "w-10 h-10 rounded-full object-cover border border-gray-200", "w-10 h-10 rounded-full object-cover border border-gray-700")} />
                    ) : (
                        <div className={getThemeClasses(theme, "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg", "w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-lg")}>
                            {(act.user?.firstName && act.user?.lastName) ? act.user.firstName[0] + act.user.lastName[0] : 'UN'}
                        </div>
                    )}
                </div>
                {/* Details and time */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start">
                        <div className="flex flex-col">
                            <div className={getThemeClasses(theme, "text-gray-900 font-medium text-base w-[90%]", "dark:text-gray-100 font-medium text-base w-[90%]")}>{renderDetailsWithTaskLink()}</div>
                            {secondRow}
                        </div>
                        <span className={getThemeClasses(theme, "text-xs text-gray-400 text-right whitespace-nowrap", "text-xs text-gray-500 text-right whitespace-nowrap ")}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>
        );
    }
}

export default ProjectActivity; 