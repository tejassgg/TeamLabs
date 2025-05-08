import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaMoon, FaSun, FaChevronDown } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { authService } from '../services/api';

const Navbar = ({ onLogout, theme, toggleTheme }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const menuRef = useRef();
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfile = await authService.getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profileImage = user?.profileImage || profile?.profileImage || '/static/default-avatar.png';

  const handleLogoClick = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const handleProfile = () => {
    setOpen(false);
    router.push('/profile');
  };
  const handleSettings = () => {
    setOpen(false);
    router.push('/settings');
  };
  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <nav className={`w-full flex items-center justify-between px-8 py-4 mt-4 rounded-3xl transition-colors duration-200 ${theme === 'dark' ? 'bg-[#424242] text-white' : 'bg-gray-800 text-white'}`}>
      <button
        onClick={handleLogoClick}
        className={`text-3xl font-extrabold focus:outline-none ${theme === 'dark' ? 'text-primary' : 'text-white'}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label="TeamLabs Home"
      >
        TeamLabs
      </button>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full focus:outline-none ${theme === 'dark' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg focus:outline-none transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            onClick={() => setOpen((o) => !o)}
          >
            <img
              src={profileImage}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/static/default-avatar.png';
              }}
            />
            <span className="font-semibold">{profile?.username || user?.username || 'User'}</span>
            <FaChevronDown className="ml-1" />
          </button>
          {open && (
            <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg py-2 z-50 ${theme === 'dark' ? 'bg-[#424242] text-white' : 'bg-white text-gray-900'}`}>
              <button className={`block w-full text-left px-4 py-2 hover:${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`} onClick={handleProfile}>My Profile</button>
              <button className={`block w-full text-left px-4 py-2 hover:${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`} onClick={handleSettings}>Settings</button>
              <button className={`block w-full text-left px-4 py-2 hover:${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} text-red-600`} onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 