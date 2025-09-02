import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaDesktop, FaShieldAlt, FaSignOutAlt, FaCheck, FaTimes, FaCrown, FaInfinity, FaUsers, FaRocket, FaStar, FaCheckCircle, FaGithub, FaGoogle } from 'react-icons/fa';
import { SiGooglecalendar } from "react-icons/si";
import { useToast } from '../context/ToastContext';
import TwoFactorAuth from '../components/auth/TwoFactorAuth';
import { GoogleLogin } from '@react-oauth/google';

import { authService, meetingService } from '../services/api';
import { useRouter } from 'next/router';

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
  const { showToast } = useToast();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionFeatures, setSubscriptionFeatures] = useState({
    free: [],
    monthly: [],
    annual: []
  });
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeInfo, setDowngradeInfo] = useState({
    fromPlan: '',
    toPlan: '',
    refundAmount: 0,
    remainingDays: 0
  });
  const [githubStatus, setGithubStatus] = useState({
    connected: false,
    username: null,
    email: null,
    avatarUrl: null,
    connectedAt: null
  });
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, email: null, tokenExpiry: null });
  const [googleLoading, setGoogleLoading] = useState(false);

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

  // Set active tab based on URL query parameter
  // This allows direct navigation to specific tabs via URL (e.g., /settings?tab=subscription)
  useEffect(() => {
    if (router.query.tab) {
      const validTabs = ['appearance', 'security', 'subscription', 'integrations'];
      if (validTabs.includes(router.query.tab)) {
        setActiveTab(router.query.tab);
      }
    } else if (router.isReady) {
      // Default to appearance tab if no tab parameter is provided
      setActiveTab('appearance');
    }
  }, [router.query.tab, router.isReady]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch subscription data when subscription tab is active
  useEffect(() => {
    if (activeTab === 'subscription' && user?.organizationID) {
      fetchSubscriptionData();
    }
  }, [activeTab, user?.organizationID]);

  // Refresh subscription data when user changes
  useEffect(() => {
    if (user?.organizationID) {
      fetchSubscriptionData();
    }
  }, [user?.organizationID]);

  // Fetch GitHub status when integrations tab is active
  useEffect(() => {
    if (activeTab === 'integrations' && user?._id) {
      fetchGitHubStatus();
      fetchGoogleStatus();
    }
  }, [activeTab, user?._id]);

  const fetchSubscriptionData = async () => {
    setLoadingSubscription(true);
    try {
      const response = await authService.getSubscriptionData(user.organizationID);

      setSubscriptionData(response.data.subscription);
      setPaymentHistory(response.data.paymentHistory.payments || []);
      setSubscriptionFeatures(response.data.subscriptionFeatures || {
        free: [],
        monthly: [],
        annual: []
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const fetchGitHubStatus = async () => {
    try {
      setGithubLoading(true);
      const response = await authService.getGitHubStatus(user._id);
      if (response.success) {
        setGithubStatus(response.githubStatus);
      }
    } catch (error) {
      console.error('Error fetching GitHub status:', error);
      showToast('Failed to fetch GitHub status', 'error');
    } finally {
      setGithubLoading(false);
    }
  };
  const fetchGoogleStatus = async () => {
    try {
      setGoogleLoading(true);
      const response = await meetingService.getGoogleCalendarStatus(user._id);
      if (response?.success) {
        setGoogleStatus({ connected: Boolean(response.connected), email: response.email || null, tokenExpiry: response.tokenExpiry || null });
      }
    } catch (error) {
      // ignore
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setGoogleLoading(true);
      const res = await meetingService.initiateGoogleCalendarAuth();
      if (res.success && res.authUrl) window.location.href = res.authUrl;
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setGoogleLoading(true);
      const res = await meetingService.disconnectGoogleCalendar();
      if (res?.success) {
        setGoogleStatus({ connected: false });
        showToast('Google Calendar disconnected successfully', 'success');
      }
    } catch (e) {
      showToast('Failed to disconnect Google Calendar', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleConnectGitHub = async () => {
    try {
      setGithubLoading(true);
      const response = await authService.initiateGitHubAuth(user._id);

      if (response.success) {
        // Store state for verification
        localStorage.setItem('github_state', response.state);
        localStorage.setItem('github_userId', user._id);

        // Redirect to GitHub OAuth
        window.location.href = response.authUrl;
      } else {
        showToast(response.error || 'Failed to initiate GitHub authentication', 'error');
      }
    } catch (error) {
      console.error('Error initiating GitHub auth:', error);
      showToast('Failed to initiate GitHub authentication', 'error');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    try {
      setGithubLoading(true);
      const response = await authService.disconnectGitHub(user._id);

      if (response.success) {
        setGithubStatus({
          connected: false,
          username: null,
          email: null,
          avatarUrl: null,
          connectedAt: null
        });
        showToast('GitHub account disconnected successfully', 'success');
      } else {
        showToast(response.error || 'Failed to disconnect GitHub account', 'error');
      }
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      showToast('Failed to disconnect GitHub account', 'error');
    } finally {
      setGithubLoading(false);
    }
  };

  // Handle GitHub OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('github_state');
    const storedUserId = localStorage.getItem('github_userId');

    if (code && state && storedState && storedUserId) {
      // Verify state parameter
      if (state === storedState) {
        handleGitHubCallback(code, state, storedUserId);
      } else {
        showToast('Invalid GitHub authentication state', 'error');
      }

      // Clean up stored data
      localStorage.removeItem('github_state');
      localStorage.removeItem('github_userId');

      // Remove URL parameters
      const newUrl = window.location.pathname + '?tab=integrations';
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleGitHubCallback = async (code, state, userId) => {
    try {
      setGithubLoading(true);
      const response = await authService.handleGitHubCallback(code, state, userId);

      if (response.success) {
        setGithubStatus({
          connected: true,
          username: response.githubUser.username,
          email: response.githubUser.email,
          avatarUrl: response.githubUser.avatarUrl,
          connectedAt: new Date()
        });
        showToast('GitHub account connected successfully', 'success');
      } else {
        showToast(response.error || 'Failed to connect GitHub account', 'error');
      }
    } catch (error) {
      console.error('Error handling GitHub callback:', error);
      showToast('Failed to connect GitHub account', 'error');
    } finally {
      setGithubLoading(false);
    }
  };

  // Helper function to get icon for feature
  const getFeatureIcon = (feature) => {
    const featureText = feature.Value.toLowerCase();
    if (featureText.includes('unlimited')) {
      return <FaInfinity className="text-sm text-white" />;
    } else if (featureText.includes('analytics')) {
      return <FaRocket className="text-sm text-white" />;
    } else if (featureText.includes('support')) {
      return <FaStar className="text-sm text-white" />;
    } else if (featureText.includes('members')) {
      return <FaUsers className="text-sm text-white" />;
    } else if (featureText.includes('discount')) {
      return <FaCheckCircle className="text-sm text-white" />;
    } else {
      return <FaCheck className="text-sm text-white" />;
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    showToast(`Theme changed to ${newTheme}`, 'success');
  };

  const handleTabChange = (tabId) => {
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
      console.table(securitySettings);
      const response = await authService.updateSecuritySettings(securitySettings);

      if (response.status === 200) {
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

  const handleEnable2FA = async () => {
    try {
      await authService.enableTwoFactorAuth();
      showToast('Two-factor authentication enabled successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to enable 2FA', 'error');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await authService.disableTwoFactorAuth();
      showToast('Two-factor authentication disabled successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to disable 2FA', 'error');
    }
  };

  // Handle downgrade to free
  const handleDowngradeToFree = async () => {
    try {
      const response = await authService.post(`/payment/downgrade/${user.organizationID}`, {
        newPlan: 'free',
        userId: user._id
      });

      if (response.data.success) {
        showToast(`Successfully downgraded to free plan`, 'success');
        fetchSubscriptionData(); // Refresh subscription data
        setShowDowngradeModal(false);
      } else {
        showToast(response.data.message || 'Failed to downgrade', 'error');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      showToast(error.response?.data?.message || 'Failed to downgrade. Please try again.', 'error');
    }
  };

  // Handle upgrade to annual
  const handleUpgradeToAnnual = async () => {
    try {
      const response = await authService.post(`/payment/upgrade/${user.organizationID}`, {
        newPlan: 'annual',
        userId: user._id
      });

      if (response.data.success) {
        showToast(`Successfully upgraded to annual plan`, 'success');
        fetchSubscriptionData(); // Refresh subscription data
      } else {
        showToast(response.data.message || 'Failed to upgrade', 'error');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      showToast(error.response?.data?.message || 'Failed to upgrade. Please try again.', 'error');
    }
  };

  // Handle downgrade to monthly
  const handleDowngradeToMonthly = async () => {
    try {
      const response = await authService.post(`/payment/downgrade/${user.organizationID}`, {
        newPlan: 'monthly',
        userId: user._id
      });

      if (response.data.success) {
        const originalPlan = response.data.data.originalPlan;
        showToast(`Successfully downgraded from ${originalPlan} to monthly plan. Refund amount: $${response.data.data.refundAmount}`, 'success');

        // Close modal first
        setShowDowngradeModal(false);

        // Add a small delay to ensure backend processing is complete
        setTimeout(() => {
          fetchSubscriptionData(); // Refresh subscription data
        }, 500);
      } else {
        showToast(response.data.message || 'Failed to downgrade', 'error');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      showToast(error.response?.data?.message || 'Failed to downgrade. Please try again.', 'error');
    }
  };

  // Show downgrade confirmation modal
  const showDowngradeConfirmation = async (toPlan) => {
    const currentPlan = getCurrentPlan();

    // Handle downgrade to free (any plan to free)
    if (toPlan === 'free' && currentPlan !== 'free') {
      try {
        // Get actual refund amount from backend
        const response = await authService.get(`/payment/calculate-refund/${user.organizationID}?newPlan=${toPlan}`);

        if (response.data.success) {
          setDowngradeInfo({
            fromPlan: currentPlan,
            toPlan: toPlan,
            refundAmount: response.data.data.refundAmount,
            remainingDays: response.data.data.remainingDays
          });
          setShowDowngradeModal(true);
        } else {
          showToast(response.data.message || 'Failed to calculate refund', 'error');
        }
      } catch (error) {
        console.error('Error calculating refund:', error);
        showToast(error.response?.data?.message || 'Failed to calculate refund. Please try again.', 'error');
      }
    }
    // Handle downgrade from annual to monthly
    else if (currentPlan === 'annual' && toPlan === 'monthly') {
      try {
        // Get actual refund amount from backend
        const response = await authService.get(`/payment/calculate-refund/${user.organizationID}?newPlan=${toPlan}`);

        if (response.data.success) {
          setDowngradeInfo({
            fromPlan: currentPlan,
            toPlan: toPlan,
            refundAmount: response.data.data.refundAmount,
            remainingDays: response.data.data.remainingDays
          });
          setShowDowngradeModal(true);
        } else {
          showToast(response.data.message || 'Failed to calculate refund', 'error');
        }
      } catch (error) {
        console.error('Error calculating refund:', error);
        showToast(error.response?.data?.message || 'Failed to calculate refund. Please try again.', 'error');
      }
    } else {
      // Direct downgrade without refund
      if (toPlan === 'free') {
        handleDowngradeToFree();
      } else if (toPlan === 'monthly') {
        handleDowngradeToMonthly();
      }
    }
  };

  // Helper function to get current plan
  const getCurrentPlan = () => {
    if (!subscriptionData?.hasActiveSubscription) {
      return 'free';
    }
    if (subscriptionData.subscription?.plan === 'monthly') {
      return 'monthly';
    }
    if (subscriptionData.subscription?.plan === 'annual') {
      return 'annual';
    }
    return 'free';
  };

  // Helper function to get button text and state
  const getPlanButtonInfo = (planType) => {
    const currentPlan = getCurrentPlan();
    const planOrder = { free: 0, monthly: 1, annual: 2 };

    if (planType === currentPlan) {
      return {
        text: 'Current Plan',
        disabled: true,
        className: theme === 'dark'
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
      };
    } else if (planOrder[planType] > planOrder[currentPlan]) {
      return {
        text: 'Upgrade',
        disabled: false,
        className: planType === 'monthly'
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
      };
    } else {
      return {
        text: 'Downgrade',
        disabled: false,
        className: theme === 'dark'
          ? 'bg-gray-600 hover:bg-gray-500 text-white'
          : 'bg-gray-500 hover:bg-gray-600 text-white'
      };
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: resolvedTheme === 'dark' ? FaMoon : FaSun },
    { id: 'security', label: 'Security', icon: FaShieldAlt },
    { id: 'subscription', label: 'Subscription', icon: FaCrown },
    { id: 'integrations', label: 'Integrations', icon: FaGithub }, // New Integrations tab
  ];

  return (
    <>
      <Head>
        <title>Settings | TeamLabs</title>
      </Head>
      <div className="mx-auto">
        {/* Settings Navigation */}
        <div className="mb-6">
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8">
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
        <div className={`rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-transparent border-gray-700' : 'bg-white border-gray-200'
          }`}>
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
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
              <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-transparent' : 'bg-white'
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
            <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Security Settings</h2>
              <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-transparent' : 'bg-gray-50'}`}>
                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-transparent' : 'bg-white'
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
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-transparent' : 'bg-white'
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
                        ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400'
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
                  <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-transparent' : 'bg-white'
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

          {/* Subscription Settings */}
          {activeTab === 'subscription' && (
            <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
              <div className="mb-8">
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Subscription Plans
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Choose the perfect plan for your organization's needs
                </p>
              </div>

              {/* Current Plan Status */}
              <div className={`mb-8 p-6 rounded-xl ${theme === 'dark' ? 'bg-transparent' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Current Plan: {subscriptionData?.hasActiveSubscription ? 'Premium' : 'Free'}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {subscriptionData?.hasActiveSubscription
                        ? `Active until ${new Date(subscriptionData.subscription.subscriptionEndDate).toLocaleDateString()}`
                        : 'Limited to 3 projects, 3 user stories, and 20 tasks per user story'
                      }
                    </p>
                    {subscriptionData?.hasActiveSubscription && (
                      <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mt-1`}>
                        {subscriptionData.premiumUsersCount} members have premium access
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchSubscriptionData}
                      disabled={loadingSubscription}
                      className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                        }`}
                      title="Refresh subscription data"
                    >
                      <svg className={`w-5 h-5 ${loadingSubscription ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${subscriptionData?.hasActiveSubscription
                      ? theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                      {subscriptionData?.hasActiveSubscription ? 'Premium Plan' : 'Free Plan'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Cards */}
              <div className="w-4/5 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Free Plan */}
                  <div className={`group relative p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${theme === 'dark'
                    ? 'bg-transparent border-gray-600 hover:border-gray-500'
                    : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl'
                    }`}>
                    {/* Current Plan Badge */}
                    {getCurrentPlan() === 'free' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white'} shadow-lg`}>
                          ✓ CURRENT PLAN
                        </div>
                      </div>
                    )}

                    {/* Background Pattern */}
                    <div className={`absolute inset-0 rounded-2xl opacity-5 ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'}`}
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px),
                                           radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }}>
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="text-center mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 ${theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                          }`}>
                          <FaUsers className={`text-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Free</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Perfect for small teams</p>
                      </div>

                      <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <span className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$0</span>
                          <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
                        </div>
                        <div className={`w-16 h-0.5 mx-auto rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                      </div>

                      <div className="flex-grow">
                        <ul className="space-y-4 mb-8">
                          {subscriptionFeatures.free.map((feature) => (
                            <li key={feature.Code} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-green-600/20' : 'bg-green-100'}`}>
                                {getFeatureIcon(feature)}
                              </div>
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {feature.Value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        disabled={getPlanButtonInfo('free').disabled}
                        onClick={() => {
                          if (getCurrentPlan() !== 'free') {
                            // Handle downgrade to free
                            showDowngradeConfirmation('free');
                          }
                        }}
                        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${getPlanButtonInfo('free').className}`}
                      >
                        {getPlanButtonInfo('free').text}
                      </button>
                    </div>
                  </div>

                  {/* Monthly Premium */}
                  <div className={`group relative p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${theme === 'dark'
                    ? 'bg-transparent border-blue-500/50 hover:border-blue-400'
                    : 'bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-blue-500 hover:border-blue-400 shadow-lg hover:shadow-xl'
                    }`}>
                    {/* Current Plan Badge */}
                    {getCurrentPlan() === 'monthly' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white'} shadow-lg`}>
                          ✓ CURRENT PLAN
                        </div>
                      </div>
                    )}

                    {/* Popular Badge */}
                    {getCurrentPlan() !== 'monthly' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg`}>
                          ⭐ POPULAR
                        </div>
                      </div>
                    )}

                    {/* Background Pattern */}
                    <div className={`absolute inset-0 rounded-2xl opacity-10 ${theme === 'dark' ? 'bg-white' : 'bg-blue-900'}`}
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px),
                                           radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }}>
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="text-center mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 ${theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg'}`}>
                          <FaCrown className="text-2xl text-white" />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Premium Monthly</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>For growing organizations</p>
                      </div>

                      <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <span className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>$99</span>
                          <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
                        </div>
                        <div className="w-16 h-0.5 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                      </div>

                      <div className="flex-grow">
                        <ul className="space-y-4 mb-8">
                          {subscriptionFeatures.monthly.map((feature) => (
                            <li key={feature.Code} className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600">
                                {getFeatureIcon(feature)}
                              </div>
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {feature.Value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        disabled={getPlanButtonInfo('monthly').disabled}
                        onClick={() => {
                          if (getCurrentPlan() === 'annual') {
                            // Handle downgrade from annual to monthly
                            showDowngradeConfirmation('monthly');
                          } else if (getCurrentPlan() !== 'monthly') {
                            // Handle upgrade to monthly
                            router.push(`/payment?plan=monthly&amount=99`);
                          }
                        }}
                        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${getPlanButtonInfo('monthly').className}`}
                      >
                        {getPlanButtonInfo('monthly').text}
                      </button>
                    </div>
                  </div>

                  {/* Annual Premium */}
                  <div className={`group relative p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${theme === 'dark'
                    ? 'bg-transparent border-purple-500/50 hover:border-purple-400'
                    : 'bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-purple-500 hover:border-purple-400 shadow-lg hover:shadow-xl'
                    }`}>
                    {/* Current Plan Badge */}
                    {getCurrentPlan() === 'annual' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white'} shadow-lg`}>
                          ✓ CURRENT PLAN
                        </div>
                      </div>
                    )}

                    {/* Best Value Badge */}
                    {getCurrentPlan() !== 'annual' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg`}>
                          🏆 BEST VALUE
                        </div>
                      </div>
                    )}

                    {/* Background Pattern */}
                    <div className={`absolute inset-0 rounded-2xl opacity-10 ${theme === 'dark' ? 'bg-white' : 'bg-purple-900'}`}
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px),
                                           radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }}>
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="text-center mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 ${theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg'}`}>
                          <FaStar className="text-2xl text-white" />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Premium Annual</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Save 40% with annual billing</p>
                      </div>

                      <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <span className={`text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>$59</span>
                          <span className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>$708</span>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/year</span>
                        </div>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white`}>
                          Save $480/year
                        </div>
                        <div className="w-16 h-0.5 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mt-2"></div>
                      </div>

                      <div className="flex-grow">
                        <ul className="space-y-4 mb-8">
                          {subscriptionFeatures.annual.map((feature) => (
                            <li key={feature.Code} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${feature.Value.toLowerCase().includes('discount')
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600'
                                }`}>
                                {getFeatureIcon(feature)}
                              </div>
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {feature.Value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        disabled={getPlanButtonInfo('annual').disabled}
                        onClick={() => {
                          if (getCurrentPlan() === 'monthly') {
                            // Handle upgrade from monthly to annual
                            handleUpgradeToAnnual();
                          } else if (getCurrentPlan() === 'free') {
                            // Handle direct upgrade from free to annual
                            router.push(`/payment?plan=annual&amount=708`);
                          } else if (getCurrentPlan() !== 'annual') {
                            // Handle upgrade to annual
                            handleUpgradeToAnnual();
                          }
                        }}
                        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${getPlanButtonInfo('annual').className}`}
                      >
                        {getPlanButtonInfo('annual').text}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              {paymentHistory.length > 0 && (
                <div className={`mt-8 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-transparent border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Transaction History
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    {loadingSubscription ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Loading transactions...
                        </p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className={`${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Amount</th>
                            <th className="py-3 px-4 text-left">Plan</th>
                            <th className="py-3 px-4 text-left">Type</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Payment Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((payment) => (
                            <tr key={payment._id} className={`border-b ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <td className="py-3 px-4">
                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {new Date(payment.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`font-medium ${payment.amount < 0 ? 'text-red-500' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {payment.amount < 0 ? '-' : ''}${Math.abs(payment.amount)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {payment.plan === 'monthly' ? 'Monthly' : payment.plan === 'annual' ? 'Annual' : 'Free'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.paymentId?.startsWith('CREDIT_')
                                  ? theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                  : payment.paymentId?.startsWith('REFUND_')
                                    ? theme === 'dark' ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                                    : payment.paymentId?.startsWith('ANNUAL_') || payment.paymentId?.startsWith('MONTHLY_')
                                      ? theme === 'dark' ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                                      : theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {payment.paymentId?.startsWith('CREDIT_') ? 'Credit' :
                                    payment.paymentId?.startsWith('REFUND_') ? 'Refund' :
                                      payment.paymentId?.startsWith('ANNUAL_') ? 'Upgrade' :
                                        payment.paymentId?.startsWith('MONTHLY_') ? 'Downgrade' : 'Payment'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'completed'
                                  ? theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                                  : payment.status === 'pending'
                                    ? theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                    : payment.status === 'refunded'
                                      ? theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                      : theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-700'
                                  }`}>
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {payment.paymentMethod === 'card' ? 'Credit Card' : 'Bank Transfer'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className={`mt-8 p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  What's included in Premium?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Unlimited Resources</h4>
                    <ul className={`space-y-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <li>• Create unlimited projects</li>
                      <li>• Unlimited user stories per project</li>
                      <li>• Unlimited tasks per user story</li>
                      <li>• No storage limits</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Premium Features</h4>
                    <ul className={`space-y-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <li>• Advanced analytics & reporting</li>
                      <li>• Priority customer support</li>
                      <li>• All team members get premium access</li>
                      <li>• Early access to new features</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Integrations</h2>

              <div className='flex items-center justify-between gap-4'>
                {/* GitHub Integration */}
                <div className={`mb-6 p-6 rounded-xl w-full border ${theme === 'dark' ? 'bg-transparent border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <FaGithub size={32} className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
                    <div>
                      <span className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>GitHub</span>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Connect your GitHub account for repository integrations
                      </p>
                    </div>
                  </div>

                  {githubLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {githubStatus.connected ? 'Disconnecting...' : 'Connecting...'}
                      </span>
                    </div>
                  ) : githubStatus.connected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {githubStatus.avatarUrl && (
                          <img
                            src={githubStatus.avatarUrl}
                            alt="GitHub Avatar"
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            @{githubStatus.username}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {githubStatus.email}
                          </p>
                          {githubStatus.connectedAt && (
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                              Connected {new Date(githubStatus.connectedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleDisconnectGitHub}
                        disabled={githubLoading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors float-end duration-200 ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleConnectGitHub}
                          disabled={githubLoading}
                          className={`px-6 py-2 rounded-lg font-semibold transition-colors float-end duration-200 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                          Connect GitHub Account
                        </button>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Not connected</span>
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Connect your GitHub account to enable repository integrations and automations.
                      </div>
                    </div>
                  )}
                </div>
                {/* Google Calendar Integration */}
                <div className={`mb-6 p-6 rounded-xl w-full border ${theme === 'dark' ? 'bg-transparent border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <SiGooglecalendar size={28} className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
                    <div>
                      <span className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Google Calendar</span>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Create calendar events with Google Meet links</p>
                    </div>
                  </div>

                  {googleLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {googleStatus.connected ? 'Disconnecting...' : 'Connecting...'}
                      </span>
                    </div>
                  ) : googleStatus.connected ? (
                    <div className="space-y-4">
                      <div className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>Connected</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div><span className="font-medium">Email:</span> {googleStatus.email || user?.email}</div>
                        {googleStatus.tokenExpiry && (
                          <div><span className="font-medium">Token Expiry:</span> {new Date(googleStatus.tokenExpiry).toLocaleString()}</div>
                        )}
                      </div>
                      <button
                        onClick={handleDisconnectGoogle}
                        disabled={googleLoading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors float-end duration-200 ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <GoogleLogin
                          onSuccess={async (credentialResponse) => {
                            try {
                              const accessToken = credentialResponse.credential;
                              await meetingService.attachGoogleCalendarToken({ accessToken });
                              // Update localStorage user snapshot
                              const userDataRaw = localStorage.getItem('user');
                              if (userDataRaw) {
                                const userData = JSON.parse(userDataRaw);
                                userData.googleCalendarConnected = true;
                                localStorage.setItem('user', JSON.stringify(userData));
                              }
                              await fetchGoogleStatus();
                              showToast('Google Calendar connected', 'success');
                            } catch (e) {
                              showToast('Failed to connect Google Calendar', 'error');
                            }
                          }}
                          onError={() => showToast('Failed to connect Google Calendar', 'error')}
                          scope="https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar"
                          theme="filled_blue"
                          size="large"
                          text="continue_with"
                          shape="rectangular"
                        />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Not connected</span>
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Connect your Google account so meetings automatically include Google Meet links.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Future Integrations Placeholder */}
              <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-transparent border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>More Integrations Coming Soon</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  We're working on adding more integrations including Slack, Discord, and more.
                </p>
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

      {/* Downgrade Confirmation Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-yellow-600/20' : 'bg-yellow-100'}`}>
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Confirm Downgrade
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                You're about to downgrade from {downgradeInfo.fromPlan} to {downgradeInfo.toPlan} plan
              </p>
            </div>

            <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-green-600/20 border border-green-600/30' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                  Estimated Refund:
                </span>
                <span className={`text-lg font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                  ${downgradeInfo.refundAmount}
                </span>
              </div>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                Based on remaining subscription time ({downgradeInfo.remainingDays} days left)
              </p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                From {downgradeInfo.fromPlan} plan to {downgradeInfo.toPlan} plan
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (downgradeInfo.toPlan === 'free') {
                    handleDowngradeToFree();
                  } else if (downgradeInfo.toPlan === 'monthly') {
                    handleDowngradeToMonthly();
                  }
                }}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Confirm Downgrade
              </button>
              <button
                onClick={() => setShowDowngradeModal(false)}
                className={`w-full py-3 px-4 border rounded-lg font-semibold transition-colors duration-200 ${theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings; 