import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaCog, FaDownload, FaShare, FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTimes, FaCalendarAlt, FaArrowRight, FaTasks, FaChartBar, FaRocket, FaTrash, FaInfoCircle } from 'react-icons/fa';

import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ReportGenerator = ({ projectId, projectName, onClose, inline = false, canGenerate = true }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('executive');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    includeMetrics: true,
    includeRiskAssessment: true,
    includeTeamPerformance: true,
    reportDepth: 'standard', // 'brief', 'standard', 'detailed'
    focusAreas: [],
    customPrompt: '',
    includeCharts: false,
    language: 'en',
    format: 'professional' // 'professional', 'casual', 'technical'
  });
  const [existingReports, setExistingReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState({ isPremium: false, maxReports: 1, currentCount: 0 });
  const [activeTab, setActiveTab] = useState(canGenerate ? 'generate' : 'view'); // 'generate' or 'view'
  const [deletingReportId, setDeletingReportId] = useState(null);

  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (!canGenerate) {
      setActiveTab('view');
    }
  }, [canGenerate]);

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

        // Update subscription info if available
        if (response.subscription) {
          setSubscriptionInfo(response.subscription);
        }
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
        endDate: endDate ? new Date(endDate).toISOString() : null,
        advancedOptions: showAdvanced && subscriptionInfo.isPremium ? advancedOptions : null
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
      if (err.error && (err.error.includes('Maximum of') || err.error.includes('trial limit'))) {
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

        // Remove the deleted report from local state instead of refetching
        setExistingReports(prevReports =>
          prevReports.filter(report => report.reportId !== reportId)
        );

        // Update subscription info if needed (decrease current count)
        setSubscriptionInfo(prevInfo => ({
          ...prevInfo,
          currentCount: Math.max(0, prevInfo.currentCount - 1)
        }));

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
    <div className={inline ? 'w-full h-full' : `fixed inset-0 bg-gray-900/50 backdrop-blur-sm dark:bg-black/70 dark:backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300`}>
      <div className={`${inline ? 'bg-transparent' : 'bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 shadow-2xl dark:shadow-sm rounded-2xl'} max-w-7xl w-full ${inline ? '' : 'mx-4 h-[90vh] overflow-hidden'} transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className={` ${inline ? 'bg-transparent' : 'bg-white dark:bg-[#1e1e24]'} border-b border-gray-200 dark:border-zinc-800 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 transition-all duration-300`}>
                <FaFileAlt className="text-xl" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300`}>
                  Progress Reports
                </h2>
                <p className={`text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                  {projectName}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${subscriptionInfo.isPremium
                    ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                    }`}>
                    {subscriptionInfo.isPremium
                      ? `Premium: ${existingReports.length}/${subscriptionInfo.maxReports} reports`
                      : `Free Trial: ${existingReports.length}/${subscriptionInfo.maxReports} reports`
                    }
                  </span>
                </div>
              </div>
            </div>
            {!inline && (
              <div className="flex items-start -mt-14">
                <button onClick={onClose}
                  className={`p-2 rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-hover`}
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className={`flex space-x-2 bg-gray-100 mb-1 p-1 dark:bg-dark-bg dark:p-1 dark:border dark:border-zinc-800 rounded-xl transition-all duration-300`}>
            {canGenerate && (
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'generate'
                  ? 'bg-white text-emerald-600 shadow-lg dark:bg-zinc-800 dark:text-white dark:shadow-sm dark:border dark:border-zinc-750'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-850/50'
                  }`}
              >
                Generate New Report
              </button>
            )}
            <button
              onClick={() => {
                setGeneratedReport(null);
                setActiveTab('view');
              }}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'view' || (!canGenerate && !generatedReport)
                ? 'bg-white text-emerald-600 shadow-lg dark:bg-zinc-800 dark:text-white dark:shadow-sm dark:border dark:border-zinc-750'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-850/50'
                }`}
              style={!canGenerate && !generatedReport ? { pointerEvents: 'none' } : {}}
            >
              {canGenerate ? `View Reports (${existingReports.length}/${subscriptionInfo.maxReports})` : 'Existing Reports'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={` ${inline ? 'bg-transparent' : 'bg-gray-50 dark:bg-[#1e1e24]'} transition-all duration-300 overflow-y-auto flex-1`}>
          {activeTab === 'generate' ? (
            // Generate Report Tab
            !generatedReport ? (
              !canGenerate ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                  <div className="p-4 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 mb-4 animate-bounce">
                    <FaExclamationTriangle className="text-3xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h3>
                  <p className="text-sm text-gray-650 dark:text-zinc-400 max-w-md">
                    Only the Project Owner and Administrators can generate new project reports. You can view existing reports under the "Existing Reports" tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                {/* Report Type Selection */}
                <div>
                  <label className={`block text-lg font-semibold mb-6 text-gray-900 dark:text-white transition-colors duration-300`}>
                    Choose Report Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {reportTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${reportType === type.value
                          ? 'bg-emerald-50 border-2 border-emerald-500 dark:border-emerald-400 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/10'
                          : 'bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-dark-bg'
                          }`}
                        onClick={() => setReportType(type.value)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${reportType === type.value
                            ? 'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400'
                            : 'border-gray-300 dark:border-zinc-800'
                            }`}>
                            {reportType === type.value && (
                              <div className="w-2 h-2 bg-white rounded-full m-1"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg text-gray-900 dark:text-white transition-colors duration-300`}>
                              {type.label}
                            </h3>
                            <p className={`text-sm mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
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
                  <label className={`block text-lg font-semibold mb-6 text-gray-900 dark:text-white transition-colors duration-300`}>
                    Report Period
                  </label>
                  <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border dark:border-zinc-800 transition-all duration-300`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 dark:bg-dark-bg dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 dark:bg-dark-bg dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Options */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`flex items-center space-x-2 sm:space-x-3 text-sm font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white`}
                  >
                    <FaCog className="text-sm" />
                    <span>Advanced Options</span>
                    {!subscriptionInfo.isPremium && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border dark:border-purple-800`}>
                        Premium Only
                      </span>
                    )}
                  </button>

                  {showAdvanced && (
                    <div className={`mt-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 bg-gray-100 border border-gray-200 dark:bg-[#1e1e24] dark:border dark:border-zinc-800`}>
                      {subscriptionInfo.isPremium ? (
                        <div className="space-y-4 sm:space-y-6">
                          {/* Report Depth */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                              Report Depth
                            </label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                              {[
                                { value: 'brief', label: 'Brief', description: 'Quick overview' },
                                { value: 'standard', label: 'Standard', description: 'Balanced detail' },
                                { value: 'detailed', label: 'Detailed', description: 'Comprehensive analysis' }
                              ].map((depth) => (
                                <button
                                  key={depth.value}
                                  type="button"
                                  onClick={() => setAdvancedOptions(prev => ({ ...prev, reportDepth: depth.value }))}
                                  className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${advancedOptions.reportDepth === depth.value
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-400 dark:text-emerald-400'
                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-zinc-800 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                  <div className="font-semibold">{depth.label}</div>
                                  <div className="text-xs opacity-75 hidden sm:block">{depth.description}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Content Sections */}
                          <div>
                            <label className={`block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                              Include Sections
                            </label>
                            <div className="space-y-3">
                              {[
                                { key: 'includeMetrics', label: 'Project Metrics', description: 'Task counts, completion rates, etc.' },
                                { key: 'includeRiskAssessment', label: 'Risk Assessment', description: 'Project risks and mitigation strategies' },
                                { key: 'includeTeamPerformance', label: 'Team Performance', description: 'Individual and team productivity analysis' }
                              ].map((section) => (
                                <label key={section.key} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={advancedOptions[section.key]}
                                    onChange={(e) => setAdvancedOptions(prev => ({
                                      ...prev,
                                      [section.key]: e.target.checked
                                    }))}
                                    className={`w-4 h-4 rounded border-2 transition-all duration-300 ${advancedOptions[section.key]
                                      ? 'bg-emerald-500 border-emerald-500 dark:border-emerald-400'
                                      : 'border-gray-300 bg-white dark:border-zinc-800 dark:bg-dark-bg'
                                      }`}
                                  />
                                  <div>
                                    <div className={`text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                                      {section.label}
                                    </div>
                                    <div className={`text-xs text-gray-500 dark:text-gray-550 dark:text-gray-500`}>
                                      {section.description}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Report Format */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                              Report Format
                            </label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                              {[
                                { value: 'professional', label: 'Professional', description: 'Formal business style' },
                                { value: 'casual', label: 'Casual', description: 'Friendly, conversational' },
                                { value: 'technical', label: 'Technical', description: 'Detailed, data-focused' }
                              ].map((format) => (
                                <button
                                  key={format.value}
                                  type="button"
                                  onClick={() => setAdvancedOptions(prev => ({ ...prev, format: format.value }))}
                                  className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${advancedOptions.format === format.value
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-400 dark:text-emerald-400'
                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-dark-bg dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                  <div className="font-semibold">{format.label}</div>
                                  <div className="text-xs opacity-75 hidden sm:block">{format.description}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Prompt */}
                          <div>
                            <label className={`block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                              Custom Instructions (Optional)
                            </label>
                            <textarea
                              value={advancedOptions.customPrompt}
                              onChange={(e) => setAdvancedOptions(prev => ({ ...prev, customPrompt: e.target.value }))}
                              placeholder="Add specific instructions for the AI report generation..."
                              rows={3}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 dark:bg-dark-bg dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-1 dark:focus:ring-emerald-500`}
                            />
                          </div>

                          {/* Language Selection */}
                          <div>
                            <label className={`block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                              Report Language
                            </label>
                            <select
                              value={advancedOptions.language}
                              onChange={(e) => setAdvancedOptions(prev => ({ ...prev, language: e.target.value }))}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 border-gray-300 text-gray-900 dark:bg-dark-bg dark:border-zinc-800 dark:text-white`}
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="it">Italian</option>
                              <option value="pt">Portuguese</option>
                              <option value="zh">Chinese</option>
                              <option value="ja">Japanese</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        // Non-premium user content
                        <div className="text-center py-8">
                          <div className={`p-6 rounded-2xl mx-auto max-w-md bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border dark:border-purple-800`}>
                            <div className={`p-4 rounded-xl mx-auto mb-4 w-fit bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400`}>
                              <FaCog className="text-2xl" />
                            </div>
                            <h4 className={`text-xl font-semibold mb-3 text-gray-900 dark:text-white transition-colors duration-300`}>
                              Advanced Options
                            </h4>
                            <p className={`text-sm mb-6 text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                              Unlock powerful customization features with premium access:
                            </p>
                            <div className="space-y-3 text-left">
                              <div className={`flex items-center space-x-3 text-gray-700 dark:text-gray-300`}>
                                <div className={`w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400`}></div>
                                <span className="text-sm">Custom report depth (Brief/Standard/Detailed)</span>
                              </div>
                              <div className={`flex items-center space-x-3 text-gray-700 dark:text-gray-300`}>
                                <div className={`w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400`}></div>
                                <span className="text-sm">Choose report format (Professional/Casual/Technical)</span>
                              </div>
                              <div className={`flex items-center space-x-3 text-gray-700 dark:text-gray-300`}>
                                <div className={`w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400`}></div>
                                <span className="text-sm">Multi-language support (8 languages)</span>
                              </div>
                              <div className={`flex items-center space-x-3 text-gray-700 dark:text-gray-300`}>
                                <div className={`w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400`}></div>
                                <span className="text-sm">Custom AI instructions</span>
                              </div>
                              <div className={`flex items-center space-x-3 text-gray-700 dark:text-gray-300`}>
                                <div className={`w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400`}></div>
                                <span className="text-sm">Selective content sections</span>
                              </div>
                            </div>
                            <div className={`mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-emerald-50 border border-purple-200 dark:bg-gradient-to-r dark:from-purple-900/30 dark:to-emerald-900/30 dark:border dark:border-purple-800`}>
                              <p className={`text-sm font-medium text-purple-700 dark:text-purple-300`}>
                                Upgrade to Premium to unlock these advanced features
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className={`p-6 rounded-2xl border transition-all duration-300 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800`}>
                    <div className="flex items-center space-x-3">
                      <FaExclamationTriangle className={`text-xl text-red-500 dark:text-red-400`} />
                      <p className={`text-sm font-medium text-red-700 dark:text-red-400 transition-colors duration-300`}>{error}</p>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex justify-end gap-3 sm:gap-4 pb-4">
                  {!inline && (
                    <button
                      onClick={onClose}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-hover`}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating || existingReports.length >= subscriptionInfo.maxReports}
                    className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base ${isGenerating || existingReports.length >= subscriptionInfo.maxReports
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25'
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        <FaSpinner className="animate-spin text-sm sm:text-base" />
                        <span>Generating...</span>
                      </>
                    ) : existingReports.length >= subscriptionInfo.maxReports ? (
                      <>
                        <FaExclamationTriangle className="text-sm sm:text-base" />
                        <span className="hidden sm:inline">{subscriptionInfo.isPremium ? 'Limit Reached (10/10)' : 'Trial Limit Reached (1/1)'}</span>
                        <span className="sm:hidden">Limit Reached</span>
                      </>
                    ) : (
                      <>
                        <FaFileAlt className="text-sm sm:text-base" />
                        <span>Generate Report</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Report Limit Info */}
                {existingReports.length >= subscriptionInfo.maxReports && (
                  <div className={`p-4 rounded-xl border transition-all duration-300 bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20`}>
                    <div className="flex items-center space-x-3">
                      <FaExclamationTriangle className={`text-lg text-yellow-600 dark:text-yellow-400`} />
                      <div>
                        <p className={`text-sm font-medium text-yellow-700 dark:text-yellow-400`}>
                          {subscriptionInfo.isPremium
                            ? `Maximum of ${subscriptionInfo.maxReports} reports reached for this project`
                            : `You have reached your trial limit of ${subscriptionInfo.maxReports} report`
                          }
                        </p>
                        <p className={`text-xs mt-1 text-yellow-600 dark:text-yellow-300`}>
                          {subscriptionInfo.isPremium
                            ? 'Delete an existing report to generate a new one'
                            : `Upgrade to premium for up to ${subscriptionInfo.maxReports * 10} reports per project`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) ) : (
              // Generated Report Display
              <div className="space-y-6 sm:space-y-8">
                {/* Report Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 transition-all duration-300`}>
                      <FaFileAlt className="text-lg sm:text-xl" />
                    </div>
                    <div>
                      <h3 className={`text-lg sm:text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300`}>
                        {generatedReport.reportType.charAt(0).toUpperCase() + generatedReport.reportType.slice(1)} Report
                      </h3>
                      <p className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                        Generated on {new Date(generatedReport.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleDownloadReport}
                      title="Download PDF"
                      className={`p-2 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 bg-green-100 hover:bg-green-300 text-white hover:shadow-green-500/25 dark:bg-green-100 dark:hover:bg-green-300 dark:text-white dark:hover:shadow-green-500/25`}
                    >
                      <FaDownload className="text-green-500 text-sm sm:text-base" />
                    </button>
                    <button
                      onClick={() => setGeneratedReport(null)}
                      className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-dark-bg dark:hover:bg-zinc-800 dark:text-white dark:border dark:border-zinc-800`}
                    >
                      Generate New
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className={`text-xl font-bold mb-6 text-gray-900 dark:text-white transition-colors duration-300`}>
                    Project Metrics
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 flex flex-col bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20`}>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400`}>
                          <FaTasks className="text-lg sm:text-xl" />
                        </div>
                        <div className={`text-right text-emerald-600 dark:text-emerald-400 transition-colors duration-300`}>
                          <div className="text-2xl sm:text-3xl font-bold">
                            {generatedReport.content.metrics.totalTasks}
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Total Tasks</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs mt-auto text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                        <span>All project tasks</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-sm sm:text-base text-emerald-500 dark:text-emerald-300 cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 bg-gray-900 text-white border border-zinc-800 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-zinc-800`}>
                            Total number of tasks created for this project
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800`}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 flex flex-col bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20`}>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400`}>
                          <FaCheckCircle className="text-lg sm:text-xl" />
                        </div>
                        <div className={`text-right text-green-600 dark:text-green-400 transition-colors duration-300`}>
                          <div className="text-2xl sm:text-3xl font-bold">
                            {generatedReport.content.metrics.completedTasks}
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Completed</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs mt-auto text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                        <span>Finished tasks</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-sm sm:text-base text-green-500 dark:text-green-300 cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 bg-gray-900 text-white border border-zinc-800 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-zinc-800`}>
                            Number of tasks that have been completed
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800`}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 flex flex-col bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20`}>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400`}>
                          <FaChartBar className="text-lg sm:text-xl" />
                        </div>
                        <div className={`text-right text-yellow-600 dark:text-yellow-400 transition-colors duration-300`}>
                          <div className="text-2xl sm:text-3xl font-bold">
                            {generatedReport.content.metrics.completionRate}%
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Completion Rate</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs mt-auto text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                        <span>Progress percentage</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-sm sm:text-base text-yellow-500 dark:text-yellow-300 cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 bg-gray-900 text-white border border-zinc-800 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-zinc-800`}>
                            Percentage of tasks completed out of total tasks
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800`}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 flex flex-col bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20`}>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400`}>
                          <FaRocket className="text-lg sm:text-xl" />
                        </div>
                        <div className={`text-right text-purple-600 dark:text-purple-400 transition-colors duration-300`}>
                          <div className="text-2xl sm:text-3xl font-bold">
                            {generatedReport.content.metrics.projectHealth}
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Health Score</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs mt-auto text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                        <span>Overall project health</span>
                        <div className="relative group">
                          <FaInfoCircle className={`text-sm sm:text-base text-purple-500 dark:text-purple-300 cursor-help`} />
                          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 bg-gray-900 text-white border border-zinc-800 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-zinc-800`}>
                            Overall project health based on completion rate, deadlines, and team utilization
                            <div className={`absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                {/* Raw Content Display */}
                <div>
                  <h4 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white transition-colors duration-300`}>
                    Report Content
                  </h4>
                  <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 bg-white border-gray-200 dark:bg-[#1e1e24] dark:border-zinc-800`}>
                    <div className={`prose prose-sm sm:prose-lg max-w-none prose-gray dark:prose-invert`}>
                      <div className={`text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-300`}>
                        {generatedReport.content.rawContent.split('\n').map((line, index) => {
                          const trimmedLine = line.trim();
                          // // Skip empty lines
                          // if (!trimmedLine) {
                          //   return <br key={index} />;
                          // }

                          // Main report title
                          if (trimmedLine.includes('PROGRESS REPORT')) {
                            return (
                              <h1 key={index} className={`text-lg sm:text-2xl font-bold text-center mb-2 sm:mb-4 text-gray-900 dark:text-white`}>
                                {trimmedLine}
                              </h1>
                            );
                          }

                          // Project title (all caps)
                          if (trimmedLine.startsWith('PROJECT:') || trimmedLine.startsWith('REPORTING PERIOD:') || trimmedLine.startsWith('REPORT DATE:') || trimmedLine.startsWith('DATE GENERATED:')) {
                            return (
                              <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2'>
                                <div key={index} className={`text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400`}>
                                  {trimmedLine.split(':')[0].trim()}:
                                </div>
                                <div key={index} className={`text-xs sm:text-sm text-emerald-600 dark:text-emerald-400`}>
                                  {trimmedLine.startsWith('REPORTING PERIOD:') ? (
                                    <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                                      <span>{trimmedLine.split(':')[1].trim()}</span>
                                    </div>
                                  ) : trimmedLine.startsWith('DATE GENERATED:') ? (
                                    <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                                      <span>{new Date(generatedReport.generatedAt).toLocaleDateString()}</span>
                                    </div>
                                  ) : (
                                    <div className="break-words">
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
                              <h2 key={index} className={`text-lg sm:text-xl font-bold mt-3 sm:mt-4 mb-2 sm:mb-3 text-gray-900 dark:text-white`}>
                                {trimmedLine}
                              </h2>
                            );
                          }

                          // Bullet points (starting with -)
                          if (trimmedLine.startsWith('- ')) {
                            return (
                              <div key={index} className="flex items-start space-x-2 mb-2 ml-2 sm:ml-4">
                                <span className={`text-sm sm:text-lg font-bold flex-shrink-0 text-emerald-600 dark:text-emerald-400`}>•</span>
                                <span className="flex-1 text-sm sm:text-base leading-relaxed">{trimmedLine.substring(2)}</span>
                              </div>
                            );
                          }

                          // Regular paragraphs
                          return (
                            <p key={index} className="text-sm sm:text-base leading-relaxed mb-2 sm:mb-3">
                              {trimmedLine}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={`flex justify-end gap-3 sm:gap-4 sm:space-x-4 transition-all duration-300 pb-4 sm:pb-6 border-gray-200 dark:border-zinc-800`}>
                  <button
                    onClick={onClose}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-hover`}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white dark:shadow-lg dark:hover:shadow-emerald-500/25`}
                  >
                    <FaDownload className="text-sm sm:text-base" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            // View Reports Tab
            <div className="space-y-6">
              <div className="flex flex-row items-center justify-between gap-4">
                <h3 className={`text-xl sm:text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300`}>
                  Existing Reports ({existingReports.length}/{subscriptionInfo.maxReports})
                </h3>
                <button
                  onClick={fetchExistingReports}
                  disabled={loadingReports}
                  className={`p-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 self-start sm:self-auto ${loadingReports
                    ? 'text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                    : 'hover:bg-gray-300 text-gray-700 dark:bg-dark-bg dark:hover:bg-zinc-800 dark:text-white dark:border dark:border-zinc-800'
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
                    <FaSpinner className={`animate-spin text-2xl mx-auto mb-4 text-emerald-600 dark:text-emerald-400`} />
                    <p className={`text-lg text-gray-600 dark:text-gray-400 transition-colors duration-300`}>Loading reports...</p>
                  </div>
                </div>
              ) : existingReports.length === 0 ? (
                <div className="text-center py-16">
                  <div className={`p-8 rounded-3xl mx-auto max-w-md bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border dark:border-zinc-800 transition-all duration-300`}>
                    <FaFileAlt className={`text-6xl mx-auto mb-6 text-gray-400 dark:text-gray-600`} />
                    <h4 className={`text-xl font-semibold mb-3 text-gray-900 dark:text-white transition-colors duration-300`}>
                      No Reports Found
                    </h4>
                    <p className={`text-sm mb-6 text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                      No reports have been generated for this project yet.
                    </p>
                    <button
                      onClick={() => setActiveTab('generate')}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white dark:shadow-lg dark:hover:shadow-emerald-500/25`}
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
                      className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.01] bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-[#1e1e24] dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-dark-bg`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 mb-4">
                            <div className={`p-2 sm:p-3 lg:rounded-xl rounded-lg flex-shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400`}>
                              <FaFileAlt className="text-sm sm:text-base" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-semibold text-base sm:text-lg text-gray-900 dark:text-white transition-colors duration-300`}>
                                {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Report
                              </h4>
                            </div>
                            <span className={` float-left inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${report.status === 'completed'
                              ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border dark:border-green-800'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border dark:border-yellow-800'
                              }`}>
                              {report.status}
                            </span>
                          </div>
                          <div className={`text-xs sm:text-sm space-y-2 text-gray-600 dark:text-gray-400 transition-colors duration-300`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0">
                              <span className="flex items-center space-x-2">
                                <FaClock className="text-xs flex-shrink-0" />
                                <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                              </span>
                              {report.period && (
                                <span className="flex items-center space-x-2">
                                  <FaCalendarAlt className="text-xs flex-shrink-0" />
                                  <span className="break-words">Period: {new Date(report.period.startDate).toLocaleDateString()} - {new Date(report.period.endDate).toLocaleDateString()}</span>
                                </span>
                              )}
                            </div>
                            {report.metadata && (
                              <div className={`text-xs text-gray-500 dark:text-gray-500`}>
                                Generation time: {Math.round(report.metadata.generationTime / 1000)}s |
                                Data points: {report.metadata.dataPoints} |
                                Model: {report.metadata.llmModel}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end lg:justify-start space-x-2 sm:space-x-3">
                          <button
                            onClick={() => handleViewReport(report.reportId)}
                            className={`p-2 sm:p-2 rounded-full font-semibold transition-all duration-300 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-600 hover:text-emerald-700 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 dark:text-emerald-400 dark:hover:text-emerald-300`}
                            title="View Report"
                          >
                            <FaFileAlt className="text-sm" />
                          </button>
                          <button
                            onClick={() => {
                              setGeneratedReport(report);
                              setActiveTab('generate');
                            }}
                            className={`p-2 sm:p-2 rounded-full font-semibold transition-all duration-300 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 dark:bg-green-600/20 dark:hover:bg-green-600/30 dark:text-green-400 dark:hover:text-green-300`}
                            title="Download Report"
                          >
                            <FaDownload className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.reportId)}
                            disabled={deletingReportId === report.reportId}
                            className={`p-2 sm:p-2 rounded-full font-semibold transition-all duration-300 flex items-center justify-center ${deletingReportId === report.reportId
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                              : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 dark:bg-red-600/20 dark:hover:bg-red-600/30 dark:text-red-400 dark:hover:text-red-300'
                              }`}
                            title="Delete Report"
                          >
                            {deletingReportId === report.reportId ? (
                              <FaSpinner className="animate-spin text-sm" />
                            ) : (
                              <FaTrash className="text-sm" />
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
