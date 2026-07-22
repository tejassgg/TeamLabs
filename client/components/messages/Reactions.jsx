import React from 'react';

const Reactions = ({ reactions, theme, isOwnMessage, userDetails, onSelectReaction }) => {
  if (!reactions || reactions.length === 0) return null;

  const currentUserId = String(userDetails?._id || '');

  // Group reactions by emoji, count them, and check if current user reacted to it
  const groupedReactions = reactions.reduce((acc, r) => {
    const rUserId = String(r.user?._id || r.user || '');
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, hasReacted: false };
    }
    acc[r.emoji].count += 1;
    if (currentUserId && rUserId === currentUserId) {
      acc[r.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  return (
    <div className={`mt-1 text-sm opacity-90 flex items-center gap-1 flex-wrap ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {Object.entries(groupedReactions).map(([emoji, { count, hasReacted }]) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectReaction) onSelectReaction(emoji);
          }}
          className={`px-2 py-0.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${hasReacted
              ? 'bg-blue-100 border-blue-400 text-primary font-semibold dark:bg-blue-900/60 dark:border-blue-500 dark:text-blue-200'
              : 'bg-white dark:bg-dark-card text-gray-900 dark:text-[#F3F6FA] border-gray-200 hover:bg-gray-100 dark:border-dark-border dark:hover:bg-[#333]'
            }`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
};

export default Reactions;
