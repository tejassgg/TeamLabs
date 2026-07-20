import React from 'react';

const ReadReceipts = ({ message, isOwnMessage, userDetails }) => {
  // Read receipts (basic): show "Read" for messages you sent that have been read by others
  if (
    isOwnMessage &&
    Array.isArray(message.readBy) &&
    message.readBy.some((uid) => String(uid) !== String(userDetails?._id))
  ) {
    return (
      <div className={`mt-1 text-xs opacity-60 text-right`}>
        Read
      </div>
    );
  }
  
  return null;
};

export default ReadReceipts;
