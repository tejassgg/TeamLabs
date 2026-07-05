import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import CustomToast from '../components/shared/CustomToast';
import Layout from '../components/layout/Layout';
import LoadingScreen from '../components/shared/LoadingScreen';
import { FaPlay, FaCopy, FaCheck } from 'react-icons/fa';

const ToastPreviewPage = () => {
  const { userDetails, loading } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!userDetails || userDetails.username !== 'tejassgg') {
        router.replace('/dashboard');
      }
    }
  }, [userDetails, loading, router]);

  if (loading || !userDetails) {
    return <LoadingScreen />;
  }

  if (userDetails.username !== 'tejassgg') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-55 dark:bg-zinc-950">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-red-100 dark:border-red-950 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4 font-bold text-2xl">!</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This preview page is only accessible by user "tejassgg". You are being redirected...</p>
        </div>
      </div>
    );
  }

  const toastCombinations = [
    {
      id: 'success-simple',
      title: 'Success - Simple',
      message: 'Saved successfully',
      type: 'success',
      description: null,
      action: null,
      code: `showToast('Saved successfully', 'success');`
    },
    {
      id: 'success-action',
      title: 'Success - With Description & Action',
      message: 'Task added successfully!',
      type: 'success',
      description: 'Task "Redesign Navigation Hook" has been created and assigned.',
      action: {
        label: 'View',
        onClick: () => {
          showToast('Navigating to task details...', 'info');
        }
      },
      code: `showToast('Task added successfully!', 'success', 5000, {
  description: 'Task "Redesign Navigation Hook" has been created and assigned.',
  action: {
    label: 'View',
    onClick: () => router.push('/task/123')
  }
});`
    },
    {
      id: 'info-simple',
      title: 'Info - Simple',
      message: 'Request in progress',
      type: 'info',
      description: null,
      action: null,
      code: `showToast('Request in progress', 'info');`
    },
    {
      id: 'info-description',
      title: 'Info - With Description',
      message: 'Request in progress',
      type: 'info',
      description: "We're processing your request. You'll be notified once it's done.",
      action: null,
      code: `showToast('Request in progress', 'info', 5000, {
  description: "We're processing your request. You'll be notified once it's done."
});`
    },
    {
      id: 'warning-description',
      title: 'Warning - With Description',
      message: 'Connection unstable',
      type: 'warning',
      description: 'Your internet connection seems slow. Working offline changes will be synced later.',
      action: null,
      code: `showToast('Connection unstable', 'warning', 5000, {
  description: 'Your internet connection seems slow. Working offline changes will be synced later.'
});`
    },
    {
      id: 'error-action',
      title: 'Error - With Description & Action Buttons',
      message: 'Something went wrong',
      type: 'error',
      description: "We couldn't complete your request. Check your connection and try again.",
      action: {
        label: 'Retry',
        onClick: () => {
          showToast('Retrying operation...', 'info');
        }
      },
      secondaryAction: {
        label: 'Dismiss',
        onClick: () => {}
      },
      code: `showToast('Something went wrong', 'error', 6000, {
  description: "We couldn't complete your request. Check your connection and try again.",
  action: {
    label: 'Retry',
    onClick: () => handleRetry()
  }
});`
    }
  ];

  const handleTrigger = (item) => {
    if (item.action) {
      showToast(item.message, item.type, 5300, {
        description: item.description,
        action: item.action,
        secondaryAction: item.secondaryAction
      });
    } else {
      showToast(item.message, item.type, 5300, {
        description: item.description
      });
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast('Code snippet copied to clipboard!', 'success', 2000);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 shadow-xl text-white">
          <div className="max-w-3xl">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
              Admin & Dev Playground
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-4 tracking-tight">
              Toast Notification Showcase
            </h1>
            <p className="mt-3 text-lg text-white/95 leading-relaxed">
              Below is the comprehensive test-suite showcasing all combinations of `CustomToast` alerts. 
              You can inspect the UI variations inline in both Light and Dark mode containers, copy code templates, and trigger actual animated alerts.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-white/80">
              <span className="font-mono bg-black/25 px-3 py-1.5 rounded-lg">User: {userDetails.username}</span>
              <span className="h-4 w-px bg-white/20"></span>
              <span className="font-mono bg-black/25 px-3 py-1.5 rounded-lg">Access Status: Authorized</span>
            </div>
          </div>
        </div>

        {/* Playground Grid */}
        <div className="space-y-12">
          {toastCombinations.map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-zinc-800 transition-all duration-300 hover:shadow-lg space-y-6"
            >
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                    Format: {item.type.toUpperCase()} toast {item.description ? 'with details' : 'simple'}.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTrigger(item)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200"
                  >
                    <FaPlay size={10} />
                    Trigger Toast
                  </button>
                  <button
                    onClick={() => handleCopyCode(item.code, item.id)}
                    className="flex items-center gap-2 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                  >
                    {copiedId === item.id ? <FaCheck className="text-green-500" size={12} /> : <FaCopy size={12} />}
                    {copiedId === item.id ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {/* Side-by-Side Visual Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Light Mode Container */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200/60 flex flex-col items-center justify-center min-h-[160px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 self-start">
                    LIGHT THEME PREVIEW
                  </span>
                  <div className="w-full flex justify-center">
                    <CustomToast
                      message={item.message}
                      type={item.type}
                      onClose={() => {}}
                      duration={null} // Hides progress bar
                      description={item.description}
                      action={item.action}
                      secondaryAction={item.secondaryAction}
                    />
                  </div>
                </div>

                {/* Dark Mode Container */}
                <div className="dark bg-zinc-950 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center min-h-[160px]">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 self-start">
                    DARK THEME PREVIEW
                  </span>
                  <div className="w-full flex justify-center">
                    <CustomToast
                      message={item.message}
                      type={item.type}
                      onClose={() => {}}
                      duration={null} // Hides progress bar
                      description={item.description}
                      action={item.action}
                      secondaryAction={item.secondaryAction}
                    />
                  </div>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto border border-gray-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">
                  Usage Code
                </span>
                <pre className="text-emerald-400 font-mono text-[13px] leading-relaxed">
                  <code>{item.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
};

export default ToastPreviewPage;
