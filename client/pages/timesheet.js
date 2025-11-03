import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs'; // <-- Import exceljs
import { saveAs } from 'file-saver'; // <-- Import file-saver
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { timesheetService } from '../services/api';
import { FaPlus, FaCheckCircle, FaArrowRight, FaPaperPlane, FaDownload, FaArrowLeft } from 'react-icons/fa'; // <-- Import FaArrowLeft
import { MdDelete } from 'react-icons/md';
import { useToast } from '../context/ToastContext';
import { useThemeClasses } from '../components/shared/hooks/useThemeClasses';
import CustomModal from '../components/shared/CustomModal';

const TimeSheet = () => {
    const { userDetails, getTableHeaderClasses, getTableHeaderTextClasses, getTableRowClasses, getTableTextClasses, getTableSecondaryTextClasses, organization } = useGlobal();
    const getThemeClasses = useThemeClasses();
    const { showToast } = useToast();
    const [userTimeSheet, setUserTimeSheet] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());
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

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState('dateRange');
    const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [reportLoading, setReportLoading] = useState(false);

    const tableContainerClasses = getThemeClasses(
        'rounded-xl border border-gray-200',
        'dark:border-gray-700'
    );
    const tableHeaderClasses = getTableHeaderClasses();
    const tableHeaderTextClasses = getTableHeaderTextClasses();
    const tableRowClasses = getTableRowClasses();
    const tableSecondaryTextClasses = getTableSecondaryTextClasses();

    const fetchUserTimeSheet = async () => {
        // ... (existing function, no changes needed)
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
                } else {
                     setPunchID(null);
                     setPunchedInTime(null);
                     setPunchedOutTime(null);
                     setUserTimeSheet([]);
                     setTotalTime({ hours: 0, minutes: 0 });
                }
            } else {
                setPunchID(null);
                setPunchedInTime(null);
                setPunchedOutTime(null);
                setUserTimeSheet([]);
                setTotalTime({ hours: 0, minutes: 0 });
            }

        } catch (error) {
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
        // ... (existing function, no changes needed)
         if (!timeString) {
            return null; // Or throw an error
        }
        const [hours, minutes] = timeString.split(':');
        const newDate = new Date(baseDate); // Create a copy to avoid modifying the original
        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return newDate;
    }

    const handleAddTime = async () => {
        // ... (existing function, no changes needed)
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
        // ... (existing function, no changes needed)
        setTimeToDelete({ timeId, punchID });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        // ... (existing function, no changes needed)
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
        // ... (existing function, no changes needed)
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
        // ... (existing function, no changes needed)
         const data = await timesheetService.punchOut(punchID);
        setPunchedOutTime(data.punchOut.OutTime)
        showToast(data.message);
    };

    /**
     * Calculates the duration between two date strings in HH:MM format
     */
    const getDuration = (start, end) => {
        const diff = new Date(end) - new Date(start);
        if (diff < 0) return '00:00';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    /**
     * Generates and downloads an XLSX report using exceljs
     */
    const generateExcelReport = async (data, criteria, user) => {
        if (!data || data.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Timesheet Report');

        // --- Styles ---
        const titleStyle = { font: { bold: true, size: 16 }, fgColor: { argb: 'FFF5F242' } };
        const boldStyle = { font: { bold: true } };
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } }; // Light Grey
        const headerStyle = { font: { bold: true }, fill: headerFill };
        const separatorFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAE634' } }; // Lighter Grey
        const separatorStyle = { font: { bold: true }, fill: separatorFill };
        const grandTotalFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF42A1F5' } }; // Light Blue
        const grandTotalStyle = { font: { bold: true, size: 12 }, fill: grandTotalFill };

        // --- Add User Details and Titles ---
        worksheet.addRow([`User Timesheet Report - ${criteria}` ]).getCell(1).style = titleStyle;
        worksheet.mergeCells('A1:E1');
        worksheet.addRow([]); // Blank row

        worksheet.addRow(['Name:', user?.firstName + " " + user?.lastName || 'N/A']).getCell(1).style = boldStyle;
        worksheet.addRow(['Role:', user?.role || 'N/A']).getCell(1).style = boldStyle;
        worksheet.addRow(['Email:', user?.email || 'N/A']).getCell(1).style = boldStyle;
        worksheet.addRow(['Organization:', organization?.Name || 'N/A']).getCell(1).style = boldStyle;
        // worksheet.addRow(['Date Range:', criteria]).getCell(1).style = boldStyle;
        worksheet.addRow([]); // Blank row

        // --- Define Column Headers ---
        const headerRow = worksheet.addRow(['Date', 'Description', 'Start Time', 'End Time', 'Duration (HH:MM)']);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });

        // --- Group entries by date ---
        const entriesByDate = data.reduce((acc, entry) => {
            const date = new Date(entry.StartTime).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(entry);
            return acc;
        }, {});

        let grandTotalMs = 0;

        // --- Process each day's entries ---
        for (const date in entriesByDate) {
            let dailyTotalMs = 0;

            entriesByDate[date].forEach((entry, index) => {
                const startTime = new Date(entry.StartTime);
                const endTime = new Date(entry.EndTime);
                const durationMs = (endTime - startTime > 0) ? (endTime - startTime) : 0;
                dailyTotalMs += durationMs;

                worksheet.addRow([
                    date,
                    entry.Description,
                    startTime.toLocaleTimeString(),
                    endTime.toLocaleTimeString(),
                    getDuration(startTime, endTime)
                ]);
            });

            grandTotalMs += dailyTotalMs;

            // --- Daily Differentiator Row (Total) with Color ---
            const totalHours = Math.floor(dailyTotalMs / (1000 * 60 * 60));
            const totalMinutes = Math.floor((dailyTotalMs % (1000 * 60 * 60)) / (1000 * 60));
            const totalRow = worksheet.addRow([
                'Worked for', '', '', '',
                `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')} hrs`
            ]);
            totalRow.eachCell((cell) => {
                cell.style = separatorStyle;
            });
            worksheet.addRow([]); // Blank row
        }

        // --- Add Grand Total ---
        worksheet.addRow([]); // Blank row
        const grandTotalHours = Math.floor(grandTotalMs / (1000 * 60 * 60));
        const grandTotalMinutes = Math.floor((grandTotalMs % (1000 * 60 * 60)) / (1000 * 60));
        const grandTotalRow = worksheet.addRow([
            'Grand Total', '', '', '',
            `${String(grandTotalHours).padStart(2, '0')}:${String(grandTotalMinutes).padStart(2, '0')} hrs`
        ]);
        grandTotalRow.eachCell((cell) => {
            cell.style = grandTotalStyle;
        });

        // --- Set Column Widths ---
        worksheet.getColumn('A').width = 15; // Date
        worksheet.getColumn('B').width = 80; // Description
        worksheet.getColumn('C').width = 17; // Start Time
        worksheet.getColumn('D').width = 17; // End Time
        worksheet.getColumn('E').width = 17; // Duration

        // --- Generate and Download File ---
        try {
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `TimeSheet_Report_${criteria.replace(/ /g, '_')}.xlsx`);
        } catch (error) {
             console.error("Error writing excel buffer", error);
             showToast('Error generating Excel file.', 'error');
        }
    };


    /**
     * Handles the report download logic
     */
    const handleDownloadReport = async () => {
        setReportLoading(true);
        let start, end, criteria;
        const today = new Date();

        if (reportType === 'month') {
            const [year, month] = reportMonth.split('-').map(Number);
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 0);
            if (end > today) end = today;
            criteria = start.toLocaleString('default', { month: 'long', year: 'numeric' });
        } else {
            start = new Date(reportStartDate);
            end = new Date(reportEndDate);
            if (start > end) {
                showToast('Start date cannot be after end date', 'error');
                setReportLoading(false);
                return;
            }
            // Use local date strings for criteria display
            criteria = `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
            // For API call, ensure we send YYYY-MM-DD
            start = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
            end = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
        }

        try {
            const data = await timesheetService.getTimesheetReport(
                start.toISOString().split('T')[0], // YYYY-MM-DD
                end.toISOString().split('T')[0]   // YYYY-MM-DD
            );

            if (data.message && (!data.timeSheets || data.timeSheets.length === 0)) {
                 showToast(data.message, 'warning'); // Show message if no data
            }

            if (!data.timeSheets || data.timeSheets.length === 0) {
                showToast('No timesheet entries found for this period.', 'info');
                setReportLoading(false);
                return;
            }

            // Generate and Download XLSX using exceljs
            await generateExcelReport(data.timeSheets, criteria, userDetails);

            showToast('Report downloaded successfully!', 'success');
            setIsReportModalOpen(false);

        } catch (error) {
            console.error('Error downloading report:', error);
            showToast(error.message || 'Failed to download report', 'error');
        } finally {
            setReportLoading(false);
        }
    };
    
    // --- START NEW DATE CHANGE HANDLER ---
    /**
     * Handles changing the current date by one day, forward or backward
     */
    const handleDateChange = (direction) => {
        const currentDateObj = new Date(currentDate);
        if (direction === 'prev') {
            currentDateObj.setDate(currentDateObj.getDate() - 1);
        } else if (direction === 'next') {
            currentDateObj.setDate(currentDateObj.getDate() + 1);
        }
        setCurrentDate(currentDateObj.toLocaleDateString());
    };
    // --- END NEW DATE CHANGE HANDLER ---


    // --- END NEW HELPER FUNCTIONS ---

    useEffect(() => {
        fetchUserTimeSheet();
    }, [currentDate, userDetails]); // Added userDetails dependency

    useEffect(() => {
        // ... (calculateTotalTime, no changes needed)
         const calculateTotalTime = () => {
            if (userTimeSheet && userTimeSheet.length > 0) {
                const totalMilliseconds = userTimeSheet.reduce((acc, time) => {
                    const startTime = new Date(time.StartTime);
                    const endTime = new Date(time.EndTime);
                     // Make sure endTime is after startTime
                     const diff = endTime > startTime ? endTime - startTime : 0;
                    return acc + diff;
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
        // ... (elapsedTime timer, no changes needed)
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
        } else {
             // Clear interval if not punched in or already punched out
             setElapsedTime({ hours: 0, minutes: 0, seconds: 0 }); // Reset timer display
        }

        return () => {
            clearInterval(timerInterval);
        };
    }, [punchedInTime, punchedOutTime]);

    useEffect(() => {
        // ... (isToday check, no changes needed)
          const today = new Date();
        const selectedDate = new Date(currentDate);

        // Set time to 0 to compare dates only, ignoring time
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        setIsToday(today.getTime() === selectedDate.getTime());
    }, [currentDate]);

    useEffect(() => {
        // ... (punchDuration calculation, no changes needed)
          if (punchedInTime && punchedOutTime) {
            const start = new Date(punchedInTime);
            const end = new Date(punchedOutTime);
            const diff = end - start; // Difference in milliseconds

             if (diff > 0) { // Only calculate if end is after start
                 const hours = Math.floor(diff / (1000 * 60 * 60));
                 const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                 setPunchDuration({ hours, minutes });
             } else {
                  setPunchDuration({ hours: 0, minutes: 0 });
             }
        } else {
            // Reset if not punched out or not punched in yet
            setPunchDuration({ hours: 0, minutes: 0 });
        }
    }, [punchedInTime, punchedOutTime]);

    return (
        // --- JSX Structure ---
        // The overall JSX structure remains the same as the previous version.
        // No changes needed here, only the generateExcelReport function was modified.
        <div>
            <div className={getThemeClasses(
                'w-full text-gray-900 lg:grid lg:grid-cols-5 lg:gap-4 flex flex-col-reverse mt-4',
                'bg-[#18181b] text-white'
            )}>
                {/* TimeSheet Table */}
                <div className={`col-span-4`}>
                    {/* --- MODIFIED SECTION --- */}
                    <div className="flex items-center justify-end mb-4 gap-4">
                        <div className="flex-col text-right">
                           <button
                                onClick={() => setIsReportModalOpen(true)}
                                className={getThemeClasses(
                                    'flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50',
                                    'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600'
                                )}
                           >
                                <FaDownload size={14} />
                                Download Report
                           </button>
                        </div>
                        
                        {/* --- Date Navigation --- */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleDateChange('prev')}
                                className={getThemeClasses(
                                    'p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50',
                                    'dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                                )}
                                title="Previous day"
                            >
                                <FaArrowLeft size={14} />
                            </button>
                            
                            <input
                                type="date"
                                value={new Date(currentDate).toISOString().split('T')[0]}
                                onChange={(e) => {
                                    const selectedDate = new Date(e.target.value);
                                    // Adjust date based on timezone offset to keep the selected date correct
                                    const adjustedDate = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000);
                                    setCurrentDate(adjustedDate.toLocaleDateString()); // Use local date string
                                }}
                                className={getThemeClasses(
                                    'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500'
                                )}
                            />

                            <button
                                onClick={() => handleDateChange('next')}
                                className={getThemeClasses(
                                    'p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50',
                                    'dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                                )}
                                title="Next day"
                            >
                                <FaArrowRight size={14} />
                            </button>
                        </div>
                        {/* --- End Date Navigation --- */}

                    </div>
                    {/* --- END MODIFIED SECTION --- */}

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
                                {punchedInTime && !punchedOutTime && isToday && ( // Only show input row if punched in, not out, and it's today
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
                                                    disabled={!description || !startTime || !endTime} // Disable if fields are empty
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
                                            {/* Format time nicely */}
                                            <span>{new Date(time.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className={`py-3 px-4 ${tableSecondaryTextClasses}`}>
                                            <span>{new Date(time.EndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                 {/* Show message if no timesheet entries */}
                                 {userTimeSheet.length === 0 && !loading && (
                                     <tr className={tableRowClasses}>
                                         <td colSpan="4" className={`py-4 px-4 text-center ${tableSecondaryTextClasses}`}>
                                             {punchedInTime ? "No time logged yet for this day." : "Clock in to start logging time."}
                                         </td>
                                     </tr>
                                 )}
                                 {/* Show loading indicator */}
                                 {loading && (
                                      <tr className={tableRowClasses}>
                                         <td colSpan="4" className={`py-4 px-4 text-center ${tableSecondaryTextClasses}`}>
                                            Loading timesheet...
                                         </td>
                                      </tr>
                                 )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Punch Clock UI */}
                <div className={`max-w-md p-4 ${tableContainerClasses} col-span-1 mb-4`}> {/* Increased padding */}
                    <h2 className={getThemeClasses("text-xl font-bold mb-4 text-black", "text-white")}>Clock In / Out</h2>

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

                    <div className="grid grid-cols-2 gap-4 text-center mb-6">
                        <div>
                             <p className="text-3xl font-bold">
                                {punchedInTime && !punchedOutTime && isToday ? ( // Live timer only if punched in today and not out
                                    <span className='text-green-500'>
                                        {String(elapsedTime.hours).padStart(2, '0')}:
                                        {String(elapsedTime.minutes).padStart(2, '0')}:
                                        {String(elapsedTime.seconds).padStart(2, '0')}
                                    </span>
                                ) : punchedInTime && punchedOutTime ? ( // Show duration if punched out
                                    <>
                                        {String(punchDuration.hours).padStart(2, '0')}:
                                        {String(punchDuration.minutes).padStart(2, '0')}<span className='text-sm'> hrs</span>
                                    </>
                                ) : ( // Default
                                    '00:00'
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
                                    '00:00'
                                )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Logged Time</p>
                        </div>
                    </div>

                     <div className="grid grid-cols-1 gap-4"> {/* Changed to grid-cols-1 for better stacking */}
                        {!punchedInTime && isToday ? ( // Show Clock In only if it's today and not punched in
                            <button
                                onClick={handlePunchIn}
                                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg transition-colors shadow-sm hover:bg-green-700`}
                            >
                                <FaPlus size={14} />
                                Clock In
                            </button>
                        ) : punchedInTime && !punchedOutTime && isToday ? ( // Show Clock Out only if punched in today and not out
                            <button
                                onClick={handlePunchOut}
                                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-lg transition-colors shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800`} // Changed color to red
                            >
                                Clock Out
                                <FaArrowRight size={14} />
                            </button>
                        ) : punchedOutTime ? ( // Show Shift Completed if punched out
                             <div className={`text-center px-4 py-3 text-sm font-medium rounded-lg ${getThemeClasses("bg-gray-100 text-gray-500", "dark:bg-zinc-800 dark:text-gray-400")}`}>
                                Shift Completed for this day
                             </div>
                         ) : !isToday ? ( // Message if viewing a past/future date
                             <div className={`text-center px-4 py-3 text-sm font-medium rounded-lg ${getThemeClasses("bg-gray-100 text-gray-500", "dark:bg-zinc-800 dark:text-gray-400")}`}>
                                 Cannot Clock In/Out on past/future dates
                             </div>
                         ) : null /* Should not happen, but prevents rendering nothing */
                        }
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


                {/* Report Download Modal */}
                <CustomModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    title="Download Timesheet Report"
                    getThemeClasses={getThemeClasses}
                    actions={
                        <>
                            <button
                                onClick={() => setIsReportModalOpen(false)}
                                className={getThemeClasses(
                                    'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200',
                                    'dark:text-gray-400 dark:hover:bg-gray-700'
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownloadReport}
                                disabled={reportLoading}
                                className={getThemeClasses(
                                    'px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50',
                                    'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70'
                                )}
                            >
                                {reportLoading ? 'Generating...' : 'Download XLSX'}
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1 gap-1">
                            <button
                                onClick={() => setReportType('dateRange')}
                                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${reportType === 'dateRange' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                By Date Range
                            </button>
                            <button
                                onClick={() => setReportType('month')}
                                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${reportType === 'month' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                By Month
                            </button>
                        </div>

                        {reportType === 'dateRange' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={reportStartDate}
                                        onChange={(e) => setReportStartDate(e.target.value)}
                                        className={getThemeClasses(
                                            'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                            'dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                                        )}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={reportEndDate}
                                        onChange={(e) => setReportEndDate(e.target.value)}
                                        className={getThemeClasses(
                                            'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                            'dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                                        )}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Select Month</label>
                                <input
                                    type="month"
                                    value={reportMonth}
                                    onChange={(e) => setReportMonth(e.target.value)}
                                    className={getThemeClasses(
                                        'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                                        'dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </CustomModal>

            </div>
        </div>
    );
};

export default TimeSheet;