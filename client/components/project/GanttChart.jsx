import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaTimes, FaComment, FaPaperclip, FaChevronLeft, FaChevronRight, FaRegComment, FaLink, FaUnlink, FaExclamationTriangle } from 'react-icons/fa';
import { TiAttachment } from "react-icons/ti";
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { getTaskTypeBadge, getPriorityBadge } from '../task/TaskTypeBadge';

const GanttChart = ({ tasks = [], userStories = [], project, onUpdateTask, onEditTask }) => {
    const { theme } = useTheme();
    const { formatDateUTC, getUserInitials, showToast } = useGlobal();
    const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'quarter'
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return startOfWeek;
    });

    // Interactive drag state
    const [dragState, setDragState] = useState(null);
    const [previewDates, setPreviewDates] = useState(null);
    const timelineContainerRef = useRef(null);

    // Dependency editing state
    const [showDependencyModal, setShowDependencyModal] = useState(false);
    const [dependencyTask, setDependencyTask] = useState(null);

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

    const allItems = useMemo(() => {
        return [...userStories, ...tasks];
    }, [userStories, tasks]);

    // Calculate timeline start/end boundaries
    const timelineBounds = useMemo(() => {
        let start = project?.CreatedDate ? new Date(project.CreatedDate) : new Date();
        let end = project?.DueDate ? new Date(project.DueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (viewMode === 'week') {
            start = new Date(currentWeekStart);
            start.setDate(currentWeekStart.getDate() - 7);
            end = new Date(currentWeekStart);
            end.setDate(currentWeekStart.getDate() + 13); // 3 weeks total range
        }
        return { start, end, duration: end.getTime() - start.getTime() };
    }, [project, viewMode, currentWeekStart]);

    // Calculate timeline data with preview overrides
    const timelineData = useMemo(() => {
        const { start: projectStart, end: projectEnd, duration: totalDuration } = timelineBounds;

        const itemsWithTimeline = allItems.map(item => {
            const itemId = item.TaskID || item._id;

            // Check if this item is currently being dragged
            const isDraggingThis = previewDates && previewDates.taskId === itemId;

            let startDate;
            if (isDraggingThis) {
                startDate = previewDates.startDate;
            } else {
                startDate = item.StartDate ? new Date(item.StartDate) : (item.CreatedDate ? new Date(item.CreatedDate) : projectStart);
            }

            let endDate;
            if (isDraggingThis) {
                endDate = previewDates.endDate;
            } else {
                if (item.DueDate) {
                    endDate = new Date(item.DueDate);
                } else if (item.Type === 'User Story') {
                    endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                } else if (item.ParentID) {
                    const parent = userStories.find(us => (us.TaskID || us._id) === item.ParentID);
                    endDate = parent?.DueDate ? new Date(parent.DueDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                } else {
                    endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                }
            }

            // Boundary validation
            if (endDate < startDate) {
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
            }

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
            totalDuration
        };
    }, [allItems, userStories, timelineBounds, previewDates]);

    // Drag move handler
    const handleMouseMove = (e) => {
        if (!dragState) return;

        const container = timelineContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const deltaX = e.clientX - dragState.startX;
        const deltaMs = (deltaX / rect.width) * dragState.totalDuration;

        let newStart = new Date(dragState.initialStartDate.getTime());
        let newEnd = new Date(dragState.initialEndDate.getTime());

        if (dragState.dragType === 'shift') {
            newStart.setTime(dragState.initialStartDate.getTime() + deltaMs);
            newEnd.setTime(dragState.initialEndDate.getTime() + deltaMs);
        } else if (dragState.dragType === 'resize-left') {
            newStart.setTime(dragState.initialStartDate.getTime() + deltaMs);
            if (newStart >= newEnd) {
                newStart.setTime(newEnd.getTime() - 24 * 60 * 60 * 1000); // 1 day min
            }
        } else if (dragState.dragType === 'resize-right') {
            newEnd.setTime(dragState.initialEndDate.getTime() + deltaMs);
            if (newEnd <= newStart) {
                newEnd.setTime(newStart.getTime() + 24 * 60 * 60 * 1000); // 1 day min
            }
        }

        setPreviewDates({
            taskId: dragState.item.TaskID || dragState.item._id,
            startDate: newStart,
            endDate: newEnd
        });
    };

    // Drag end handler
    const handleMouseUp = async () => {
        if (!dragState) return;

        document.body.style.cursor = 'default';
        const finalPreview = previewDates;
        const targetItem = dragState.item;

        setDragState(null);
        setPreviewDates(null);

        if (finalPreview && onUpdateTask) {
            try {
                await onUpdateTask(finalPreview.taskId, {
                    StartDate: finalPreview.startDate,
                    DueDate: finalPreview.endDate
                });
            } catch (err) {
                console.error('Failed to update task timeline dates:', err);
            }
        }
    };

    // Mouse listeners for drag/resize
    useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, previewDates]);

    const handleMouseDown = (e, item, dragType) => {
        e.preventDefault();
        e.stopPropagation();

        const container = timelineContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();

        const initialStartDate = item.startDate;
        const initialEndDate = item.endDate;

        setDragState({
            item,
            dragType,
            startX: e.clientX,
            initialStartDate,
            initialEndDate,
            totalDuration: timelineBounds.duration,
            projectStart: timelineBounds.start
        });

        document.body.style.cursor = dragType === 'shift' ? 'grabbing' : 'col-resize';
    };

    // Generate timeline headers
    const generateTimelineHeaders = () => {
        const headers = [];
        const today = new Date();

        if (viewMode === 'week') {
            const startOfTimeline = new Date(currentWeekStart);
            startOfTimeline.setDate(currentWeekStart.getDate() - 7); // Offset left

            for (let i = 0; i < 21; i++) {
                const date = new Date(startOfTimeline);
                date.setDate(startOfTimeline.getDate() + i);
                headers.push({
                    date: date,
                    label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    isToday: date.toDateString() === today.toDateString(),
                    isWeekend: date.getDay() === 0 || date.getDay() === 6
                });
            }
        } else {
            const { start: projectStart, end: projectEnd } = timelineBounds;

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

    // Handle adding a dependency
    const handleAddDependency = async (dependencyId) => {
        if (!dependencyTask) return;
        const currentDeps = dependencyTask.Dependencies || [];
        if (currentDeps.includes(dependencyId)) return;

        const updatedDeps = [...currentDeps, dependencyId];
        try {
            await onUpdateTask(dependencyTask.TaskID || dependencyTask._id, {
                Dependencies: updatedDeps
            });
            // Update local state
            setDependencyTask(prev => ({ ...prev, Dependencies: updatedDeps }));
            showToast('Dependency added successfully!', 'success');
        } catch (err) {
            showToast('Failed to add dependency', 'error');
        }
    };

    // Handle removing a dependency
    const handleRemoveDependency = async (dependencyId) => {
        if (!dependencyTask) return;
        const currentDeps = dependencyTask.Dependencies || [];
        const updatedDeps = currentDeps.filter(id => id !== dependencyId);
        try {
            await onUpdateTask(dependencyTask.TaskID || dependencyTask._id, {
                Dependencies: updatedDeps
            });
            setDependencyTask(prev => ({ ...prev, Dependencies: updatedDeps }));
            showToast('Dependency removed successfully!', 'success');
        } catch (err) {
            showToast('Failed to remove dependency', 'error');
        }
    };

    return (
        <div className={`w-full bg-white dark:bg-transparent overflow-hidden`}>
            {/* Mobile Warning */}
            <div className="md:hidden p-4 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                    <FaCalendarAlt size={16} />
                    <span className="text-sm font-medium">Timeline view is optimized for desktop. Consider using Board view on mobile.</span>
                </div>
            </div>

            {/* Header Controls */}
            <div className={`mb-6 border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setViewMode('week');
                                    goToCurrentWeek();
                                }}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'week'
                                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'month'
                                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setViewMode('quarter')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'quarter'
                                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Quarter
                            </button>
                        </div>

                        {viewMode === 'week' && (
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={goToPreviousWeek}
                                    className={`p-2 rounded-md transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-dark-hover`}
                                    title="Previous Week"
                                >
                                    <FaChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={goToCurrentWeek}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`}
                                    title="Current Week"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={goToNextWeek}
                                    className={`p-2 rounded-md transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-dark-hover`}
                                    title="Next Week"
                                >
                                    <FaChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={`text-xs text-gray-500 dark:text-gray-400 italic`}>
                        Tip: Drag timeline bars to reschedule, or stretch ends to change duration
                    </div>
                </div>
            </div>

            {/* Timeline Wrapper */}
            <div className={`border rounded-2xl border-gray-200 dark:border-gray-800 max-h-[800px] overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800`}>
                <div className="min-w-max flex flex-col">
                    {/* Header Row */}
                    <div className={`flex min-w-max border-b sticky top-0 z-30 border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#161616]`}>
                        {/* Task List Header */}
                        <div className={`w-80 p-4 font-semibold text-sm flex-shrink-0 sticky left-0 z-40 border-r bg-gray-50 border-gray-200 dark:bg-[#161616] dark:border-gray-800`}>
                            Task / User Story Info
                        </div>
                        {/* Dates Header Columns */}
                        <div className="flex flex-1" ref={timelineContainerRef} id="gantt-timeline-container">
                            {timelineHeaders.map((header, index) => (
                                <div
                                    key={index}
                                    className={`flex-1 p-3 text-center text-xs font-semibold border-r last:border-r-0 ${header.isToday
                                        ? 'text-blue-500 border-blue-500/20 bg-blue-500/5'
                                        : header.isWeekend
                                            ? 'border-gray-250 text-gray-450 bg-gray-50 dark:border-gray-800 dark:text-gray-500 dark:bg-gray-900/50'
                                            : 'border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-400'
                                        }`}
                                    style={{ minWidth: '100px' }}
                                >
                                    <div>{header.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Body Rows */}
                    <div className="flex flex-col">
                        {timelineData.items.length === 0 ? (
                            <div className={`p-12 text-center text-gray-500 dark:text-gray-400`}>
                                <FaCalendarAlt size={48} className="mx-auto mb-4 opacity-40" />
                                <p className="text-lg font-semibold mb-1">No timeline entries yet</p>
                                <p className="text-sm">Create user stories or sprint tasks to visualize them here.</p>
                            </div>
                        ) : (
                            timelineData.items.map((item) => {
                                const isBlocked = item.Dependencies && item.Dependencies.length > 0 && item.Dependencies.some(depId => {
                                    const depTask = allItems.find(t => (t.TaskID || t._id) === depId);
                                    return depTask && depTask.Status !== 6;
                                });

                                return (
                                    <div
                                        key={item.TaskID || item._id}
                                        className={`flex border-b last:border-b-0 relative group transition-colors duration-200 border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800/40`}
                                    >
                                        {/* Task Metadata Info Column */}
                                        <div className={`w-80 p-3.5 border-r sticky left-0 z-10 flex-shrink-0 flex flex-col justify-center transition-colors duration-200 bg-white border-gray-200 group-hover:bg-gray-50 dark:bg-[#121212] dark:border-gray-800 dark:group-hover:bg-[#1e1e20]`}>
                                            <div className="flex items-start gap-2.5">
                                                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(item.Status, item.Type)}`}></span>
                                                <div className="flex-1 min-w-0">
                                                    <div
                                                        className={`font-semibold text-sm truncate cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 text-gray-900 dark:text-white`}
                                                        onClick={() => onEditTask && onEditTask(item)}
                                                    >
                                                        {(item.TaskNumber || item.TicketNumber) ? `#${item.TaskNumber || item.TicketNumber} ` : ''}{item.Name}
                                                    </div>

                                                    {/* Type / Priority Badges */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                        {getTaskTypeBadge(item.Type)}
                                                        {getPriorityBadge(item.Priority)}

                                                        {/* Dependencies Edit Trigger */}
                                                        <button
                                                            onClick={() => {
                                                                setDependencyTask(item);
                                                                setShowDependencyModal(true);
                                                            }}
                                                             className={`px-1.5 py-0.5 rounded text-xs font-semibold border flex items-center gap-1 transition-all ${isBlocked
                                                                 ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                                                 : item.Dependencies?.length > 0
                                                                     ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                                                                     : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-dark-hover'
                                                                 }`}
                                                        >
                                                            <FaLink size={8} />
                                                            {item.Dependencies?.length > 0 ? `${item.Dependencies.length} Prerequisites` : 'Add Prerequisites'}
                                                        </button>
                                                    </div>

                                                    {/* Blocked Alert Description */}
                                                    {isBlocked && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-red-400">
                                                            <FaExclamationTriangle size={8} /> Blocked by prerequisites
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gantt Bar Column Track */}
                                        <div className="flex-1 min-w-max relative py-4 pointer-events-none h-16">
                                            {/* Bar container */}
                                            <div
                                                className={`group absolute top-3 bottom-3 rounded-lg flex items-center transition-shadow shadow-md hover:shadow-lg select-none pointer-events-auto border-2 ${getStatusColor(item.Status, item.Type)
                                                    } border-white/30 text-white dark:border-gray-900/30 dark:text-white`}
                                                style={{
                                                    left: `${item.startPercentage}%`,
                                                    width: `${Math.max(item.durationPercentage, 1.5)}%`,
                                                    minWidth: '35px',
                                                    cursor: 'grab'
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e, item, 'shift')}
                                                onClick={() => onEditTask && onEditTask(item)}
                                                title={`${item.Name} (${formatDateUTC(item.StartDate || item.CreatedDate || item.startDate)} - ${formatDateUTC(item.DueDate || item.endDate)})`}
                                            >
                                                {/* Left Edge Resize Handle */}
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize rounded-l-md flex items-center justify-center bg-black/15 dark:bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                    onMouseDown={(e) => handleMouseDown(e, item, 'resize-left')}
                                                    title="Drag to extend or shorten start date"
                                                >
                                                    <div className="w-[1.5px] h-3.5 bg-white/80 rounded-full"></div>
                                                </div>

                                                {/* Bar Title Label */}
                                                <div className="flex-1 px-3.5 text-xs font-semibold truncate flex items-center gap-1.5 pointer-events-none select-none">
                                                    {item.AssignedToDetails && (
                                                        <div className="flex-shrink-0 w-4 h-4">
                                                            {item.AssignedToDetails.profileImage ? (
                                                                <img
                                                                    src={item.AssignedToDetails.profileImage}
                                                                    alt={item.AssignedToDetails.fullName}
                                                                    className="w-4 h-4 rounded-full object-cover border border-white/20"
                                                                />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-white text-[8px] font-bold">
                                                                    {item.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <span className="truncate">{item.Name}</span>
                                                </div>

                                                {/* Right Edge Resize Handle */}
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize rounded-r-md flex items-center justify-center bg-black/15 dark:bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                    onMouseDown={(e) => handleMouseDown(e, item, 'resize-right')}
                                                    title="Drag to extend or shorten end date"
                                                >
                                                    <div className="w-[1.5px] h-3.5 bg-white/80 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Dependency Management Modal */}
            {showDependencyModal && dependencyTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`w-full max-w-lg rounded-3xl shadow-2xl p-6 border transition-all duration-300 bg-white border-gray-100 text-gray-900 dark:bg-dark-bg dark:border-dark-card dark:text-zinc-100`}>
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <FaLink size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold">Manage Prerequisites</h3>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium truncate max-w-[280px] mt-0.5">
                                        For: {dependencyTask.Name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDependencyModal(false);
                                    setDependencyTask(null);
                                }}
                                className={`p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200`}
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* List current dependencies */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                                Active Prerequisites
                            </h4>
                            {(!dependencyTask.Dependencies || dependencyTask.Dependencies.length === 0) ? (
                                <div className={`text-sm italic p-4 text-center border border-dashed rounded-2xl border-gray-200 text-gray-400 dark:border-zinc-800 dark:text-zinc-500`}>
                                    No dependencies currently defined.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                                    {dependencyTask.Dependencies.map(depId => {
                                        const dep = allItems.find(t => (t.TaskID || t._id) === depId);
                                        if (!dep) return null;
                                        return (
                                            <div
                                                key={depId}
                                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors bg-gray-50/50 border-gray-100 dark:bg-zinc-900/40 dark:border-zinc-800/80`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(dep.Status, dep.Type)}`}></span>
                                                    <span className="text-sm font-semibold truncate">{dep.Name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveDependency(depId)}
                                                    className="p-2 rounded-xl text-rose-550 hover:text-white hover:bg-rose-500 transition-all duration-200"
                                                    title="Remove prerequisite"
                                                >
                                                    <FaUnlink size={11} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Add new dependencies */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                                Add Prerequisite Task
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                                {allItems
                                    .filter(item =>
                                        (item.TaskID || item._id) !== (dependencyTask.TaskID || dependencyTask._id) &&
                                        !(dependencyTask.Dependencies || []).includes(item.TaskID || item._id)
                                    )
                                    .map(item => (
                                        <div
                                            key={item.TaskID || item._id}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all border-gray-100 hover:bg-gray-50/50 dark:border-dark-card dark:hover:bg-zinc-800/40`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(item.Status, item.Type)}`}></span>
                                                <span className="text-xs font-semibold truncate">{item.Name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleAddDependency(item.TaskID || item._id)}
                                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl transition-all duration-200"
                                            >
                                                Link
                                            </button>
                                        </div>
                                    ))
                                }
                                {allItems.filter(item =>
                                    (item.TaskID || item._id) !== (dependencyTask.TaskID || dependencyTask._id) &&
                                    !(dependencyTask.Dependencies || []).includes(item.TaskID || item._id)
                                ).length === 0 && (
                                        <p className={`text-xs italic text-center py-4 text-gray-400 dark:text-zinc-550`}>
                                            No other tasks available to link.
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GanttChart;
