import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaCog, FaDownload, FaShare, FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTimes, FaCalendarAlt, FaArrowRight, FaTasks, FaChartBar, FaRocket, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ReportGenerator = ({ projectId, projectName, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('executive');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [existingReports, setExistingReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'view'
  const [deletingReportId, setDeletingReportId] = useState(null);

  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);

    // Fetch existing reports for this project
    fetchExistingReports();
  }, [projectId]);

  const fetchExistingReports = async () => {
    if (!projectId) return;

    setLoadingReports(true);
    try {
      const response = await reportService.getReports({ projectId });
      if (response.success) {
        setExistingReports(response.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast('Failed to load existing reports', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!projectId) {
      setError('Project ID is required');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedReport(null);

    try {
      const response = await reportService.generateReport(projectId, {
        reportType,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null
      });

      if (response.success) {
        setGeneratedReport(response.report);
        showToast('Report generated successfully!', 'success');
        // Refresh the reports list
        fetchExistingReports();
      } else {
        setError(response.error || 'Failed to generate report');
        showToast(response.error || 'Failed to generate report', 'error');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      const errorMessage = err.error || err.message || 'Failed to generate report';
      setError(errorMessage);
      showToast(errorMessage, 'error');

      // If it's a limit error, switch to view tab to show existing reports
      if (err.error && err.error.includes('Maximum of 5 reports')) {
        setActiveTab('view');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      const response = await reportService.getReport(reportId);
      if (response.success) {
        setGeneratedReport(response.report);
        setActiveTab('generate'); // Switch to generate tab to show the report
      } else {
        showToast('Failed to load report', 'error');
      }
    } catch (err) {
      console.error('Error loading report:', err);
      showToast('Failed to load report', 'error');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    setDeletingReportId(reportId);
    try {
      const response = await reportService.deleteReport(reportId);
      if (response.success) {
        showToast('Report deleted successfully!', 'success');
        // Refresh the reports list
        fetchExistingReports();
        // If we're viewing the deleted report, clear it
        if (generatedReport && generatedReport.reportId === reportId) {
          setGeneratedReport(null);
        }
      } else {
        showToast(response.error || 'Failed to delete report', 'error');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      showToast(err.error || err.message || 'Failed to delete report', 'error');
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleDownloadReport = async () => {
    if (!generatedReport) return;

    try {
      // Use only raw content for PDF generation
      const reportContent = generatedReport.content.rawContent || 'No report content available.';

      // Create HTML content for PDF generation
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${projectName} - Progress Report</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 40px;
              color: #333;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              font-size: 18px;
              margin: 0;
              font-weight: bold;
            }
            .header h2 {
              font-size: 14px;
              margin: 5px 0;
              font-weight: normal;
            }
            .meta {
              font-size: 10px;
              margin-bottom: 20px;
            }
            .content {
              white-space: pre-wrap;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.3;
            }
            .separator {
              border-top: 1px solid #ccc;
              margin: 20px 0;
            }
            @media print {
              body { margin: 20px; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PROJECT PROGRESS REPORT</h1>
            <h2>${projectName}</h2>
            <h2>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
          </div>
          
          <div class="meta">
            <strong>Generated on:</strong> ${new Date(generatedReport.generatedAt).toLocaleDateString()}<br>
            <strong>Report Period:</strong> ${new Date(generatedReport.period.startDate).toLocaleDateString()} - ${new Date(generatedReport.period.endDate).toLocaleDateString()}
          </div>
          
          <div class="separator"></div>
          
          <div class="content">${reportContent}</div>
          
          <div class="separator"></div>
          
          <div style="text-align: center; font-size: 10px; color: #666; margin-top: 20px;">
            Report generated by TeamLabs AI-Powered Progress Reports<br>
            Generated at: ${new Date(generatedReport.generatedAt).toLocaleString()}
          </div>
        </body>
        </html>
      `;

      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after a delay
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const reportTypes = [
    { value: 'executive', label: 'Executive Summary', description: 'High-level overview for stakeholders' },
    { value: 'detailed', label: 'Detailed Analysis', description: 'Comprehensive project analysis' },
    { value: 'technical', label: 'Technical Report', description: 'Technical insights and metrics' },
    { value: 'dashboard', label: 'Dashboard Style', description: 'Visual metrics and KPIs' }
  ];

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/70 backdrop-blur-sm' : 'bg-gray-900/50 backdrop-blur-sm'} flex items-center justify-center z-50 transition-all duration-300`}>
      <div className={`${theme === 'dark'
        ? 'bg-gray-900 border border-gray-700 shadow-2xl'
        : 'bg-white border border-gray-200 shadow-2xl'
        } rounded-2xl max-w-5xl w-full mx-4 h-[90vh] overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <div className={`p-6 ${theme === 'dark'
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'
          } transition-all duration-300`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${theme === 'dark'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-100 text-blue-600'
                } transition-all duration-300`}>
                <FaFileAlt className="text-xl" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark'
                  ? 'text-white'
                  : 'text-gray-900'
                  } transition-colors duration-300`}>
                  Progress Reports
                </h2>
                <p className={`text-sm ${theme === 'dark'
                  ? 'text-gray-400'
                  : 'text-gray-600'
                  } transition-colors duration-300`}>
                  {projectName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex space-x-2 ${theme === 'dark'
            ? 'bg-gray-800 p-1'
            : 'bg-gray-100 p-1'
            } rounded-xl transition-all duration-300`}>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'generate'
                ? theme === 'dark'
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-white text-blue-600 shadow-lg'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              Generate New Report
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'view'
                ? theme === 'dark'
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-white text-blue-600 shadow-lg'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              View Reports ({existingReports.length}/5)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-8 ${theme === 'dark'
          ? 'bg-gray-900'
          : 'bg-gray-50'
          } transition-all duration-300 overflow-y-auto h-[calc(90vh-200px)]`}>
          {activeTab === 'generate' ? (
            // Generate Report Tab
            !generatedReport ? (
              <div className="space-y-6">
                {/* Report Type Selection */}
                <div>
                  <label className={`block text-lg font-semibold mb-6 ${theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                    } transition-colors duration-300`}>
                    Choose Report Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${reportType === type.value
                          ? theme === 'dark'
                            ? 'bg-blue-500/20 border-2 border-blue-400 shadow-lg shadow-blue-500/20'
                            : 'bg-blue-50 border-2 border-blue-500 shadow-lg shadow-blue-500/20'
                          : theme === 'dark'
                            ? 'bg-gray-800 border border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                            : 'bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        onClick={() => setReportType(type.value)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${reportType === type.value
                            ? theme === 'dark'
                              ? 'border-blue-400 bg-blue-400'
                              : 'border-blue-500 bg-blue-500'
                            : theme === 'dark'
                              ? 'border-gray-600'
                              : 'border-gray-300'
                            }`}>
                            {reportType === type.value && (
                              <div className="w-2 h-2 bg-white rounded-full m-1"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg ${theme === 'dark'
                              ? 'text-white'
                              : 'text-gray-900'
                              } transition-colors duration-300`}>
                              {type.label}
                            </h3>
                            <p className={`text-sm mt-1 ${theme === 'dark'
                              ? 'text-gray-400'
                              : 'text-gray-600'
                              } transition-colors duration-300`}>
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className={`block text-lg font-semibold mb-6 ${theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                    } transition-colors duration-300`}>
                    Report Period
                  </label>
                  <div className={`p-6 rounded-2xl ${theme === 'dark'
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white border border-gray-200'
                    } transition-all duration-300`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-3 ${theme === 'dark'
                          ? 'text-gray-300'
                          : 'text-gray-700'
                          } transition-colors duration-300`}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-3 ${theme === 'dark'
                          ? 'text-gray-300'
                          : 'text-gray-700'
                          } transition-colors duration-300`}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Options */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`flex items-center space-x-3 text-sm font-medium transition-all duration-300 ${theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <FaCog className="text-sm" />
                    <span>Advanced Options</span>
                  </button>

                  {showAdvanced && (
                    <div className={`mt-4 p-6 rounded-2xl transition-all duration-300 ${theme === 'dark'
                      ? 'bg-gray-800 border border-gray-700'
                      : 'bg-gray-100 border border-gray-200'
                      }`}>
                      <p className={`text-sm ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                        } transition-colors duration-300`}>
                        Advanced options will be available in future updates.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark'
                    ? 'bg-red-900/20 border-red-800'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <FaExclamationTriangle className={`text-xl ${theme === 'dark'
                        ? 'text-red-400'
                        : 'text-red-500'
                        }`} />
                      <p className={`text-sm font-medium ${theme === 'dark'
                        ? 'text-red-400'
                        : 'text-red-700'
                        } transition-colors duration-300`}>{error}</p>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={onClose}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating || existingReports.length >= 5}
                    className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-3 ${isGenerating || existingReports.length >= 5
                      ? theme === 'dark'
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : existingReports.length >= 5 ? (
                      <>
                        <FaExclamationTriangle />
                        <span>Limit Reached (5/5)</span>
                      </>
                    ) : (
                      <>
                        <FaFileAlt />
                        <span>Generate Report</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Report Limit Info */}
                {existingReports.length >= 5 && (
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${theme === 'dark'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-yellow-50 border-yellow-200'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <FaExclamationTriangle className={`text-lg ${theme === 'dark'
                        ? 'text-yellow-400'
                        : 'text-yellow-600'
                        }`} />
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark'
                          ? 'text-yellow-400'
                          : 'text-yellow-700'
                          }`}>
                          Maximum of 5 reports reached for this project
                        </p>
                        <p className={`text-xs mt-1 ${theme === 'dark'
                          ? 'text-yellow-300'
                          : 'text-yellow-600'
                          }`}>
                          Delete an existing report to generate a new one
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Generated Report Display
              <div className="space-y-8">
                {/* Report Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${theme === 'dark'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-green-100 text-green-600'
                      } transition-all duration-300`}>
                      <FaFileAlt className="text-xl" />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${theme === 'dark'
                        ? 'text-white'
                        : 'text-gray-900'
                        } transition-colors duration-300`}>
                        {generatedReport.reportType.charAt(0).toUpperCase() + generatedReport.reportType.slice(1)} Report
                      </h3>
                      <p className={`text-sm ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                        } transition-colors duration-300`}>
                        Generated on {new Date(generatedReport.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleDownloadReport}
                      title="Download PDF"
                      className={`p-2 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${theme === 'dark'
                        ? 'bg-green-100 hover:bg-green-300 text-white hover:shadow-green-500/25'
                        : 'bg-green-100 hover:bg-green-300 text-white hover:shadow-green-500/25'
                        }`}
                    >
                      <FaDownload className="text-green-500" />
                    </button>
                    <button
                      onClick={() => setGeneratedReport(null)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    >
                      Generate New
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className={`text-xl font-bold mb-6 ${theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                    } transition-colors duration-300`}>
                    Project Metrics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark'
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'bg-blue-50 border-blue-200'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${theme === 'dark'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-blue-100 text-blue-600'
                          }`}>
                          <FaTasks className="text-xl" />
                        </div>
                        <div className={`text-right ${theme === 'dark'
                          ? 'text-blue-400'
                          : 'text-blue-600'
                          } transition-colors duration-300`}>
                          <div className="text-3xl font-bold">
                            {generatedReport.content.metrics.totalTasks}
                          </div>
                          <div className="text-sm font-medium">Total Tasks</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                        } transition-colors duration-300`}>
                        <span>All project tasks</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'} cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-900 text-white border border-gray-600'}`}>
                            Total number of tasks created for this project
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${theme === 'dark' ? 'border-t-gray-800' : 'border-t-gray-900'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark'
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-green-50 border-green-200'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${theme === 'dark'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-100 text-green-600'
                          }`}>
                          <FaCheckCircle className="text-xl" />
                        </div>
                        <div className={`text-right ${theme === 'dark'
                          ? 'text-green-400'
                          : 'text-green-600'
                          } transition-colors duration-300`}>
                          <div className="text-3xl font-bold">
                            {generatedReport.content.metrics.completedTasks}
                          </div>
                          <div className="text-sm font-medium">Completed</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                        } transition-colors duration-300`}>
                        <span>Finished tasks</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-xs ${theme === 'dark' ? 'text-green-300' : 'text-green-500'} cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-900 text-white border border-gray-600'}`}>
                            Number of tasks that have been completed
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${theme === 'dark' ? 'border-t-gray-800' : 'border-t-gray-900'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark'
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-yellow-50 border-yellow-200'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${theme === 'dark'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-yellow-100 text-yellow-600'
                          }`}>
                          <FaChartBar className="text-xl" />
                        </div>
                        <div className={`text-right ${theme === 'dark'
                          ? 'text-yellow-400'
                          : 'text-yellow-600'
                          } transition-colors duration-300`}>
                          <div className="text-3xl font-bold">
                            {generatedReport.content.metrics.completionRate}%
                          </div>
                          <div className="text-sm font-medium">Completion Rate</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                        } transition-colors duration-300`}>
                        <span>Progress percentage</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-xs ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-500'} cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-900 text-white border border-gray-600'}`}>
                            Percentage of tasks completed out of total tasks
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${theme === 'dark' ? 'border-t-gray-800' : 'border-t-gray-900'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark'
                      ? 'bg-purple-500/10 border-purple-500/20'
                      : 'bg-purple-50 border-purple-200'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${theme === 'dark'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-purple-100 text-purple-600'
                          }`}>
                          <FaRocket className="text-xl" />
                        </div>
                        <div className={`text-right ${theme === 'dark'
                          ? 'text-purple-400'
                          : 'text-purple-600'
                          } transition-colors duration-300`}>
                          <div className="text-3xl font-bold">
                            {generatedReport.content.metrics.projectHealth}
                          </div>
                          <div className="text-sm font-medium">Health Score</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                        } transition-colors duration-300`}>
                        <span>Overall project health</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-xs ${theme === 'dark' ? 'text-purple-300' : 'text-purple-500'} cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-900 text-white border border-gray-600'}`}>
                            Overall project health based on completion rate, deadlines, and team utilization
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${theme === 'dark' ? 'border-t-gray-800' : 'border-t-gray-900'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                {/* Raw Content Display */}
                <div>
                  <h4 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    Report Content
                  </h4>
                  <div className={`p-6 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`prose prose-lg max-w-none ${theme === 'dark' ? 'prose-invert' : 'prose-gray'}`}>
                      <div className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>
                        {generatedReport.content.rawContent.split('\n').map((line, index) => {
                          const trimmedLine = line.trim();

                          // // Skip empty lines
                          // if (!trimmedLine) {
                          //   return <br key={index} />;
                          // }

                          // Main report title
                          if (trimmedLine.includes('PROGRESS REPORT')) {
                            return (
                              <h1 key={index} className={`text-2xl font-bold text-center mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {trimmedLine}
                              </h1>
                            );
                          }

                          // Project title (all caps)
                          if (trimmedLine.startsWith('PROJECT NAME:') || trimmedLine.startsWith('REPORTING PERIOD:') || trimmedLine.startsWith('REPORT DATE:')) {
                            return (
                              <div className='flex items-center gap-2'>
                                <div key={index} className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                  {trimmedLine.split(':')[0].trim()}:
                                </div>
                                <div key={index} className={`text-sm mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                  {trimmedLine.startsWith('REPORTING PERIOD:') ? (
                                    <div className='flex items-center gap-2'>
                                      {new Date(trimmedLine.split(':')[1].split('TO')[0].trim()).toLocaleDateString()}
                                      <FaArrowRight />
                                      {new Date(trimmedLine.split(':')[1].split('TO')[1].trim()).toLocaleDateString()}
                                    </div>
                                  ) : (
                                    <div>
                                      {trimmedLine.split(':')[1].trim()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          // Numbered sections (1. EXECUTIVE SUMMARY, 2. PROJECT PROGRESS, etc.)
                          if (/^\d+\.\s+[A-Z\s]+$/.test(trimmedLine)) {
                            return (
                              <h2 key={index} className={`text-xl font-bold mt-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {trimmedLine}
                              </h2>
                            );
                          }

                          // Bullet points (starting with -)
                          if (trimmedLine.startsWith('- ')) {
                            return (
                              <div key={index} className="flex items-start space-x-2 mb-2 ml-4">
                                <span className={`text-lg font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>•</span>
                                <span className="flex-1">{trimmedLine.substring(2)}</span>
                              </div>
                            );
                          }

                          // Regular paragraphs
                          return (
                            <p key={index} className=" leading-relaxed">
                              {trimmedLine}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={`flex justify-end space-x-4 pt-8 border-t transition-all duration-300 ${theme === 'dark'
                  ? 'border-gray-700'
                  : 'border-gray-200'
                  }`}>
                  <button
                    onClick={onClose}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-3 ${theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                      }`}
                  >
                    <FaDownload />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            // View Reports Tab
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-2xl font-bold ${theme === 'dark'
                  ? 'text-white'
                  : 'text-gray-900'
                  } transition-colors duration-300`}>
                  Existing Reports
                </h3>
                <button
                  onClick={fetchExistingReports}
                  disabled={loadingReports}
                  className={`p-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${loadingReports
                    ? theme === 'dark'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'hover:bg-gray-300 text-gray-700'
                    }`}
                >
                  <svg className={`w-5 h-5 ${loadingReports ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {loadingReports ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FaSpinner className={`animate-spin text-2xl mx-auto mb-4 ${theme === 'dark'
                      ? 'text-blue-400'
                      : 'text-blue-600'
                      }`} />
                    <p className={`text-lg ${theme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-600'
                      } transition-colors duration-300`}>Loading reports...</p>
                  </div>
                </div>
              ) : existingReports.length === 0 ? (
                <div className="text-center py-16">
                  <div className={`p-8 rounded-3xl mx-auto max-w-md ${theme === 'dark'
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white border border-gray-200'
                    } transition-all duration-300`}>
                    <FaFileAlt className={`text-6xl mx-auto mb-6 ${theme === 'dark'
                      ? 'text-gray-600'
                      : 'text-gray-400'
                      }`} />
                    <h4 className={`text-xl font-semibold mb-3 ${theme === 'dark'
                      ? 'text-white'
                      : 'text-gray-900'
                      } transition-colors duration-300`}>
                      No Reports Found
                    </h4>
                    <p className={`text-sm mb-6 ${theme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-600'
                      } transition-colors duration-300`}>
                      No reports have been generated for this project yet.
                    </p>
                    <button
                      onClick={() => setActiveTab('generate')}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                        }`}
                    >
                      Generate First Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingReports.map((report) => (
                    <div
                      key={report.reportId}
                      className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className={`p-3 rounded-xl ${theme === 'dark'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-blue-100 text-blue-600'
                              }`}>
                              <FaFileAlt />
                            </div>
                            <div>
                              <h4 className={`font-semibold text-lg ${theme === 'dark'
                                ? 'text-white'
                                : 'text-gray-900'
                                } transition-colors duration-300`}>
                                {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Report
                              </h4>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${report.status === 'completed'
                                ? theme === 'dark'
                                  ? 'bg-green-900/30 text-green-400 border border-green-800'
                                  : 'bg-green-100 text-green-800 border border-green-200'
                                : theme === 'dark'
                                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}>
                                {report.status}
                              </span>
                            </div>
                          </div>
                          <div className={`text-sm space-y-2 ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                            } transition-colors duration-300`}>
                            <div className="flex items-center space-x-6">
                              <span className="flex items-center space-x-2">
                                <FaClock className="text-xs" />
                                <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                              </span>
                              {report.period && (
                                <span className="flex items-center space-x-2">
                                  <FaCalendarAlt className="text-xs" />
                                  <span>Period: {new Date(report.period.startDate).toLocaleDateString()} - {new Date(report.period.endDate).toLocaleDateString()}</span>
                                </span>
                              )}
                            </div>
                            {report.metadata && (
                              <div className={`text-xs ${theme === 'dark'
                                ? 'text-gray-500'
                                : 'text-gray-500'
                                }`}>
                                Generation time: {Math.round(report.metadata.generationTime / 1000)}s |
                                Data points: {report.metadata.dataPoints} |
                                Model: {report.metadata.llmModel}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewReport(report.reportId)}
                            className={`p-2 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${theme === 'dark'
                              ? 'bg-blue-100 hover:bg-blue-300 text-white shadow-lg hover:shadow-blue-500/25'
                              : 'bg-blue-100 hover:bg-blue-300 text-white shadow-lg hover:shadow-blue-500/25'
                              }`}
                          >
                            <FaFileAlt className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => {
                              setGeneratedReport(report);
                              setActiveTab('generate');
                            }}
                            className={`p-2 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${theme === 'dark'
                              ? 'bg-green-100 hover:bg-green-300 text-white shadow-lg hover:shadow-green-500/25'
                              : 'bg-green-100 hover:bg-green-300 text-white shadow-lg hover:shadow-green-500/25'
                              }`}
                          >
                            <FaDownload className="text-green-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.reportId)}
                            disabled={deletingReportId === report.reportId}
                            className={`p-2 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${deletingReportId === report.reportId
                              ? theme === 'dark'
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : theme === 'dark'
                                ? 'bg-red-100 hover:bg-red-300 text-white shadow-lg hover:shadow-red-500/25'
                                : 'bg-red-100 hover:bg-red-300 text-white shadow-lg hover:shadow-red-500/25'
                              }`}
                          >
                            {deletingReportId === report.reportId ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTrash className="text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
