import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { FaMoon, FaSun, FaSignOutAlt, FaBars, FaTimes, FaRegSun, FaRegMoon } from 'react-icons/fa';

const AuthNavbar = ({ openLogin }) => {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${resolvedTheme === 'dark' ? 'bg-gray-900/95 backdrop-blur-sm border-b border-gray-800' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'}`}>
      <div className="sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
              TeamLabs
            </Link>
          </div>
          <div className="flex items-center">
            {/* Theme toggle and Auth buttons */}
            {/* <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-yellow-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? <FaSun /> : <FaMoon />}
            </button> */}

            <button
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] justify-start`}
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
            >
              <span className="ml-auto">
                <span
                  className={`relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in ml-2 ${resolvedTheme === 'dark' ? 'bg-blue-700' : 'bg-gray-300'}`}
                  style={{ borderRadius: '9999px' }}
                >
                  <span className={`absolute left-1 top-1 w-4 h-4 rounded-full flex items-center justify-center transition-transform duration-200 ${resolvedTheme === 'dark' ? 'translate-x-4' : 'translate-x-0'} `}>
                    {resolvedTheme === 'dark' ? (
                      <FaRegSun className="text-yellow-300" size={12} />
                    ) : (
                      <FaRegMoon className="text-gray-600" size={12} />
                    )}
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar;
