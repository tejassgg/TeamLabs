import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { authService } from '../services/api';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaMoon, 
  FaSun, 
  FaCog, 
  FaChevronDown,
  FaBell,
  FaCircle,
  FaVideo,
  FaChalkboardTeacher,
  FaCoffee,
  FaPowerOff,
  FaCheckCircle,
  FaUserSlash
} from 'react-icons/fa';
import ActivityNotifications from './ActivityNotifications';
import { useToast } from '../context/ToastContext';

// Enhanced StatusDropdown component
const StatusDropdown = ({ currentStatus, onStatusChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isChanging, setIsChanging] = useState(false);

  const statusConfig = {
    'Active': {
      color: 'text-green-500',
      icon: FaCheckCircle,
      tooltip: 'Available and active'
    },
    'In a Meeting': {
      color: 'text-blue-500',
      icon: FaVideo,
      tooltip: 'Currently in a meeting'
    },
    'Presenting': {
      color: 'text-purple-500',
      icon: FaChalkboardTeacher,
      tooltip: 'Currently presenting'
    },
    'Away': {
      color: 'text-yellow-500',
      icon: FaCoffee,
      tooltip: 'Away from keyboard'
    },
    'Busy': {
      color: 'text-red-500',
      icon: FaUserSlash,
      tooltip: 'Currently busy'
    },
    'Offline': {
      color: 'text-gray-500',
      icon: FaPowerOff,
      tooltip: 'Currently offline'
    }
  };

  const statusOptions = Object.keys(statusConfig);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus) => {
    setIsChanging(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setTimeout(() => setIsChanging(false), 500); // Reset after animation
    }
  };

  const StatusIcon = statusConfig[currentStatus].icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200
          ${theme === 'dark' 
            ? 'hover:bg-[#424242] text-blue-200' 
            : 'hover:bg-blue-100 text-blue-600'}
          ${isChanging ? 'scale-95' : 'scale-100'}
          relative overflow-hidden`}
        title={statusConfig[currentStatus].tooltip}
      >
        {/* Pulsing effect for Active status */}
        {currentStatus === 'Active' && (
          <span className="absolute inset-0 bg-green-500/10 rounded-lg animate-pulse"></span>
        )}
        <div className="relative flex items-center gap-2">
          <StatusIcon className={`${statusConfig[currentStatus].color} text-sm transition-transform duration-200 group-hover:scale-110`} />
          <span className="text-sm font-medium transition-all duration-200">{currentStatus}</span>
          <FaChevronDown className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-50 transform transition-all duration-200 origin-top-right
          ${theme === 'dark' ? 'bg-[#424242] border border-[#2d2d2d]' : 'bg-white border border-gray-200'}`}
        >
          <div className="py-1.5">
            {statusOptions.map((status) => {
              const StatusOptionIcon = statusConfig[status].icon;
              return (
                <button
                  key={status}
                  onClick={() => {
                    handleStatusChange(status);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all duration-200
                    ${theme === 'dark' 
                      ? 'hover:bg-[#2d2d2d] text-blue-200' 
                      : 'hover:bg-gray-50 text-gray-700'}
                    ${currentStatus === status ? 'font-semibold' : ''}`}
                  title={statusConfig[status].tooltip}
                >
                  <StatusOptionIcon className={`${statusConfig[status].color} text-sm`} />
                  <span>{status}</span>
                  {currentStatus === status && (
                    <span className="ml-auto text-xs text-gray-400">Current</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = ({ isMobile, theme, onLogout }) => {
  const { userDetails } = useGlobal();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [mobileScreen, setMobileScreen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStatus, setUserStatus] = useState('Offline');
  const { showToast } = useToast();

  // Add status update handler
  const handleStatusChange = async (newStatus) => {
    try {
      const response = await authService.updateUserStatus(newStatus, userDetails._id);

      if (response.status != 200) throw new Error('Failed to update status');
      
      setUserStatus(newStatus);
      showToast('Status updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
      console.error('Error updating status:', error);
    }
  };

  // Add effect to set initial status
  useEffect(() => {
    if (userDetails) {
      setUserStatus(userDetails.status || 'Active');
    }
  }, [userDetails]);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setMobileScreen(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (isNotificationsOpen && !event.target.closest('.notifications-container')) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isNotificationsOpen]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      if (onLogout) onLogout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  // If in mobile navbar, show only the user profile button
  if (isMobile) {
    return (
      <div className={`flex items-center gap-1.5 ${theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA]' : 'bg-white text-gray-900'} p-2 rounded-xl border ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'} shadow-sm`}>
        {/* Status Dropdown */}
        <StatusDropdown 
          currentStatus={userStatus}
          onStatusChange={handleStatusChange}
          theme={theme}
        />
        {/* Notification Button */}
        <div className="notifications-container relative">
          <button 
            onClick={toggleNotifications}
            className={`p-1.5 rounded-lg transition-all duration-200 relative ${
              theme === 'dark' 
                ? 'text-blue-200 hover:bg-[#424242]' 
                : 'text-blue-600 hover:bg-blue-100'
            }`}
          >
            <FaBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <ActivityNotifications 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />
        </div>
        {/* User Menu */}
        {userDetails && (
          <div className="relative user-menu-container z-50">
            <button
              onClick={toggleUserMenu}
              className={`flex items-center space-x-1 p-1.5 rounded-lg transition-all duration-200 ${
                theme === 'dark' 
                  ? 'text-blue-200 hover:bg-[#424242]' 
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
              aria-label="User profile menu"
            >
              <div className={`w-8 h-8 rounded-full overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600'}`}>
                {userDetails.profileImage ? (
                  <img
                    src={userDetails.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <FaUser size={16} />
                  </div>
                )}
              </div>
            </button>
            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg py-1 border z-50 ${
                theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'}`}
              >
                <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
                  <p className="font-medium text-sm truncate">{userDetails.firstName} {userDetails.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{userDetails.email}</p>
                </div>
                <Link 
                  href="/profile" 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
                >
                  <FaUser size={16} />
                  <span>Profile</span>
                </Link>
                <Link 
                  href="/settings" 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
                >
                  <FaCog size={16} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-red-300' : 'hover:bg-blue-100 text-red-600'}`}
                >
                  <FaSignOutAlt size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className={`${theme === 'dark' ? 'bg-[#18181b] text-white border-[#232323]' : 'bg-white text-gray-900 border-gray-200'} shadow-sm rounded-xl mt-4 border`}>
      <div className="mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <div className="flex-shrink-0 ml-4 lg:ml-12">
            <Link href="/" className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-600 text-white'}`}>TL</div>
              <span className="text-2xl lg:text-3xl font-extrabold">TeamLabs</span>
            </Link>
          </div>
          {/* Right side - User menu and Notifications */}
          <div className="flex items-center pr-4 lg:pr-8 space-x-2 lg:space-x-6">
            {/* Status Dropdown */}
            <StatusDropdown 
              currentStatus={userStatus}
              onStatusChange={handleStatusChange}
              theme={theme}
            />
            {/* Notifications */}
            <div className="notifications-container relative">
              <button 
                onClick={toggleNotifications}
                className={`p-2 rounded-full transition-all duration-200 relative ${
                  theme === 'dark' 
                    ? 'text-blue-200 hover:bg-[#424242]' 
                    : 'text-blue-600 hover:bg-blue-100'
                }`}
              >
                <FaBell size={mobileScreen ? 18 : 20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <ActivityNotifications 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
              />
            </div>
            {/* User Menu */}
            {userDetails && (
              <div className="relative user-menu-container">
                <button
                  onClick={toggleUserMenu}
                  className={`flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-xl transition-all duration-200 ${
                    theme === 'dark' 
                      ? 'text-blue-200 hover:bg-[#424242]' 
                      : 'text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600'}`}>
                    {userDetails.profileImage ? (
                      <img
                        src={userDetails.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <FaUser size={16} />
                      </div>
                    )}
                  </div>
                  <span className="hidden lg:block font-medium">{userDetails.username}</span>
                  <FaChevronDown size={12} className={`transform transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 border z-50 ${
                    theme === 'dark' ? 'bg-[#221E1E] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'}`}
                  >
                    <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
                      <p className="font-medium text-sm truncate">{userDetails.firstName} {userDetails.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{userDetails.email}</p>
                    </div>
                    <Link 
                      href="/profile" 
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
                    >
                      <FaUser size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link 
                      href="/settings" 
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-blue-200' : 'hover:bg-blue-100 text-blue-600'}`}
                    >
                      <FaCog size={16} />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#424242] text-red-300' : 'hover:bg-blue-100 text-red-600'}`}
                    >
                      <FaSignOutAlt size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 