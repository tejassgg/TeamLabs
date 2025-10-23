import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { timesheetService } from '../services/api';
// Added new icons to match the UI
import { FaPlus, FaCheckCircle, FaArrowRight, FaPaperPlane } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useToast } from '../context/ToastContext';
import { useThemeClasses } from '../components/shared/hooks/useThemeClasses';
import CustomModal from '../components/shared/CustomModal'; // Assuming CustomModal is in this path

const TimeSheet = () => {
    const { userDetails, getTableHeaderClasses, getTableHeaderTextClasses, getTableRowClasses, getTableTextClasses, getTableSecondaryTextClasses } = useGlobal();
    const getThemeClasses = useThemeClasses();
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
    const [totalTime, setTotalTime] = useState({ hours: 0, minutes: 0 });
    const [punchDuration, setPunchDuration] = useState({ hours: 0, minutes: 0 });
    const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [timeToDelete, setTimeToDelete] = useState(null);
    const [isToday, setIsToday] = useState(true);


    // Update the table container classes - transparent background with borders to blend with page
    const tableContainerClasses = getThemeClasses(
        'rounded-xl border border-gray-200',
        'dark:border-gray-700'
    );

    // Table styling classes from GlobalContext for consistency
    const tableHeaderClasses = getTableHeaderClasses();
    const tableHeaderTextClasses = getTableHeaderTextClasses();
    const tableRowClasses = getTableRowClasses();
    const tableSecondaryTextClasses = getTableSecondaryTextClasses();

    // Fetch teams with statistics using the new API
    const fetchUserTimeSheet = async () => {
        if (!userDetails?._id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const data = await timesheetService.getTimeSheetHistory(new Date(currentDate).toLocaleDateString().replaceAll('/', '-'));
            if (data) {
                if (data.message) {
                    showToast(data.message, 'warning')
                }
                if (data.punchData) {
                    setPunchID(data.punchData._id);
                    setPunchedInTime(data.punchData.InTime);
                    setPunchedOutTime(data.punchData.OutTime);
                    setUserTimeSheet(data.timeSheet || []);
                }
            } else {
                setPunchID(null);
                setPunchedInTime(null);
                setPunchedOutTime(null);
                setUserTimeSheet([]);
                setTotalTime({ hours: 0, minutes: 0 });
            }

        } catch (error) {
            // console.error('Error fetching TimeSheet:', error);
            showToast(error.message || 'Failed to load timesheet', 'error');
            setUserTimeSheet([]);
            setPunchID(null);
            setPunchedInTime(null);
            setPunchedOutTime(null);
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
                StartTime: createDateFromTimeString(startTime, new Date(currentDate)),
                EndTime: createDateFromTimeString(endTime, new Date(currentDate)),
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

    const openDeleteConfirmation = (timeId, punchID) => {
        setTimeToDelete({ timeId, punchID });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!timeToDelete) return;

        try {
            const res = await timesheetService.delTimeSheet(timeToDelete.timeId, timeToDelete.punchID);
            if (res.status === 200) {
                showToast(res.data.message, 'success');
                setUserTimeSheet(prev => prev.filter(t => t._id !== timeToDelete.timeId));
            } else {
                showToast('Unable to Delete TimeSheet', 'warning');
            }
        } catch (err) {
            console.log(err);
            showToast('Failed to Delete TimeSheet', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setTimeToDelete(null);
        }
    };

    const handlePunchIn = async () => {
        try {
            const data = await timesheetService.punchIn();
            console.log('PunchIn Data: ', data);
            setPunchedInTime(data.punchIn.InTime)
            setPunchID(data.punchIn._id)
            showToast(data.message);
        }
        catch (error) {
            console.log(error);
        }
    };

    const handlePunchOut = async () => {
        const data = await timesheetService.punchOut(punchID);
        setPunchedOutTime(data.punchOut.OutTime)
        showToast(data.message);
    };

    useEffect(() => {
        fetchUserTimeSheet();
    }, [currentDate]);

    useEffect(() => {
        const calculateTotalTime = () => {
            if (userTimeSheet && userTimeSheet.length > 0) {
                const totalMilliseconds = userTimeSheet.reduce((acc, time) => {
                    const startTime = new Date(time.StartTime);
                    const endTime = new Date(time.EndTime);
                    return acc + (endTime - startTime);
                }, 0);

                const hours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
                const minutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60));

                setTotalTime({ hours, minutes });
            } else {
                setTotalTime({ hours: 0, minutes: 0 });
            }
        };
        calculateTotalTime();
    }, [userTimeSheet]);


    useEffect(() => {
        let timerInterval;

        if (punchedInTime && !punchedOutTime) {
            timerInterval = setInterval(() => {
                const now = new Date();
                const punchedInDate = new Date(punchedInTime);
                const diff = now - punchedInDate;

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setElapsedTime({ hours, minutes, seconds });
            }, 1000);
        }

        return () => {
            clearInterval(timerInterval);
        };
    }, [punchedInTime, punchedOutTime]);

    useEffect(() => {
        const today = new Date();
        const selectedDate = new Date(currentDate);

        // Set time to 0 to compare dates only, ignoring time
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        setIsToday(today.getTime() === selectedDate.getTime());
    }, [currentDate]);

    useEffect(() => {
        if (punchedInTime && punchedOutTime) {
            const start = new Date(punchedInTime);
            const end = new Date(punchedOutTime);
            const diff = end - start; // Difference in milliseconds

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setPunchDuration({ hours, minutes });
        } else {
            // Reset if not punched out
            setPunchDuration({ hours: 0, minutes: 0 });
        }
    }, [punchedInTime, punchedOutTime]);

    return (
        <div>
            <div className={getThemeClasses(
                'w-full text-gray-900 lg:grid lg:grid-cols-5 lg:gap-4 flex flex-col-reverse mt-4',
                'bg-[#18181b] text-white'
            )}>
                {/* TimeSheet Table */}
                <div className={`col-span-4`}>
                    <div className="flex items-center justify-end mb-4">
                        <input
                            type="date"
                            value={new Date(currentDate).toISOString().split('T')[0]}
                            onChange={(e) => {
                                const selectedDate = new Date(e.target.value);
                                const adjustedDate = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000);
                                setCurrentDate(adjustedDate.toLocaleDateString());
                            }}
                            className={getThemeClasses(
                                'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500'
                            )}
                        />
                    </div>
                    <div className={`overflow-x-auto ${tableContainerClasses}`}>
                        <table className="w-full">
                            <thead>
                                <tr className={tableHeaderClasses}>
                                    <th className={`py-3 px-4 text-left w-[60%] ${tableHeaderTextClasses}`}>Description</th>
                                    <th className={`py-3 px-4 text-left w-[15%] ${tableHeaderTextClasses}`}>Start</th>
                                    <th className={`py-3 px-4 text-left w-[15%] ${tableHeaderTextClasses}`}>End</th>
                                    <th className={`py-3 px-4 text-center w-[10%] ${tableHeaderTextClasses}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {punchedInTime && (
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
                                            />
                                        </td>
                                        <td >
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                className={getThemeClasses(
                                                    'flex px-0 py-2 border-0 border-b-2 border-gray-200 focus:border-gray-200 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400',
                                                    'flex px-0 py-2 border-0 border-b-2 border-gray-600 focus:border-gray-600 focus:outline-none bg-transparent text-white placeholder-gray-500'
                                                )}
                                                required
                                            />
                                        </td>
                                        <td>
                                            <div className='flex items-center justify-center'>
                                                <button
                                                    onClick={handleAddTime}
                                                    className={getThemeClasses(
                                                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
                                                        'dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70'
                                                    )}
                                                >
                                                    <FaPaperPlane size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {userTimeSheet.map(time => (
                                    <tr key={time._id} className={tableRowClasses}>
                                        <td className="py-3 px-4">
                                            {time.Description && (
                                                <span className={tableSecondaryTextClasses}>{time.Description}</span>
                                            )}
                                        </td>
                                        <td className={`py-3 px-4 ${tableSecondaryTextClasses}`}>
                                            <span>{new Date(time.StartTime).toLocaleTimeString()}</span>                                   </td>
                                        <td className={`py-3 px-4 ${tableSecondaryTextClasses}`}>
                                            <span>{new Date(time.EndTime).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        openDeleteConfirmation(time._id, time.PunchID)
                                                    }}
                                                    className={getThemeClasses(
                                                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                                        'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                                    )}
                                                    title="Delete TimeSheet"
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

                {/* Punch Clock UI */}
                <div className={`max-w-md p-2 ${tableContainerClasses} col-span-1 mb-4`}>
                    <h2 className={getThemeClasses("text-xl font-bold mb-4 text-black", "text-white")}>Clock In / Out</h2>

                    {/* Date Display */}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <FaCheckCircle className="mr-2 text-green-500" />
                        <span>
                            {new Date(currentDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>

                    {/* Clock In / Clock Out Boxes */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={getThemeClasses("bg-gray-100 p-4 rounded-lg", "dark:bg-zinc-800")}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Clock In</p>
                            <p className="text-lg font-semibold">
                                {punchedInTime ? new Date(punchedInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                            </p>
                        </div>
                        <div className={getThemeClasses("bg-gray-100 p-4 rounded-lg", "dark:bg-zinc-800")}>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Clock Out</p>
                            <p className="text-lg font-semibold">
                                {punchedOutTime ? new Date(punchedOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Timers */}
                    <div className="grid grid-cols-2 gap-4 text-center mb-6">
                        <div>
                            <p className="text-3xl font-bold">
                                {punchedInTime && !punchedOutTime ? (
                                    <span className='text-green-500'>
                                        {String(elapsedTime.hours).padStart(2, '0')}:
                                        {String(elapsedTime.minutes).padStart(2, '0')}:
                                        {String(elapsedTime.seconds).padStart(2, '0')}
                                    </span>
                                ) : punchedInTime && punchedOutTime ? (
                                    <>
                                        {String(punchDuration.hours).padStart(2, '0')}:
                                        {String(punchDuration.minutes).padStart(2, '0')}<span className='text-sm'>hrs</span>
                                    </>
                                ) : (
                                    '00:00:00'
                                )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Clocked Time</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">
                                {totalTime ? (
                                    <>
                                        {String(totalTime.hours).padStart(2, '0')}:
                                        {String(totalTime.minutes).padStart(2, '0')}<span className='text-sm'> hrs</span>
                                    </>
                                ) : (
                                    '00:00:00'
                                )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Logged Time</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        {!punchedInTime ? (
                            <button
                                onClick={handlePunchIn}
                                disabled={!isToday}
                                className={`col-span-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg transition-colors shadow-sm ${!isToday ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                            >
                                <FaPlus size={14} />
                                Clock In
                            </button>
                        ) : !punchedOutTime ? (
                            <button
                                onClick={handlePunchOut}
                                disabled={!isToday}
                                className={`col-span-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gray-800 rounded-lg transition-colors shadow-sm ${!isToday ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 dark:hover:bg-zinc-800'}`}
                            >
                                Clock Out
                                <FaArrowRight size={14} />
                            </button>
                        ) : (
                            <div className="col-span-2 text-center px-4 py-3 text-sm font-medium bg-zinc-800 text-gray-400 rounded-lg">
                                Shift Completed
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <CustomModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Confirm Deletion"
                    getThemeClasses={getThemeClasses}
                    actions={
                        <>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className={getThemeClasses(
                                    'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                                    'dark:text-gray-400 dark:hover:bg-gray-700'
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className={getThemeClasses(
                                    'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
                                    'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70'
                                )}
                            >
                                Delete
                            </button>
                        </>
                    }
                >
                    <p className={getThemeClasses(
                        'text-gray-600',
                        'dark:text-gray-400'
                    )}>
                        Are you sure you want to delete this time entry? This action cannot be undone.
                    </p>
                </CustomModal>
            </div>
        </div>
    );
};

export default TimeSheet;