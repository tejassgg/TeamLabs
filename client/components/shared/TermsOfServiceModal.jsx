import React from 'react';
import { FaTimes, FaFileContract, FaUser, FaShieldAlt, FaExclamationTriangle, FaInfoCircle, FaGavel, FaEnvelope, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { acceptPolicy, isPolicyAccepted, getPolicyAcceptanceData } from '../../utils/policyAcceptance';

const TermsOfServiceModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const getThemeClasses = (lightClasses, darkClasses) => {
    if (theme === 'dark') {
      return darkClasses
        .replace(/bg-gray-950/g, 'bg-[#030712]/90 backdrop-blur-xl')
        .replace(/bg-gray-900\/60/g, 'bg-slate-900/40 border border-white/5 shadow-2xl backdrop-blur-md')
        .replace(/bg-gray-900/g, 'bg-slate-950/60 border border-white/5')
        .replace(/border-gray-800/g, 'border-white/5')
        .replace(/text-gray-900/g, 'text-slate-100 font-semibold')
        .replace(/text-gray-700/g, 'text-slate-300')
        .replace(/text-gray-600/g, 'text-slate-400')
        .replace(/text-white/g, 'text-slate-200')
        .replace(/text-green-800/g, 'text-slate-300')
        .replace(/text-blue-800/g, 'text-slate-300')
        .replace(/text-purple-800/g, 'text-slate-300')
        .replace(/text-orange-800/g, 'text-slate-300')
        .replace(/text-indigo-700/g, 'text-slate-300')
        .replace(/text-green-700/g, 'text-slate-455 text-slate-400')
        .replace(/text-blue-700/g, 'text-slate-455 text-slate-400')
        .replace(/text-purple-700/g, 'text-slate-455 text-slate-400')
        .replace(/text-orange-700/g, 'text-slate-455 text-slate-400')
        .replace(/border-blue-100/g, 'border-white/5')
        .replace(/border-indigo-100/g, 'border-white/5')
        .replace(/border-green-300/g, 'border-white/5')
        .replace(/border-orange-100/g, 'border-white/5')
        .replace(/bg-green-100/g, 'bg-slate-900/30')
        .replace(/bg-blue-600/g, 'bg-indigo-600')
        .replace(/bg-blue-500/g, 'bg-indigo-500')
        .replace(/from-blue-600 to-indigo-600/g, 'from-indigo-500 to-purple-500')
        .replace(/from-blue-500 to-indigo-500/g, 'from-indigo-500 to-purple-500')
        .replace(/from-green-600 to-emerald-600/g, 'from-indigo-500 to-cyan-500')
        .replace(/from-green-500 to-emerald-500/g, 'from-indigo-500 to-cyan-500')
        .replace(/from-purple-600 to-pink-600/g, 'from-purple-500 to-pink-500')
        .replace(/from-purple-500 to-pink-500/g, 'from-purple-500 to-pink-500')
        .replace(/from-red-600 to-orange-600/g, 'from-pink-500 to-orange-500')
        .replace(/from-red-500 to-orange-500/g, 'from-pink-500 to-orange-500')
        .replace(/from-yellow-600 to-orange-600/g, 'from-amber-500 to-orange-500')
        .replace(/from-yellow-500 to-orange-500/g, 'from-amber-500 to-orange-500');
    } else {
      return lightClasses
        .replace(/bg-white/g, 'bg-white/80 backdrop-blur-md shadow-sm')
        .replace(/border-gray-200/g, 'border-slate-200/60')
        .replace(/bg-gray-200\/60/g, 'bg-slate-100/80 border border-slate-200/60 shadow-sm')
        .replace(/text-gray-900/g, 'text-slate-900 font-bold')
        .replace(/text-gray-700/g, 'text-slate-700')
        .replace(/text-gray-600/g, 'text-slate-500')
        .replace(/from-blue-600 to-indigo-600/g, 'from-indigo-600 to-purple-600')
        .replace(/from-blue-500 to-indigo-500/g, 'from-indigo-600 to-purple-600')
        .replace(/from-green-600 to-emerald-600/g, 'from-teal-600 to-emerald-600')
        .replace(/from-green-500 to-emerald-500/g, 'from-teal-600 to-emerald-600')
        .replace(/from-purple-600 to-pink-600/g, 'from-purple-600 to-pink-600')
        .replace(/from-purple-500 to-pink-500/g, 'from-purple-600 to-pink-600')
        .replace(/from-red-600 to-orange-600/g, 'from-rose-600 to-orange-600')
        .replace(/from-red-500 to-orange-500/g, 'from-rose-600 to-orange-600')
        .replace(/from-yellow-600 to-orange-600/g, 'from-amber-600 to-orange-600')
        .replace(/from-yellow-500 to-orange-500/g, 'from-amber-600 to-orange-600');
    }
  };

  const handleAccept = () => {
    acceptPolicy('TERMS_OF_SERVICE');
    showToast('Terms of Service accepted successfully!', 'success');
    onClose();
  };

  // Get acceptance data if policy is accepted
  const acceptanceData = getPolicyAcceptanceData('TERMS_OF_SERVICE');
  const isAccepted = isPolicyAccepted('TERMS_OF_SERVICE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 transition-all duration-300">
      <div className={`relative w-full sm:max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-[#030712]/90 border-white/10 shadow-slate-950/80' : 'bg-white/95 border-slate-200/80 shadow-slate-200/50'} backdrop-blur-xl`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50/85 border-slate-200/80'}`}>
          <div className="flex items-start sm:items-center justify-between p-5 sm:p-6 gap-3">
            <div className="flex items-start sm:items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-blue-500/10' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-600/15'}`}>
                <FaFileContract className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Terms of Service
                </h1>
                <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
                  <p className={`text-xs sm:text-sm mt-1 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {isAccepted && acceptanceData && (
                    <div className="flex items-center gap-1">
                      <FaCheckCircle className={`w-4 h-4 ${getThemeClasses('text-green-600', 'text-green-400')}`} />
                      <span className={`text-xs sm:text-sm ${getThemeClasses('text-green-700', 'text-green-400')}`}>
                        Accepted on {new Date(acceptanceData.acceptedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} • Version {acceptanceData.version}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-white hover:shadow-md text-gray-500 hover:text-gray-700'}`}
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="p-4 sm:p-8 space-y-8 sm:space-y-10">
            {/* Introduction */}
            <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-900/60 border border-gray-800 ' : 'bg-gray-200/60 border border-blue-100'}`}>
              <div className="flex items-start">
                <FaInfoCircle className={`w-6 h-6 mr-4 mt-1 ${getThemeClasses('text-indigo-600', 'text-indigo-400')}`} />
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                    Agreement to Terms
                  </h3>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-white')}`}>
                    By accessing and using TeamLabs, you accept and agree to be bound by the terms and provision of this agreement.
                    These Terms of Service govern your use of our AI-powered project management platform and all related services.
                  </p>
                </div>
              </div>
            </div>

            {/* Service Description */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-blue-600 to-indigo-600', 'bg-gradient-to-r from-blue-500 to-indigo-500')}`}>
                  <FaUser className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Service Description
                </h3>
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                <p className={`text-base sm:text-lg leading-relaxed mb-3 sm:mb-4 ${getThemeClasses('text-gray-700', 'text-white')}`}>
                  TeamLabs provides a comprehensive project management platform that includes:
                </p>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  <ul className={`space-y-2 sm:space-y-3 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Project and task management tools
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Team collaboration features
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      AI-powered assistant and analytics
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Real-time messaging and notifications
                    </li>
                  </ul>
                  <ul className={`space-y-2 sm:space-y-3 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      File sharing and document management
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Kanban boards and workflow automation
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Third-party integrations (GitHub, Google)
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Subscription and billing management
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* User Responsibilities */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-green-600 to-emerald-600', 'bg-gradient-to-r from-green-500 to-emerald-500')}`}>
                  <FaShieldAlt className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  User Responsibilities
                </h3>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-green-600', 'bg-green-500')}`}>
                      <FaUser className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-green-900', 'text-gray-100')}`}>
                      Account Security
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-green-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Maintain accurate account information
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Keep login credentials secure
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Enable two-factor authentication
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Report suspicious activity immediately
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Update contact information promptly
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-blue-600', 'bg-blue-500')}`}>
                      <FaShieldAlt className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-blue-900', 'text-gray-100')}`}>
                      Acceptable Use
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-blue-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Use service for legitimate business purposes
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Respect intellectual property rights
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Comply with applicable laws and regulations
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Maintain professional conduct
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Report violations promptly
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-purple-600', 'bg-purple-500')}`}>
                      <FaExclamationTriangle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-purple-900', 'text-gray-100')}`}>
                      Prohibited Activities
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-purple-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Unauthorized access to accounts
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Malicious software or hacking attempts
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Spam or unsolicited communications
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Harassment or inappropriate content
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Reverse engineering or data scraping
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-orange-600', 'bg-orange-500')}`}>
                      <FaGavel className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-orange-900', 'text-gray-100')}`}>
                      Legal Compliance
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-orange-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Follow data protection regulations
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Respect privacy rights of others
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Comply with export control laws
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Adhere to industry standards
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Maintain audit trails when required
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Subscription Terms */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-purple-600 to-pink-600', 'bg-gradient-to-r from-purple-500 to-pink-500')}`}>
                  <FaFileContract className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Subscription Terms
                </h3>
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Billing & Payments
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Subscriptions are billed in advance
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Payment processing via Stripe
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Automatic renewal unless cancelled
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Prorated refunds for annual plans
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Cancellation & Refunds
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        Cancel anytime from account settings
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        30-day money-back guarantee
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        No refunds for partial months
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        Downgrade options available
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-red-600 to-orange-600', 'bg-gradient-to-r from-red-500 to-orange-500')}`}>
                  <FaGavel className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Intellectual Property
                </h3>
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      TeamLabs Ownership
                    </h4>
                    <p className={`${getThemeClasses('text-gray-600', 'text-white')}`}>
                      All rights, title, and interest in and to TeamLabs, including all intellectual property rights,
                      are and will remain the exclusive property of TeamLabs and its licensors.
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      User Content
                    </h4>
                    <p className={`${getThemeClasses('text-gray-600', 'text-white')}`}>
                      You retain ownership of content you create, upload, or share through our platform. By using our service,
                      you grant us a limited license to use, store, and process your content solely to provide our services.
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Third-Party Content
                    </h4>
                    <p className={`${getThemeClasses('text-gray-600', 'text-white')}`}>
                      Our platform may include third-party content, services, or integrations. Such content is subject to
                      the respective third-party terms and conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-yellow-600 to-orange-600', 'bg-gradient-to-r from-yellow-500 to-orange-500')}`}>
                  <FaExclamationTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Limitation of Liability
                </h3>
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                <div className="space-y-4">
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-white')}`}>
                    <strong>Service Availability:</strong> We strive to maintain high service availability but cannot guarantee
                    uninterrupted access. We are not liable for temporary service disruptions.
                  </p>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-white')}`}>
                    <strong>Data Loss:</strong> While we implement robust backup systems, users are responsible for maintaining
                    their own data backups. We are not liable for data loss.
                  </p>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-white')}`}>
                    <strong>Third-Party Services:</strong> We are not responsible for the availability, content, or security
                    of third-party services integrated with our platform.
                  </p>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-white')}`}>
                    <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount paid by you for the
                    service in the 12 months preceding the claim.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-900/60 border border-gray-800 ' : 'bg-gray-200/60 border border-indigo-100'} ${getThemeClasses('border border-indigo-100', 'border border-gray-800')}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center ${getThemeClasses('text-indigo-800', 'text-indigo-200')}`}>
                <FaEnvelope className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <p className={`mb-4 ${getThemeClasses('text-indigo-700', 'text-white')}`}>
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2">
                <p className={`flex items-center ${getThemeClasses('text-indigo-700', 'text-white')}`}>
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  Email: tejassggprojects@gmail.com
                </p>
                <p className={`flex items-center ${getThemeClasses('text-indigo-700', 'text-white')}`}>
                  <FaPhone className="w-4 h-4 mr-2" />
                  Phone: +1 (559) 388-6490
                </p>
              </div>
            </div>

            {/* Updates */}
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                Terms Updates
              </h3>
              <p className={`leading-relaxed ${getThemeClasses('text-gray-600', 'text-white')}`}>
                We may update these Terms of Service from time to time. We will notify users of material changes via email
                or through our platform. Your continued use of our service after any modifications constitutes acceptance
                of the updated terms.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 border-t backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-[#030712]/90 border-white/5' : 'bg-slate-50/85 border-slate-200/80'}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 sm:p-6">
            <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              TeamLabs Terms of Service • Version 1.0
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 border text-sm shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Close
              </button>
              <button
                onClick={isAccepted ? undefined : handleAccept}
                className={`w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:opacity-95 transition-all duration-200 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 text-sm ${isAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAccepted ? '✓ Accepted' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;
