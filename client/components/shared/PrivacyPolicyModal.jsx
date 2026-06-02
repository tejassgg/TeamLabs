import React from 'react';
import { FaTimes, FaShieldAlt, FaUser, FaDatabase, FaLock, FaGlobe, FaEnvelope, FaPhone, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { acceptPolicy, isPolicyAccepted, getPolicyAcceptanceData } from '../../utils/policyAcceptance';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
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
    acceptPolicy('PRIVACY_POLICY');
    showToast('Privacy Policy accepted successfully!', 'success');
    onClose();
  };

  // Get acceptance data if policy is accepted
  const acceptanceData = getPolicyAcceptanceData('PRIVACY_POLICY');
  const isAccepted = isPolicyAccepted('PRIVACY_POLICY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 transition-all duration-300">
      <div className={`relative w-full sm:max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-[#030712]/90 border-white/10 shadow-slate-950/80' : 'bg-white/95 border-slate-200/80 shadow-slate-200/50'} backdrop-blur-xl`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50/85 border-slate-200/80'}`}>
          <div className="flex items-start sm:items-center justify-between p-5 sm:p-6 gap-3">
            <div className="flex items-start sm:items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-indigo-500/10' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-600/15'}`}>
                <FaShieldAlt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Privacy Policy
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
                <FaInfoCircle className={`w-6 h-6 mr-4 mt-1 ${getThemeClasses('text-blue-600', 'text-blue-400')}`} />
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                    Introduction
                  </h3>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-white')}`}>
                    At TeamLabs, we are committed to protecting your privacy and ensuring the security of your personal information.
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
                    AI-powered project management platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Information We Collect */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-blue-600 to-indigo-600', 'bg-gradient-to-r from-blue-500 to-indigo-500')}`}>
                  <FaDatabase className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Information We Collect
                </h3>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <FaUser className={`w-5 h-5 mr-3 ${getThemeClasses('text-blue-600', 'text-blue-400')}`} />
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Personal Information
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      Name (first, last, and middle name)
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      Email address
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      Phone number and extension
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      Profile image
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      Address information
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      Username and password (encrypted)
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <FaDatabase className={`w-5 h-5 mr-3 ${getThemeClasses('text-green-600', 'text-green-400')}`} />
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Account & Usage Data
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                      Organization membership and role
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                      Team memberships and assignments
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                      Task creation and completion data
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                      User activity logs
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                      Login history and sessions
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                      Two-factor authentication settings
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <FaLock className={`w-5 h-5 mr-3 ${getThemeClasses('text-purple-600', 'text-purple-400')}`} />
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Payment Information
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                      Subscription plan details
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                      Payment method (via Stripe)
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                      Billing history
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                      Usage limits and access
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <FaGlobe className={`w-5 h-5 mr-3 ${getThemeClasses('text-orange-600', 'text-orange-400')}`} />
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Technical & Integration Data
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>
                      IP address and device info
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>
                      Browser and OS details
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>
                      Usage patterns
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>
                      Google OAuth data
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>
                      GitHub integration data
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>
                      Error logs and analytics
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-green-600 to-emerald-600', 'bg-gradient-to-r from-green-500 to-emerald-500')}`}>
                  <FaUser className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  How We Use Your Information
                </h3>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-blue-600', 'bg-blue-500')}`}>
                      <FaCheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-blue-900', 'text-gray-100')}`}>
                      Service Provision
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-blue-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Account creation and management
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Project and task organization
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Team collaboration features
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      AI assistant functionality
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Analytics and reporting
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-green-600', 'bg-green-500')}`}>
                      <FaEnvelope className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-green-900', 'text-gray-100')}`}>
                      Communication
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-green-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Account notifications
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Security alerts
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Feature updates
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Support communications
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Marketing (with consent)
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-purple-600', 'bg-purple-500')}`}>
                      <FaLock className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-purple-900', 'text-gray-100')}`}>
                      Security & Compliance
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-purple-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Authentication and authorization
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Fraud prevention
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Legal compliance
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      System security monitoring
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Data backup and recovery
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-orange-600', 'bg-orange-500')}`}>
                      <FaExclamationTriangle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-orange-900', 'text-gray-100')}`}>
                      Service Improvement
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-orange-800', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Service optimization
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Feature development
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      User experience enhancement
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Performance monitoring
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Bug fixes and updates
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center ${getThemeClasses('text-gray-900', 'text-white')}`}>
                <FaLock className="w-5 h-5 mr-2 text-red-500" />
                Data Security
              </h3>

              <div className={`p-5 sm:p-6 rounded-lg ${getThemeClasses('bg-gray-50', 'bg-transparent')}`}>
                <p className={`mb-4 ${getThemeClasses('text-gray-700', 'text-white')}`}>
                  We implement industry-standard security measures to protect your data:
                </p>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className={`font-semibold mb-3 ${getThemeClasses('text-gray-800', 'text-white')}`}>
                      Technical Safeguards
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        SSL/TLS encryption for data transmission
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        Password hashing with bcrypt
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        JWT token-based authentication
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        Two-factor authentication support
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className={`font-semibold mb-3 ${getThemeClasses('text-gray-800', 'text-white')}`}>
                      Administrative Safeguards
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        Role-based access control
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        Regular security audits
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        Employee training on data protection
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        Incident response procedures
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Third-Party Services */}
            <div>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center ${getThemeClasses('text-gray-900', 'text-white')}`}>
                <FaGlobe className="w-5 h-5 mr-2 text-indigo-500" />
                Third-Party Services
              </h3>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${getThemeClasses('border-gray-200 bg-white', 'border-gray-800 bg-gray-900/60')}`}> 
                  <h4 className={`font-semibold mb-2 ${getThemeClasses('text-gray-800', 'text-white')}`}>
                    Google OAuth
                  </h4>
                  <p className={`text-sm ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    We use Google OAuth for secure authentication. Google may collect and process your data according to their privacy policy.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${getThemeClasses('border-gray-200 bg-white', 'border-gray-800 bg-gray-900/60')}`}>
                  <h4 className={`font-semibold mb-2 ${getThemeClasses('text-gray-800', 'text-white')}`}>
                    Stripe Payment Processing
                  </h4>
                  <p className={`text-sm ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    Payment information is processed securely through Stripe. We do not store credit card details on our servers.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${getThemeClasses('border-gray-200 bg-white', 'border-gray-800 bg-gray-900/60')}`}>
                  <h4 className={`font-semibold mb-2 ${getThemeClasses('text-gray-800', 'text-white')}`}>
                    GitHub Integration
                  </h4>
                  <p className={`text-sm ${getThemeClasses('text-gray-600', 'text-white')}`}>
                    Optional GitHub integration allows repository management. GitHub data is processed according to their terms of service.
                  </p>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                Your Rights and Choices
              </h3>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className={`p-4 rounded-lg ${getThemeClasses('bg-green-50', 'bg-green-900/60')}`}>
                  <h4 className={`font-semibold mb-2 ${getThemeClasses('text-green-800', 'text-green-200')}`}>
                    Access and Control
                  </h4>
                  <ul className={`text-sm space-y-1 ${getThemeClasses('text-green-700', 'text-green-300')}`}>
                    <li>• View and update your profile</li>
                    <li>• Download your data</li>
                    <li>• Delete your account</li>
                    <li>• Manage privacy settings</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg ${getThemeClasses('bg-blue-50', 'bg-blue-900/20')}`}>
                  <h4 className={`font-semibold mb-2 ${getThemeClasses('text-blue-800', 'text-blue-200')}`}>
                    Communication Preferences
                  </h4>
                  <ul className={`text-sm space-y-1 ${getThemeClasses('text-blue-700', 'text-blue-300')}`}>
                    <li>• Opt-out of marketing emails</li>
                    <li>• Manage notification settings</li>
                    <li>• Control data sharing</li>
                    <li>• Update contact preferences</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                Data Retention
              </h3>
              <p className={`leading-relaxed ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations.
                Account data is typically retained for the duration of your subscription plus 30 days. Activity logs may be retained
                for up to 2 years for security and compliance purposes. You may request data deletion at any time.
              </p>
            </div>

            {/* Contact Information */}
            <div className={`p-5 sm:p-6 rounded-lg ${getThemeClasses('bg-blue-50', 'bg-blue-900/20')}`}>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center ${getThemeClasses('text-blue-800', 'text-blue-200')}`}>
                <FaEnvelope className="w-5 h-5 mr-2" />
                Contact Us
              </h3>
              <p className={`mb-4 ${getThemeClasses('text-blue-700', 'text-blue-300')}`}>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2">
                <p className={`flex items-center ${getThemeClasses('text-blue-700', 'text-blue-300')}`}>
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  Email: tejassggprojects@gmail.com
                </p>
                <p className={`flex items-center ${getThemeClasses('text-blue-700', 'text-blue-300')}`}>
                  <FaPhone className="w-4 h-4 mr-2" />
                  Phone: +1 (559) 388-6490
                </p>
              </div>
            </div>

            {/* Updates */}
            <div>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                Policy Updates
              </h3>
              <p className={`leading-relaxed ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
                the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our service
                after any modifications constitutes acceptance of the updated Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 border-t backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-[#030712]/90 border-white/5' : 'bg-slate-50/85 border-slate-200/80'}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 sm:p-6">
            <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              TeamLabs Privacy Policy • Version 1.0
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
                className={`w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-95 transition-all duration-200 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 text-sm ${isAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAccepted ? '✓ Accepted' : 'I Understand'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
