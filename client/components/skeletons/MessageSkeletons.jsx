import React from 'react';

export const ConversationSkeleton = ({ theme }) => (
  <div className={`w-full p-2 rounded-lg flex items-center gap-3 ${theme === 'dark' ? 'bg-[#221E1E]' : 'bg-white'}`}>
    <div className={`w-8 h-8 rounded-full animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
    <div className="flex-1 space-y-2">
      <div className={`h-4 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} style={{ width: '70%' }} />
      <div className={`h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} style={{ width: '50%' }} />
    </div>
    <div className={`w-12 h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
  </div>
);

export const MessageSkeleton = ({ isMine, theme }) => (
  <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
    <div className="max-w-[85%] lg:max-w-[75%]">
      <div className={`flex items-center gap-2 mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <div className={`w-7 h-7 rounded-full animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
        )}
        <div className={`w-16 h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
        <div className={`w-12 h-3 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      </div>
      <div className={`relative border rounded-2xl ${isMine ? 'rounded-br-none' : 'rounded-bl-none'} ${theme === 'dark' ? 'bg-[#221E1E] border-[#424242]' : 'bg-white border-gray-200'}`}>
        <div className="px-3 py-2">
          <div className={`h-4 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} style={{ width: isMine ? '120px' : '180px' }} />
        </div>
      </div>
    </div>
  </div>
);

export const ConversationsListSkeleton = ({ theme }) => (
  <div className="space-y-4">
    {/* Group Chats Section Skeleton */}
    <div>
      <div className={`h-4 w-24 rounded animate-pulse mb-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <ConversationSkeleton key={`group-${i}`} theme={theme} />
        ))}
      </div>
    </div>

    {/* Direct Messages Section Skeleton */}
    <div>
      <div className={`h-4 w-32 rounded animate-pulse mb-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <ConversationSkeleton key={`dm-${i}`} theme={theme} />
        ))}
      </div>
    </div>
  </div>
);

export const ChatHeaderSkeleton = ({ theme }) => (
  <div className={`p-3 border-b ${theme === 'dark' ? 'bg-transparent border-[#424242]' : 'bg-white border-gray-200'} flex-shrink-0`}>
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`h-5 w-32 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
    </div>
  </div>
);

export const MessagesAreaSkeleton = ({ theme }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <MessageSkeleton key={i} isMine={i % 2 === 0} theme={theme} />
    ))}
  </div>
);

export const ChatFooterSkeleton = ({ theme }) => (
  <div className={`p-2 lg:p-3 mx-2 lg:mx-3 mb-2 lg:mb-3 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-[#221E1E]' : 'bg-white'} flex-shrink-0`}>
    <div className="flex items-center gap-1 lg:gap-2">
      <div className={`w-8 h-8 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`w-8 h-8 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`flex-1 h-10 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
      <div className={`w-20 h-10 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`} />
    </div>
  </div>
);
