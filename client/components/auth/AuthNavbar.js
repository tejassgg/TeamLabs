import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaRegSun, FaRegMoon, FaSignInAlt, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';

const AuthNavbar = ({ openLogin, openRegister, showLogin }) => {
  const { toggleTheme, theme } = useTheme();
  const { logout, isAuthenticated } = useGlobal();
  const router = useRouter();

  const handleLogin = () => {
    if (openLogin) {
      openLogin();
    } else {
      router.push('/auth?type=login');
    }
  };

  const handleRegister = () => {
    if (openRegister) {
      openRegister();
    } else {
      router.push('/auth');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm dark:bg-gray-900/95 dark:backdrop-blur-sm dark:border-b dark:border-gray-800`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 w-full">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
              <img src="/static/logo.png" alt="TeamLabs Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              TeamLabs
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Theme toggle and Auth buttons */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900 bg-gray-105 bg-gray-100 hover:bg-gray-200 dark:text-yellow-300 dark:hover:text-yellow-400 dark:bg-gray-800 dark:hover:bg-dark-hover`}
              title="Switch to dark mode dark:Switch dark:to dark:light dark:mode"
            >
              {theme === 'dark' ? <FaSun className="text-sm sm:text-base" /> : <FaMoon className="text-sm sm:text-base" />}
            </button>

            {/* Auth button */}
            {isAuthenticated ? (
              <button onClick={handleLogout} className={`inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm transition-all transform hover:scale-105 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-500`} >
                <span className="mr-1 sm:mr-2 ">Logout</span>
                <FaSignOutAlt className="text-xs sm:text-sm" />
              </button>
            ) : router.pathname !== '/auth' && (
              !showLogin ? (
                <button onClick={handleLogin} className={`inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm transition-all border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300`} >
                  <FaSignInAlt className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                  <span className=" ">Sign In</span>
                </button>
              ) : (
                <button onClick={handleRegister} className={`inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border-2 rounded-lg font-semibold text-xs sm:text-sm transition-all border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300`} >
                  <FaSignInAlt className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                  <span className=" ">Sign Up</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar;
