// Helper function to get deadline status and styling
export const getDeadlineStatus = (deadlineText) => {
  if (deadlineText === 'Deadline Passed') {
    return {
      text: 'Deadline Passed',
      bgColor: 'from-red-50 to-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      dotColor: 'bg-red-500'
    };
  }
  if (deadlineText === 'No Deadline') {
    return {
      text: 'No Deadline',
      bgColor: 'from-gray-50 to-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-500'
    };
  }

  const daysLeft = parseInt(deadlineText);
  if (daysLeft <= 3) {
    return {
      text: deadlineText,
      bgColor: 'from-red-50 to-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      dotColor: 'bg-red-500'
    };
  } else if (daysLeft <= 7) {
    return {
      text: deadlineText,
      bgColor: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      dotColor: 'bg-yellow-500'
    };
  } else {
    return {
      text: deadlineText,
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      dotColor: 'bg-green-500'
    };
  }
};

// Helper function to calculate deadline text
export const calculateDeadlineText = (finishDate) => {
  if (!finishDate) {
    return 'No Deadline';
  }

  const now = new Date();
  const finish = new Date(finishDate);
  const diff = finish - now;

  if (diff <= 0) {
    return 'Deadline Passed';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days} ${days === 1 ? 'Day' : 'Days'} Left`;
}; 