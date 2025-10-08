import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { timesheetService } from '../services/api';
import { FaMinus, FaPlus, FaAlignLeft, FaCalendarAlt, FaEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useToast } from '../context/ToastContext';
import { useThemeClasses } from '../components/shared/hooks/useThemeClasses';

const TimeSheet = () => {
    const { setTeams, userDetails, getTableHeaderClasses, getTableHeaderTextClasses, getTableRowClasses, getTableTextClasses, getTableSecondaryTextClasses, formatDateUTC } = useGlobal();
    const getThemeClasses = useThemeClasses();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [userTimeSheet, setUserTimeSheet] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());  //MM-DD-YYYY
    const [punchID, setPunchID] = useState();
    const [punchedInTime, setPunchedInTime] = useState();
    const [punchedOutTime, setPunchedOutTime] = useState();
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Update the table container classes - transparent background with borders to blend with page
    const tableContainerClasses = getThemeClasses(
        'rounded-xl border border-gray-200',
        'dark:border-gray-700'
    );

    // Table styling classes from GlobalContext for consistency
    const tableHeaderClasses = getTableHeaderClasses();
    const tableHeaderTextClasses = getTableHeaderTextClasses();
    const tableRowClasses = getTableRowClasses();
    const tableTextClasses = getTableTextClasses();
    const tableSecondaryTextClasses = getTableSecondaryTextClasses();

    // Fetch teams with statistics using the new API
    const fetchUserTimeSheet = async () => {
        if (!userDetails?._id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const data = await timesheetService.getTimeSheetHistory(new Date(currentDate).toJSON());
            if (data) {
                setPunchID(data.punchData._id);
                setPunchedInTime(data.punchData.InTime);
                setPunchedOutTime(data.punchData.OutTime);
                setUserTimeSheet(data.timeSheet);
                if (data.message) {
                    showToast(data.message, 'warning')
                }
            }

        } catch (error) {
            console.error('Error fetching TimeSheet:', error);
            showToast(error.message || 'Failed to load timesheet', 'error');
            setUserTimeSheet([]);
        } finally {
            setLoading(false);
        }
    };

    function createDateFromTimeString(timeString, baseDate = new Date()) {
        if (!timeString) {
            return null; // Or throw an error
        }
        const [hours, minutes] = timeString.split(':');
        const newDate = new Date(baseDate); // Create a copy to avoid modifying the original
        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return newDate;
    }

    const handleAddTime = async () => {
        try {
            const formData = {
                Description: description,
                StartTime: createDateFromTimeString(startTime, currentDate),
                EndTime: createDateFromTimeString(endTime, currentDate),
                PunchDate: new Date(currentDate).toJSON(),
                PunchID: punchID
            }
            const res = await timesheetService.postTimeSheet(formData);
            if (res.status == 201) {
                setUserTimeSheet(prev => [...prev, res.data]);
                showToast('TimeSheet Updated Successfully!', 'success');
                setDescription('');
                setStartTime('');
                setEndTime('');
            }
        } catch (err) {
            console.log(err);
            showToast('Failed to Add TimeSheet', 'error');
        }
    };

    const handleEditTime = async (timeId) => {
        try {
            const formData = {
                Description: description,
                StartTime: createDateFromTimeString(startTime, currentDate),
                EndTime: createDateFromTimeString(endTime, currentDate),
                PunchDate: new Date(currentDate).toJSON(),
                TimeId: timeId,
                PunchID: punchID
            }
            const newTime = await timesheetService.postTimeSheet(punchID, formData);
            setUserTimeSheet(prev => [...prev, newTime]);
            showToast('TimeSheet Updated Successfully!', 'success');
        } catch (err) {
            console.log(err);
            showToast('Failed to Add TimeSheet', 'error');
        }
    };

    const handleDelTime = async (timeId, punchID) => {
        try {
            const res = await timesheetService.delTimeSheet(timeId, punchID);
            if (res.status == 200) {
                showToast(res.data.message, 'success');
                setUserTimeSheet(prev => prev.filter(t => t._id !== timeId));
                return;
            }
            showToast('Unable to Delete TimeSheet', 'warning');
        } catch (err) {
            console.log(err);
            showToast('Failed to Delete TimeSheet', 'error');
        }
    };

    const handlePunchIn = async () => {
        try {
            const data = await timesheetService.punchIn();
            setPunchedInTime(new Date(data.punchIn.InTime).toLocaleString())
            setPunchID(data.punchIn._id)
            showToast(data.message);
        }
        catch (error) {
            console.log(error);
        }
    };

    const handlePunchOut = async () => {
        const data = await timesheetService.punchOut(punchID);
        setPunchedOutTime(new Date(data.punchOut.OutTime).toLocaleString())
        showToast(data.message);
    };

    useEffect(() => {
        fetchUserTimeSheet();
    }, [userDetails?._id]);

    // if (loading) {
    //     return <TeamsSkeleton />;
    // }

    return (
        <div className={getThemeClasses(
            'mx-auto text-gray-900',
            'bg-[#18181b] text-white'
        )}>
            {/* Punch In & Out Buttons */}
            <div className='flex items-center justify-between gap-4 mb-4 max-w-2xl'>
                <div className='flex flex-col items-start justify-center gap-2'>
                    {punchedInTime ?
                        <span className={getThemeClasses('text-black text-sm', 'text-white')}>Punched In at: {punchedInTime}</span>
                        :

                        <button
                            onClick={handlePunchIn}
                            className={getThemeClasses(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm',
                                'dark:bg-green-500 dark:hover:bg-green-600 dark:text-white'
                            )}
                        >
                            <FaPlus size={14} />
                            Punch In
                        </button>
                    }
                </div>
                <div className='flex flex-col items-start justify-center gap-2'>
                    {punchedOutTime ?
                        <span className={getThemeClasses('text-black text-sm', 'text-white')}>Punched Out at: {punchedOutTime}</span>
                        :
                        <button
                            onClick={handlePunchOut}
                            className={getThemeClasses(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm',
                                'dark:bg-red-500 dark:hover:bg-red-600 dark:text-white'
                            )}
                        >
                            <FaMinus size={14} />
                            Punch Out
                        </button>
                    }
                </div>
            </div>
            {/* TimeSheet Table */}
            <div className={`lg:col-span-2`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Time Sheet: <span>{currentDate}</span></h2>
                </div>
                <div className={`overflow-x-auto ${tableContainerClasses}`}>
                    <table className="w-full">
                        <thead>
                            <tr className={tableHeaderClasses}>
                                <th className={`py-3 px-4 text-left w-[300px] ${tableHeaderTextClasses}`}>Description</th>
                                <th className={`hidden md:table-cell py-3 px-4 text-left w-[200px] ${tableHeaderTextClasses}`}>Start Time</th>
                                <th className={`hidden md:table-cell py-3 px-4 text-left w-[200px] ${tableHeaderTextClasses}`}>End Time</th>
                                <th className={`py-3 px-4 text-center w-[150px] ${tableHeaderTextClasses}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className='p-2'>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className={getThemeClasses(
                                            'w-[95%] flex px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                                            'flex px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                                        )}
                                        maxLength={100}
                                        required
                                        placeholder="Enter work description"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className={getThemeClasses(
                                            'flex px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                                            'flex px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                                        )}
                                        required
                                        placeholder="Enter team name"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className={getThemeClasses(
                                            'flex px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                                            'flex px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                                        )}
                                        required
                                        placeholder="Enter team name"
                                    />
                                </td>
                                <td>
                                    <div className='flex items-center justify-center'>
                                        <button
                                            onClick={handleAddTime}
                                            className={getThemeClasses(
                                                'flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-700 hover:text-white duration-300 rounded-lg transition-colors shadow-sm',
                                                'dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'
                                            )}
                                        >Submit</button>
                                    </div>
                                </td>
                            </tr>
                            {userTimeSheet.map(time => (
                                <tr key={time._id} className={tableRowClasses}>
                                    <td className="py-3 px-4">
                                        {time.Description && (
                                            <span className={tableSecondaryTextClasses}>{time.Description}</span>
                                        )}
                                    </td>
                                    <td className={`hidden md:table-cell py-3 px-4 ${tableSecondaryTextClasses}`}>
                                        {/* <span>{new Date(time.StartTime).toDateString() + ' ' + new Date(time.StartTime).toLocaleTimeString()}</span>                                        </td> */}
                                        <span>{new Date(time.StartTime).toLocaleTimeString()}</span>                                        </td>
                                    <td className={`hidden md:table-cell py-3 px-4 ${tableSecondaryTextClasses}`}>
                                        <span>{new Date(time.EndTime).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* <button
                                                onClick={() => {
                                                    handleEditTime(time._id)
                                                }}
                                                className={getThemeClasses(
                                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                                    'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                                )}
                                                title="Edit TimeSheet"
                                            >
                                                <FaEdit size={14} />
                                            </button> */}
                                            <button
                                                onClick={() => {
                                                    handleDelTime(time._id, time.PunchID)
                                                }}
                                                className={getThemeClasses(
                                                    'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                                    'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                                )}
                                                title="Delete TimeSheer"
                                            >
                                                <MdDelete size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TimeSheet;
