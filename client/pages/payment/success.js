import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { paymentService, authService } from '../../services/api';

const PaymentSuccess = () => {
  const router = useRouter();
  const { userDetails, setUserDetails } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const hasConfirmed = useRef(false);

  useEffect(() => {
    const sessionId = router.query.session_id;
    if (!sessionId || hasConfirmed.current) return;
    hasConfirmed.current = true;
    (async () => {
      try {
        // 1) Load the session details for display
        const res = await paymentService.getCheckoutSession(sessionId);
        if (res?.success) {
          setSession(res.data);
        }
        // 2) Confirm internally (no user action needed)
        const confirmRes = await paymentService.confirmCheckoutSession(sessionId);
        if (confirmRes?.success) {
          setConfirmed(true);
          showToast('Subscription activated successfully', 'success');
          
          // Refresh user profile details to update sidebar and hide Upgrade to Pro button
          try {
            const currentUser = await authService.getUserProfile();
            if (currentUser) {
              setUserDetails(currentUser);
            }
          } catch (profileError) {
            console.error('Error fetching updated profile details:', profileError);
          }
        }
      } catch (_) {
        // No-op; UI will still show success screen
      } finally {
        setLoading(false);
      }
    })();
  }, [router.query.session_id]);

  const planLabel = () => {
    const plan = session?.metadata?.plan;
    if (plan === 'annual') return 'Premium Annual';
    if (plan === 'monthly') return 'Premium Monthly';
    return 'Premium';
  };

  return (
    <>
      <Head>
        <title>Payment Success | TeamLabs</title>
      </Head>
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Confetti (simple decorative) */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-6 left-1/4 w-2 h-6 bg-pink-400 rotate-12 rounded"></div>
            <div className="absolute top-4 right-1/3 w-2 h-5 bg-yellow-400 -rotate-6 rounded"></div>
            <div className="absolute top-10 left-8 w-2 h-4 bg-blue-400 rotate-45 rounded"></div>
            <div className="absolute top-0 right-8 w-2 h-7 bg-green-400 -rotate-12 rounded"></div>
            <div className="absolute top-16 left-1/2 w-2 h-6 bg-purple-400 rotate-12 rounded"></div>
          </div>
        </div>

        <div className={`rounded-2xl border p-8 text-center border-gray-200 bg-white dark:border-gray-700 dark:bg-[#121212] shadow-xl`}> 
          <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold text-gray-900 dark:text-white`}>Payment Successful</h1>
          <p className={`text-gray-600 dark:text-gray-300 mt-2`}>
            Congratulations! Your payment was received and your subscription is now active.
          </p>

          <div className={`mx-auto mt-6 max-w-md rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border dark:border-gray-700 p-5 text-left`}>
            {loading ? (
              <div className={`text-gray-600 dark:text-gray-300`}>Loading your plan details...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-gray-600 dark:text-gray-300`}>Plan</span>
                  <span className={`font-semibold text-gray-900 dark:text-white`}>{planLabel()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-gray-600 dark:text-gray-300`}>Amount</span>
                  <span className={`font-semibold text-gray-900 dark:text-white`}>{session?.amount_total ? `$${(session.amount_total/100).toFixed(2)}` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-gray-600 dark:text-gray-300`}>Email</span>
                  <span className={`font-medium text-gray-800 dark:text-gray-200`}>{session?.customer_details?.email || userDetails?.email}</span>
                </div>
                <span className={`text-sm hidden text-gray-500 dark:text-gray-400`}>{session?.id}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => router.replace('/settings?tab=billing')}
              className={`px-5 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white`}
            >
              Go to Billing Settings
            </button>
          </div>

          {confirmed && (
            <div className={`mt-3 text-sm text-green-700 dark:text-green-400`}>Your premium access has been applied to your organization.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;


