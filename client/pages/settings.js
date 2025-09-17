import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaDesktop, FaCheck, FaTimes, FaCrown, FaInfinity, FaUsers, FaRocket, FaStar, FaCheckCircle, FaGithub } from 'react-icons/fa';
import { MdOutlinePayments } from "react-icons/md";
import { SiGooglecalendar } from "react-icons/si";
import { useToast } from '../context/ToastContext';
import TwoFactorAuth from '../components/auth/TwoFactorAuth';
import { GoogleLogin } from '@react-oauth/google';

import { authService, meetingService, commonTypeService } from '../services/api';
import { paymentService } from '../services/api';
import { useRouter } from 'next/router';

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
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [stripeInvoices, setStripeInvoices] = useState([]);
  const [loadingStripeInvoices, setLoadingStripeInvoices] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
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
  const [googleStatus, setGoogleStatus] = useState({ connected: false, email: null, tokenExpiry: null, avatarUrl: null });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  // Fetch billing data when billing tab is active
  useEffect(() => {
    if (activeTab === 'billing' && user?.organizationID) {
      fetchSubscriptionData();
      // Use single catalog API for features and prices
      commonTypeService.getSubscriptionCatalog()
        .then((catalog) => {
          if (catalog?.features) {
            setSubscriptionFeatures({
              free: catalog.features.free || [],
              monthly: catalog.features.monthly || [],
              annual: catalog.features.annual || []
            });
          }
          if (catalog?.prices) {
            setSubscriptionPrices({
              freeMonthly: catalog.prices.freeMonthly || '0',
              premiumMonthly: catalog.prices.premiumMonthly || '49',
              premiumAnnualMonthlyEq: catalog.prices.premiumAnnualMonthlyEq || '34.92',
              premiumAnnualYearly: catalog.prices.premiumAnnualYearly || '419'
            });
          }
        })
        .catch(() => {/* ignore; fallback defaults stay */ });
      // Fetch Stripe invoices
      fetchStripeInvoices();
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

  const fetchStripeInvoices = async () => {
    try {
      setLoadingStripeInvoices(true);
      const res = await paymentService.getStripeTransactions(user.organizationID);
      if (res?.success) {
        const invoices = res.data || [];
        setStripeInvoices(invoices);
      }
    } catch (e) {
      // ignore errors; just don't show stripe section
    } finally {
      setLoadingStripeInvoices(false);
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
        setGoogleStatus({
          connected: Boolean(response.connected),
          email: response.email || null,
          tokenExpiry: response.tokenExpiry || null,
          avatarUrl: response.avatarUrl || null
        });
      }
    } catch (error) {
      // ignore
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

  // Handle downgrade to free
  const handleDowngradeToFree = async () => {
    try {
      const response = await authService.downgradeSubscription(user.organizationID, 'free', user._id);

      if (response.success) {
        showToast(`Successfully downgraded to free plan`, 'success');
        fetchSubscriptionData(); // Refresh subscription data
        setShowDowngradeModal(false);
      } else {
        showToast(response.message || 'Failed to downgrade', 'error');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      showToast(error.message || 'Failed to downgrade. Please try again.', 'error');
    }
  };

  // Start Stripe Checkout for monthly/annual
  const startStripeCheckout = async (selectedPlan) => {
    try {
      const priceId = selectedPlan === 'annual'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

      if (!priceId) {
        showToast('Stripe price not configured for selected plan', 'error');
        return;
      }

      const { success, url } = await paymentService.createCheckoutSession({
        organizationID: user.organizationID,
        userId: user._id,
        plan: selectedPlan,
        priceId,
      });
      if (success && url) {
        window.location.href = url;
      } else {
        showToast('Failed to start checkout', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Failed to start checkout', 'error');
    }
  };

  // Handle upgrade to annual (existing immediate backend path retained for monthly->annual within app)
  const handleUpgradeToAnnual = async () => {
    try {
      // 1) Cancel current subscription first (prorated refund if eligible)
      const cancelRes = await authService.cancelSubscription(user.organizationID, user._id);
      if (!cancelRes?.success) {
        showToast(cancelRes?.message || 'Failed to cancel current subscription', 'error');
        return;
      }

      showToast('Current subscription cancelled. Redirecting to annual checkout...', 'success');

      // 2) Redirect to Annual payment page (Stripe Checkout)
      await startStripeCheckout('annual');
    } catch (error) {
      console.error('Upgrade to annual error:', error);
      showToast(error.message || 'Failed to upgrade. Please try again.', 'error');
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
        const response = await authService.calculateRefund(user.organizationID, toPlan);

        if (response.success) {
          setDowngradeInfo({
            fromPlan: currentPlan,
            toPlan: toPlan,
            refundAmount: response.data.refundAmount,
            remainingDays: response.data.remainingDays
          });
          setShowDowngradeModal(true);
        } else {
          showToast(response.message || 'Failed to calculate refund', 'error');
        }
      } catch (error) {
        console.error('Error calculating refund:', error);
        showToast(error.message || 'Failed to calculate refund. Please try again.', 'error');
      }
    }
    // Handle downgrade from annual to monthly
    else if (currentPlan === 'annual' && toPlan === 'monthly') {
      try {
        const response = await authService.calculateRefund(user.organizationID, toPlan);

        if (response.success) {
          setDowngradeInfo({
            fromPlan: currentPlan,
            toPlan: toPlan,
            refundAmount: response.data.refundAmount,
            remainingDays: response.data.remainingDays
          });
          setShowDowngradeModal(true);
        } else {
          showToast(response.message || 'Failed to calculate refund', 'error');
        }
      } catch (error) {
        console.error('Error calculating refund:', error);
        showToast(error.message || 'Failed to calculate refund. Please try again.', 'error');
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

  // Subscription plans data structure for dynamic rendering
  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Basic Account',
      description: 'Perfect for small teams',
      icon: FaUsers,
      // price: 'Free forever *',
      price: `$${subscriptionPrices.freeMonthly}`,
      priceValue: subscriptionPrices.freeMonthly,
      features: subscriptionFeatures.free,
      borderColor: theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300',
      backgroundGradient: theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-gray-50 to-white',
      iconBg: theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200',
      iconColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      titleGradient: theme === 'dark' ? 'from-blue-400 via-purple-400 to-blue-400' : 'from-blue-600 via-purple-600 to-blue-600',
      descriptionColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
      badge: getCurrentPlan() === 'free' ? { text: '✓ CURRENT PLAN', color: theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white' } : null,
      showPrice: true,
      priceUnit: '/mo',
      priceGradient: 'from-blue-600 to-purple-600',
      showSavings: false
    },
    {
      id: 'monthly',
      name: 'Premium Monthly',
      description: 'For growing organizations',
      icon: FaCrown,
      price: `$${subscriptionPrices.premiumMonthly}`,
      priceValue: subscriptionPrices.premiumMonthly,
      features: subscriptionFeatures.monthly,
      borderColor: theme === 'dark' ? 'border-blue-500/50 hover:border-blue-400' : 'border-blue-500 hover:border-blue-400',
      backgroundGradient: theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50',
      iconBg: theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200',
      iconColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      titleGradient: theme === 'dark' ? 'from-blue-400 via-purple-400 to-blue-400' : 'from-blue-600 via-purple-600 to-blue-600',
      descriptionColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
      badge: getCurrentPlan() === 'monthly' && { text: '✓ CURRENT PLAN', color: theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white' },
      showPrice: true,
      showSavings: false,
      priceUnit: '/mo',
      priceGradient: 'from-blue-600 to-purple-600'
    },
    {
      id: 'annual',
      name: 'Premium Annual',
      description: 'Save 40% with annual billing',
      icon: FaStar,
      price: `$${subscriptionPrices.premiumAnnualYearly}`,
      priceValue: subscriptionPrices.premiumAnnualYearly,
      features: subscriptionFeatures.annual,
      borderColor: theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300',
      backgroundGradient: theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-gray-50 to-white',
      // borderColor: theme === 'dark' ? 'border-purple-500/50 hover:border-purple-400' : 'border-purple-500 hover:border-purple-400',
      // backgroundGradient: theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50',
      iconBg: theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200',
      iconColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      titleGradient: theme === 'dark' ? 'from-blue-400 via-purple-400 to-blue-400' : 'from-blue-600 via-purple-600 to-blue-600',
      descriptionColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
      badge: getCurrentPlan() === 'annual' && { text: '✓ CURRENT PLAN', color: theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white' },
      showPrice: true,
      showSavings: true,
      priceUnit: '/yr',
      priceGradient: 'from-purple-600 to-pink-600',
      originalPrice: (Number(subscriptionPrices.premiumMonthly) * 12).toFixed(0),
      monthlyEquivalent: subscriptionPrices.premiumAnnualMonthlyEq,
      savingsAmount: ((Number(subscriptionPrices.premiumMonthly) * 12) - Number(subscriptionPrices.premiumAnnualYearly)).toFixed(0)
    }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: resolvedTheme === 'dark' ? FaMoon : FaSun },
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
            <div className='p-6 max-w-7xl'>
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

              {/* Security section card */}
              <div className={`mt-6`}>
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Security</h3>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Manage account security preferences.</p>
                </div>
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
            <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
              {/* Current Plan Status */}
              <div className={`mb-4 p-6 rounded-xl ${theme === 'dark' ? 'bg-transparent' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Current Plan: {subscriptionData?.hasActiveSubscription ? `Premium ${subscriptionData?.subscription?.plan === 'annual' ? '(Annual)' : '(Monthly)'}` : 'Free'}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {subscriptionData?.hasActiveSubscription
                        ? `Active until ${new Date(subscriptionData.subscription.subscriptionEndDate).toLocaleDateString()}`
                        : 'Limited to 3 projects, 3 user stories, and 20 tasks per user story'
                      }
                    </p>
                    {subscriptionData?.hasActiveSubscription && (
                      <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mt-1`}>
                        {subscriptionData.premiumUsersCount} {subscriptionData.premiumUsersCount === 1 ? 'member' : 'members'} have premium access
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
                    {subscriptionData?.hasActiveSubscription && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold shadow transition-all duration-200 ${theme === 'dark'
                          ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:shadow-md'
                          : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:shadow-md'
                          }`}
                      >
                        Cancel Subscription
                      </button>
                    )}
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${subscriptionData?.hasActiveSubscription
                      ? theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                      {subscriptionData?.hasActiveSubscription ? 'Premium Plan' : 'Free Plan'}
                    </div>
                  </div>
                </div>
              </div>
              {!subscriptionData?.hasActiveSubscription && (
                <div className="flex flex-col items-center justify-center gap-2 mb-12">
                  <h2 className={`text-5xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Choose Your Plan
                  </h2>
                  <p className={`text-lg w-1/3 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Select the perfect plan for your organization's needs and start building amazing projects today
                  </p>
                </div>
              )}

              {/* Subscription Cards */}
              <div className={`max-w-7xl mx-auto ${subscriptionData?.hasActiveSubscription ? 'mt-12' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {subscriptionPlans.map((plan) => {
                    return (
                      <div key={plan.id} className={`group relative p-8 rounded-2xl border-2 transition-all duration-500 ${plan.id === 'monthly' ? 'scale-105' : ''} hover:scale-105 hover:shadow-2xl ${plan.backgroundGradient} ${plan.borderColor} ${theme === 'dark' ? '' : 'shadow-lg hover:shadow-xl'}`}>
                        {/* Plan Badge */}
                        {plan.badge && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className={`px-4 py-2 rounded-full text-xs font-bold ${plan.badge.color} shadow-lg`}>
                              {plan.badge.text}
                            </div>
                          </div>
                        )}

                        <div className="relative z-10 flex flex-col h-full">
                          {/* Plan Header */}
                          <div className="flex flex-col items-center mb-4">
                            <h3 className={`mb-1 text-3xl font-bold bg-gradient-to-r ${plan.titleGradient} bg-clip-text text-transparent`}>
                              {plan.name}
                            </h3>
                            <p className={`text-md ${plan.descriptionColor}`}>{plan.description}</p>
                          </div>

                          {/* Price Section */}
                          <div className="text-center mb-6">
                            {plan.showPrice && (
                              <>
                                <div className="flex items-center justify-center gap-1 mb-2">
                                  {plan.showSavings && (
                                    <div className="line-through">
                                      <span className={`text-md font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                        ${plan.originalPrice}
                                      </span>
                                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/yr</span>
                                    </div>
                                  )}
                                  <span className={`text-5xl font-bold bg-gradient-to-r ${plan.priceGradient} bg-clip-text text-transparent`}>
                                    ${plan.priceValue}
                                  </span>
                                  <span className={`text-md mt-6 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                    {plan.priceUnit}
                                  </span>
                                </div>
                                {plan.showSavings && (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className={`text-md font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                        ${plan.monthlyEquivalent}
                                      </span>
                                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                                    </div>
                                    <div className="absolute -top-12 -right-1 transform translate-x-1/4">
                                      <div className={`px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg`}>
                                        Save 40%
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className={`w-16 h-0.5 mx-auto rounded-full bg-gradient-to-r ${plan.priceGradient} ${plan.showSavings ? 'mt-2' : ''}`}></div>
                              </>
                            )}
                          </div>

                          {/* Features List */}
                          <div className="flex-grow">
                            <ul className="space-y-4 mb-4">
                              {plan.features.map((feature) => (
                                <li key={feature.Code} className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${plan.id === 'free'
                                    ? theme === 'dark' ? 'bg-green-600/20' : 'bg-green-400'
                                    : feature.Value.toLowerCase().includes('discount')
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                      : plan.id === 'monthly'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                                    }`}>
                                    {getFeatureIcon(feature)}
                                  </div>
                                  <span className={`text-md ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {feature.Value}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Button */}
                          <button
                            disabled={getPlanButtonInfo(plan.id).disabled}
                            onClick={() => {
                              if (plan.id === 'free' && getCurrentPlan() !== 'free') {
                                showDowngradeConfirmation('free');
                              } else if (plan.id === 'monthly') {
                                if (getCurrentPlan() === 'annual') {
                                  showDowngradeConfirmation('monthly');
                                } else if (getCurrentPlan() !== 'monthly') {
                                  // Use Stripe Checkout for monthly
                                  startStripeCheckout('monthly');
                                }
                              } else if (plan.id === 'annual') {
                                if (getCurrentPlan() === 'monthly') {
                                  // Show confirm modal: cancel current, then redirect to annual
                                  setShowUpgradeModal(true);
                                } else if (getCurrentPlan() !== 'annual') {
                                  startStripeCheckout('annual');
                                }
                              }
                            }}
                            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${getPlanButtonInfo(plan.id).className}`}
                          >
                            {getPlanButtonInfo(plan.id).text}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transaction History (internal DB) - temporarily hidden */}
              {false && paymentHistory.length > 0 && (
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
              <div className={`mt-8`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-2xl font-semibold`}>Transaction History</h3>
                  {/* <button onClick={openBillingPortal} className={`px-4 py-2 rounded-lg font-medium ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    Open Stripe Billing Portal
                  </button> */}
                </div>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-lg`}>Manage payment methods, invoices, and subscription in Stripe.</p>

                {/* Stripe Transactions */}
                <div className={`mt-6 rounded-xl border shadow-sm`}>
                  <div className={getThemeClasses('p-4 border-b border-gray-200', 'dark:border-gray-700')}>
                    <div className="flex items-center justify-between">
                      <h4 className={getThemeClasses('text-xl font-semibold text-gray-900', 'dark:text-gray-100')}>Recent Stripe Transactions</h4>
                      <button
                        onClick={fetchStripeInvoices}
                        disabled={loadingStripeInvoices}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                          }`}
                        title="Refresh transaction data"
                      >
                        <svg className={`w-5 h-5 ${loadingStripeInvoices ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {loadingStripeInvoices ? (
                      <div className={getThemeClasses(
                        'text-center py-8 text-gray-400',
                        'dark:text-gray-500'
                      )}>
                        Loading Stripe transactions...
                      </div>
                    ) : stripeInvoices.length === 0 ? (
                      <div className={getThemeClasses(
                        'text-center py-8 text-gray-400',
                        'dark:text-gray-500'
                      )}>
                        No Stripe transactions found.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className={getThemeClasses('border-b border-gray-200', 'dark:border-gray-700')}>
                            <th className={`py-3 px-4 text-left ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>Subscribed By</th>
                            <th className={`py-3 px-4 text-left ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>Date</th>
                            <th className={`py-3 px-4 text-left ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>Invoice #</th>
                            <th className={`py-3 px-4 text-left ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>Description</th>
                            <th className={`py-3 px-4 text-left ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>Amount</th>
                            <th className={`py-3 px-4 text-left ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>Status</th>
                            <th className={`py-3 px-4 text-left ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stripeInvoices.map((inv) => (
                            <tr key={inv.id} className={getThemeClasses('border-b border-gray-100 hover:bg-gray-50/50 transition-colors last:border-b-0', 'dark:border-gray-700 dark:hover:bg-gray-700/30')}>
                              <td className={`py-3 px-4 text-sm ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                {inv.userDetails ? (
                                  <div className="flex items-center gap-3">
                                    {inv.userDetails.profileImage && (
                                      <img
                                        src={inv.userDetails.profileImage}
                                        alt={inv.userDetails.fullName}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div className="flex flex-col items-start">
                                      <span className={`font-medium ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                        {inv.userDetails.fullName}
                                      </span>
                                      <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                        {inv.userDetails.email}
                                      </span>
                                      {inv.userDetails.role && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${inv.userDetails.role === 'Admin' || inv.userDetails.role === 1
                                          ? (theme === 'dark' ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700')
                                          : inv.userDetails.role === 'Developer' || inv.userDetails.role === 3
                                            ? (theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                                            : inv.userDetails.role === 'Project Manager' || inv.userDetails.role === 7
                                              ? (theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700')
                                              : (theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700')
                                          }`}>
                                          {typeof inv.userDetails.role === 'number'
                                            ? ['', 'Admin', 'User', 'Developer', 'Tester', 'Support Engineer', 'Deployment Engineer', 'Project Manager', 'Client'][inv.userDetails.role] || 'Unknown'
                                            : inv.userDetails.role
                                          }
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : inv.subscription_details?.metadata?.userId ? (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`font-medium ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                        Unknown User
                                      </span>
                                      <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                        ID: {inv.subscription_details.metadata.userId.substring(0, 8)}...
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`font-medium ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                        System
                                      </span>
                                      <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                        No user data
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className={`py-3 px-4 text-sm ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {new Date((inv.created || inv.created_at || inv.status_transitions?.finalized_at || inv.effective_at) * 1000).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                  </span>
                                  <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                    {new Date((inv.created || inv.created_at || inv.status_transitions?.finalized_at || inv.effective_at) * 1000).toLocaleTimeString('en-US', {
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </td>
                              <td className={`py-3 px-4 text-sm ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                <div className="flex flex-col">
                                  <span className="font-mono text-xs">{inv.number || inv.id}</span>
                                  {inv.type === 'refund' ? (
                                    <span className={`text-xs ${getThemeClasses('text-red-600', 'dark:text-red-400')}`}>
                                      Refund ID
                                    </span>
                                  ) : (
                                    inv.customer && (
                                      <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                        {inv.customer}
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                              <td className={`py-3 px-4 text-sm ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                <div className="flex flex-col">
                                  {inv.type === 'refund' ? (
                                    <>
                                      <span className="font-medium text-red-600 dark:text-red-400">
                                        Refund
                                      </span>
                                      {inv.reason && (
                                        <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                          Reason: {inv.reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      )}
                                      {inv.relatedInvoice && (
                                        <span className={`text-xs ${getThemeClasses('text-blue-600', 'dark:text-blue-400')}`}>
                                          For: {inv.relatedInvoice.number || inv.relatedInvoice.id}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {inv.lines?.data?.[0]?.description ? (
                                        <span className="font-medium">{inv.lines.data[0].description}</span>
                                      ) : (
                                        <span className="font-medium">{inv.billing_reason?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Subscription'}</span>
                                      )}
                                      {inv.lines?.data?.[0]?.price?.nickname && (
                                        <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                          {inv.lines.data[0].price.nickname}
                                        </span>
                                      )}
                                      {inv.subscription && (
                                        <span className={`text-xs ${getThemeClasses('text-blue-600', 'dark:text-blue-400')}`}>
                                          Subscription
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className={`py-3 px-4 text-sm font-medium ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                                <div className="flex flex-col">
                                  {inv.type === 'refund' ? (
                                    <>
                                      <span className="font-semibold text-red-600 dark:text-red-400">
                                        -${((inv.amount || 0) / 100).toFixed(2)}
                                      </span>
                                      <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                        {inv.currency?.toUpperCase()}
                                      </span>
                                      {inv.amount !== inv.total && (
                                        <span className={`text-xs ${getThemeClasses('text-orange-600', 'dark:text-orange-400')}`}>
                                          Partial refund
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-semibold">${((inv.total || 0) / 100).toFixed(2)}</span>
                                      <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                        {inv.currency?.toUpperCase()}
                                      </span>
                                      {inv.amount_paid !== inv.total && (
                                        <span className={`text-xs ${getThemeClasses('text-orange-600', 'dark:text-orange-400')}`}>
                                          ${((inv.amount_paid || 0) / 100).toFixed(2)} paid
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex flex-col items-start gap-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.type === 'refund'
                                    ? (inv.status === 'succeeded'
                                      ? (theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-700')
                                      : inv.status === 'pending'
                                        ? (theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                                        : inv.status === 'failed'
                                          ? (theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700')
                                          : (theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700')
                                    )
                                    : (inv.status === 'paid'
                                      ? (theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700')
                                      : inv.status === 'open'
                                        ? (theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                                        : inv.status === 'void'
                                          ? (theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-700')
                                          : (theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700')
                                    )
                                    }`}>
                                    {inv.type === 'refund'
                                      ? (inv.status === 'succeeded' ? 'Refunded' : inv.status?.charAt(0).toUpperCase() + inv.status?.slice(1))
                                      : (inv.status?.charAt(0).toUpperCase() + inv.status?.slice(1))
                                    }
                                  </span>
                                  {inv.type === 'refund' && inv.status === 'succeeded' && inv.created && (
                                    <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                      Processed {new Date(inv.created * 1000).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric'
                                      })}
                                    </span>
                                  )}
                                  {inv.type !== 'refund' && inv.attempt_count > 1 && (
                                    <span className={`text-xs ${getThemeClasses('text-orange-600', 'dark:text-orange-400')}`}>
                                      {inv.attempt_count} attempts
                                    </span>
                                  )}
                                  {inv.type !== 'refund' && inv.status_transitions?.paid_at && (
                                    <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                      Paid {new Date(inv.status_transitions.paid_at * 1000).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric'
                                      })}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center justify-center gap-2">
                                  {inv.type === 'refund' ? (
                                    <>
                                      {inv.receipt_url && (
                                        <button
                                          onClick={() => window.open(inv.receipt_url, '_blank')}
                                          className={getThemeClasses(
                                            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-red-100 text-red-700 hover:bg-red-200',
                                            'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/50'
                                          )}
                                          title="View Refund Receipt"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        </button>
                                      )}
                                      {inv.id && (
                                        <button
                                          onClick={() => window.open(`https://dashboard.stripe.com/refunds/${inv.id}`, '_blank')}
                                          className={getThemeClasses(
                                            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200',
                                            'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50'
                                          )}
                                          title="View Refund in Stripe"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {inv.hosted_invoice_url && (
                                        <button
                                          onClick={() => window.open(inv.hosted_invoice_url, '_blank')}
                                          className={getThemeClasses(
                                            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
                                            'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50'
                                          )}
                                          title="View Invoice"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </button>
                                      )}
                                      {inv.invoice_pdf && (
                                        <button
                                          onClick={() => window.open(inv.invoice_pdf, '_blank')}
                                          className={getThemeClasses(
                                            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-sm transition-all duration-200',
                                            'dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600'
                                          )}
                                          title="Download PDF"
                                        >
                                          <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      )}
                                      {inv.payment_intent && (
                                        <button
                                          onClick={() => window.open(`https://dashboard.stripe.com/payments/${inv.payment_intent}`, '_blank')}
                                          className={getThemeClasses(
                                            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 shadow-sm transition-all duration-200',
                                            'dark:text-green-400 dark:bg-green-900/50 dark:hover:bg-green-800/50'
                                          )}
                                          title="View Payment"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                          </svg>
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
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
            <div className={`p-4 md:p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Integrations</h2>

              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                {/* GitHub Integration */}
                <div className={`mb-6 p-4 md:p-6 rounded-xl w-full border ${theme === 'dark' ? 'bg-transparent border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <FaGithub size={32} className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
                      <div>
                        <span className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>GitHub</span>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Connect your GitHub account for repository integrations
                        </p>
                      </div>
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
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          {githubStatus.avatarUrl && (
                            <img
                              src={githubStatus.avatarUrl}
                              alt="GitHub Avatar"
                              className="w-10 h-10 rounded-full flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                              @{githubStatus.username}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
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
                          className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        >
                          Disconnect
                        </button>
                      </div>
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
                <div className={`mb-6 p-4 md:p-6 rounded-xl w-full border ${theme === 'dark' ? 'bg-transparent border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <SiGooglecalendar size={28} className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
                      <div>
                        <span className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Google Calendar</span>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Create calendar events with Google Meet links</p>
                      </div>
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
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          {googleStatus.avatarUrl && (
                            <img
                              src={googleStatus.avatarUrl}
                              alt="Google Profile"
                              className="w-10 h-10 rounded-full flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                              {googleStatus.email || user?.email}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                              Connected
                            </p>
                            {googleStatus.tokenExpiry && (
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                Token expires {new Date(googleStatus.tokenExpiry).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleDisconnectGoogle}
                          disabled={googleLoading}
                          className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={async () => {
                            try {
                              const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
                              const res = await meetingService.initiateGoogleCalendarAuth(currentUrl);
                              if (res?.success && res?.authUrl) {
                                window.location.href = res.authUrl;
                              }
                            } catch (_) {
                              showToast('Failed to start Google authorization', 'error');
                            }
                          }}
                          className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                          Connect Google Calendar
                        </button>
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
            <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 justify-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600`}>
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Confirm Downgrade</h3>
              </div>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm text-center mt-3 mb-4`}>
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
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow transition-all duration-200 ${theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }`}
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
      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl border-2 ${theme === 'dark' ? 'border-gray-700 bg-[#111214]' : 'border-gray-200 bg-white'}`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 justify-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59c.75 1.335-.213 3.01-1.743 3.01H3.482c-1.53 0-2.493-1.675-1.743-3.01L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Cancel Premium Subscription</h3>
              </div>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm text-center mt-3`}>
                This will stop auto‑renewal. You will retain premium access until your current billing period ends.
              </p>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={async () => {
                  try {
                    const res = await authService.cancelSubscription(user.organizationID, user._id);
                    if (res?.success) {
                      setShowCancelModal(false);
                      showToast('Subscription cancelled successfully', 'success');
                      fetchSubscriptionData();
                    } else {
                      showToast(res?.message || 'Failed to cancel subscription', 'error');
                    }
                  } catch (e) {
                    showToast(e?.message || 'Failed to cancel subscription', 'error');
                  }
                }}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow ${theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
              >
                Confirm Cancellation
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-200 ${theme === 'dark'
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl border-2 ${theme === 'dark' ? 'border-gray-700 bg-[#111214]' : 'border-gray-200 bg-white'}`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 justify-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 13V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.414-1.414A2 2 0 009.172 3H6a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2zM7 9h6a1 1 0 110 2H7a1 1 0 110-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Upgrade to Annual</h3>
              </div>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm text-center mt-3`}>
                We will cancel your current monthly subscription and issue a prorated refund when eligible, then redirect you to the Annual payment page.
              </p>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={async () => {
                  setShowUpgradeModal(false);
                  await handleUpgradeToAnnual();
                }}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow ${theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
              >
                Confirm Upgrade
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-200 ${theme === 'dark'
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
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