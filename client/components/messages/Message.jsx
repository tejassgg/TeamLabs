import React from 'react';
import ReactionOptions from './ReactionOptions';
import Reactions from './Reactions';
import ReadReceipts from './ReadReceipts';

const Message = ({
  message: m,
  mine,
  theme,
  userDetails,
  formatTimeAgo,
  handleReaction,
}) => {
  const panel = theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900';
  const border = theme === 'dark' ? 'border border-[#424242]' : 'border border-gray-200';

  const renderMessageText = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /@([A-Za-z_]+)/g;

    const renderMentions = (chunk, baseKey) => {
      const nodes = [];
      let lastIndex = 0;
      let match;
      while ((match = mentionRegex.exec(chunk)) !== null) {
        if (match.index > lastIndex) nodes.push(chunk.substring(lastIndex, match.index));
        const displayName = match[1].replace(/_/g, ' ');
        nodes.push(
          <span key={`${baseKey}-m-${match.index}`} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">
            @{displayName}
          </span>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < chunk.length) nodes.push(chunk.substring(lastIndex));
      return nodes;
    };

    const parts = text.split(urlRegex);
    const out = [];
    parts.forEach((part, idx) => {
      if (urlRegex.test(part)) {
        out.push(
          <a
            key={`u-${idx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else {
        const nodes = renderMentions(part, `p-${idx}`);
        nodes.forEach((n, i) => out.push(typeof n === 'string' ? <span key={`t-${idx}-${i}`}>{n}</span> : n));
      }
    });
    return out;
  };

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        {/* Sender info */}
        <div className={`flex items-center gap-2 mb-1 ${mine ? 'justify-end' : 'justify-start'}`}>
          {!mine && (
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
              {m.sender?.profileImage ? (
                <img src={m.sender.profileImage} alt="" className="w-7 h-7 object-cover" />
              ) : (
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>
                  {`${(m.sender?.firstName || '')[0] || ''}${(m.sender?.lastName || '')[0] || ''}`.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          )}
          <div className="text-xs opacity-70">
            {mine ? 'You' : `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`}
          </div>
          <div className="text-xs opacity-50">
            {formatTimeAgo(m.createdAt || m.timestamp)}
          </div>
        </div>

        {/* Message content */}
        <div className={`group relative ${mine ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' : `${theme === 'dark' ? 'bg-gray-700 ' : 'bg-gray-100 '} rounded-2xl rounded-bl-none`} ${m.type === 'text' ? 'inline-block w-fit' : 'p-3'}`}>
          {m.type === 'text' && (
            <div className="whitespace-pre-wrap px-3 py-2">{renderMessageText(m.text)}</div>
          )}
          {m.type === 'image' && (
            <img src={m.mediaUrl} alt="" className="rounded-lg max-h-80" />
          )}
          {m.type === 'video' && (
            <video src={m.mediaUrl} controls className="rounded-lg max-h-80" />
          )}
          
          <ReactionOptions
            theme={theme}
            isOwnMessage={mine}
            onSelectReaction={(emoji) => handleReaction(m._id, emoji)}
          />
        </div>

        <ReadReceipts
          message={m}
          isOwnMessage={mine}
          userDetails={userDetails}
        />

        <Reactions
          reactions={m.reactions}
          theme={theme}
          isOwnMessage={mine}
          userDetails={userDetails}
          onSelectReaction={(emoji) => handleReaction(m._id, emoji)}
        />
      </div>
    </div>
  );
};

export default Message;
