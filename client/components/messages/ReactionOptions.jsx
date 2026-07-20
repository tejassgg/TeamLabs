import React from 'react';

const ReactionOptions = ({ onSelectReaction, isOwnMessage, theme }) => {
  const emojis = ['👍', '❤️', '😂', '🎉', '😮', '🙏'];
  const panel = theme === 'dark' ? 'bg-dark-card text-[#F3F6FA]' : 'bg-white text-gray-900';
  const border = theme === 'dark' ? 'border-dark-border' : 'border-gray-200';

  return (
    <div className={`absolute -top-10 ${isOwnMessage ? 'right-8' : 'left-8'} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
      <div className={`flex items-center px-1 py-0.5 rounded-lg border shadow-sm ${panel} ${border}`}>
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`text-md px-1 py-0.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-gray-100'
              }`}
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
