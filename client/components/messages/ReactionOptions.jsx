import React from 'react';

const ReactionOptions = ({ onSelectReaction, isOwnMessage, theme }) => {
  const emojis = ['👍', '❤️', '😂', '🎉', '😮', '🙏'];

  return (
    <div className={`absolute -top-10 ${isOwnMessage ? 'right-8' : 'left-8'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
      <div className="flex items-center px-1 py-0.5 rounded-lg border border-gray-200 dark:border-dark-border shadow-sm bg-white dark:bg-dark-card text-gray-900 dark:text-[#F3F6FA]">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`text-md px-1 py-0.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-dark-hover`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectReaction(emoji);
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactionOptions;
