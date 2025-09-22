import React, { useState, useMemo } from 'react';
import { FaCalendarAlt, FaTimes, FaComment, FaPaperclip, FaChevronLeft, FaChevronRight, FaRegComment } from 'react-icons/fa';
import { getTaskTypeStyle } from '../task/TaskTypeBadge';
import { TiAttachment } from "react-icons/ti";
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { getTaskTypeBadge, getPriorityBadge } from '../task/TaskTypeBadge';

const GanttChart = ({ tasks = [], userStories = [], project }) => {
    const { theme } = useTheme();
    const { formatDateUTC, getUserInitials } = useGlobal();
    const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'quarter'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return startOfWeek;
    });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [selectedTask, setSelectedTask] = useState(null);

    // Week navigation functions
    const goToPreviousWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() - 7);
        setCurrentWeekStart(newWeekStart);
    };

    const goToNextWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() + 7);
        setCurrentWeekStart(newWeekStart);
    };

    const goToCurrentWeek = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        setCurrentWeekStart(startOfWeek);
    };

    // Calculate timeline data
    const timelineData = useMemo(() => {
        const allItems = [...userStories, ...tasks];
        // Calculate project start and end dates
        let projectStart = project?.CreatedDate ? new Date(project.CreatedDate) : new Date();
        let projectEnd = project?.DueDate ? new Date(project.DueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        // For week view, adjust the timeline to show the current week
        if (viewMode === 'week') {
            // Show 2 weeks centered around currentWeekStart
            projectStart = new Date(currentWeekStart);
            projectStart.setDate(currentWeekStart.getDate() - 7);
            projectEnd = new Date(currentWeekStart);
            projectEnd.setDate(currentWeekStart.getDate() + 13); // 2 weeks total
        }

        // Pre-compute end dates for user stories
        const userStoryEndById = new Map();
        for (const us of userStories) {
            const usStart = us.CreatedDate ? new Date(us.CreatedDate) : projectStart;
            const usFinish = us.DueDate ? new Date(us.DueDate) : (us.AssignedDate ? new Date(us.AssignedDate) : new Date(usStart.getTime() + 7 * 24 * 60 * 60 * 1000));
            userStoryEndById.set(us.TaskID || us._id, usFinish);
        }

        // Calculate item positions and durations
        const itemsWithTimeline = allItems.map(item => {
            const startDate = item.CreatedDate ? new Date(item.CreatedDate) : projectStart;
            // For tasks, use their parent user story's DueDate; for user stories, use their own DueDate
            let endDate;
            if (item.Type === 'User Story') {
                endDate = userStoryEndById.get(item.TaskID || item._id) || (item.DueDate ? new Date(item.DueDate) : (item.AssignedDate ? new Date(item.AssignedDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)));
            } else if (item.ParentID && userStoryEndById.has(item.ParentID)) {
                endDate = new Date(userStoryEndById.get(item.ParentID));
            } else {
                endDate = item.AssignedDate ? new Date(item.AssignedDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            }

            // Calculate position as percentage of total timeline
            const totalDuration = projectEnd.getTime() - projectStart.getTime();
            const itemStart = startDate.getTime() - projectStart.getTime();
            const itemDuration = endDate.getTime() - startDate.getTime();

            return {
                ...item,
                startDate,
                endDate,
                startPercentage: (itemStart / totalDuration) * 100,
                durationPercentage: (itemDuration / totalDuration) * 100,
                isUserStory: item.Type === 'User Story'
            };
        });

        return {
            projectStart,
            projectEnd,
            items: itemsWithTimeline,
            totalDuration: projectEnd.getTime() - projectStart.getTime()
        };
    }, [tasks, userStories, project, viewMode, currentWeekStart]);

    // Generate timeline headers
    const generateTimelineHeaders = () => {
        const headers = [];
        const today = new Date();

        if (viewMode === 'week') {
            // Show 7 days starting from currentWeekStart
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentWeekStart);
                date.setDate(currentWeekStart.getDate() + i);
                headers.push({
                    date: date,
                    label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    isToday: date.toDateString() === today.toDateString(),
                    isWeekend: date.getDay() === 0 || date.getDay() === 6
                });
            }
        } else {
            const { projectStart, projectEnd } = timelineData;

            if (viewMode === 'month') {
                const current = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
                while (current <= projectEnd) {
                    headers.push({
                        date: new Date(current),
                        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                        isWeekend: false
                    });
                    current.setMonth(current.getMonth() + 1);
                }
            } else if (viewMode === 'quarter') {
                const current = new Date(projectStart.getFullYear(), Math.floor(projectStart.getMonth() / 3) * 3, 1);
                while (current <= projectEnd) {
                    headers.push({
                        date: new Date(current),
                        label: `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`,
                        isWeekend: false
                    });
                    current.setMonth(current.getMonth() + 3);
                }
            }
        }

        return headers;
    };

    const timelineHeaders = generateTimelineHeaders();

    // Get status color
    const getStatusColor = (status, type) => {
        const statusMap = {
            1: theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300',      // Not Assigned
            2: theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-400',  // Assigned
            3: theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400',      // In Progress
            4: theme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-400',  // QA
            5: theme === 'dark' ? 'bg-orange-600' : 'bg-orange-400',  // Deployment
            6: theme === 'dark' ? 'bg-green-600' : 'bg-green-400'     // Completed
        };

        if (type === 'User Story') {
            return theme === 'dark' ? 'bg-purple-600' : 'bg-purple-400';
        }

        return statusMap[status] || (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300');
    };

    const renderTaskTypeIcon = (type) => {
        const style = getTaskTypeStyle(type);
        return <span className="mr-1.5 opacity-90 inline-flex items-center">{style.icon}</span>;
    };



    return (
        <div className={`w-full ${theme === 'dark' ? 'bg-transparent' : 'bg-white'} overflow-hidden`}>
            {/* Mobile Warning */}
            <div className="md:hidden p-4 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                    <FaCalendarAlt size={16} />
                    <span className="text-sm font-medium">Timeline view is optimized for desktop. Consider using Board view on mobile.</span>
                </div>
            </div>
            {/* Header Controls */}
            <div className={`mb-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-start">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setViewMode('week');
                                    goToCurrentWeek();
                                }}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'week'
                                    ? theme === 'dark'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-500 text-white'
                                    : theme === 'dark'
                                        ? 'text-gray-400 hover:text-gray-300'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'month'
                                    ? theme === 'dark'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-500 text-white'
                                    : theme === 'dark'
                                        ? 'text-gray-400 hover:text-gray-300'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setViewMode('quarter')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'quarter'
                                    ? theme === 'dark'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-500 text-white'
                                    : theme === 'dark'
                                        ? 'text-gray-400 hover:text-gray-300'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Quarter
                            </button>
                        </div>

                        {/* Week Navigation - Only show when in week view */}
                        {viewMode === 'week' && (
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={goToPreviousWeek}
                                    className={`p-2 rounded-md transition-colors ${theme === 'dark'
                                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                        }`}
                                    title="Previous Week"
                                >
                                    <FaChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={goToCurrentWeek}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${theme === 'dark'
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    title="Current Week"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={goToNextWeek}
                                    className={`p-2 rounded-md transition-colors ${theme === 'dark'
                                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                        }`}
                                    title="Next Week"
                                >
                                    <FaChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Header */}
            <div className={`border-t border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                <div className="flex min-w-max">
                    {/* Task Name Column */}
                    <div className={`w-80 p-3 border-r ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} flex-shrink-0`}>
                        <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Task / User Story
                        </span>
                    </div>

                    {/* Timeline Columns */}
                    <div className="flex flex-1 min-w-max">
                        {timelineHeaders.map((header, index) => (
                            <div
                                key={index}
                                className={`flex-1 p-3 text-center border-r last:border-r-0 ${theme === 'dark'
                                    ? `border-gray-700 ${header.isWeekend ? 'bg-gray-800' : 'bg-gray-750'}`
                                    : `border-gray-200 ${header.isWeekend ? 'bg-gray-100' : 'bg-white'}`
                                    }`}
                                style={{ minWidth: `${100 * zoomLevel}px` }}
                            >
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                    {header.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Content */}
            <div className="h-[750px] overflow-auto">
                {timelineData.items.length === 0 ? (
                    <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FaCalendarAlt size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No tasks or user stories found</p>
                        <p className="text-sm">Create tasks and user stories to see them in the timeline view.</p>
                    </div>
                ) : (
                    <div className="min-w-max">
                        {timelineData.items.map((item, index) => (
                            <div
                                key={item.TaskID || item._id}
                                className={`flex border-b last:border-b-0 hover:bg-opacity-50 ${theme === 'dark'
                                    ? 'border-gray-700 hover:bg-gray-800'
                                    : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {/* Task Info Column */}
                                <div className={`w-80 p-3 border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(item.Status, item.Type)}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {item.Name}
                                            </div>

                                            {item.Description && (
                                                <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                                                    {item.Description}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getTaskTypeBadge(item.Type)}
                                                    {item.Priority && getPriorityBadge(item.Priority)}
                                                </div>
                                                <div className="flex items-center justify-end gap-3 mt-1 text-xs">
                                                    {(item.commentCount || 0) > 0 && (
                                                        <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            <FaRegComment className="w-3 h-3" />
                                                            <span>{item.commentCount || 0}</span>
                                                        </div>
                                                    )}
                                                    {(item.attachmentCount || 0) > 0 && (
                                                        <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            <TiAttachment size={16} />
                                                            <span>{item.attachmentCount || 0}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Bar */}
                                <div className="flex-1 relative p-3">
                                    <div className="relative h-8">
                                        <div className="absolute inset-0 flex">
                                            {timelineHeaders.map((_, headerIndex) => (
                                                <div
                                                    key={headerIndex}
                                                    className={`flex-1 border-r last:border-r-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                        }`}
                                                ></div>
                                            ))}
                                        </div>

                                        {/* Task Bar */}
                                        <div className={`absolute top-1 px-1 py-2 rounded-lg cursor-pointer transition-all hover:opacity-80 ${getStatusColor(item.Status, item.Type)} border-2`}
                                            style={{ left: `${item.startPercentage}%`, width: `${Math.max(item.durationPercentage, 2)}%`, minWidth: '20px' }}
                                            onClick={() => setSelectedTask(item)}
                                            title={`$ {item.Name} - ${formatDateUTC(item.startDate)} to ${formatDateUTC(item.endDate)}`} >
                                            <div className={`h-full flex items-center px-2 ${theme === 'dark' ? 'text-white' : 'text-white'}`}>
                                                {renderTaskTypeIcon(item.Type)}
                                                <span className="flex items-center text-sm font-medium truncate">
                                                    {item.Name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Legend:
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Not Assigned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-400'}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Assigned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-400'}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>QA</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-orange-600' : 'bg-orange-400'}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Deployment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-green-600' : 'bg-green-400'}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>User Story</span>
                    </div>
                </div>
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`w-96 p-6 rounded-xl shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Task Details
                            </h3>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Name:
                                </span>
                                <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedTask.Name}
                                </p>
                            </div>

                            {selectedTask.Description && (
                                <div>
                                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Description:
                                    </span>
                                    <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>
                                        {selectedTask.Description}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Type:
                                    </span>
                                    {getTaskTypeBadge(selectedTask.Type)}
                                </div>

                                {selectedTask.Priority && (
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Priority:
                                        </span>
                                        {getPriorityBadge(selectedTask.Priority)}
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Timeline:
                                </span>
                                <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatDateUTC(selectedTask.startDate)} - {formatDateUTC(selectedTask.endDate)}
                                </p>
                            </div>

                            {((selectedTask.commentCount || 0) > 0 || (selectedTask.attachmentCount || 0) > 0) && (
                                <div>
                                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Activity:
                                    </span>
                                    <div className="flex items-center gap-4 mt-1">
                                        {(selectedTask.commentCount || 0) > 0 && (
                                            <div className={`flex items-center gap-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <FaComment className="w-3 h-3" />
                                                <span>{selectedTask.commentCount || 0} comments</span>
                                            </div>
                                        )}
                                        {(selectedTask.attachmentCount || 0) > 0 && (
                                            <div className={`flex items-center gap-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <FaPaperclip className="w-3 h-3" />
                                                <span>{selectedTask.attachmentCount || 0} attachments</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GanttChart;
