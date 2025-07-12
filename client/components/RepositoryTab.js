import React, { useState, useEffect } from 'react';
import { FaCodeCommit, FaExclamationTriangle, FaSpinner, FaRedo, FaLink } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';

const RepositoryTab = ({ projectId, projectRepository }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  
  // Repository data state
  const [repositoryCommits, setRepositoryCommits] = useState([]);
  const [repositoryIssues, setRepositoryIssues] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Fetch repository data when component mounts
  useEffect(() => {
    if (projectRepository && projectRepository.connected) {
      fetchRepositoryCommits();
      fetchRepositoryIssues();
    }
  }, [projectRepository]);

  const fetchRepositoryCommits = async () => {
    try {
      setCommitsLoading(true);
      const response = await authService.getRepositoryCommits(projectId);
      if (response.success) {
        setRepositoryCommits(response.commits);
      } else {
        showToast(response.error || 'Failed to fetch commits', 'error');
      }
    } catch (error) {
      console.error('Error fetching repository commits:', error);
      showToast('Failed to fetch commits', 'error');
    } finally {
      setCommitsLoading(false);
    }
  };

  const fetchRepositoryIssues = async () => {
    try {
      setIssuesLoading(true);
      const response = await authService.getRepositoryIssues(projectId);
      if (response.success) {
        setRepositoryIssues(response.issues);
      } else {
        showToast(response.error || 'Failed to fetch issues', 'error');
      }
    } catch (error) {
      console.error('Error fetching repository issues:', error);
      showToast('Failed to fetch issues', 'error');
    } finally {
      setIssuesLoading(false);
    }
  };

  const getThemeClasses = (baseClasses, darkClasses) => {
    return theme === 'dark' ? `${baseClasses} ${darkClasses}` : baseClasses;
  };

  // Table styling classes
  const tableContainerClasses = getThemeClasses(
    'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
    'dark:bg-gray-800 dark:border-gray-700'
  );
  const tableHeaderClasses = getThemeClasses(
    'bg-gray-50 border-b border-gray-200',
    'dark:bg-gray-700 dark:border-gray-600'
  );
  const tableHeaderTextClasses = getThemeClasses(
    'text-sm font-medium text-gray-700',
    'dark:text-gray-300'
  );
  const tableRowClasses = getThemeClasses(
    'border-b border-gray-200 hover:bg-gray-50 transition-colors',
    'dark:border-gray-700 dark:hover:bg-gray-700'
  );
  const tableTextClasses = getThemeClasses(
    'text-sm font-medium text-gray-900',
    'dark:text-gray-100'
  );
  const tableSecondaryTextClasses = getThemeClasses(
    'text-sm text-gray-500',
    'dark:text-gray-400'
  );

  if (!projectRepository || !projectRepository.connected) {
    return (
      <div className={getThemeClasses(
        'text-center py-12 text-gray-400',
        'dark:text-gray-500'
      )}>
        <div className="mb-4">
          <FaCodeCommit className="mx-auto text-4xl mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Repository Connected</h3>
        <p className="text-sm">Connect a GitHub repository to view commit history and issues.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Repository Tab: Commit History and Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commits Table */}
        <div className={tableContainerClasses}>
          <div className={getThemeClasses('p-4 border-b border-gray-200', 'dark:border-gray-700')}>
            <div className="flex items-center justify-between">
              <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>
                <FaCodeCommit className="inline mr-2" />
                Commit History
              </h2>
              <button
                onClick={fetchRepositoryCommits}
                disabled={commitsLoading}
                className={getThemeClasses(
                  'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 rounded-lg transition-colors',
                  'dark:text-blue-400 dark:hover:text-blue-300'
                )}
              >
                {commitsLoading ? <FaSpinner className="animate-spin" size={14} /> : <FaRedo size={14} />}
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {commitsLoading ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-blue-500" size={24} />
                <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading commits...
                </span>
              </div>
            ) : repositoryCommits.length === 0 ? (
              <div className={getThemeClasses(
                'text-center py-8 text-gray-400',
                'dark:text-gray-500'
              )}>
                No commits found.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className={tableHeaderClasses}>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Commit</th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Author</th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Date</th>
                    <th className={`py-3 px-4 text-center ${tableHeaderTextClasses}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {repositoryCommits.map((commit, index) => (
                    <tr key={commit.sha} className={tableRowClasses}>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className={`font-mono text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {commit.sha.substring(0, 8)}
                          </span>
                          <span className={`${tableTextClasses} line-clamp-2`}>
                            {commit.message}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className={tableTextClasses}>{commit.author.name}</span>
                          <span className={tableSecondaryTextClasses}>{commit.author.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={tableSecondaryTextClasses}>
                          {new Date(commit.author.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={getThemeClasses(
                            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 rounded transition-colors',
                            'dark:text-blue-400 dark:hover:text-blue-300'
                          )}
                        >
                          <FaLink size={12} />
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Issues Table */}
        <div className={tableContainerClasses}>
          <div className={getThemeClasses('p-4 border-b border-gray-200', 'dark:border-gray-700')}>
            <div className="flex items-center justify-between">
              <h2 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>
                <FaExclamationTriangle className="inline mr-2" />
                Issues
              </h2>
              <button
                onClick={fetchRepositoryIssues}
                disabled={issuesLoading}
                className={getThemeClasses(
                  'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 rounded-lg transition-colors',
                  'dark:text-blue-400 dark:hover:text-blue-300'
                )}
              >
                {issuesLoading ? <FaSpinner className="animate-spin" size={14} /> : <FaRedo size={14} />}
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {issuesLoading ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-blue-500" size={24} />
                <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading issues...
                </span>
              </div>
            ) : repositoryIssues.length === 0 ? (
              <div className={getThemeClasses(
                'text-center py-8 text-gray-400',
                'dark:text-gray-500'
              )}>
                No issues found.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className={tableHeaderClasses}>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Issue</th>
                    <th className={`py-3 px-4 text-left ${tableHeaderTextClasses}`}>Created By</th>
                    <th className={`py-3 px-4 text-center ${tableHeaderTextClasses}`}>Status</th>
                    <th className={`py-3 px-4 text-center ${tableHeaderTextClasses}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {repositoryIssues.map((issue) => (
                    <tr key={issue.id} className={tableRowClasses}>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              #{issue.number}
                            </span>
                            {issue.pull_request && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                PR
                              </span>
                            )}
                          </div>
                          <span className={`${tableTextClasses} line-clamp-2`}>
                            {issue.title}
                          </span>
                          {issue.labels && issue.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {issue.labels.slice(0, 3).map((label, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `#${label.color}`,
                                    color: parseInt(label.color, 16) > 0xffffff / 2 ? '#000' : '#fff'
                                  }}
                                >
                                  {label.name}
                                </span>
                              ))}
                              {issue.labels.length > 3 && (
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  +{issue.labels.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={issue.user.avatar_url}
                            alt={issue.user.login}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className={tableTextClasses}>{issue.user.login}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          issue.state === 'open'
                            ? theme === 'dark'
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-green-100 text-green-700'
                            : theme === 'dark'
                              ? 'bg-red-600/20 text-red-400'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            issue.state === 'open'
                              ? theme === 'dark' ? 'bg-green-400' : 'bg-green-500'
                              : theme === 'dark' ? 'bg-red-400' : 'bg-red-500'
                          }`}></span>
                          {issue.state === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={getThemeClasses(
                            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 rounded transition-colors',
                            'dark:text-blue-400 dark:hover:text-blue-300'
                          )}
                        >
                          <FaLink size={12} />
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryTab; 