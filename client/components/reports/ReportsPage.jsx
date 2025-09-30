import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaCog, FaDownload, FaEye, FaTrash, FaPlus, FaFilter, FaSearch, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ReportGenerator from './ReportGenerator';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filters, setFilters] = useState({
    projectId: '',
    reportType: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'configs'

  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [filters, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'reports') {
        const response = await reportService.getReports(filters);
        if (response.success) {
          setReports(response.reports);
          setPagination(response.pagination);
        }
      } else {
        const response = await reportService.getConfigs(filters);
        if (response.success) {
          setConfigs(response.configs);
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = (project) => {
    setSelectedProject(project);
    setShowGenerator(true);
  };

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      const response = await reportService.deleteConfig(configId);
      if (response.success) {
        showToast('Configuration deleted successfully', 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      showToast('Failed to delete configuration', 'error');
    }
  };

  const handleDownloadReport = (report) => {
    const reportContent = `
# ${report.projectId?.Name || 'Project'} - ${report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Report

**Generated on:** ${new Date(report.generatedAt).toLocaleDateString()}
**Period:** ${new Date(report.period.startDate).toLocaleDateString()} - ${new Date(report.period.endDate).toLocaleDateString()}

## Executive Summary
${report.content.executiveSummary}

## Detailed Analysis
${report.content.detailedAnalysis}

## Recommendations
${report.content.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Key Insights
${report.content.insights.map((insight, index) => `${index + 1}. ${insight}`).join('\n')}

## Project Metrics
- Total Tasks: ${report.content.metrics.totalTasks}
- Completed Tasks: ${report.content.metrics.completedTasks}
- Completion Rate: ${report.content.metrics.completionRate}%
- Project Health: ${report.content.metrics.projectHealth}/100
- Team Utilization: ${report.content.metrics.teamUtilization}%
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.projectId?.Name || 'Project'}_${report.reportType}_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter(report => 
    !searchTerm || 
    report.projectId?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reportType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConfigs = configs.filter(config => 
    !searchTerm || 
    config.projectId?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.reportType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'generating': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'executive': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      case 'detailed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'technical': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'dashboard': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${theme === 'dark' 
      ? 'bg-gray-900 text-white' 
      : 'bg-white text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${theme === 'dark'
                ? 'text-white'
                : 'text-gray-900'
              }`}>
                AI-Powered Reports
              </h1>
              <p className={`mt-2 text-lg transition-colors duration-300 ${theme === 'dark'
                ? 'text-gray-400'
                : 'text-gray-600'
              }`}>
                Generate intelligent project progress reports using AI
              </p>
            </div>
            <button
              onClick={() => setShowGenerator(true)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              }`}
            >
              <FaPlus className="text-lg" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className={`border-b transition-colors duration-300 ${theme === 'dark'
            ? 'border-gray-700'
            : 'border-gray-200'
          }`}>
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'reports'
                    ? theme === 'dark'
                      ? 'border-blue-400 text-blue-400'
                      : 'border-blue-600 text-blue-600'
                    : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaFileAlt className="inline mr-2 text-lg" />
                Generated Reports
              </button>
              <button
                onClick={() => setActiveTab('configs')}
                className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'configs'
                    ? theme === 'dark'
                      ? 'border-blue-400 text-blue-400'
                      : 'border-blue-600 text-blue-600'
                    : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaCog className="inline mr-2 text-lg" />
                Report Configurations
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${theme === 'dark'
                ? 'text-gray-400'
                : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filters.reportType}
              onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
              className={`px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Types</option>
              <option value="executive">Executive</option>
              <option value="detailed">Detailed</option>
              <option value="technical">Technical</option>
              <option value="dashboard">Dashboard</option>
            </select>
            <button className={`px-4 py-3 rounded-xl border transition-all duration-300 hover:shadow-md ${theme === 'dark'
              ? 'border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white'
              : 'border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}>
              <FaFilter className="text-lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 transition-colors duration-300 ${theme === 'dark'
              ? 'border-blue-400'
              : 'border-blue-600'
            }`}></div>
            <span className={`ml-4 text-lg font-medium transition-colors duration-300 ${theme === 'dark'
              ? 'text-gray-400'
              : 'text-gray-600'
            }`}>Loading...</span>
          </div>
        ) : activeTab === 'reports' ? (
          <div className="space-y-6">
            {filteredReports.length === 0 ? (
              <div className="text-center py-16">
                <div className={`p-8 rounded-3xl mx-auto max-w-md ${theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
                } transition-all duration-300`}>
                  <FaFileAlt className={`mx-auto h-16 w-16 transition-colors duration-300 ${theme === 'dark'
                    ? 'text-gray-600'
                    : 'text-gray-400'
                  }`} />
                  <h3 className={`mt-6 text-xl font-semibold transition-colors duration-300 ${theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                  }`}>No reports found</h3>
                  <p className={`mt-3 text-base transition-colors duration-300 ${theme === 'dark'
                    ? 'text-gray-400'
                    : 'text-gray-600'
                  }`}>
                    Get started by generating your first AI-powered report.
                  </p>
                  <div className="mt-8">
                    <button
                      onClick={() => setShowGenerator(true)}
                      className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                      }`}
                    >
                      <FaPlus className="mr-2 text-lg" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.reportId} className={`rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <h3 className={`text-xl font-bold transition-colors duration-300 ${theme === 'dark'
                            ? 'text-white'
                            : 'text-gray-900'
                          }`}>
                            {report.projectId?.Name || 'Unknown Project'}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${getReportTypeColor(report.reportType)}`}>
                            {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                          </span>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${getStatusColor(report.status)}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm transition-colors duration-300">
                          <div className={`flex items-center space-x-2 ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                          }`}>
                            <FaCalendarAlt className="text-lg" />
                            <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                          }`}>
                            <FaChartLine className="text-lg" />
                            <span>{report.content.metrics.completionRate}% Complete</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                          }`}>
                            <FaFileAlt className="text-lg" />
                            <span>{report.content.metrics.totalTasks} Tasks</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleDownloadReport(report)}
                          className={`p-3 rounded-xl transition-all duration-300 hover:shadow-md ${theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Download Report"
                        >
                          <FaDownload className="text-lg" />
                        </button>
                        <button
                          className={`p-3 rounded-xl transition-all duration-300 hover:shadow-md ${theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="View Report"
                        >
                          <FaEye className="text-lg" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Report Preview */}
                    <div className={`mt-6 p-5 rounded-xl transition-colors duration-300 ${theme === 'dark'
                      ? 'bg-gray-700'
                      : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-base font-semibold mb-3 transition-colors duration-300 ${theme === 'dark'
                        ? 'text-white'
                        : 'text-gray-900'
                      }`}>Executive Summary</h4>
                      <p className={`text-sm leading-relaxed line-clamp-3 transition-colors duration-300 ${theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-600'
                      }`}>
                        {report.content.executiveSummary}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredConfigs.length === 0 ? (
              <div className="text-center py-16">
                <div className={`p-8 rounded-3xl mx-auto max-w-md ${theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
                } transition-all duration-300`}>
                  <FaCog className={`mx-auto h-16 w-16 transition-colors duration-300 ${theme === 'dark'
                    ? 'text-gray-600'
                    : 'text-gray-400'
                  }`} />
                  <h3 className={`mt-6 text-xl font-semibold transition-colors duration-300 ${theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                  }`}>No configurations found</h3>
                  <p className={`mt-3 text-base transition-colors duration-300 ${theme === 'dark'
                    ? 'text-gray-400'
                    : 'text-gray-600'
                  }`}>
                    Create automated report configurations to schedule regular reports.
                  </p>
                </div>
              </div>
            ) : (
              filteredConfigs.map((config) => (
                <div key={config.configId} className={`rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <h3 className={`text-xl font-bold transition-colors duration-300 ${theme === 'dark'
                            ? 'text-white'
                            : 'text-gray-900'
                          }`}>
                            {config.projectId?.Name || 'Unknown Project'}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${getReportTypeColor(config.reportType)}`}>
                            {config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1)}
                          </span>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${
                            config.isActive ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm transition-colors duration-300">
                          <div className={`flex items-center space-x-2 ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                          }`}>
                            <FaCalendarAlt className="text-lg" />
                            <span>{config.frequency.charAt(0).toUpperCase() + config.frequency.slice(1)}</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                          }`}>
                            <FaFileAlt className="text-lg" />
                            <span>{config.recipients.length} Recipients</span>
                          </div>
                          {config.lastGenerated && (
                            <div className={`flex items-center space-x-2 ${theme === 'dark'
                              ? 'text-gray-400'
                              : 'text-gray-600'
                            }`}>
                              <FaChartLine className="text-lg" />
                              <span>Last: {new Date(config.lastGenerated).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          className={`p-3 rounded-xl transition-all duration-300 hover:shadow-md ${theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Edit Configuration"
                        >
                          <FaCog className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.configId)}
                          className={`p-3 rounded-xl transition-all duration-300 hover:shadow-md ${theme === 'dark'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                            : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                          }`}
                          title="Delete Configuration"
                        >
                          <FaTrash className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark'
              ? 'text-gray-300'
              : 'text-gray-700'
            }`}>
              Showing page {pagination.current} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                  ? 'border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                disabled={filters.page === pagination.pages}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                  ? 'border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Generator Modal */}
      {showGenerator && (
        <ReportGenerator
          projectId={selectedProject?.id}
          projectName={selectedProject?.name}
          onClose={() => {
            setShowGenerator(false);
            setSelectedProject(null);
            loadData(); // Refresh data after generation
          }}
        />
      )}
    </div>
  );
};

export default ReportsPage;
