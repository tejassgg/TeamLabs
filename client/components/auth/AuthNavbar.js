import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaRegSun, FaRegMoon, FaSignInAlt, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';

const AuthNavbar = ({ openLogin }) => {
  const { toggleTheme, theme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    if (openLogin) {
      openLogin();
    } else {
      router.push('/auth?type=login');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900/95 backdrop-blur-sm border-b border-gray-800' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 w-full">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
              TeamLabs
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Theme toggle and Auth buttons */}
            {/* <button
              onClick={toggleTheme}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-yellow-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100/10 hover:bg-gray-200'}`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <FaSun className="text-sm sm:text-base" /> : <FaMoon className="text-sm sm:text-base" />}
            </button> */}

            <button
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] justify-start`}
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
            >
              <span className="ml-auto">
                <span
                  className={`relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in ml-2 ${theme === 'dark' ? 'bg-blue-700' : 'bg-gray-300'}`}
                  style={{ borderRadius: '9999px' }}
                >
                  <span className={`absolute left-1 top-1 w-4 h-4 rounded-full flex items-center justify-center transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'} `}>
                    {theme === 'dark' ? (
                      <FaRegSun className="text-yellow-300" size={12} />
                    ) : (
                      <FaRegMoon className="text-gray-600" size={12} />
                    )}
                  </span>
                </span>
              </span>
            </button>

            {/* Auth button */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className={`inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm transition-all transform hover:scale-105 ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'}`}
              >
                <FaSignOutAlt className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className={`inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
              >
                <FaSignInAlt className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                <span className="hidden lg:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar;
