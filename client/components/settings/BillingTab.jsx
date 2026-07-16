import React, { useEffect, useState, useMemo } from 'react';

import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/api';
import { paymentService } from '../../services/api';
import { FaUsers, FaCrown, FaStar, FaInfinity, FaCheckCircle, FaCheck, FaArrowUp, FaArrowDown, FaTimes } from 'react-icons/fa';

const BillingTab = ({
  getThemeClasses,
  subscriptionData: prefetchedSubscriptionData,
  subscriptionFeatures: prefetchedSubscriptionFeatures,
  subscriptionPrices: prefetchedSubscriptionPrices,
  loadingSubscription: prefetchedLoadingSubscription,
  onRefreshSubscription
}) => {
  const { userDetails } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [subscriptionData, setSubscriptionData] = useState(prefetchedSubscriptionData || null);
  const [stripeInvoices, setStripeInvoices] = useState([]);
  const [loadingStripeInvoices, setLoadingStripeInvoices] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(prefetchedLoadingSubscription || false);
  const [subscriptionFeatures, setSubscriptionFeatures] = useState(prefetchedSubscriptionFeatures || {
    free: [],
    monthly: [],
    annual: []
  });
  const [subscriptionPrices, setSubscriptionPrices] = useState(prefetchedSubscriptionPrices || {
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [cancelOption, setCancelOption] = useState('expiry');

  const currentExpiryDate = useMemo(() => {
    if (subscriptionData?.subscription?.subscriptionEndDate) {
      return new Date(subscriptionData.subscription.subscriptionEndDate).toLocaleDateString();
    }
    return '';
  }, [subscriptionData]);

  const todayDateStr = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    if (!userDetails?.organizationID) return;
    fetchStripeInvoices();
  }, [userDetails?.organizationID]);

  // Sync with prefetched data when props change
  useEffect(() => {
    if (prefetchedSubscriptionData !== undefined) {
      setSubscriptionData(prefetchedSubscriptionData);
    }
    if (prefetchedSubscriptionFeatures !== undefined) {
      setSubscriptionFeatures(prefetchedSubscriptionFeatures);
    }
    if (prefetchedSubscriptionPrices !== undefined) {
      setSubscriptionPrices(prefetchedSubscriptionPrices);
    }
    if (prefetchedLoadingSubscription !== undefined) {
      setLoadingSubscription(prefetchedLoadingSubscription);
    }
  }, [prefetchedSubscriptionData, prefetchedSubscriptionFeatures, prefetchedSubscriptionPrices, prefetchedLoadingSubscription]);

  const fetchStripeInvoices = async () => {
    try {
      setLoadingStripeInvoices(true);
      const res = await paymentService.getStripeTransactions(userDetails.organizationID);
      if (res?.success) {
        setStripeInvoices(res.data || []);
      }
    } catch (_) {
    } finally {
      setLoadingStripeInvoices(false);
    }
  };

  const getFeatureIcon = (feature) => {
    const featureText = feature.Value?.toLowerCase?.() || '';
    if (featureText.includes('unlimited')) return <FaInfinity className="text-sm text-white" />;
    if (featureText.includes('analytics')) return <FaCheck className="text-sm text-white" />;
    if (featureText.includes('support')) return <FaStar className="text-sm text-white" />;
    if (featureText.includes('members')) return <FaUsers className="text-sm text-white" />;
    if (featureText.includes('discount')) return <FaCheckCircle className="text-sm text-white" />;
    return <FaCheck className="text-sm text-white" />;
  };

  const getCurrentPlan = () => {
    if (!subscriptionData?.hasActiveSubscription) return 'free';
    if (subscriptionData.subscription?.plan === 'monthly') return 'monthly';
    if (subscriptionData.subscription?.plan === 'annual') return 'annual';
    return 'free';
  };

  const getPlanButtonInfo = (planType) => {
    const currentPlan = getCurrentPlan();
    const planOrder = { free: 0, monthly: 1, annual: 2 };
    if (planType === currentPlan) {
      return {
        text: 'Current Plan',
        disabled: true,
        className: theme === 'dark'
          ? 'bg-gray-850 text-gray-500 border border-white/5 cursor-not-allowed'
          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
      };
    }

    const isCancelled = subscriptionData?.subscription?.autoRenew === false;
    let text = planOrder[planType] > planOrder[currentPlan] ? 'Upgrade' : 'Downgrade';
    if (planType === 'free' && currentPlan !== 'free') {
      text = isCancelled ? 'Cancel Cancellation' : 'Cancel Subscription';
    }

    let className = '';
    if (planType === 'monthly') {
      className = 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-indigo-600/20 transition-all font-bold text-sm rounded-xl py-3.5';
    } else if (planType === 'annual') {
      className = 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-lg shadow-purple-600/20 transition-all font-bold text-sm rounded-xl py-3.5';
    } else {
      if (currentPlan !== 'free') {
        className = isCancelled
          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white shadow-lg shadow-emerald-600/20 transition-all font-bold text-sm rounded-xl py-3.5'
          : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-600/20 transition-all font-bold text-sm rounded-xl py-3.5';
      } else {
        className = theme === 'dark'
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl py-3.5'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl py-3.5';
      }
    }

    return {
      text,
      disabled: false,
      className
    };
  };

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
        organizationID: userDetails.organizationID,
        userId: userDetails._id,
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

  const handleUpgradeToAnnual = async () => {
    try {
      const cancelRes = await authService.cancelSubscription(userDetails.organizationID, userDetails._id);
      if (!cancelRes?.success) {
        showToast(cancelRes?.message || 'Failed to cancel current subscription', 'error');
        return;
      }
      showToast('Current subscription cancelled. Redirecting to annual checkout...', 'success');
      await startStripeCheckout('annual');
    } catch (error) {
      console.error('Upgrade to annual error:', error);
      showToast(error.message || 'Failed to upgrade. Please try again.', 'error');
    }
  };

  const handleDowngradeToFree = async () => {
    try {
      const response = await authService.downgradeSubscription(userDetails.organizationID, 'free', userDetails._id);
      if (response.success) {
        showToast('Successfully downgraded to free plan', 'success');
        onRefreshSubscription();
        setShowDowngradeModal(false);
      } else {
        showToast(response.message || 'Failed to downgrade', 'error');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      showToast(error.message || 'Failed to downgrade. Please try again.', 'error');
    }
  };

  const handleDowngradeToMonthly = async () => {
    try {
      const response = await authService.post(`/payment/downgrade/${userDetails.organizationID}`, { newPlan: 'monthly', userId: userDetails._id });
      if (response.data.success) {
        const originalPlan = response.data.data.originalPlan;
        showToast(`Successfully downgraded from ${originalPlan} to monthly plan. Refund amount: $${response.data.data.refundAmount}`, 'success');
        setShowDowngradeModal(false);
        setTimeout(() => { onRefreshSubscription(); }, 500);
      } else {
        showToast(response.data.message || 'Failed to downgrade', 'error');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      showToast(error.response?.data?.message || 'Failed to downgrade. Please try again.', 'error');
    }
  };

  const handleResumeSubscription = async () => {
    try {
      const res = await authService.resumeSubscription(userDetails.organizationID, userDetails._id);
      if (res?.success) {
        showToast('Subscription auto-renewal reactivated successfully', 'success');
        onRefreshSubscription();
        fetchStripeInvoices();
      } else {
        showToast(res?.message || 'Failed to resume subscription', 'error');
      }
    } catch (e) {
      showToast(e?.message || 'Failed to resume subscription', 'error');
    }
  };

  const showDowngradeConfirmation = async (toPlan) => {
    const currentPlan = getCurrentPlan();
    if (toPlan === 'free' && currentPlan !== 'free') {
      try {
        const response = await authService.calculateRefund(userDetails.organizationID, toPlan);
        if (response.success) {
          setDowngradeInfo({
            fromPlan: currentPlan,
            toPlan,
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
    } else if (currentPlan === 'annual' && toPlan === 'monthly') {
      try {
        const response = await authService.calculateRefund(userDetails.organizationID, toPlan);
        if (response.success) {
          setDowngradeInfo({
            fromPlan: currentPlan,
            toPlan,
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
      if (toPlan === 'free') handleDowngradeToFree();
      else if (toPlan === 'monthly') handleDowngradeToMonthly();
    }
  };

  const subscriptionPlans = useMemo(() => ([
    {
      id: 'free',
      name: 'Basic Account',
      description: 'Perfect for small teams',
      icon: FaUsers,
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
      description: 'Save 29% with annual billing',
      icon: FaStar,
      price: `$${subscriptionPrices.premiumAnnualYearly}`,
      priceValue: subscriptionPrices.premiumAnnualYearly,
      features: subscriptionFeatures.annual,
      borderColor: theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300',
      backgroundGradient: theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-gray-50 to-white',
      iconBg: theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200',
      iconColor: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      titleGradient: theme === 'dark' ? 'from-purple-400 to-pink-400' : 'from-purple-600 to-pink-600',
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
  ]), [subscriptionPrices, subscriptionFeatures, theme, subscriptionData]);

  return (
    <>
      <div className="p-6 bg-white dark:bg-transparent">
        <div className={`mb-4 p-6 rounded-xl ${theme === 'dark' ? 'bg-transparent' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Current Plan: {subscriptionData?.hasActiveSubscription ? `Premium ${subscriptionData?.subscription?.plan === 'annual' ? '(Annual)' : '(Monthly)'}` : 'Free'}
              </h3>
              <p className={`text-sm mt-1 ${subscriptionData?.subscription?.autoRenew === false
                ? 'text-amber-605 dark:text-amber-400 font-semibold'
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {subscriptionData?.hasActiveSubscription
                  ? subscriptionData.subscription.autoRenew === false
                    ? `Subscription is cancelled. You will still have access until ${new Date(subscriptionData.subscription.subscriptionEndDate).toLocaleDateString()}`
                    : `Active until ${new Date(subscriptionData.subscription.subscriptionEndDate).toLocaleDateString()}`
                  : 'Limited to 3 projects, 1 story per project and 10 tasks per user story'}
              </p>
              {subscriptionData?.hasActiveSubscription && (
                <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mt-1`}>
                  {subscriptionData.premiumUsersCount} {subscriptionData.premiumUsersCount === 1 ? 'member' : 'members'} have premium access
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 md:flex-shrink-0">
              <button
                onClick={onRefreshSubscription}
                disabled={loadingSubscription}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}
                title="Refresh subscription data" >
                <svg className={`w-5 h-5 ${loadingSubscription ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {subscriptionData?.hasActiveSubscription && (
                subscriptionData.subscription.autoRenew === false ? (
                  <button
                    onClick={handleResumeSubscription}
                    className="px-4 py-2 rounded-xl text-sm font-semibold shadow transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white hover:shadow-md animate-pulse"
                  >
                    Cancel Cancellation
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold shadow transition-all duration-200 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:shadow-md"
                  >
                    Cancel Subscription
                  </button>
                )
              )}
              <div className={`px-4 py-2 rounded-full text-sm text-center font-medium ${subscriptionData?.hasActiveSubscription
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
            <h2 className={`lg:text-5xl text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Choose Your Plan
            </h2>
            <p className={`lg:text-lg text-sm lg:w-1/3 w-full text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Select the perfect plan for your organization's needs and start building amazing projects today
            </p>
          </div>
        )}

        <div className={`max-w-7xl mx-auto ${subscriptionData?.hasActiveSubscription ? 'mt-12' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => {
              const isCurrent = getCurrentPlan() === plan.id && plan.id !== 'free';

              // Determine card container classes
              let cardBgBorderClasses = '';
              if (isCurrent) {
                cardBgBorderClasses = theme === 'dark'
                  ? 'bg-slate-950/60 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'bg-emerald-50/10 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-2 ring-emerald-500/10';
              } else {
                cardBgBorderClasses = theme === 'dark'
                  ? 'bg-slate-950/30 border-white/5 hover:border-slate-800'
                  : 'bg-white border-slate-200 hover:shadow-xl';
              }

              // Determine badges
              const hasActiveSub = subscriptionData?.hasActiveSubscription;
              let topBadge = null;

              if (!hasActiveSub) {
                if (plan.id === 'monthly') {
                  topBadge = (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg z-20">
                      MOST POPULAR
                    </div>
                  );
                } else if (plan.id === 'annual') {
                  topBadge = (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg z-20">
                      BEST VALUE (SAVE 29%)
                    </div>
                  );
                }
              } else {
                if (isCurrent) {
                  if (plan.id === 'monthly') {
                    topBadge = (
                      <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg z-20">
                        MOST POPULAR
                      </div>
                    );
                  } else if (plan.id === 'annual') {
                    topBadge = (
                      <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg z-20">
                        BEST VALUE (SAVE 29%)
                      </div>
                    );
                  }
                }
              }

              return (
                <div
                  key={plan.id}
                  className={`p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between text-left relative ${cardBgBorderClasses}`}
                >
                  {topBadge}
                  {isCurrent && !topBadge && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg z-20">
                      CURRENT PLAN
                    </div>
                  )}
                  {isCurrent && topBadge && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 rounded bg-green-500 text-white text-[8px] font-extrabold uppercase tracking-wider shadow-md z-20 whitespace-nowrap">
                      ✓ ACTIVE CURRENT PLAN
                    </div>
                  )}

                  <div className="flex flex-col gap-4 h-full justify-between">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {plan.id === 'free' ? 'Basic Free Account' : plan.name}
                        </h3>
                        <p className="text-xs mt-1 text-slate-500">
                          {plan.id === 'free'
                            ? 'Perfect for small teams and developers.'
                            : plan.id === 'monthly'
                              ? 'Best choice for scaling team velocities.'
                              : 'Max savings for permanent scrums.'}
                        </p>
                      </div>

                      <div className="py-2">
                        {plan.id === 'annual' ? (
                          <div className="flex flex-col">
                            <div>
                              <span className="text-5xl font-extrabold text-slate-900 dark:text-white">${plan.priceValue}</span>
                              <span className="text-sm font-semibold text-slate-500">/yr</span>
                              <span className="text-lg text-slate-400 dark:text-slate-500 line-through ml-2 font-bold">$588</span>
                            </div>
                            <span className="text-xs text-emerald-500 font-extrabold mt-1.5">
                              Equivalent to just ${plan.monthlyEquivalent} / month
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-5xl font-extrabold text-slate-900 dark:text-white">${plan.priceValue}</span>
                            <span className="text-sm font-semibold text-slate-500">/mo</span>
                          </div>
                        )}
                      </div>

                      <hr className="border-indigo-500/10" />

                      <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {plan.features.map((feature) => {
                          const isCrown = feature.Value.toLowerCase().includes('priority') ||
                            feature.Value.toLowerCase().includes('executive') ||
                            feature.Value.toLowerCase().includes('crown') ||
                            feature.Value.toLowerCase().includes('monthly');
                          return (
                            <li key={feature.Code} className="flex items-center gap-2.5">
                              {isCrown ? (
                                <FaCrown className="text-indigo-500 shrink-0 animate-pulse" size={12} />
                              ) : (
                                <FaCheck className="text-indigo-500 shrink-0" size={12} />
                              )}
                              <span>{feature.Value}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <button
                      disabled={getPlanButtonInfo(plan.id).disabled}
                      onClick={() => {
                        if (plan.id === 'free' && getCurrentPlan() !== 'free') {
                          if (subscriptionData?.subscription?.autoRenew === false) {
                            handleResumeSubscription();
                          } else {
                            setShowCancelModal(true);
                          }
                        } else if (plan.id === 'monthly') {
                          if (getCurrentPlan() === 'annual') {
                            showDowngradeConfirmation('monthly');
                          } else if (getCurrentPlan() !== 'monthly') {
                            startStripeCheckout('monthly');
                          }
                        } else if (plan.id === 'annual') {
                          if (getCurrentPlan() === 'monthly') {
                            setShowUpgradeModal(true);
                          } else if (getCurrentPlan() !== 'annual') {
                            startStripeCheckout('annual');
                          }
                        }
                      }}
                      className={`w-full py-3.5 mt-8 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${getPlanButtonInfo(plan.id).className}`}
                    >
                      <span>{getPlanButtonInfo(plan.id).text}</span>
                      {getPlanButtonInfo(plan.id).text === 'Upgrade' && <FaArrowUp size={11} />}
                      {getPlanButtonInfo(plan.id).text === 'Downgrade' && <FaArrowDown size={11} />}
                      {getPlanButtonInfo(plan.id).text === 'Cancel Subscription' && <FaTimes size={11} />}
                      {getPlanButtonInfo(plan.id).text === 'Cancel Cancellation' && <FaCheck size={11} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`mt-8`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-2xl font-semibold`}>Transaction History</h3>
          </div>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-lg`}>Manage payment methods, invoices, and subscription in Stripe.</p>
          <div className={`mt-6 rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
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
                <div className={getThemeClasses('text-center py-8 text-gray-400', 'dark:text-gray-500')}>
                  Loading Stripe transactions...
                </div>
              ) : stripeInvoices.length === 0 ? (
                <div className={getThemeClasses('text-center py-8 text-gray-400', 'dark:text-gray-500')}>
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
                                  onError={(e) => { e.target.style.display = 'none'; }}
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
                              {new Date((inv.created || inv.created_at || inv.status_transitions?.finalized_at || inv.effective_at) * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                              {new Date((inv.created || inv.created_at || inv.status_transitions?.finalized_at || inv.effective_at) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-sm ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{inv.number || inv.id}</span>
                            {inv.type === 'refund' ? (
                              <span className={`text-xs ${getThemeClasses('text-red-600', 'dark:text-red-400')}`}>Refund ID</span>
                            ) : (
                              inv.customer && (
                                <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>{inv.customer}</span>
                              )
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-sm ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                          <div className="flex flex-col">
                            {inv.type === 'refund' ? (
                              <>
                                <span className="font-medium text-red-600 dark:text-red-400">Refund</span>
                                {inv.reason && (
                                  <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>Reason: {inv.reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                )}
                                {inv.relatedInvoice && (
                                  <span className={`text-xs ${getThemeClasses('text-blue-600', 'dark:text-blue-400')}`}>For: {inv.relatedInvoice.number || inv.relatedInvoice.id}</span>
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
                                  <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>{inv.lines.data[0].price.nickname}</span>
                                )}
                                {inv.subscription && (
                                  <span className={`text-xs ${getThemeClasses('text-blue-600', 'dark:text-blue-400')}`}>Subscription</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-sm font-medium ${getThemeClasses('text-gray-900', 'dark:text-gray-100')}`}>
                          <div className="flex flex-col">
                            {inv.type === 'refund' ? (
                              <>
                                <span className="font-semibold text-red-600 dark:text-red-400">-${((inv.amount || 0) / 100).toFixed(2)}</span>
                                <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>{inv.currency?.toUpperCase()}</span>
                                {inv.relatedInvoice && (inv.relatedInvoice.total - inv.amount) > 0 ? (
                                  <span className={`text-xs ${getThemeClasses('text-orange-600', 'dark:text-orange-400')}`}>Partial refund</span>
                                ) : (
                                  <span className={`text-xs ${getThemeClasses('text-red-600', 'dark:text-red-400')}`}>Full refund</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-semibold">${((inv.total || 0) / 100).toFixed(2)}</span>
                                <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>{inv.currency?.toUpperCase()}</span>
                                {inv.amount_paid !== inv.total && (
                                  <span className={`text-xs ${getThemeClasses('text-orange-600', 'dark:text-orange-400')}`}>${((inv.amount_paid || 0) / 100).toFixed(2)} paid</span>
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
                                    : (theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700'))
                              : (inv.status === 'paid'
                                ? (theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700')
                                : inv.status === 'refunded'
                                  ? (theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-700')
                                  : inv.status === 'partially_refunded'
                                    ? (theme === 'dark' ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-700')
                                    : inv.status === 'open'
                                      ? (theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                                      : inv.status === 'void'
                                        ? (theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-700')
                                        : (theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700'))
                              }`}>
                              {inv.type === 'refund'
                                ? (inv.status === 'succeeded' ? 'Refunded' : inv.status?.charAt(0).toUpperCase() + inv.status?.slice(1))
                                : inv.status === 'partially_refunded'
                                  ? 'Partially Refunded'
                                  : (inv.status?.charAt(0).toUpperCase() + inv.status?.slice(1))}
                            </span>
                            {inv.type === 'refund' && inv.status === 'succeeded' && inv.created && (
                              <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                Processed {new Date(inv.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {inv.type !== 'refund' && inv.attempt_count > 1 && (
                              <span className={`text-xs ${getThemeClasses('text-orange-600', 'dark:text-orange-400')}`}>{inv.attempt_count} attempts</span>
                            )}
                            {inv.type !== 'refund' && inv.status_transitions?.paid_at && (
                              <span className={`text-xs ${getThemeClasses('text-gray-500', 'dark:text-gray-400')}`}>
                                Paid {new Date(inv.status_transitions.paid_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            {inv.type === 'refund' ? (
                              <>
                                {inv.receipt_url && (
                                  <button onClick={() => window.open(inv.receipt_url, '_blank')} className={getThemeClasses('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-red-100 text-red-700 hover:bg-red-200', 'dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/50')} title="View Refund Receipt">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </button>
                                )}
                                {inv.id && (
                                  <button onClick={() => window.open(`https://dashboard.stripe.com/refunds/${inv.id}`, '_blank')} className={getThemeClasses('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition-all duration-200', 'dark:text-red-400 dark:bg-red-900/50 dark:hover:bg-red-800/50')} title="View Refund in Stripe">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {inv.hosted_invoice_url && (
                                  <button onClick={() => window.open(inv.hosted_invoice_url, '_blank')} className={getThemeClasses('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shadow-sm transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200', 'dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50')} title="View Invoice">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                )}
                                {inv.invoice_pdf && (
                                  <button onClick={() => window.open(inv.invoice_pdf, '_blank')} className={getThemeClasses('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-sm transition-all duration-200', 'dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600')} title="Download PDF">
                                    <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                )}
                                {inv.payment_intent && (
                                  <button onClick={() => window.open(`https://dashboard.stripe.com/payments/${inv.payment_intent}`, '_blank')} className={getThemeClasses('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 shadow-sm transition-all duration-200', 'dark:text-green-400 dark:bg-green-900/50 dark:hover:bg-green-800/50')} title="View Payment">
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
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>What's included in Premium?</h3>
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

      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} max-w-md w-full mx-4 p-6 rounded-xl shadow-2xl`}>
            <div className={`${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'} border-b`}>
              <div className="flex items-center gap-3 justify-start">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600">
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
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>Estimated Refund:</span>
                <span className={`text-lg font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>${downgradeInfo.refundAmount}</span>
              </div>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>Based on remaining subscription time ({downgradeInfo.remainingDays} days left)</p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>From {downgradeInfo.fromPlan} plan to {downgradeInfo.toPlan} plan</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => { if (downgradeInfo.toPlan === 'free') { handleDowngradeToFree(); } else if (downgradeInfo.toPlan === 'monthly') { handleDowngradeToMonthly(); } }} className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow transition-all duration-200 ${'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}>
                Confirm Downgrade
              </button>
              <button onClick={() => setShowDowngradeModal(false)} className={`w-full py-3 px-4 border rounded-lg font-semibold transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} max-w-lg w-full mx-4 p-6 rounded-xl shadow-2xl`}>
            <div className={`pb-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 justify-start">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Cancel Subscription</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>Choose how you would like to cancel your Premium plan</p>
                </div>
              </div>
            </div>

            <div className="my-6 space-y-4">
              {/* Option 1: Cancel Immediately */}
              <div
                onClick={() => setCancelOption('immediate')}
                className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left ${cancelOption === 'immediate'
                  ? 'border-indigo-600 bg-indigo-600/5 ring-1 ring-indigo-600/10'
                  : theme === 'dark'
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg transition-colors duration-200 ${cancelOption === 'immediate'
                    ? 'bg-indigo-600 text-white'
                    : theme === 'dark' ? 'bg-gray-700 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between text-left gap-4">
                      <h4 className={`font-bold text-sm ${cancelOption === 'immediate' ? 'text-indigo-600 dark:text-indigo-400' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Cancel Immediately Today (With Partial Refund)
                        <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Date: {todayDateStr}</span>
                      </h4>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${cancelOption === 'immediate' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'}`}>
                        {cancelOption === 'immediate' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2 leading-relaxed`}>
                      Your premium features will stop working immediately today ({todayDateStr}). We will calculate the remaining unused days of your subscription and issue a prorated refund back to your payment method.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Cancel at End of Period */}
              <div
                onClick={() => setCancelOption('expiry')}
                className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left ${cancelOption === 'expiry'
                  ? 'border-indigo-600 bg-indigo-600/5 ring-1 ring-indigo-600/10'
                  : theme === 'dark'
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg transition-colors duration-200 ${cancelOption === 'expiry'
                    ? 'bg-indigo-600 text-white'
                    : theme === 'dark' ? 'bg-gray-700 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between text-left gap-4">
                      <h4 className={`font-bold text-sm ${cancelOption === 'expiry' ? 'text-indigo-600 dark:text-indigo-400' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Cancel Today (Retain Premium Access)
                        <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Access until: {currentExpiryDate || 'Expiry'}</span>
                      </h4>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${cancelOption === 'expiry' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'}`}>
                        {cancelOption === 'expiry' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2 leading-relaxed`}>
                      Your subscription will remain active with full Premium access until the end of your current billing period on {currentExpiryDate || 'expiry'}. Auto-billing will be turned off and no refund is issued.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className={`px-5 py-2.5 rounded-xl font-semibold border transition-all duration-200 text-sm ${theme === 'dark'
                  ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Keep Subscription
              </button>
              <button
                onClick={async () => {
                  if (!cancelOption) return;
                  const cancelImmediately = cancelOption === 'immediate';
                  try {
                    const res = await authService.cancelSubscription(userDetails.organizationID, userDetails._id, cancelImmediately);
                    if (res?.success) {
                      setShowCancelModal(false);
                      if (cancelImmediately) {
                        showToast('Subscription cancelled immediately and refund issued', 'success');
                      } else {
                        showToast('Auto-renew disabled. Premium active until end of cycle', 'success');
                      }
                      onRefreshSubscription();
                      fetchStripeInvoices();
                    } else {
                      showToast(res?.message || 'Failed to cancel subscription', 'error');
                    }
                  } catch (e) {
                    showToast(e?.message || 'Failed to cancel subscription', 'error');
                  }
                }}
                className="px-6 py-2.5 rounded-xl font-semibold text-white shadow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'border-gray-700 bg-[#111214]' : 'border-gray-200 bg-white'} max-w-md w-full mx-4 rounded-2xl shadow-2xl border-2`}>
            <div className={`${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'} p-6 border-b`}>
              <div className="flex items-center gap-3 justify-start">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600">
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
              <button onClick={async () => { setShowUpgradeModal(false); await handleUpgradeToAnnual(); }} className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow ${'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}>
                Confirm Upgrade
              </button>
              <button onClick={() => setShowUpgradeModal(false)} className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillingTab;


