export const getStatusConfig = (status) => {
  const config = {
    'Active': {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      label: 'Active'
    },
    'In a Meeting': {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="m22 8-6 4 6 4V8Z" />
          <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
      ),
      label: 'In a Meeting'
    },
    'Presenting': {
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <path d="M12 17v4M8 21h8" />
        </svg>
      ),
      label: 'Presenting'
    },
    'Away': {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      ),
      label: 'Away'
    },
    'Busy': {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      ),
      label: 'Busy'
    },
    'Offline': {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
      ),
      label: 'Offline'
    },
    'InActive': {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      icon: ({ className, size }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
      ),
      label: 'InActive'
    }
  };
  return config[status] || config['Offline'];
};
