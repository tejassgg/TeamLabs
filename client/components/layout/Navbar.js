import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlobal } from '../../context/GlobalContext';
import { authService } from '../../services/api';
import {
  FaUser,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaCog,
  FaChevronDown,
  FaBell,
  FaCircle,
  FaSearch
} from 'react-icons/fa';
import ActivityNotifications from '../shared/ActivityNotifications';
import { useToast } from '../../context/ToastContext';
import StatusDropdown from '../shared/StatusDropdown';



const isProfileComplete = (userDetails) => {
  if (!userDetails) return false;
  const requiredFields = [
    'firstName', 'lastName', 'email'
  ];
  return requiredFields.every(field => userDetails[field] && userDetails[field].toString().trim() !== '');
};

const Navbar = ({ isMobile, theme, onLogout, pageTitle, onSearchClick, breadcrumb }) => {
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
      if (onLogout) onLogout();
      showToast('Logged Out Successfully', 'success');
      router.push('/');
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

  const handleLogoClick = (e) => {
    if (!isProfileComplete(userDetails)) {
      e.preventDefault();
      router.push('/profile');
    }
  };

  // If in mobile navbar, show only the user profile button
  if (isMobile) {
    return (
      <div className={`flex items-center gap-3.5 p-2`}>
        {/* Status Dropdown */}
        <StatusDropdown
          isMobile={isMobile}
          currentStatus={userStatus}
          onStatusChange={handleStatusChange}
          theme={theme}
        />
        {/* Search Trigger (Mobile) */}
        <button
          onClick={onSearchClick}
          className={`p-1.5 rounded-lg transition-all duration-200 text-blue-600 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-dark-hover`}
          aria-label="Search organization"
        >
          <FaSearch size={18} />
        </button>
        {/* Notification Button */}
        <div className="notifications-container relative">
          <button
            onClick={toggleNotifications}
            className={`p-1.5 rounded-lg transition-all duration-200 relative text-blue-600 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-dark-hover`}
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
            onUnreadCountChange={setUnreadCount}
          />
        </div>
        {/* User Menu */}
        {userDetails && (
          <div className="relative user-menu-container z-50">
            <button
              onClick={toggleUserMenu}
              className={`flex items-center space-x-1 p-1.5 rounded-lg transition-all duration-200 text-blue-600 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-dark-hover`}
              aria-label="User profile menu"
            >
              <div className={`w-8 h-8 rounded-full overflow-hidden shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200`}>
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
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg py-1 border z-50 bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700`}>
                <div className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700`}>
                  <p className="font-medium text-sm truncate">{userDetails.firstName} {userDetails.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{userDetails.email}</p>
                </div>
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-dark-hover dark:text-gray-300 dark:hover:text-white`}
                >
                  <FaUser size={16} />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/settings"
                  className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-dark-hover dark:text-gray-300 dark:hover:text-white`}
                >
                  <FaCog size={16} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 text-red-600 hover:text-red-700 dark:hover:bg-dark-hover dark:text-red-400 dark:hover:text-red-300`}
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
    <nav className={`bg-white text-gray-900 border-gray-200 dark:bg-dark-bg dark:text-white dark:border-gray-700 border-b`}>
      <div className="mx-auto">
        <div className="flex justify-between items-center h-16 ml-2">
          {/* Left side - Logo or Breadcrumb */}
          <div className="flex-shrink-0 flex items-center">
            {breadcrumb ? (
              <div className="flex items-center">
                {breadcrumb}
              </div>
            ) : pageTitle ? (
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none cursor-pointer" onClick={handleLogoClick}>
                {pageTitle}
              </div>
            ) : (
              <Link href="/" className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none" onClick={handleLogoClick}>
                TeamLabs
              </Link>
            )}
          </div>

          {/* Right side - User menu and Notifications */}
          <div className="flex items-center space-x-4 mr-2 lg:space-x-6">
            {/* Search Trigger (Desktop) */}
            <button
              onClick={onSearchClick}
              className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all duration-200 cursor-pointer shadow-sm
                bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-dark-hover dark:hover:text-white
              `}
            // title="What are you looking for?"
            >
              <FaSearch className="text-xs text-gray-400" />
              <span className="font-medium text-xs text-gray-400 dark:text-gray-500">What are you looking for?</span>
              <div className="flex items-center gap-1 ml-2">
                <kbd className={`px-1 py-0.2 rounded text-xs font-sans border shadow-sm select-none
                  bg-white border-gray-200 text-gray-400 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-500
                `}>
                  ⌘
                </kbd>
                <span className="text-xs text-gray-400 select-none">+</span>
                <kbd className={`px-1.5 py-0.2 rounded text-xs font-sans border shadow-sm select-none
                  bg-white border-gray-200 text-gray-400 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-500
                `}>
                  /
                </kbd>
              </div>
            </button>
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
                className={`p-2 rounded-full transition-all duration-200 relative text-blue-600 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-dark-hover`}
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
                onUnreadCountChange={setUnreadCount}
              />
            </div>
            {/* User Menu */}
            {userDetails && (
              <div className="relative user-menu-container">
                <button
                  onClick={toggleUserMenu}
                  className={`flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-xl transition-all duration-200 text-blue-600 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-dark-hover`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200`}>
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
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 border z-50 bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700`}>
                    <div className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700`}>
                      <p className="font-medium text-sm truncate">{userDetails.firstName} {userDetails.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{userDetails.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-dark-hover dark:text-gray-300 dark:hover:text-white`}
                    >
                      <FaUser size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-dark-hover dark:text-gray-300 dark:hover:text-white`}
                    >
                      <FaCog size={16} />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 text-red-600 hover:text-red-700 dark:hover:bg-dark-hover dark:text-red-400 dark:hover:text-red-300`}
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