import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

import { verifyEmailHtml, inviteEmailHtml, taskAssignmentEmailHtml, commentMentionEmailHtml, contactConfirmationEmailHtml, contactNotificationEmailHtml, releaseSummaryEmailHtml, roleChangeEmailHtml } from '../utils/mockEmailTemplates';
import { sendBrowserNotification } from '../utils/browserNotifications';

import { FaLaptopCode, FaEnvelope, FaBell, FaDesktop, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import StatusPill from '../components/shared/StatusPill';
import StatusDropdown from '../components/shared/StatusDropdown';
import CustomDropdown from '../components/shared/CustomDropdown';
import VersionIndicator, { VersionBadge } from '../components/shared/VersionIndicator';
import CustomModal from '../components/shared/CustomModal';

const Playground = () => {
  const { userDetails, loading } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('components');

  // State for real components
  const [modalOpen, setModalOpen] = useState(false);
  const [statusDropdownValue, setStatusDropdownValue] = useState('Active');
  const [customDropdownValue, setCustomDropdownValue] = useState('');

  // State for browser notification permission
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!userDetails || userDetails.username !== 'tejassgg') {
        router.push('/');
      }
    }
  }, [loading, userDetails, router]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('This browser does not support desktop notification', 'error');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      showToast('Notification permission granted', 'success');
    }
  };

  const triggerBrowserNotification = async () => {
    if (Notification.permission === 'granted') {
      await sendBrowserNotification('TeamLabs Test Notification', {
        body: 'This is a test browser notification from your playground.'
      });
      showToast('Notification sent!', 'success');
    } else {
      showToast('Notification permission not granted', 'warning');
      setNotificationPermission(Notification.permission);
    }
  };

  const handleIframeLoad = (e) => {
    try {
      const height = e.target.contentWindow.document.documentElement.scrollHeight;
      e.target.style.height = height + 'px';
    } catch (err) {
      console.error('Error resizing iframe:', err);
    }
  };

  if (loading || !userDetails || userDetails.username !== 'tejassgg') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Playground | TeamLabs</title>
      </Head>

      <div className="p-1">
        <div className="mb-2">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
            Developer Playground
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Test and preview various UI components and templates. Exclusive to tejassgg.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'components', label: 'Components', icon: FaLaptopCode },
                { id: 'email', label: 'Email Templates', icon: FaEnvelope },
                { id: 'toast', label: 'Toast Templates', icon: FaBell },
                { id: 'browser', label: 'Browser Notifications', icon: FaDesktop }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${activeTab === tab.id
                    ? theme === 'dark' ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                    : theme === 'dark' ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`${theme === 'dark' ? 'bg-[#1e1e24]' : 'bg-white'} min-h-[500px]`}>

          {activeTab === 'components' && (
            <div>
              <div className="mt-2 space-y-8">
                {/* Status Pills */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Pills</h3>
                  <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <StatusPill status="Active" theme={theme} />
                    <StatusPill status="In a Meeting" theme={theme} />
                    <StatusPill status="Presenting" theme={theme} />
                    <StatusPill status="Away" theme={theme} />
                    <StatusPill status="Busy" theme={theme} />
                    <StatusPill status="Offline" theme={theme} />
                    <StatusPill status="InActive" theme={theme} />
                  </div>
                </div>

                {/* Dropdowns */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Dropdowns</h3>
                  <div className="flex flex-wrap gap-8 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="w-64">
                      <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Status Dropdown</p>
                      <StatusDropdown
                        currentStatus={statusDropdownValue}
                        onStatusChange={setStatusDropdownValue}
                        theme={theme}
                      />
                    </div>
                    <div className="w-64">
                      <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Custom Dropdown</p>
                      <CustomDropdown
                        value={customDropdownValue}
                        onChange={setCustomDropdownValue}
                        options={['Option 1', 'Option 2', 'Option 3']}
                        placeholder="Select an option"
                      />
                    </div>
                  </div>
                </div>

                {/* Version Indicators */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Version Indicators</h3>
                  <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <VersionBadge version="1.2.0" isLatest={true} />
                    <VersionBadge version="1.1.0" isLatest={false} />
                    <VersionIndicator
                      versionUpdateAvailable={true}
                      latestVersion="1.3.0"
                      onClick={() => showToast('Update started', 'info')}
                    />
                  </div>
                </div>

                {/* Modals */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Modals</h3>
                  <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Open Custom Modal
                    </button>
                    <CustomModal
                      isOpen={modalOpen}
                      onClose={() => setModalOpen(false)}
                      title="Example Modal"
                      actions={
                        <>
                          <button onClick={() => setModalOpen(false)} className={`px-4 py-2 font-medium text-sm transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}>Cancel</button>
                          <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm">Confirm</button>
                        </>
                      }
                    >
                      <p className={theme === 'dark' ? 'text-gray-300 text-sm' : 'text-gray-600 text-sm'}>
                        This is an example of the CustomModal component used throughout the TeamLabs application.
                      </p>
                    </CustomModal>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <div className="mt-2 grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Verify Email Template */}
                <div className="flex flex-col">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Verify Email</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={verifyEmailHtml} title="Verify Email Template" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Invite Email Template */}
                <div className="flex flex-col">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Organization Invite</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={inviteEmailHtml} title="Invite Email Template" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Task Assignment */}
                <div className="flex flex-col">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Task Assignment</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={taskAssignmentEmailHtml} title="Task Assignment Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Comment Mention */}
                <div className="flex flex-col">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Comment Mention</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={commentMentionEmailHtml} title="Comment Mention Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Contact Confirmation */}
                <div className="flex flex-col">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Contact Confirmation (To User)</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={contactConfirmationEmailHtml} title="Contact Confirmation Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Contact Notification */}
                <div className="flex flex-col">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Contact Notification (To Admin)</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={contactNotificationEmailHtml} title="Contact Notification Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Role Change Email */}
                <div className="flex flex-col">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role Change Notification</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={roleChangeEmailHtml} title="Role Change Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Release Summary */}
                <div className="flex flex-col xl:col-span-2">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Release Summary</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                    <iframe className="w-full border-none" srcDoc={releaseSummaryEmailHtml} title="Release Summary Email" onLoad={handleIframeLoad} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'toast' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    <FaCheckCircle /> Success Toast
                  </h3>
                  <button
                    onClick={() => showToast('Operation completed successfully!', 'success')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Trigger Success
                  </button>
                </div>

                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                    <FaTimesCircle /> Error Toast
                  </h3>
                  <button
                    onClick={() => showToast('An error occurred during the operation.', 'error')}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Trigger Error
                  </button>
                </div>

                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    <FaExclamationTriangle /> Warning Toast
                  </h3>
                  <button
                    onClick={() => showToast('Please review your changes before continuing.', 'warning')}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Trigger Warning
                  </button>
                </div>

                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    <FaInfoCircle /> Info Toast
                  </h3>
                  <button
                    onClick={() => showToast('New updates are available for your project.', 'info')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Trigger Info
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browser' && (
            <div>
              <div className="max-w-md mt-2">
                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Current Permission:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${notificationPermission === 'granted'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : notificationPermission === 'denied'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                      {notificationPermission}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={requestNotificationPermission}
                      disabled={notificationPermission !== 'default'}
                      className={`px-4 py-2 rounded-lg transition-colors shadow-sm ${notificationPermission === 'default'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                        }`}
                    >
                      Request Permission
                    </button>

                    <button
                      onClick={triggerBrowserNotification}
                      disabled={notificationPermission !== 'granted'}
                      className={`px-4 py-2 rounded-lg transition-colors shadow-sm ${notificationPermission === 'granted'
                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                        }`}
                    >
                      Send Test Notification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Playground;
