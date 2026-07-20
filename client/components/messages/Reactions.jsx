import React from 'react';

const Reactions = ({ reactions, theme, isOwnMessage, userDetails, onSelectReaction }) => {
  if (!reactions || reactions.length === 0) return null;

  const panel = theme === 'dark' ? 'bg-[#232323] text-[#F3F6FA]' : 'bg-white text-gray-900';
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
          className={`px-2 py-0.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${
            hasReacted
              ? (theme === 'dark' ? 'bg-blue-900/60 border-blue-500 text-blue-200 font-semibold' : 'bg-blue-100 border-blue-400 text-blue-800 font-semibold')
              : `${panel} ${theme === 'dark' ? 'border-[#424242] hover:bg-[#333]' : 'border-gray-200 hover:bg-gray-100'}`
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
