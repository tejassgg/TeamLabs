import { useEffect, useState, useRef } from 'react';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaUserCircle, FaReply, FaPaperPlane, FaAt } from 'react-icons/fa';
import { commentService } from '../services/api';
import { useThemeClasses } from './kanbanUtils';

const TaskComments = ({ taskId, userId, userName, initialComments, projectMembers = [] }) => {
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const getThemeClasses = useThemeClasses();

  useEffect(() => {
    if (initialComments) {
      setComments(initialComments);
    } else if (taskId) {
      fetchComments();
    }
    // eslint-disable-next-line
  }, [initialComments, taskId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchComments = async () => {
    const data = await commentService.getComments(taskId);
    setComments(data);
  };

  const handleAdd = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await commentService.addComment(taskId, userName, newComment);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await commentService.deleteComment(id);
      fetchComments();
    }
  };

  const handleEdit = async (id) => {
    if (!editingContent.trim()) return;
    await commentService.updateComment(id, { Content: editingContent });
    setEditingId(null);
    setEditingContent('');
    fetchComments();
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return commentDate.toLocaleDateString();
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ symbol
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1 && atIndex < cursorPos) {
      const filter = textBeforeCursor.substring(atIndex + 1);
      setMentionFilter(filter);
      setShowMentionDropdown(true);
      setCursorPosition(cursorPos);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (member) => {
    const beforeAt = newComment.substring(0, cursorPosition - mentionFilter.length - 1);
    const afterAt = newComment.substring(cursorPosition);
    const mentionText = `@${member.fullName.replace(/ /g, '_')}`;

    const newText = beforeAt + mentionText + ' ' + afterAt;
    setNewComment(newText);
    setShowMentionDropdown(false);
    setMentionFilter('');

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPosition = beforeAt.length + mentionText.length + 1;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const renderCommentContent = (content) => {
    // Match @ followed by one or more words/underscores
    const mentionRegex = /@([A-Za-z_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Push text before the mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      // Replace underscores with spaces for display
      const displayName = match[1].replace(/_/g, ' ');
      parts.push(
        <span key={match.index} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">
          @{displayName}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    // Push any remaining text after the last mention
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    return parts;
  };

  const filteredMembers = projectMembers.filter(member =>
    member.fullName.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={getThemeClasses("text-lg font-semibold text-gray-900 flex items-center gap-2", "dark:text-gray-100")}>
          <FaReply className={getThemeClasses("text-gray-500", "dark:text-gray-400")} />
          Comments
          <span className={getThemeClasses("bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full", "dark:bg-blue-900/30 dark:text-blue-300")}>{comments.length}</span>
        </h3>
      </div>

      {/* Add Comment Form */}
      <div className={getThemeClasses("bg-transparent border-none rounded-lg p-4 relative", "dark:bg-transparent dark:border-none")}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
          </div>

          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                className={getThemeClasses(
                  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                )}
                placeholder="Write a comment... Use @ to mention team members"
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
                rows={3}
              />
              {/* Mention Dropdown */}
              {showMentionDropdown && filteredMembers.length > 0 && (
                <div
                  ref={dropdownRef}
                  className={getThemeClasses(
                    "absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto",
                    "dark:bg-gray-800 dark:border-gray-700"
                  )}
                >
                  <div className="p-2">
                    <div className={getThemeClasses("text-xs text-gray-500 px-2 py-1 mb-1", "dark:text-gray-400")}>Mention team members:</div>
                    {filteredMembers.map((member) => (
                      <button
                        key={member._id}
                        onClick={() => handleMentionSelect(member)}
                        className={getThemeClasses(
                          "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 rounded-md",
                          "dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {member.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="flex-1">{member.fullName}</span>
                        <FaAt size={10} className={getThemeClasses("text-gray-400", "dark:text-gray-500")} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>Press Enter to send, Shift+Enter for new line • Use @ to mention team members</p>
              <button
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${newComment.trim() && !isSubmitting
                    ? getThemeClasses('bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2', 'dark:bg-blue-700 dark:hover:bg-blue-800')
                    : getThemeClasses('bg-gray-200 text-gray-400 cursor-not-allowed', 'dark:bg-gray-700 dark:text-gray-500')
                  }`}
                onClick={handleAdd}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={12} />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div>
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.CommentID} className="group">
              <div className={getThemeClasses(
                "flex items-start space-x-3 p-2 rounded-lg hover:bg-transparent transition-colors mt-1 border-none bg-transparent",
                "dark:hover:bg-transparent dark:border-none dark:bg-transparent"
              )}>
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {comment.Author ? comment.Author.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </div>
                </div>
                {/* Comment Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={getThemeClasses("font-medium text-gray-900 text-sm", "dark:text-gray-100")}>{comment.Author}</span>
                      <span className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>•</span>
                      <span className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>{formatTimeAgo(comment.CreatedAt)}</span>
                      {comment.edited && (
                        <span className={getThemeClasses("text-xs text-blue-400 ml-2", "dark:text-blue-300")}> (edited)</span>
                      )}
                    </div>
                    {/* Edit/Delete Buttons on the right */}
                    <div className="flex gap-1 ml-2">
                      <button
                        className={getThemeClasses(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200",
                          "dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                        )}
                        onClick={() => { setEditingId(comment.CommentID); setEditingContent(comment.Content); }}
                        title="Edit comment"
                      >
                        <FaEdit size={10} />
                      </button>
                      <button
                        className={getThemeClasses(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200",
                          "dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                        )}
                        onClick={() => handleDelete(comment.CommentID)}
                        title="Delete comment"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                  {/* Comment content and edit mode below */}
                  {editingId === comment.CommentID ? (
                    <div className="space-y-2">
                      <textarea
                        className={getThemeClasses(
                          "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
                          "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                        )}
                        value={editingContent}
                        onChange={e => setEditingContent(e.target.value)}
                        rows={3}
                        placeholder="Edit your comment..."
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          className={getThemeClasses(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm",
                            "dark:bg-green-700 dark:hover:bg-green-800"
                          )}
                          onClick={() => handleEdit(comment.CommentID)}
                        >
                          <FaCheck size={12} />
                          Save
                        </button>
                        <button
                          className={getThemeClasses(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200",
                            "dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          )}
                          onClick={() => setEditingId(null)}
                        >
                          <FaTimes size={12} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className={getThemeClasses("text-sm text-gray-700 leading-relaxed", "dark:text-gray-200")}>{renderCommentContent(comment.Content)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <FaUserCircle className={getThemeClasses("mx-auto text-gray-300 mb-3", "dark:text-gray-600")} size={48} />
            <p className={getThemeClasses("text-gray-500 text-sm", "dark:text-gray-500")}>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskComments; 