import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaDesktop, FaCheck, FaTimes, FaGithub } from 'react-icons/fa';
import { MdOutlinePayments } from "react-icons/md";
import { useToast } from '../context/ToastContext';
import TwoFactorAuth from '../components/auth/TwoFactorAuth';

import { authService } from '../services/api';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const BillingTab = dynamic(() => import('../components/settings/BillingTab'), { ssr: false });
const IntegrationsTab = dynamic(() => import('../components/settings/IntegrationsTab'), { ssr: false });

const Settings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { logout, user } = useAuth();

  // Helper function to get theme-aware classes
  const getThemeClasses = (baseClasses, darkClasses) => {
    return `${baseClasses} ${theme === 'dark' ? darkClasses : ''}`;
  };

  // Check if user has Admin role
  const isAdmin = user?.role === 'Admin' || user?.role === 1;
  const [activeTab, setActiveTab] = useState('general');

  // Redirect non-admin users away from billing tab
  useEffect(() => {
    if (!isAdmin && activeTab === 'billing') {
      setActiveTab('general');
    }
  }, [isAdmin, activeTab]);
  const [loading, setLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: user?.twoFactorEnabled || false,
    sessionTimeout: user?.sessionTimeout || 30,
    loginNotifications: user?.loginNotifications !== false
  });
  const { showToast } = useToast();
  const router = useRouter();
  const [showSessionTimeoutDropdown, setShowSessionTimeoutDropdown] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [userSettings, setUserSettings] = useState({
    fontFamily: user?.fontFamily || 'Inter'
  });
  const sessionTimeoutOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' }
  ];
  const fontOptions = [
    { value: 'Inter', label: 'Inter', fontFamily: 'Inter, sans-serif' },
    { value: 'Roboto', label: 'Roboto', fontFamily: 'Roboto, sans-serif' },
    { value: 'Open Sans', label: 'Open Sans', fontFamily: 'Open Sans, sans-serif' },
    { value: 'Lato', label: 'Lato', fontFamily: 'Lato, sans-serif' },
    { value: 'Montserrat', label: 'Montserrat', fontFamily: 'Montserrat, sans-serif' },
    { value: 'Poppins', label: 'Poppins', fontFamily: 'Poppins, sans-serif' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro', fontFamily: 'Source Sans Pro, sans-serif' },
    { value: 'Nunito', label: 'Nunito', fontFamily: 'Nunito, sans-serif' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', fontFamily: 'JetBrains Mono, monospace' }
  ];

  // Update security settings when user data changes
  useEffect(() => {
    if (user) {
      setSecuritySettings({
        twoFactorEnabled: user.twoFactorEnabled || false,
        sessionTimeout: user.sessionTimeout || 30,
        loginNotifications: user.loginNotifications !== false
      });
      setUserSettings({
        fontFamily: user.fontFamily || 'Inter'
      });
    }
  }, [user]);

  // Apply font on component mount and when font changes
  useEffect(() => {
    if (userSettings.fontFamily) {
      const selectedFont = fontOptions.find(f => f.value === userSettings.fontFamily);
      if (selectedFont) {
        document.documentElement.style.setProperty('--font-family', selectedFont.fontFamily);
      }
    }
  }, [userSettings.fontFamily]);

  // Set active tab based on URL query parameter
  // This allows direct navigation to specific tabs via URL (e.g., /settings?tab=billing)
  useEffect(() => {
    if(router.query.googleCalendar){
      if(router.query.googleCalendar === 'connected'){
       showToast('Google Calendar connected successfully', 'success');
      }
    }
    if (router.query.tab) {
      const validTabs = ['general', 'integrations'];
      // Only add billing tab for admin users
      if (isAdmin) {
        validTabs.push('billing');
      }

      if (validTabs.includes(router.query.tab)) {
        setActiveTab(router.query.tab);
      } else if (router.query.tab === 'billing' && !isAdmin) {
        // Redirect non-admin users trying to access billing tab
        setActiveTab('general');
        router.push({
          pathname: router.pathname,
          query: { ...router.query, tab: 'general' }
        }, undefined, { shallow: true });
      }
    } else if (router.isReady) {
      // Default to general tab if no tab parameter is provided
      setActiveTab('general');
    }
  }, [router.query.tab, router.isReady, isAdmin]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);










  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    showToast(`Theme changed to ${newTheme}`, 'success');
  };

  const handleTabChange = (tabId) => {
    // Prevent non-admin users from accessing subscription tab
    if (tabId === 'billing' && !isAdmin) {
      showToast('Access denied. Admin role required.', 'error');
      return;
    }

    setActiveTab(tabId);
    // Update URL without page reload
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab: tabId }
    }, undefined, { shallow: true });
  };

  const handleSecuritySave = async () => {
    setLoading(true);
    try {
      securitySettings.userId = user._id;
      const response = await authService.updateSecuritySettings(securitySettings);

      if (response.success) {
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.sessionTimeout = securitySettings.sessionTimeout;
        userData.loginNotifications = securitySettings.loginNotifications;
        localStorage.setItem('user', JSON.stringify(userData));

        showToast('Security settings updated successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to update security settings:', err);
      showToast(err.response?.data?.error || 'Failed to update security settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFontSave = async () => {
    setLoading(true);
    try {
      const response = await authService.updateUserSettings({
        userId: user._id,
        fontFamily: userSettings.fontFamily
      });

      console.log(response);

      if (response.success) {
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.fontFamily = userSettings.fontFamily;
        localStorage.setItem('user', JSON.stringify(userData));

        // Apply font to document using CSS custom property
        const selectedFont = fontOptions.find(f => f.value === userSettings.fontFamily)?.fontFamily || 'Inter, sans-serif';
        document.documentElement.style.setProperty('--font-family', selectedFont);

        showToast('Font settings updated successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to update font settings:', err);
      showToast(err.response?.data?.error || 'Failed to update font settings', 'error');
    } finally {
      setLoading(false);
    }
  };









  const tabs = [
    { id: 'general', label: 'General', icon: FaSun },
    ...(isAdmin ? [{ id: 'billing', label: 'Billings', icon: MdOutlinePayments }] : []),
    { id: 'integrations', label: 'Integrations', icon: FaGithub }, // New Integrations tab
  ];

  return (
    <>
      <Head>
        <title>Settings | TeamLabs</title>
      </Head>
      <div className="mx-auto">
        {/* Settings Navigation */}
        <div className="">
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
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
        <div className={`shadow-sm ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
          {/* Appearance & Security Settings */}
          {activeTab === 'general' && (
            <div className='p-6 max-w-4xl'>
               {/* Security section card */}
              <div>
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Theme</h3>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Choose your display theme preference.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'light'
                    ? theme === 'dark'
                      ? 'border-blue-400 bg-blue-900/20'
                      : 'border-blue-500 bg-blue-50'
                    : theme === 'dark'
                      ? 'border-gray-700 hover:border-gray-600 bg-transparent'
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
                      ? 'border-gray-700 hover:border-gray-600 bg-transparent'
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
                      ? 'border-gray-700 hover:border-gray-600 bg-transparent'
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
                <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-transparent' : 'bg-white'
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

              {/* Font Style section */}
              <div className='mt-6'>
                <div className='flex items-center justify-between gap-2 relative'>
                  <div className="mb-4">
                    <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Font Family</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Select a font that will be applied system-wide</p>
                  </div>
                  <div className="w-1/4">
                    <button
                      type="button"
                      onClick={() => setShowFontDropdown(v => !v)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 ${theme === 'dark'
                        ? 'border-gray-700 bg-transparent text-white hover:bg-[#232323]'
                        : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                      style={{ fontFamily: fontOptions.find(f => f.value === userSettings.fontFamily)?.fontFamily || 'Inter, sans-serif' }}
                    >
                      <span>
                        {fontOptions.find(f => f.value === userSettings.fontFamily)?.label || 'Inter'}
                      </span>
                      <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {showFontDropdown && (
                      <div className={`absolute right-0 mt-2 w-1/4 z-20 rounded-xl shadow-lg border ${theme === 'dark' ? 'bg-[#18181b] border-gray-700' : 'bg-white border-gray-200'}`}>
                        <ul className="max-h-60 overflow-auto py-1">
                          {fontOptions.map(font => (
                            <li key={font.value}>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserSettings(prev => ({ ...prev, fontFamily: font.value }));
                                  setShowFontDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  font.value === userSettings.fontFamily
                                    ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                                    : (theme === 'dark' ? 'hover:bg-[#232323] text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                                }`}
                                style={{ fontFamily: font.fontFamily }}
                              >
                                {font.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleFontSave}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                      }`}
                  >
                    <span>{loading ? 'Saving...' : 'Save Font Settings'}</span>
                  </button>
                </div>
              </div>

              {/* Security section card */}
              <div className='mt-6'>
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Security</h3>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Manage account security preferences.</p>
                </div>
                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
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
                  <div className='flex items-center justify-between gap-2 relative'>
                    <div className="mb-4">
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900' }`}>Session Timeout</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Automatically log out after inactivity for</p>
                    </div>
                    <div className="w-1/4">
                      <button
                        type="button"
                        onClick={() => setShowSessionTimeoutDropdown(v => !v)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 ${theme === 'dark'
                          ? 'border-gray-700 bg-transparent text-white hover:bg-[#232323]'
                          : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                          }`}
                      >
                        <span>
                          {sessionTimeoutOptions.find(o => o.value === securitySettings.sessionTimeout)?.label || 'Select timeout'}
                        </span>
                        <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {showSessionTimeoutDropdown && (
                        <div className={`absolute right-0 mt-2 w-1/4 z-20 rounded-xl shadow-lg border ${theme === 'dark' ? 'bg-[#18181b] border-gray-700' : 'bg-white border-gray-200'}`}>
                          <ul className="max-h-60 overflow-auto py-1">
                            {sessionTimeoutOptions.map(opt => (
                              <li key={opt.value}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSecuritySettings(prev => ({ ...prev, sessionTimeout: opt.value }));
                                    setShowSessionTimeoutDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                    opt.value === securitySettings.sessionTimeout
                                      ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                                      : (theme === 'dark' ? 'hover:bg-[#232323] text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Login Notifications</h3>
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
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <BillingTab getThemeClasses={getThemeClasses} />
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <IntegrationsTab getThemeClasses={getThemeClasses} />
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
                  showToast('Two-factor authentication enabled successfully', 'success');
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
                  showToast('Two-factor authentication disabled successfully', 'success');
                }}
                onCancel={() => setShow2FADisable(false)}
                userId={user?._id}
                email={user?.email}
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Settings; 