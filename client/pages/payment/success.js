import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { paymentService } from '../../services/api';

const PaymentSuccess = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const sessionId = router.query.session_id;
    if (!sessionId) return;
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

        <div className={`rounded-2xl border p-8 text-center ${theme === 'dark' ? 'border-gray-700 bg-[#121212]' : 'border-gray-200 bg-white'} shadow-xl`}> 
          <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Payment Successful</h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
            Congratulations! Your payment was received and your subscription is now active.
          </p>

          <div className={`mx-auto mt-6 max-w-md rounded-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'} p-5 text-left`}>
            {loading ? (
              <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading your plan details...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Plan</span>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{planLabel()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Amount</span>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{session?.amount_total ? `$${(session.amount_total/100).toFixed(2)}` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Email</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{session?.customer_details?.email || user?.email}</span>
                </div>
                <span className={`text-sm hidden ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{session?.id}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => router.replace('/settings?tab=billing')}
              className={`px-5 py-2.5 rounded-lg font-semibold ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              Go to Billing Settings
            </button>
          </div>

          {confirmed && (
            <div className={`mt-3 text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>Your premium access has been applied to your organization.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;


