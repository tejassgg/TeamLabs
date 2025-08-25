import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { FaMoon, FaSun, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

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
          
          {/* Theme toggle and Auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-yellow-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
            
            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' : 'text-blue-600 hover:text-blue-700 hover:bg-gray-100'}`}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className={`px-4 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  <FaSignOutAlt className="text-sm" /> Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={openLogin}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' : 'text-blue-600 hover:text-blue-700 hover:bg-gray-100'}`}
                >
                  Login
                </button>
                <Link 
                  href="/register" 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-start px-4 py-2 rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-yellow-300 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {resolvedTheme === 'dark' ? <FaSun className="mr-2" /> : <FaMoon className="mr-2" />}
                {resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </button>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' : 'text-blue-600 hover:text-blue-700 hover:bg-gray-100'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                  >
                    <FaSignOutAlt className="text-sm" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      openLogin();
                      setMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' : 'text-blue-600 hover:text-blue-700 hover:bg-gray-100'}`}
                  >
                    Login
                  </button>
                  <Link 
                    href="/register" 
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AuthNavbar;
