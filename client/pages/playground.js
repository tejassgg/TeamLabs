import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

import { verifyEmailHtml, inviteEmailHtml, taskAssignmentEmailHtml, commentMentionEmailHtml, contactConfirmationEmailHtml, contactNotificationEmailHtml, releaseSummaryEmailHtml, roleChangeEmailHtml, welcomeEmailHtml, premiumEmailHtml } from '../utils/mockEmailTemplates';
import { sendBrowserNotification } from '../utils/browserNotifications';

import { FaLaptopCode, FaEnvelope, FaBell, FaDesktop, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import StatusPill from '../components/shared/StatusPill';
import StatusDropdown from '../components/shared/StatusDropdown';
import CustomDropdown from '../components/shared/CustomDropdown';
import VersionIndicator, { VersionBadge } from '../components/shared/VersionIndicator';
import CustomModal from '../components/shared/CustomModal';

// Shared UI components to add to components tab
import ProjectPriorityBadge from '../components/shared/ProjectPriorityBadge';
import ContactSupportModal from '../components/shared/ContactSupportModal';
import CookiePolicyModal from '../components/shared/CookiePolicyModal';
import PrivacyPolicyModal from '../components/shared/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/shared/TermsOfServiceModal';
import InviteModal from '../components/shared/InviteModal';
import SearchModal from '../components/shared/SearchModal';
import AddReleaseModal from '../components/shared/AddReleaseModal';
import AssignTaskModal from '../components/shared/AssignTaskModal';
import FirstTimeSetup from '../components/shared/FirstTimeSetup';
import ReleaseNotificationBanner from '../components/shared/ReleaseNotificationBanner';
import Breadcrumb from '../components/shared/Breadcrumb';
import TaskCollaborationIndicator from '../components/shared/TaskCollaborationIndicator';
import ActivityNotifications from '../components/shared/ActivityNotifications';
import ChatBot from '../components/shared/ChatBot';
import Modal from '../components/shared/Modal';

// Task components to add to components tab
import { getTaskTypeBadge, getPriorityBadge, getTaskStatusBadge } from '../components/task/TaskTypeBadge';
import SubtaskDisplay from '../components/task/SubtaskDisplay';

const Playground = () => {
  const { userDetails, loading, openAddTaskModal } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('components');

  // State for real components
  const [modalOpen, setModalOpen] = useState(false);
  const [statusDropdownValue, setStatusDropdownValue] = useState('Active');
  const [customDropdownValue, setCustomDropdownValue] = useState('');

  // States for other shared modals
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [cookiePolicyOpen, setCookiePolicyOpen] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addReleaseOpen, setAddReleaseOpen] = useState(false);
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [firstTimeSetupOpen, setFirstTimeSetupOpen] = useState(false);
  const [activityNotificationsOpen, setActivityNotificationsOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [simpleModalOpen, setSimpleModalOpen] = useState(false);
  const [showLoadingInline, setShowLoadingInline] = useState(false);

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
        <div className={`${theme === 'dark' ? 'bg-transparent' : 'bg-white'} min-h-[500px]`}>

          {activeTab === 'components' && (
            <div>
              <div className="mt-2 space-y-8">
                {/* Status Pills */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status Pills</h3>
                  <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800/80">
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
                  <div className="flex flex-wrap gap-8 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800/80">
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
                  <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800/80">
                    <VersionBadge version="1.2.0" isLatest={true} />
                    <VersionBadge version="1.1.0" isLatest={false} />
                    <VersionIndicator
                      versionUpdateAvailable={true}
                      latestVersion="1.3.0"
                      onClick={() => showToast('Update started', 'info')}
                    />
                  </div>
                </div>

                {/* Modals & Dialogs */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Modals & Dialogs</h3>
                  <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800/80">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Custom Modal
                    </button>
                    <button
                      onClick={() => setSimpleModalOpen(true)}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Base Modal
                    </button>
                    <button
                      onClick={() => setContactSupportOpen(true)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Contact Support
                    </button>
                    <button
                      onClick={() => setCookiePolicyOpen(true)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Cookie Policy
                    </button>
                    <button
                      onClick={() => setPrivacyPolicyOpen(true)}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Privacy Policy
                    </button>
                    <button
                      onClick={() => setTermsOfServiceOpen(true)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Terms of Service
                    </button>
                    <button
                      onClick={() => setInviteOpen(true)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Invite Modal
                    </button>
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Search Modal
                    </button>
                    <button
                      onClick={() => setAddReleaseOpen(true)}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Add Release Modal
                    </button>
                    <button
                      onClick={() => openAddTaskModal({ mode: 'fromSideBar' })}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Add Task Modal
                    </button>
                    <button
                      onClick={() => setAssignTaskOpen(true)}
                      className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Assign Task Modal
                    </button>
                    <button
                      onClick={() => setFirstTimeSetupOpen(true)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      First-Time Setup
                    </button>
                    <button
                      onClick={() => setActivityNotificationsOpen(true)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Notifications Inbox
                    </button>
                    <button
                      onClick={() => setChatbotOpen(true)}
                      className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      AI ChatBot
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

                {/* Priority & Collaboration */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Priority & Collaboration Badges</h3>
                  <div className="flex flex-wrap items-center gap-8 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800/80">
                    <div className="flex flex-col gap-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Project Priority Badges</p>
                      <div className="flex flex-wrap gap-4">
                        <ProjectPriorityBadge priority="3" showLabel={true} />
                        <ProjectPriorityBadge priority="2" showLabel={true} />
                        <ProjectPriorityBadge priority="1" showLabel={true} />
                        <ProjectPriorityBadge priority="0" showLabel={true} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Task Collaboration Indicator</p>
                      <div className="border p-2 rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                        <TaskCollaborationIndicator taskId="demo-task-id" projectId="demo-project-id" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Badges & Displays */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Task Badges & Displays</h3>
                  <div className="space-y-6 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800/80">
                    <div className="flex flex-col gap-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Task Type Badges</p>
                      <div className="flex flex-wrap gap-4">
                        {getTaskTypeBadge('Bug')}
                        {getTaskTypeBadge('Feature')}
                        {getTaskTypeBadge('Improvement')}
                        {getTaskTypeBadge('Documentation')}
                        {getTaskTypeBadge('Maintenance')}
                        {getTaskTypeBadge('User Story')}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Task Priority Badges</p>
                      <div className="flex flex-wrap gap-6">
                        {getPriorityBadge('Critical')}
                        {getPriorityBadge('High')}
                        {getPriorityBadge('Medium')}
                        {getPriorityBadge('Low')}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Task Status Badges</p>
                      <div className="flex flex-wrap gap-4">
                        {getTaskStatusBadge(1, theme === 'dark')}
                        {getTaskStatusBadge(2, theme === 'dark')}
                        {getTaskStatusBadge(3, theme === 'dark')}
                        {getTaskStatusBadge(4, theme === 'dark')}
                        {getTaskStatusBadge(5, theme === 'dark')}
                        {getTaskStatusBadge(6, theme === 'dark')}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Subtask Display (Summary Card)</p>
                      <div className="max-w-xs border border-gray-200 dark:border-zinc-800 rounded-lg p-2 bg-white dark:bg-zinc-900">
                        <SubtaskDisplay
                          theme={theme}
                          subtasks={[
                            { SubtaskID: 'sub1', Name: 'Research schema validation options', IsCompleted: true },
                            { SubtaskID: 'sub2', Name: 'Implement model tests', IsCompleted: false },
                            { SubtaskID: 'sub3', Name: 'Update configuration files', IsCompleted: false },
                            { SubtaskID: 'sub4', Name: 'Deploy updates', IsCompleted: false }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Embedded Layout Blocks */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Embedded Layout Blocks</h3>
                  <div className="space-y-6 p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800/80">
                    <div className="space-y-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Breadcrumb Navigation</p>
                      <Breadcrumb type="task" projectName="Website Redesign" projectId="web-123" taskName="Implement dark mode toggle" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading Screen Component</p>
                        <button
                          onClick={() => {
                            showToast('Showing LoadingScreen inline for 3 seconds...', 'info');
                            setShowLoadingInline(true);
                            setTimeout(() => setShowLoadingInline(false), 3000);
                          }}
                          className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs"
                        >
                          Preview Inline Loading Screen
                        </button>
                      </div>
                      {showLoadingInline ? (
                        <div className="relative border rounded-lg h-24 overflow-hidden bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Release Notification Banner</p>
                      <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                        <ReleaseNotificationBanner
                          onClose={() => showToast('Banner dismissed', 'info')}
                          releaseData={{
                            Version: 'v1.4.0',
                            Title: 'Major Summer Release',
                            Description: 'Exciting new features and fixes have landed in your workspace.',
                            Features: ['AI RAG Chat Assistant', 'Dynamic Board Views', 'Bento Layout Options'],
                            Bugs: ['Fixed iframe scrolling scrollbar glitch', 'Resolved role change email delivery latency'],
                            Improvements: ['Sleeker visual aesthetics and light mode templates'],
                            AuthorName: 'Tejas',
                            CreatedAt: new Date().toISOString()
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <div className="mt-2 columns-1 md:columns-2 xl:columns-3 gap-8 space-y-0">
                {/* Verify Email Template */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Verify Email</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={verifyEmailHtml} title="Verify Email Template" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Invite Email Template */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Organization Invite</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={inviteEmailHtml} title="Invite Email Template" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Task Assignment */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Task Assignment</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={taskAssignmentEmailHtml} title="Task Assignment Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Comment Mention */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Comment Mention</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={commentMentionEmailHtml} title="Comment Mention Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Contact Confirmation */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Contact Confirmation (To User)</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={contactConfirmationEmailHtml} title="Contact Confirmation Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Contact Notification */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Contact Notification (To Admin)</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={contactNotificationEmailHtml} title="Contact Notification Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Role Change Email */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role Change Notification</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={roleChangeEmailHtml} title="Role Change Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Release Summary */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Release Summary</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={releaseSummaryEmailHtml} title="Release Summary Email" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Welcome Email */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Welcome Email</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={welcomeEmailHtml} title="Welcome Email Template" onLoad={handleIframeLoad} />
                  </div>
                </div>

                {/* Premium Upgrade Email */}
                <div className="inline-flex flex-col w-full break-inside-avoid mb-8">
                  <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Premium Subscription Announcement</h3>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200 dark:border-zinc-800/80">
                    <iframe scrolling="no" className="w-full border-none" srcDoc={premiumEmailHtml} title="Premium Upgrade Email Template" onLoad={handleIframeLoad} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'toast' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-zinc-800/80 bg-dark-bg' : 'border-gray-200 bg-gray-50'}`}>
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

                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-zinc-800/80 bg-dark-bg' : 'border-gray-200 bg-gray-50'}`}>
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

                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-zinc-800/80 bg-dark-bg' : 'border-gray-200 bg-gray-50'}`}>
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

                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-zinc-800/80 bg-dark-bg' : 'border-gray-200 bg-gray-50'}`}>
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
                <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-zinc-800/80 bg-dark-bg' : 'border-gray-200 bg-gray-50'}`}>
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
      {/* Modals for Components Tab */}
      <ContactSupportModal isOpen={contactSupportOpen} onClose={() => setContactSupportOpen(false)} />
      <CookiePolicyModal isOpen={cookiePolicyOpen} onClose={() => setCookiePolicyOpen(false)} />
      <PrivacyPolicyModal isOpen={privacyPolicyOpen} onClose={() => setPrivacyPolicyOpen(false)} />
      <TermsOfServiceModal isOpen={termsOfServiceOpen} onClose={() => setTermsOfServiceOpen(false)} />
      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <AddReleaseModal isOpen={addReleaseOpen} onClose={() => setAddReleaseOpen(false)} onAddRelease={() => { }} />
      <AssignTaskModal isOpen={assignTaskOpen} onClose={() => setAssignTaskOpen(false)} projectMembers={[]} />
      <FirstTimeSetup isOpen={firstTimeSetupOpen} onComplete={() => setFirstTimeSetupOpen(false)} />
      <ActivityNotifications isOpen={activityNotificationsOpen} onClose={() => setActivityNotificationsOpen(false)} />
      <ChatBot isOpen={chatbotOpen} onToggle={() => setChatbotOpen(false)} showButton={false} />
      <Modal isOpen={simpleModalOpen} onClose={() => setSimpleModalOpen(false)} title="Simple Base Modal">
        <p className="text-sm text-gray-500">This is the base Modal component.</p>
      </Modal>
    </>
  );
};

export default Playground;
