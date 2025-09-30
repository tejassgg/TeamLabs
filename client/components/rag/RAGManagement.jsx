import React, { useState, useEffect } from 'react';

import { useGlobal } from '../../context/GlobalContext';
import api from '../../services/api';
import { useThemeClasses } from '../shared/hooks/useThemeClasses';
const RAGManagement = ({ organizationId }) => {
  const { userDetails } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [syncProgress, setSyncProgress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const getThemeClasses = useThemeClasses();

  // Configuration options
  const [config, setConfig] = useState({
    sourceTypes: ['project', 'task', 'report', 'user_activity', 'team'],
    similarityThreshold: 0.7,
    maxResults: 10,
    autoSync: true,
    syncInterval: 3600000 // 1 hour
  });

  useEffect(() => {
    if (organizationId) {
      loadSyncStatus();
      loadStats();
    }
  }, [organizationId]);

  useEffect(() => {
    if (config.autoSync && organizationId) {
      const interval = setInterval(() => {
        triggerSync();
      }, config.syncInterval);
      return () => clearInterval(interval);
    }
  }, [config.autoSync, config.syncInterval, organizationId]);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/rag/sync/status`);
      if (data?.success) {
        setSyncStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
      setError('Failed to load sync status');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get('/rag/stats');
      if (data?.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const triggerSync = async () => {
    try {
      setLoading(true);
      setSyncProgress({ status: 'starting', message: 'Starting sync...' });
      
      const { data } = await api.post(`/rag/sync/organization`, {
        sourceTypes: config.sourceTypes,
        forceUpdate: false
      });

      if (data?.success) {
        setSyncProgress({ status: 'completed', message: 'Sync completed successfully' });
        setSuccess('Knowledge base synced successfully');
        await loadSyncStatus();
        await loadStats();
      } else {
        setSyncProgress({ status: 'error', message: data?.error || 'Sync failed' });
        setError(data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      setSyncProgress({ status: 'error', message: 'Sync failed' });
      setError('Failed to trigger sync');
    } finally {
      setLoading(false);
      setTimeout(() => setSyncProgress(null), 3000);
    }
  };

  const regenerateEmbeddings = async () => {
    if (!window.confirm('This will delete all existing embeddings and regenerate them. This may take several minutes. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setSyncProgress({ status: 'starting', message: 'Regenerating embeddings...' });
      
      const { data } = await api.post(`/rag/regenerate-embeddings/${organizationId}`);

      if (data?.success) {
        setSyncProgress({ status: 'completed', message: 'Embeddings regenerated successfully' });
        setSuccess('Embeddings regenerated successfully');
        await loadSyncStatus();
        await loadStats();
      } else {
        setSyncProgress({ status: 'error', message: data?.error || 'Regeneration failed' });
        setError(data?.error || 'Regeneration failed');
      }
    } catch (error) {
      console.error('Error regenerating embeddings:', error);
      setSyncProgress({ status: 'error', message: 'Regeneration failed' });
      setError('Failed to regenerate embeddings');
    } finally {
      setLoading(false);
      setTimeout(() => setSyncProgress(null), 3000);
    }
  };

  const searchKnowledgeBase = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const { data } = await api.post('/rag/search', {
        query: searchQuery,
        organizationId: organizationId,
        limit: config.maxResults,
        similarityThreshold: config.similarityThreshold
      });

      if (data?.success) {
        setSearchResults(data.results || []);
      } else {
        setError(data?.error || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      setError('Failed to search knowledge base');
    } finally {
      setSearchLoading(false);
    }
  };

  const removeProjectData = async (projectId) => {
    if (!window.confirm('This will remove all knowledge base data for this project. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.delete(`/rag/remove/project/${projectId}`);

      if (data?.success) {
        setSuccess('Project data removed successfully');
        await loadSyncStatus();
        await loadStats();
      } else {
        setError(data?.error || 'Failed to remove project data');
      }
    } catch (error) {
      console.error('Error removing project data:', error);
      setError('Failed to remove project data');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'starting': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSyncStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'error': return '✗';
      case 'starting': return '⟳';
      default: return '○';
    }
  };

  return (
    <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className={getThemeClasses(
              "text-xl font-semibold text-gray-900",
              "dark:text-white"
            )}>
              RAG Knowledge Base Management
            </h2>
            <p className={getThemeClasses(
              "text-sm text-gray-600",
              "dark:text-gray-400"
            )}>
              Manage your organization's knowledge base and search capabilities
            </p>
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className="mb-4">
            {error && (
              <div className={getThemeClasses(
                "bg-red-50 border border-red-200 rounded-md p-4 mb-4",
                "dark:bg-red-900/20 dark:border-red-800"
              )}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={getThemeClasses(
                      "text-sm text-red-800",
                      "dark:text-red-200"
                    )}>{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button onClick={clearMessages} className={getThemeClasses(
                      "text-red-400 hover:text-red-600",
                      ""
                    )}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className={getThemeClasses(
                "bg-green-50 border border-green-200 rounded-md p-4 mb-4",
                "dark:bg-green-900/20 dark:border-green-800"
              )}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={getThemeClasses(
                      "text-sm text-green-800",
                      "dark:text-green-200"
                    )}>{success}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button onClick={clearMessages} className={getThemeClasses(
                      "text-green-400 hover:text-green-600",
                      ""
                    )}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Indicator */}
        {syncProgress && (
          <div className="p-4">
            <div className={getThemeClasses(
              "bg-blue-50 border border-blue-200 rounded-md p-4",
              "dark:bg-blue-900/20 dark:border-blue-800"
            )}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold ${getSyncStatusColor(syncProgress.status)}`}>
                    {getSyncStatusIcon(syncProgress.status)}
                  </div>
                </div>
                <div className="ml-3">
                  <p className={getThemeClasses(
                    "text-sm text-blue-800",
                    "dark:text-blue-200"
                  )}>{syncProgress.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={getThemeClasses(
          "border-b border-gray-200 mb-4",
          "dark:border-gray-700"
        )}>
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'search', label: 'Search' },
              { id: 'sync', label: 'Sync Management' },
              { id: 'config', label: 'Configuration' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={getThemeClasses(
                  `py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`,
                  activeTab === tab.id
                    ? 'dark:text-blue-400'
                    : 'dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={getThemeClasses(
                  "bg-white p-6 rounded-lg shadow",
                  "dark:bg-gray-700"
                )}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className={getThemeClasses(
                        "text-sm font-medium text-gray-500",
                        "dark:text-gray-400"
                      )}>Total Documents</p>
                      <p className={getThemeClasses(
                        "text-2xl font-semibold text-gray-900",
                        "dark:text-white"
                      )}>
                        {stats?.totalDocuments || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={getThemeClasses(
                  "bg-white p-6 rounded-lg shadow",
                  "dark:bg-gray-700"
                )}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className={getThemeClasses(
                        "text-sm font-medium text-gray-500",
                        "dark:text-gray-400"
                      )}>Source Types</p>
                      <p className={getThemeClasses(
                        "text-2xl font-semibold text-gray-900",
                        "dark:text-white"
                      )}>
                        {Object.keys(stats?.documentsByType || {}).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={getThemeClasses(
                  "bg-white p-6 rounded-lg shadow",
                  "dark:bg-gray-700"
                )}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className={getThemeClasses(
                        "text-sm font-medium text-gray-500",
                        "dark:text-gray-400"
                      )}>Last Updated</p>
                      <p className={getThemeClasses(
                        "text-sm font-semibold text-gray-900",
                        "dark:text-white"
                      )}>
                        {syncStatus?.lastUpdated ? new Date(syncStatus.lastUpdated).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents by Type */}
              {stats?.documentsByType && (
                <div className={getThemeClasses(
                  "bg-white p-6 rounded-lg shadow",
                  "dark:bg-gray-700"
                )}>
                  <h3 className={getThemeClasses(
                    "text-lg font-medium text-gray-900 mb-4",
                    "dark:text-white"
                  )}>Documents by Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.documentsByType).map(([type, count]) => (
                      <div key={type} className="text-center">
                        <p className={getThemeClasses(
                          "text-2xl font-bold text-blue-600",
                          "dark:text-blue-400"
                        )}>{count}</p>
                        <p className={getThemeClasses(
                          "text-sm text-gray-600 capitalize",
                          "dark:text-gray-400"
                        )}>{type.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className={getThemeClasses(
                "bg-white p-6 rounded-lg shadow",
                "dark:bg-gray-700"
              )}>
                <h3 className={getThemeClasses(
                  "text-lg font-medium text-gray-900 mb-4",
                  "dark:text-white"
                )}>Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={triggerSync}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {loading ? 'Syncing...' : 'Sync Now'}
                  </button>
                  {userDetails?.isAdmin && (
                    <button
                      onClick={regenerateEmbeddings}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {loading ? 'Regenerating...' : 'Regenerate Embeddings'}
                    </button>
                  )}
                  <button
                    onClick={loadSyncStatus}
                    className={getThemeClasses(
                      "px-4 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-800",
                      "dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                    )}
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Interface */}
              <div className={getThemeClasses(
                "bg-white p-6 rounded-lg shadow",
                "dark:bg-gray-700"
              )}>
                <h3 className={getThemeClasses(
                  "text-lg font-medium text-gray-900 mb-4",
                  "dark:text-white"
                )}>Search Knowledge Base</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter your search query..."
                    className={getThemeClasses(
                      "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                      "dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                    )}
                    onKeyPress={(e) => e.key === 'Enter' && searchKnowledgeBase()}
                  />
                  <button
                    onClick={searchKnowledgeBase}
                    disabled={searchLoading || !searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium"
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className={getThemeClasses(
                  "bg-white p-6 rounded-lg shadow",
                  "dark:bg-gray-700"
                )}>
                  <h3 className={getThemeClasses(
                    "text-lg font-medium text-gray-900 mb-4",
                    "dark:text-white"
                  )}>
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div key={index} className={getThemeClasses(
                        "border border-gray-200 rounded-lg p-4",
                        "dark:border-gray-600"
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={getThemeClasses(
                              "text-sm font-medium text-gray-900",
                              "dark:text-white"
                            )}>
                              {result.title}
                            </h4>
                            <p className={getThemeClasses(
                              "text-sm text-gray-600 mt-1",
                              "dark:text-gray-400"
                            )}>
                              {result.content}
                            </p>
                            <div className={getThemeClasses(
                              "flex items-center mt-2 space-x-4 text-xs text-gray-500",
                              "dark:text-gray-400"
                            )}>
                              <span>Type: {result.sourceType}</span>
                              <span>Similarity: {(result.similarity * 100).toFixed(1)}%</span>
                              <span>ID: {result.sourceId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searchLoading && (
                <div className={getThemeClasses(
                  "bg-white p-6 rounded-lg shadow text-center",
                  "dark:bg-gray-700"
                )}>
                  <p className={getThemeClasses(
                    "text-gray-500",
                    "dark:text-gray-400"
                  )}>No results found for your search query.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Sync Status */}
              <div className={getThemeClasses(
                "bg-white p-6 rounded-lg shadow",
                "dark:bg-gray-700"
              )}>
                <h3 className={getThemeClasses(
                  "text-lg font-medium text-gray-900 mb-4",
                  "dark:text-white"
                )}>Sync Status</h3>
                {syncStatus ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className={getThemeClasses(
                          "text-2xl font-bold text-blue-600",
                          "dark:text-blue-400"
                        )}>
                          {syncStatus.knowledgeBaseStats?.totalDocuments || 0}
                        </p>
                        <p className={getThemeClasses(
                          "text-sm text-gray-600",
                          "dark:text-gray-400"
                        )}>KB Documents</p>
                      </div>
                      <div className="text-center">
                        <p className={getThemeClasses(
                          "text-2xl font-bold text-green-600",
                          "dark:text-green-400"
                        )}>
                          {syncStatus.sourceDocumentCounts?.projects || 0}
                        </p>
                        <p className={getThemeClasses(
                          "text-sm text-gray-600",
                          "dark:text-gray-400"
                        )}>Projects</p>
                      </div>
                      <div className="text-center">
                        <p className={getThemeClasses(
                          "text-2xl font-bold text-purple-600",
                          "dark:text-purple-400"
                        )}>
                          {syncStatus.sourceDocumentCounts?.tasks || 0}
                        </p>
                        <p className={getThemeClasses(
                          "text-sm text-gray-600",
                          "dark:text-gray-400"
                        )}>Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className={getThemeClasses(
                          "text-2xl font-bold text-orange-600",
                          "dark:text-orange-400"
                        )}>
                          {syncStatus.sourceDocumentCounts?.reports || 0}
                        </p>
                        <p className={getThemeClasses(
                          "text-sm text-gray-600",
                          "dark:text-gray-400"
                        )}>Reports</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className={getThemeClasses(
                    "text-gray-500",
                    "dark:text-gray-400"
                  )}>No sync status available.</p>
                )}
              </div>

              {/* Sync Controls */}
              <div className={getThemeClasses(
                "bg-white p-6 rounded-lg shadow",
                "dark:bg-gray-700"
              )}>
                <h3 className={getThemeClasses(
                  "text-lg font-medium text-gray-900 mb-4",
                  "dark:text-white"
                )}>Sync Controls</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={getThemeClasses(
                        "text-sm font-medium text-gray-900",
                        "dark:text-white"
                      )}>Auto Sync</p>
                      <p className={getThemeClasses(
                        "text-sm text-gray-600",
                        "dark:text-gray-400"
                      )}>Automatically sync knowledge base</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoSync}
                        onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={getThemeClasses(
                        "text-sm font-medium text-gray-900",
                        "dark:text-white"
                      )}>Sync Interval</p>
                      <p className={getThemeClasses(
                        "text-sm text-gray-600",
                        "dark:text-gray-400"
                      )}>How often to auto-sync</p>
                    </div>
                    <select
                      value={config.syncInterval}
                      onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) })}
                      className={getThemeClasses(
                        "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                      )}
                    >
                      <option value={900000}>15 minutes</option>
                      <option value={1800000}>30 minutes</option>
                      <option value={3600000}>1 hour</option>
                      <option value={7200000}>2 hours</option>
                      <option value={86400000}>24 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Search Configuration */}
              <div className={getThemeClasses(
                "bg-white p-6 rounded-lg shadow",
                "dark:bg-gray-700"
              )}>
                <h3 className={getThemeClasses(
                  "text-lg font-medium text-gray-900 mb-4",
                  "dark:text-white"
                )}>Search Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className={getThemeClasses(
                      "block text-sm font-medium text-gray-700 mb-2",
                      "dark:text-gray-300"
                    )}>
                      Similarity Threshold
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={config.similarityThreshold}
                      onChange={(e) => setConfig({ ...config, similarityThreshold: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className={getThemeClasses(
                      "text-sm text-gray-600 mt-1",
                      "dark:text-gray-400"
                    )}>
                      Current: {config.similarityThreshold} (Higher = more strict matching)
                    </p>
                  </div>
                  
                  <div>
                    <label className={getThemeClasses(
                      "block text-sm font-medium text-gray-700 mb-2",
                      "dark:text-gray-300"
                    )}>
                      Max Results
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={config.maxResults}
                      onChange={(e) => setConfig({ ...config, maxResults: parseInt(e.target.value) })}
                      className={getThemeClasses(
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Source Types Configuration */}
              <div className={getThemeClasses(
                "bg-white p-6 rounded-lg shadow",
                "dark:bg-gray-700"
              )}>
                <h3 className={getThemeClasses(
                  "text-lg font-medium text-gray-900 mb-4",
                  "dark:text-white"
                )}>Source Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'project', label: 'Projects' },
                    { id: 'task', label: 'Tasks' },
                    { id: 'report', label: 'Reports' },
                    { id: 'user_activity', label: 'User Activities' },
                    { id: 'team', label: 'Teams' },
                    { id: 'comment', label: 'Comments' },
                    { id: 'attachment', label: 'Attachments' }
                  ].map((type) => (
                    <label key={type.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.sourceTypes.includes(type.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig({ ...config, sourceTypes: [...config.sourceTypes, type.id] });
                          } else {
                            setConfig({ ...config, sourceTypes: config.sourceTypes.filter(t => t !== type.id) });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={getThemeClasses(
                        "ml-2 text-sm text-gray-700",
                        "dark:text-gray-300"
                      )}>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default RAGManagement;
