import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaCog, FaDownload, FaEye, FaTrash, FaPlus, FaFilter, FaSearch, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
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

  const { user } = useAuth();
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
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI-Powered Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generate intelligent project progress reports using AI
              </p>
            </div>
            <button
              onClick={() => setShowGenerator(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <FaPlus />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FaFileAlt className="inline mr-2" />
                Generated Reports
              </button>
              <button
                onClick={() => setActiveTab('configs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'configs'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FaCog className="inline mr-2" />
                Report Configurations
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.reportType}
              onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="executive">Executive</option>
              <option value="detailed">Detailed</option>
              <option value="technical">Technical</option>
              <option value="dashboard">Dashboard</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <FaFilter />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        ) : activeTab === 'reports' ? (
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reports found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by generating your first AI-powered report.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaPlus className="mr-2" />
                    Generate Report
                  </button>
                </div>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.reportId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {report.projectId?.Name || 'Unknown Project'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReportTypeColor(report.reportType)}`}>
                          {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <FaCalendarAlt />
                          <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaChartLine />
                          <span>{report.content.metrics.completionRate}% Complete</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaFileAlt />
                          <span>{report.content.metrics.totalTasks} Tasks</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Download Report"
                      >
                        <FaDownload />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="View Report"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </div>
                  
                  {/* Report Preview */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Executive Summary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {report.content.executiveSummary}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConfigs.length === 0 ? (
              <div className="text-center py-12">
                <FaCog className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No configurations found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create automated report configurations to schedule regular reports.
                </p>
              </div>
            ) : (
              filteredConfigs.map((config) => (
                <div key={config.configId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {config.projectId?.Name || 'Unknown Project'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReportTypeColor(config.reportType)}`}>
                          {config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          config.isActive ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <FaCalendarAlt />
                          <span>{config.frequency.charAt(0).toUpperCase() + config.frequency.slice(1)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaFileAlt />
                          <span>{config.recipients.length} Recipients</span>
                        </div>
                        {config.lastGenerated && (
                          <div className="flex items-center space-x-1">
                            <FaChartLine />
                            <span>Last: {new Date(config.lastGenerated).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Edit Configuration"
                      >
                        <FaCog />
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.configId)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete Configuration"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing page {pagination.current} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
                disabled={filters.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
