import { 
  FaCheckCircle, 
  FaVideo, 
  FaChalkboardTeacher, 
  FaCoffee, 
  FaUserSlash, 
  FaPowerOff 
} from 'react-icons/fa';

export const getStatusConfig = (status) => {
  const config = {
    'Active': {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: FaCheckCircle,
      label: 'Active'
    },
    'In a Meeting': {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: FaVideo,
      label: 'In a Meeting'
    },
    'Presenting': {
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      icon: FaChalkboardTeacher,
      label: 'Presenting'
    },
    'Away': {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      icon: FaCoffee,
      label: 'Away'
    },
    'Busy': {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      icon: FaUserSlash,
      label: 'Busy'
    },
    'Offline': {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      icon: FaPowerOff,
      label: 'Offline'
    }
  };
  return config[status] || config['Offline'];
};
