import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaMoon, 
  FaSun, 
  FaCog, 
  FaChevronDown,
  FaBell
} from 'react-icons/fa';

const Navbar = ({ isMobile, theme, toggleTheme, onLogout }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileScreen, setMobileScreen] = useState(false);

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
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // If in mobile navbar, show only the user profile button
  if (isMobile) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Notification Button */}
        <button className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 relative">
          <FaBell size={18} />
          <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            <span className="text-[10px]">3</span>
          </span>
        </button>
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200"
        >
          {theme === 'dark' ? <FaMoon size={18} /> : <FaSun size={18} />}
        </button>
        
        {/* User Menu */}
        {user && (
          <div className="relative user-menu-container z-50">
            <button
              onClick={toggleUserMenu}
              className="flex items-center space-x-1 p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
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
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-sm">{user.username || user.email}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Link href="/profile" className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
                  <FaUser size={16} />
                  <span>Profile</span>
                </Link>
                <Link href="/settings" className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
                  <FaCog size={16} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 border-t border-gray-100"
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
    <nav className={`${theme === 'dark' ? 'bg-[#232E3C] text-[#F3F6FA]' : 'bg-gray-200 text-gray-900'} shadow-sm rounded-xl mt-4`}>
      <div className="mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo (hidden on mobile as it's in the mobile navbar) */}
          <div className="flex-shrink-0 ml-4 lg:ml-12">
            <Link href="/" className="flex items-center">
              <span className="text-2xl lg:text-3xl font-extrabold text-gray-900">
                TeamLabs
              </span>
            </Link>
          </div>

          {/* Right side - User menu and Theme toggle */}
          <div className="flex items-center pr-4 lg:pr-8 space-x-2 lg:space-x-6">
            {/* Notifications */}
            <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 relative">
              <FaBell size={mobileScreen ? 18 : 20} />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              {theme === 'dark' ? <FaMoon size={mobileScreen ? 18 : 20} /> : <FaSun size={mobileScreen ? 18 : 20} />}
            </button>

            {/* User Menu */}
            {user && (
              <div className="relative user-menu-container">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <FaUser size={16} />
                      </div>
                    )}
                  </div>
                  <span className="hidden lg:block font-medium">{user.username}</span>
                  <FaChevronDown size={12} className={`transform transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <Link href="/profile" className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
                      <FaUser size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link href="/settings" className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
                      <FaCog size={16} />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
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