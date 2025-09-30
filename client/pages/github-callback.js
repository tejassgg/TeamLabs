import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import Head from 'next/head';

const GitHubCallback = () => {
  const router = useRouter();
  const { userDetails } = useGlobal();
  const { showToast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { code, state } = router.query;
        const storedState = localStorage.getItem('github_state');
        const storedUserId = localStorage.getItem('github_userId');

        if (!code || !state || !storedState || !storedUserId) {
          showToast('Invalid GitHub authentication parameters', 'error');
          router.push('/settings?tab=integrations');
          return;
        }

        // Verify state parameter
        if (state !== storedState) {
          showToast('Invalid GitHub authentication state', 'error');
          router.push('/settings?tab=integrations');
          return;
        }

        // Process the callback
        const response = await authService.handleGitHubCallback(code, state, storedUserId);
        
        if (response.success) {
          showToast('GitHub account connected successfully', 'success');
        } else {
          showToast(response.error || 'Failed to connect GitHub account', 'error');
        }

        // Clean up stored data
        localStorage.removeItem('github_state');
        localStorage.removeItem('github_userId');

        // Redirect back to settings
        router.push('/settings?tab=integrations');
      } catch (error) {
        console.error('Error handling GitHub callback:', error);
        showToast('Failed to connect GitHub account', 'error');
        router.push('/settings?tab=integrations');
      } finally {
        setProcessing(false);
      }
    };

    if (router.isReady && router.query.code) {
      handleCallback();
    }
  }, [router.isReady, router.query]);

  return (
    <>
      <Head>
        <title>Connecting GitHub... | TeamLabs</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connecting GitHub Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {processing ? 'Processing authentication...' : 'Redirecting to settings...'}
          </p>
        </div>
      </div>
    </>
  );
};

export default GitHubCallback; 