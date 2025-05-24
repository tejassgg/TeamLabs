import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { FaMoon, FaSun, FaDesktop, FaShieldAlt, FaSignOutAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import TwoFactorAuth from '../components/TwoFactorAuth';
import Breadcrumb from '../components/Breadcrumb';
import authService from '../services/api';

const Settings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');
  const [loading, setLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: user?.twoFactorEnabled || false,
    sessionTimeout: user?.sessionTimeout || 30,
    loginNotifications: user?.loginNotifications !== false
  });

  // Update security settings when user data changes
  useEffect(() => {
    if (user) {
      setSecuritySettings({
        twoFactorEnabled: user.twoFactorEnabled || false,
        sessionTimeout: user.sessionTimeout || 30,
        loginNotifications: user.loginNotifications !== false
      });
    }
  }, [user]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleSecuritySave = async () => {
    setLoading(true);
    try {
      securitySettings.userId = user._id;
      console.table(securitySettings);
      const response = await authService.updateSecuritySettings(securitySettings);

      if (response.status === 200) {
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.sessionTimeout = securitySettings.sessionTimeout;
        userData.loginNotifications = securitySettings.loginNotifications;
        localStorage.setItem('user', JSON.stringify(userData));

        toast.success('Security settings updated successfully');
      }
    } catch (err) {
      console.error('Failed to update security settings:', err);
      toast.error(err.response?.data?.error || 'Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: resolvedTheme === 'dark' ? FaMoon : FaSun },
    { id: 'security', label: 'Security', icon: FaShieldAlt }
  ];

  return (
    <Layout>
      <Head>
        <title>Settings | TeamLabs</title>
      </Head>
      <Breadcrumb type="settings" />
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h1>
          <button
            onClick={logout}
            className={`flex items-center gap-2 px-4 py-2 transition-colors ${theme === 'dark'
                ? 'text-red-400 hover:text-red-300'
                : 'text-red-600 hover:text-red-700'
              }`}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>

        {/* Settings Navigation */}
        <div className="mb-6">
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${activeTab === tab.id
                      ? theme === 'dark'
                        ? 'border-blue-400 text-blue-400'
                        : 'border-blue-600 text-blue-600'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className={`rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-[#1F1F1F] border-gray-700' : 'bg-white border-gray-200'
          }`}>
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className={`p-6 ${theme === 'dark' ? 'bg-[#1F1F1F]' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Theme Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'light'
                    ? theme === 'dark'
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-blue-500 bg-blue-50'
                    : theme === 'dark'
                      ? 'border-gray-700 hover:border-gray-600 bg-[#1F1F1F]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <FaSun className={`text-2xl ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Light</span>
                    {theme === 'light' && (
                      <span className={`text-sm px-2 py-1 rounded-full ${theme === 'dark'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-blue-100 text-blue-600'
                        }`}>
                        Current Theme
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'dark'
                    ? theme === 'dark'
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-blue-500 bg-blue-50'
                    : theme === 'dark'
                      ? 'border-gray-700 hover:border-gray-600 bg-[#1F1F1F]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <FaMoon className={`text-2xl ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Dark</span>
                    {theme === 'dark' && (
                      <span className={`text-sm px-2 py-1 rounded-full ${theme === 'dark'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-blue-100 text-blue-600'
                        }`}>
                        Current Theme
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'system'
                    ? theme === 'dark'
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-blue-500 bg-blue-50'
                    : theme === 'dark'
                      ? 'border-gray-700 hover:border-gray-600 bg-[#1F1F1F]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <FaDesktop className={`text-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>System</span>
                    {theme === 'system' && (
                      <span className={`text-sm px-2 py-1 rounded-full ${theme === 'dark'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-blue-100 text-blue-600'
                        }`}>
                        Current Theme
                      </span>
                    )}
                  </div>
                </button>
              </div>
              <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Current theme: <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)}
                  </span>
                </p>
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your theme preference will be saved and applied across all your devices.
                </p>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className={`p-6 ${theme === 'dark' ? 'bg-[#1F1F1F]' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Security Settings</h2>
              <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
                    } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div>
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Two-Factor Authentication
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Add an extra layer of security to your account
                      </p>
                      {securitySettings.twoFactorEnabled && (
                        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                          <FaCheck className="w-4 h-4" />
                          Enabled
                        </p>
                      )}
                    </div>
                    {!securitySettings.twoFactorEnabled ? (
                      <button
                        onClick={() => setShow2FASetup(true)}
                        className={`px-4 py-2 rounded-lg transition-colors ${theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                      >
                        Enable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={() => setShow2FADisable(true)}
                        className={`px-4 py-2 rounded-lg transition-colors ${theme === 'dark'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                      >
                        Disable 2FA
                      </button>
                    )}
                  </div>
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
                    } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="mb-4">
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Session Timeout</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Automatically log out after period of inactivity</p>
                    </div>
                    <select
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                      className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${theme === 'dark'
                        ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-400 focus:border-blue-400'
                        : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>4 hours</option>
                    </select>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
                    } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div>
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Login Notifications</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Get notified when someone logs into your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.loginNotifications}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer ${theme === 'dark'
                        ? 'bg-gray-700 peer-checked:bg-blue-600 peer-focus:ring-blue-800'
                        : 'bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-blue-300'
                        } peer-focus:outline-none peer-focus:ring-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white`}></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSecuritySave}
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                    }`}
                >
                  <span>{loading ? 'Saving...' : 'Save Security Settings'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-2xl w-full mx-4 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-[#1F1F1F]' : 'bg-white'
            }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Setup Two-Factor Authentication
                </h3>
                <button
                  onClick={() => setShow2FASetup(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-10 ${theme === 'dark' ? 'hover:bg-white text-white' : 'hover:bg-gray-900 text-gray-900'
                    }`}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <TwoFactorAuth
                mode="setup"
                onComplete={() => {
                  setShow2FASetup(false);
                  // Update user data in localStorage
                  const userData = JSON.parse(localStorage.getItem('user') || '{}');
                  userData.twoFactorEnabled = true;
                  localStorage.setItem('user', JSON.stringify(userData));
                  // Update local state
                  setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
                  toast.success('Two-factor authentication enabled successfully');
                }}
                onCancel={() => setShow2FASetup(false)}
                userId={user?._id}
                email={user?.email}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {show2FADisable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-[#1F1F1F]' : 'bg-white'
            }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Disable Two-Factor Authentication
                </h3>
                <button
                  onClick={() => setShow2FADisable(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-10 ${theme === 'dark' ? 'hover:bg-white text-white' : 'hover:bg-gray-900 text-gray-900'
                    }`}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <TwoFactorAuth
                mode="verify"
                onComplete={() => {
                  setShow2FADisable(false);
                  // Update user data in localStorage
                  const userData = JSON.parse(localStorage.getItem('user') || '{}');
                  userData.twoFactorEnabled = false;
                  localStorage.setItem('user', JSON.stringify(userData));
                  // Update local state
                  setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
                  toast.success('Two-factor authentication disabled successfully');
                }}
                onCancel={() => setShow2FADisable(false)}
                userId={user?._id}
                email={user?.email}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings; 