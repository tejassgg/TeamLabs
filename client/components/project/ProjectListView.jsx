import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { getPriorityBadge, getTaskStatusStyle } from '../task/TaskTypeBadge';
import { FaSortUp, FaSortDown, FaCheck, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import { FiCornerDownRight } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';

const ProjectListView = ({ taskList, togglingSubtasks, onSubtaskToggle, onDeleteTask }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { isMe, formatDate, getTaskTypeBadgeComponent } = useGlobal();

  // Accordion state for List view - dynamically set based on task availability
  const [openAccordions, setOpenAccordions] = useState({});

  // Initialize accordion state based on task availability
  useEffect(() => {
    if (taskList) {
      const statusCodes = [1, 2, 3, 4, 5, 6];
      const newAccordionState = {};

      statusCodes.forEach(code => {
        const tasksByStatus = taskList.filter(t => t.Status === code);
        // Only open accordions that have tasks
        newAccordionState[code] = tasksByStatus.length > 0;
      });

      setOpenAccordions(newAccordionState);
    }
  }, [taskList]);

  // Toggle accordion state
  const toggleAccordion = (statusCode) => {
    setOpenAccordions(prev => ({
      ...prev,
      [statusCode]: !prev[statusCode]
    }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full cursor-pointer">
        <tbody className="bg-white dark:bg-dark-bg">
          {[
            { code: 1, label: 'Not Assigned' },
            { code: 2, label: 'Assigned' },
            { code: 3, label: 'In Progress' },
            { code: 4, label: 'QA' },
            { code: 5, label: 'Deployment' },
            { code: 6, label: 'Completed' }
          ].map(({ code, label }, indexx) => {
            const tasksByStatus = (taskList || []).filter(t => t.Status === code);

            // Flatten tasks and subtasks into a single array
            const flattenedItems = [];
            tasksByStatus.forEach(task => {
              // Add the main task
              flattenedItems.push({ ...task, isSubtask: false });

              // Add subtasks if they exist
              if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(subtask => {
                  flattenedItems.push({
                    ...subtask,
                    isSubtask: true,
                    parentTask: task,
                    // Map subtask fields to task-like structure
                    Name: subtask.Name,
                    Description: '', // Subtasks typically don't have descriptions
                    Status: task.Status, // Use parent task status for background color
                    AssignedTo: subtask.CompletedBy, // Map CompletedBy to AssignedTo
                    AssignedToDetails: subtask.CompletedByDetails,
                    Assignee: subtask.CreatedBy, // Map CreatedBy to Assignee
                    AssigneeDetails: subtask.CreatedByDetails,
                    IsCompleted: subtask.IsCompleted,
                    AssignedDate: subtask.CompletedDate,
                    DueDate: task.DueDate
                  });
                });
              }
            });
            const statusStyle = getTaskStatusStyle(code);

            return (
              <React.Fragment key={code}>
                {/* Status Header Row */}
                <tr>
                  <td colSpan="8" className="p-0">
                    <div className={`flex items-center ${indexx === 0 ? '' : 'mt-2'}`}>
                      <div className="flex items-center justify-center w-8 h-12" onClick={(e) => { e.preventDefault(); toggleAccordion(code); }}>
                        {openAccordions[code] ? (
                          <FaSortUp className={`${statusStyle.textColor} transition-transform duration-300 cursor-pointer`} size={14} />
                        ) : (
                          <FaSortDown className={`${statusStyle.textColor} transition-transform duration-300 cursor-pointer`} size={14} />
                        )}
                      </div>
                      <div className={`flex-1 cursor-pointer select-none px-4 py-3 font-semibold rounded-lg ${statusStyle.textColor} bg-gradient-to-r ${statusStyle.bgColor} ${statusStyle.borderColor} flex items-center justify-start gap-3`}
                        onClick={(e) => { e.preventDefault(); toggleAccordion(code); }} >
                        <div className="flex items-center gap-3">
                          {statusStyle.icon && React.cloneElement(statusStyle.icon, { width: 16, height: 16, className: `${statusStyle.icon.props.className} w-4 h-4` })}
                          <span>{label}</span>
                        </div>
                        <span className={`text-sm ${statusStyle.textColor} opacity-70`}>{tasksByStatus.length}</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Task Rows */}
                <tr>
                  <td colSpan="8" className="p-0">
                    <div className={`accordion-content ${openAccordions[code] ? 'open' : 'closed'}`}>
                      {flattenedItems.length > 0 && (
                        <table className="w-full table-fixed">
                          <thead>
                            <tr className="text-left text-xs font-medium text-gray-400 uppercase dark:bg-[#111113]">
                              <th className="py-3 px-4 tracking-wider w-[4%]"></th>
                              <th className="py-3 px-4 tracking-wider w-[43%] border-b border-gray-200 dark:border-gray-700">Task</th>
                              <th className="py-3 px-4 tracking-wider w-[15%] border-b border-gray-200 dark:border-gray-700">Assigned To</th>
                              <th className="py-3 px-4 tracking-wider text-center hidden sm:table-cell w-[11%] border-b border-gray-200 dark:border-gray-700">Assigned On</th>
                              <th className="py-3 px-4 tracking-wider text-center hidden sm:table-cell w-[8%] border-b border-gray-200 dark:border-gray-700">Priority</th>
                              <th className="py-3 px-4 tracking-wider text-center hidden sm:table-cell w-[11%] border-b border-gray-200 dark:border-gray-700">Task Type</th>
                              <th className="py-3 px-4 tracking-wider text-center hidden sm:table-cell w-[8%] border-b border-gray-200 dark:border-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {flattenedItems.map((item, index) => {
                              return (
                                <tr key={item.isSubtask ? `subtask-${item.SubtaskID}` : `task-${item.TaskID}`}
                                  className={item.isSubtask ? `bg-opacity-10 ${statusStyle.bgColor.replace('bg-gradient-to-r', '').trim()}` : ''} >
                                  <td className={`w-[4%] ${item.isSubtask ? 'py-2' : 'py-3'} px-4`}></td>
                                  <td className={`px-4 ${item.isSubtask ? 'py-2' : 'py-1'} w-[43%]`}>
                                    <div className={`flex flex-col ${item.isSubtask ? 'ml-4' : ''}`}>
                                      <div className="flex items-center gap-2 mb-1">
                                        {item.isSubtask ? (
                                          <div className="flex items-center gap-1">
                                            <FiCornerDownRight className='text-gray-400' />
                                            <div
                                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${item.IsCompleted
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                                } ${togglingSubtasks.has(item.SubtaskID) ? 'opacity-50' : ''}`}
                                              onClick={() => onSubtaskToggle(item.SubtaskID, item.parentTask.TaskID)}
                                              title={item.IsCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                                            >
                                              {item.IsCompleted && (
                                                <FaCheck size={8} className="text-white" />
                                              )}
                                              {togglingSubtasks.has(item.SubtaskID) && (
                                                <FaSpinner size={8} className="text-white animate-spin" />
                                              )}
                                            </div>
                                            <span className={`text-sm font-medium ${item.IsCompleted ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                              {item.Name && item.Name.length > 100 ? `${item.Name.substring(0, 100)}...` : item.Name}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-start gap-1">
                                            <button
                                              onClick={() => router.push(`/task/${item.TaskID}`)}
                                              className="text-left text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-450 hover:underline transition-colors cursor-pointer font-medium text-md"
                                              title="Click to view task details"
                                            >
                                              {item.Name && item.Name.length > 100 ? `${item.Name.substring(0, 100)}...` : item.Name}
                                            </button>
                                            <span className={'text-xs text-gray-500 dark:text-gray-400'}>{item.Description}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className={`px-4 ${item.isSubtask ? 'py-2' : 'py-3'} w-[15%]`}>
                                    {item.AssignedTo && item.AssignedToDetails ? (
                                      <div className={`flex items-center ${item.isSubtask ? '' : 'gap-3'}`}>
                                        {!item.isSubtask && (
                                          <div className={'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm dark:from-blue-600 dark:to-blue-700'}>
                                            {item.AssignedToDetails.fullName.split(' ').map(n => n[0]).join('')}
                                          </div>
                                        )}
                                        <div className="flex flex-col">
                                          <span className={'text-sm font-medium text-gray-900 dark:text-gray-100'}>
                                            {item.AssignedToDetails.fullName.split(' ')[0]} <span className={'text-xs'}>{isMe(item.AssignedTo) ? ' (You)' : ''}</span>
                                          </span>
                                          {item.AssignedToDetails.teamName && (
                                            <span className={`text-xs text-gray-500 dark:text-gray-400`}>{item.AssignedToDetails.teamName}</span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <span className={'text-sm text-gray-500 dark:text-gray-400'}>Not Assigned</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className={`px-4 hidden sm:table-cell text-center ${item.isSubtask ? 'py-2' : 'py-3'} w-[11%]`}>
                                    {!item.isSubtask ? (
                                      <span className={'text-sm text-gray-900 dark:text-gray-100'}>
                                        {item.AssignedDate ? formatDate(item.AssignedDate) : '-'}
                                      </span>
                                    ) : (
                                      <span className={'text-sm text-gray-900 dark:text-gray-100'}>{item.CreatedDate ? formatDate(item.CreatedDate) : '-'}</span>
                                    )}
                                  </td>
                                  <td className={`px-4 hidden sm:table-cell text-center ${item.isSubtask ? 'py-2' : 'py-3'} w-[8%]`}>
                                    {!item.isSubtask && getPriorityBadge(item.Priority)}
                                  </td>
                                  <td className={`px-4 hidden sm:table-cell text-center ${item.isSubtask ? 'py-2' : 'py-3'} w-[11%]`}>
                                    {!item.isSubtask && getTaskTypeBadgeComponent(item.Type)}
                                  </td>
                                  <td className={`px-4 hidden sm:table-cell text-center ${item.isSubtask ? 'py-2' : 'py-3'} w-[8%]`}>
                                    {!item.isSubtask && (
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => router.push(`/task/${item.TaskID}`)}
                                          className={'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'}
                                          title="Open Task"
                                        >
                                          <FaExternalLinkAlt size={14} />
                                        </button>
                                        <button
                                          onClick={() => onDeleteTask(item)}
                                          className={'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200 dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'}
                                          title="Delete Task"
                                        >
                                          <MdDelete size={18} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Empty State Row */}
                <tr>
                  <td colSpan="8" className="p-0">
                    <div className={`accordion-content ${openAccordions[code] ? 'open' : 'closed'}`}>
                      {flattenedItems.length === 0 && (
                        <div className="px-4 py-6 text-gray-500 dark:text-gray-400 text-center">
                          No tasks
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectListView;
