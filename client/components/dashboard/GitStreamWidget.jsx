import React, { useEffect, useState } from 'react';
import { FaGithub, FaSync, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../../services/api';

const GitStreamWidget = ({ organizationId, theme }) => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCommits = async () => {
    if (!organizationId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/dashboard/${organizationId}/github-commits`);
      setCommits(response.data || []);
    } catch (err) {
      console.error('Failed to fetch dashboard github commits:', err);
      setError('Could not load commit stream. Check GitHub integration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits();
  }, [organizationId]);

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md h-full flex flex-col justify-between ${theme === 'dark'
        ? 'bg-[#18181b] border-zinc-800/80'
        : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'
      }`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-dark-border/40">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FaGithub className={theme === 'dark' ? 'text-white' : 'text-slate-900'} />
            <span>GitHub Commit Stream</span>
          </h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Live code updates across organization projects
          </p>
        </div>
        <button
          onClick={fetchCommits}
          disabled={loading}
          className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-dark-hover text-slate-400' : 'hover:bg-slate-100 text-slate-600'
            }`}
          title="Refresh commit stream"
        >
          <FaSync size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-64 pr-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-slate-500"></div>
            <span className="text-xs text-slate-500">Loading commit stream...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-xs text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && commits.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-500">
            No commits found. Link a GitHub repository to your project to see commits.
          </div>
        )}

        {!loading && !error && commits.map((commit, index) => (
          <div
            key={`${commit.sha}-${index}`}
            className={`p-3 rounded-xl mb-3 border transition-all duration-200 ${theme === 'dark'
                ? 'bg-dark-bg/40 border-dark-border/40 hover:border-dark-border'
                : 'bg-slate-50 border-slate-200/50 hover:border-slate-200'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-dark-hover text-white' : 'bg-slate-100 text-slate-900'
                }`}>
                <FaGithub size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs truncate">
                    {commit.authorName}
                  </span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatRelativeTime(commit.date)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  in <span className="font-medium text-slate-400">{commit.projectName}</span>
                </div>

                <p className={`text-xs mt-2 break-words leading-relaxed font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {commit.message}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-border/40">
                  <span className="font-mono text-xs text-slate-500">
                    {commit.sha.substring(0, 7)}
                  </span>
                  {commit.htmlUrl && (
                    <a
                      href={commit.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      View Commit <FaExternalLinkAlt size={8} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GitStreamWidget;
