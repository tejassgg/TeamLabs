import React, { useEffect, useState } from 'react';
import { FaComments, FaSync } from 'react-icons/fa';
import api from '../../services/api';

const RecentCommentsWidget = ({ organizationId, theme }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    if (!organizationId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/dashboard/${organizationId}/recent-comments`);
      setComments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch recent comments:', err);
      setError('Could not load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
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
    <div className={`rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md h-full flex flex-col justify-between ${
      theme === 'dark' 
        ? 'bg-slate-950/70 border-white/10 shadow-slate-950/65 shadow-2xl' 
        : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'
    }`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/10">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FaComments className="text-blue-500 animate-pulse" />
            <span>Recent Comments</span>
          </h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Latest feedback across projects
          </p>
        </div>
        <button 
          onClick={fetchComments} 
          disabled={loading}
          className={`p-2 rounded-lg transition-all ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Refresh comments"
        >
          <FaSync size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-64 pr-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="text-xs text-slate-500">Loading comments...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-xs text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-500">
            No comments yet.
          </div>
        )}

        {!loading && !error && comments.map((comment) => (
          <div 
            key={comment.CommentID} 
            className={`p-3 rounded-xl mb-3 border transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-slate-900/40 border-white/5 hover:border-white/10' 
                : 'bg-slate-50 border-slate-200/50 hover:border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'
              }`}>
                {comment.AuthorDetails?.initials || comment.Author.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs truncate">
                    {comment.AuthorDetails?.fullName || comment.Author}
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {formatRelativeTime(comment.CreatedAt)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate italic">
                  in <span className="font-medium text-slate-400">{comment.ProjectName}</span> &gt; <span className="font-medium text-slate-400">{comment.TaskName}</span>
                </div>
                <p className={`text-xs mt-2 break-words leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {comment.Content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentCommentsWidget;
