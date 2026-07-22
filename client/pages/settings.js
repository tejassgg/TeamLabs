import React, { useState, useEffect } from 'react';
import Head from 'next/head';

import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaDesktop, FaCheck, FaTimes, FaGithub, FaRocket } from 'react-icons/fa';
import { MdOutlinePayments } from "react-icons/md";
import { useToast } from '../context/ToastContext';
import TwoFactorAuth from '../components/auth/TwoFactorAuth';

import { authService } from '../services/api';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const BillingTab = dynamic(() => import('../components/settings/BillingTab'), { ssr: false });
const IntegrationsTab = dynamic(() => import('../components/settings/IntegrationsTab'), { ssr: false });
const ReleaseNotificationsTab = dynamic(() => import('../components/settings/ReleaseNotificationsTab'), { ssr: false });

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { userDetails, setUserDetails } = useGlobal();

  // Helper function to get theme-aware classes

  // Check if user has Admin role
  const isAdmin = userDetails?.role === 'Admin';

  // Check if user has Admin role where username = tejassgg (system admin)
  const isSystemAdmin = isAdmin && userDetails?.username === 'tejassgg';
  const [activeTab, setActiveTab] = useState('general');

  // Redirect non-admin users away from admin-only tabs
  useEffect(() => {
    if (!isAdmin && activeTab === 'billing') {
      setActiveTab('general');
    }
    if (!isSystemAdmin && activeTab === 'releases') {
      setActiveTab('general');
    }
  }, [isAdmin, isSystemAdmin, activeTab]);
  const [loading, setLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: userDetails?.twoFactorEnabled || false,
    sessionTimeout: userDetails?.sessionTimeout || 30,
    loginNotifications: userDetails?.loginNotifications !== false
  });
  const { showToast } = useToast();
  const router = useRouter();
  const [showSessionTimeoutDropdown, setShowSessionTimeoutDropdown] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [userSettings, setUserSettings] = useState({
    fontFamily: userDetails?.fontFamily || 'JetBrains Mono'
  });
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionFeatures, setSubscriptionFeatures] = useState({
    free: [],
    monthly: [],
    annual: []
  });
  const [subscriptionPrices, setSubscriptionPrices] = useState({
    freeMonthly: '0',
    premiumMonthly: '49',
    premiumAnnualMonthlyEq: '34.92',
    premiumAnnualYearly: '419'
  });
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
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
    if (userDetails) {
      setSecuritySettings({
        twoFactorEnabled: userDetails.twoFactorEnabled || false,
        sessionTimeout: userDetails.sessionTimeout || 30,
        loginNotifications: userDetails.loginNotifications !== false
      });
      setUserSettings({
        fontFamily: userDetails.fontFamily || 'JetBrains Mono'
      });
    }
  }, [userDetails]);

  // Apply font on component mount and when font changes
  useEffect(() => {
    if (userSettings.fontFamily) {
      const selectedFont = fontOptions.find(f => f.value === userSettings.fontFamily);
      if (selectedFont) {
        document.documentElement.style.setProperty('--font-family', selectedFont.fontFamily);
      }
    }
  }, [userSettings.fontFamily]);

  // Fetch subscription data on component mount for admin users
  const fetchSubscriptionData = async () => {
    if (!userDetails?.organizationID || !isAdmin) return;

    setLoadingSubscription(true);
    try {
      const response = await authService.getSubscriptionData(userDetails.organizationID);
      setSubscriptionData(response.data.subscription);
      setSubscriptionFeatures(response.data.subscriptionFeatures || { free: [], monthly: [], annual: [] });
      setSubscriptionPrices(response.data.subscriptionPrices || {
        freeMonthly: '0',
        premiumMonthly: '49',
        premiumAnnualMonthlyEq: '34.92',
        premiumAnnualYearly: '419'
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [userDetails?.organizationID, isAdmin]);

  // Fetch integrations data on component mount
  const fetchIntegrationsData = async () => {
    if (!userDetails?._id) return;

    setLoadingIntegrations(true);
    try {
      const response = await authService.getIntegrationsStatus(userDetails._id);
      if (response.success) {
        setIntegrations(response.integrations);
      }
    } catch (error) {
      console.error('Error fetching integrations data:', error);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  useEffect(() => {
    fetchIntegrationsData();
  }, [userDetails?._id]);

  // Set active tab based on URL query parameter
  // This allows direct navigation to specific tabs via URL (e.g., /settings?tab=billing)
  useEffect(() => {
    if (router.query.googleCalendar) {
      if (router.query.googleCalendar === 'connected') {
        showToast('Google Calendar connected successfully', 'success');
      }
    }
    if (router.query.tab) {
      const validTabs = ['general', 'integrations'];
      // Only add billing tab for admin users
      if (isAdmin) {
        validTabs.push('billing');
      }
      // Only add releases tab for system admin users (OrganizationID='1')
      if (isSystemAdmin) {
        validTabs.push('releases');
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
      } else if (router.query.tab === 'releases' && !isSystemAdmin) {
        // Redirect non-system-admin users trying to access releases tab
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
  }, [router.query.tab, router.isReady, isAdmin, isSystemAdmin]);

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

    // Prevent non-system-admin users from accessing releases tab
    if (tabId === 'releases' && !isSystemAdmin) {
      showToast('Access denied. System admin role required.', 'error');
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
      securitySettings.userId = userDetails._id;
      const response = await authService.updateSecuritySettings(securitySettings);

      if (response.success) {
        // Update user data in localStorage
        const userData = userDetails;
        userData.sessionTimeout = securitySettings.sessionTimeout;
        userData.loginNotifications = securitySettings.loginNotifications;
        setUserDetails(userData);

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
        userId: userDetails._id,
        fontFamily: userSettings.fontFamily
      });

      if (response.success) {
        // Update user data in localStorage
        const userData = userDetails;
        userData.fontFamily = userSettings.fontFamily;
        setUserDetails(userData);

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
    { id: 'integrations', label: 'Integrations', icon: FaGithub },
    ...(isSystemAdmin ? [{ id: 'releases', label: 'Release Notifications', icon: FaRocket }] : []),
  ];

  return (
    <>
      <Head>
        <title>Settings | TeamLabs</title>
      </Head>
      <div className="mx-auto">
        {/* Settings Navigation */}
        <div className={`border-b border-gray-200 dark:border-gray-700`}>
          <nav className="ml-2 mt-2 flex space-x-2 pb-3 -mb-px overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 shadow-sm'
                    : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-zinc-800/50'
                    } whitespace-nowrap px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 group relative`}
                >
                  {tab.id === 'general' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  {tab.id === 'billing' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                      <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  )}
                  {tab.id === 'integrations' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                  {tab.id === 'releases' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                      <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M14 2s.5 2 2.5 4M10 14L3 21M22 2l-3 10-4 1-4-4 1-4 10-3z" />
                    </svg>
                  )}
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="bg-white dark:bg-transparent">
          {/* Appearance & Security Settings */}
          {activeTab === 'general' && (
            <div className='p-6 max-w-4xl'>
              {/* Security section card */}
              <div>
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white`}>Theme</h3>
                  <p className={`text-gray-500 dark:text-gray-400 text-sm`}>Choose your display theme preference.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white dark:border-gray-700 dark:hover:border-gray-600 dark:bg-transparent'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FaSun className={`text-2xl text-yellow-500 dark:text-yellow-400`} />
                      <span className={`font-medium text-gray-700 dark:text-gray-200`}>Light</span>
                      {theme === 'light' && (
                        <span className={`text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400`}>
                          Current Theme
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white dark:border-gray-700 dark:hover:border-gray-600 dark:bg-transparent'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FaMoon className={`text-2xl text-blue-500 dark:text-blue-400`} />
                      <span className={`font-medium text-gray-700 dark:text-gray-200`}>Dark</span>
                      {theme === 'dark' && (
                        <span className={`text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400`}>
                          Current Theme
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'system'
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white dark:border-gray-700 dark:hover:border-gray-600 dark:bg-transparent'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FaDesktop className={`text-2xl text-gray-500 dark:text-gray-400`} />
                      <span className={`font-medium text-gray-700 dark:text-gray-200`}>System</span>
                      {theme === 'system' && (
                        <span className={`text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400`}>
                          Current Theme
                        </span>
                      )}
                    </div>
                  </button>
                </div>
                <div className={`mt-4 p-4 rounded-lg bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700`}>
                  <p className={`text-sm text-gray-600 dark:text-gray-300`}>
                    Current theme: <span className={`font-medium text-gray-900 dark:text-white`}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </p>
                  <p className={`mt-2 text-sm text-gray-500 dark:text-gray-400`}>
                    Your theme preference will be saved and applied across all your devices.
                  </p>
                </div>
              </div>

              {/* Font Style section */}
              <div className='mt-6'>
                <div className='flex items-center justify-between gap-2 relative'>
                  <div className="mb-4">
                    <h3 className={`font-medium text-gray-900 dark:text-white`}>Font Family</h3>
                    <p className={`text-sm text-gray-500 dark:text-gray-400`}>Select a font that will be applied system-wide</p>
                  </div>
                  <div className="lg:w-1/4 w-full">
                    <button
                      type="button"
                      onClick={() => setShowFontDropdown(v => !v)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-dark-card`}
                      style={{ fontFamily: fontOptions.find(f => f.value === userSettings.fontFamily)?.fontFamily || 'JetBrains Mono, monospace' }}
                    >
                      <span>
                        {fontOptions.find(f => f.value === userSettings.fontFamily)?.label || 'JetBrains Mono'}
                      </span>
                      <svg className={`w-4 h-4 text-gray-600 dark:text-gray-300`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {showFontDropdown && (
                      <div className={`absolute right-0 mt-2 lg:w-1/4 w-1/2 z-20 rounded-xl shadow-lg border bg-white border-gray-200 dark:bg-dark-bg dark:border-gray-700`}>
                        <ul className="max-h-60 overflow-auto py-1">
                          {fontOptions.map(font => (
                            <li key={font.value}>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserSettings(prev => ({ ...prev, fontFamily: font.value }));
                                  setShowFontDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${font.value === userSettings.fontFamily
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-dark-card dark:text-gray-200'
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
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 dark:text-white`}
                  >
                    <span>{loading ? 'Saving...' : 'Save Font Settings'}</span>
                  </button>
                </div>
              </div>

              {/* Security section card */}
              <div className='mt-6'>
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white`}>Security</h3>
                  <p className={`text-gray-500 dark:text-gray-400 text-sm`}>Manage account security preferences.</p>
                </div>
                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className={`flex items-center justify-between bg-white dark:bg-transparent`}>
                    <div>
                      <h3 className={`font-medium text-gray-900 dark:text-white`}>
                        Two-Factor Authentication
                      </h3>
                      <p className={`text-sm text-gray-500 dark:text-gray-400`}>
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
                        className={`px-4 py-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white`}
                      >
                        Enable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={() => setShow2FADisable(true)}
                        className={`px-4 py-2 rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white`}
                      >
                        Disable 2FA
                      </button>
                    )}
                  </div>
                  <div className='flex items-center justify-between gap-2 relative'>
                    <div className="mb-4">
                      <h3 className={`font-medium text-gray-900 dark:text-white`}>Session Timeout</h3>
                      <p className={`text-sm text-gray-500 dark:text-gray-400`}>Automatically log out after inactivity for</p>
                    </div>
                    <div className="lg:w-1/4 w-full">
                      <button
                        type="button"
                        onClick={() => setShowSessionTimeoutDropdown(v => !v)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-dark-card`}
                      >
                        <span>
                          {sessionTimeoutOptions.find(o => o.value === securitySettings.sessionTimeout)?.label || 'Select timeout'}
                        </span>
                        <svg className={`w-4 h-4 text-gray-600 dark:text-gray-300`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {showSessionTimeoutDropdown && (
                        <div className={`absolute right-0 mt-2 lg:w-1/4 w-1/2 z-20 rounded-xl shadow-lg border bg-white border-gray-200 dark:bg-dark-bg dark:border-gray-700`}>
                          <ul className="max-h-60 overflow-auto py-1">
                            {sessionTimeoutOptions.map(opt => (
                              <li key={opt.value}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSecuritySettings(prev => ({ ...prev, sessionTimeout: opt.value }));
                                    setShowSessionTimeoutDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${opt.value === securitySettings.sessionTimeout
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-dark-card dark:text-gray-200'
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
                      <h3 className={`font-medium text-gray-900 dark:text-white`}>Login Notifications</h3>
                      <p className={`text-sm text-gray-500 dark:text-gray-400`}>Get notified when someone logs into your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.loginNotifications}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-blue-300 dark:bg-gray-700 dark:peer-checked:bg-blue-600 dark:peer-focus:ring-blue-800 peer-focus:outline-none peer-focus:ring-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white`}></div>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSecuritySave}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 dark:text-white`}
                  >
                    <span>{loading ? 'Saving...' : 'Save Security Settings'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <BillingTab
              subscriptionData={subscriptionData}
              subscriptionFeatures={subscriptionFeatures}
              subscriptionPrices={subscriptionPrices}
              loadingSubscription={loadingSubscription}
              onRefreshSubscription={fetchSubscriptionData}
            />
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <IntegrationsTab
              integrations={integrations}
              loadingIntegrations={loadingIntegrations}
              onRefreshIntegrations={fetchIntegrationsData}
            />
          )}

          {/* Release Notifications Tab */}
          {activeTab === 'releases' && (
            <ReleaseNotificationsTab
            />
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`max-w-2xl w-full mx-4 rounded-xl shadow-lg bg-white dark:bg-[#1F1F1F]`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium text-gray-900 dark:text-white`}>
                  Setup Two-Factor Authentication
                </h3>
                <button
                  onClick={() => setShow2FASetup(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-900 text-gray-900 dark:hover:bg-white dark:text-white`}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <TwoFactorAuth
                mode="setup"
                onComplete={() => {
                  setShow2FASetup(false);
                  // Update user data in localStorage
                  const userData = userDetails;
                  userData.twoFactorEnabled = true;
                  setUserDetails(userData);
                  // Update local state
                  setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
                  showToast('Two-factor authentication enabled successfully', 'success');
                }}
                onCancel={() => setShow2FASetup(false)}
                userId={userDetails?._id}
                email={userDetails?.email}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {show2FADisable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 rounded-xl shadow-lg bg-white dark:bg-[#1F1F1F]`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium text-gray-900 dark:text-white`}>
                  Disable Two-Factor Authentication
                </h3>
                <button
                  onClick={() => setShow2FADisable(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-900 text-gray-900 dark:hover:bg-white dark:text-white`}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <TwoFactorAuth
                mode="verify"
                onComplete={() => {
                  setShow2FADisable(false);
                  // Update user data in localStorage
                  const userData = userDetails;
                  userData.twoFactorEnabled = false;
                  setUserDetails(userData);
                  // Update local state
                  setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
                  showToast('Two-factor authentication disabled successfully', 'success');
                }}
                onCancel={() => setShow2FADisable(false)}
                userId={userDetails?._id}
                email={userDetails?.email}
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Settings; 
