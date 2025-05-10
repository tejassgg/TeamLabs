import { useState } from 'react';
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
  FaChevronDown
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <nav className={`${theme === 'dark' ? 'bg-white' : 'bg-[#424242]'} shadow-lg rounded-2xl mt-4`}>
      <div className="mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <div className="flex-shrink-0 ml-12">
            <Link href="/" className="flex items-center">
              <span className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-gray-800' : 'text-white'}`}>
                TeamLabs
              </span>
            </Link>
          </div>

          {/* Right side - User menu and Theme toggle */}
          <div className="flex items-center pr-8">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full mr-8 ${
                theme === 'dark' 
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              } transition-colors duration-200`}
            >
              {theme === 'dark' ? <FaMoon size={20} /> : <FaSun size={20} />}
            </button>

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    theme === 'dark'
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  } transition-colors duration-200`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white">
                        <FaUser size={16} />
                      </div>
                    )}
                  </div>
                  <span className="hidden md:block">{user.username}</span>
                  <FaChevronDown size={12} className={`transform transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                    theme === 'dark' ? 'bg-white' : 'bg-[#424242]'
                  } ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}>
                    <Link href="/profile" className={`flex items-center space-x-2 px-4 py-2 ${
                      theme === 'dark' 
                        ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}>
                      <FaUser size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link href="/settings" className={`flex items-center space-x-2 px-4 py-2 ${
                      theme === 'dark' 
                        ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}>
                      <FaCog size={16} />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center space-x-2 px-4 py-2 ${
                        theme === 'dark' 
                          ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
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