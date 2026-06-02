import React from 'react';
import { FaTimes, FaCookieBite, FaShieldAlt, FaCog, FaChartBar, FaUser, FaExclamationTriangle, FaInfoCircle, FaEnvelope, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { acceptPolicy, isPolicyAccepted, getPolicyAcceptanceData } from '../../utils/policyAcceptance';

const CookiePolicyModal = ({ isOpen, onClose }) => {
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
    acceptPolicy('COOKIE_POLICY');
    showToast('Cookie Policy accepted successfully!', 'success');
    onClose();
  };

  // Get acceptance data if policy is accepted
  const acceptanceData = getPolicyAcceptanceData('COOKIE_POLICY');
  const isAccepted = isPolicyAccepted('COOKIE_POLICY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 transition-all duration-300">
      <div className={`relative w-full sm:max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border transition-all duration-300 ${theme === 'dark' ? 'bg-[#030712]/90 border-white/10 shadow-slate-950/80' : 'bg-white/95 border-slate-200/80 shadow-slate-200/50'} backdrop-blur-xl`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-slate-950/80 border-white/5' : 'bg-slate-50/85 border-slate-200/80'}`}>
          <div className="flex items-start sm:items-center justify-between p-5 sm:p-6 gap-3">
            <div className="flex items-start sm:items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-tr from-orange-500 to-amber-500 shadow-orange-500/10' : 'bg-gradient-to-tr from-orange-600 to-amber-600 shadow-orange-600/15'}`}>
                <FaCookieBite className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Cookie Policy
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
                <FaInfoCircle className={`w-6 h-6 mr-4 mt-1 ${getThemeClasses('text-orange-600', 'text-orange-400')}`} />
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                    What Are Cookies?
                  </h3>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-white')}`}>
                    Cookies are small text files that are stored on your device when you visit our website.
                    They help us provide you with a better experience by remembering your preferences,
                    analyzing site usage, and enabling essential functionality.
                  </p>
                </div>
              </div>
            </div>

            {/* Types of Cookies */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-blue-600 to-indigo-600', 'bg-gradient-to-r from-blue-500 to-indigo-500')}`}>
                  <FaCog className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Types of Cookies We Use
                </h3>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-blue-600', 'bg-blue-500')}`}>
                      <FaShieldAlt className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-blue-900', 'text-gray-100')}`}>
                      Essential Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-blue-800', 'text-white')}`}>
                    These cookies are necessary for the website to function properly and cannot be disabled.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-blue-700', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Authentication and login sessions
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Security and fraud prevention
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Load balancing and performance
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      User preferences and settings
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      Shopping cart and checkout process
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-green-600', 'bg-green-500')}`}>
                      <FaChartBar className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-green-900', 'text-gray-100')}`}>
                      Analytics Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-green-800', 'text-white')}`}>
                    These cookies help us understand how visitors interact with our website.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-green-700', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Page views and user behavior
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Performance monitoring
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Error tracking and debugging
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      Feature usage statistics
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                      A/B testing and optimization
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-purple-600', 'bg-purple-500')}`}>
                      <FaUser className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-purple-900', 'text-gray-100')}`}>
                      Functional Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-purple-800', 'text-white')}`}>
                    These cookies enable enhanced functionality and personalization.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-purple-700', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Theme preferences (dark/light mode)
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Language and region settings
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Dashboard layout preferences
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Notification preferences
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-3"></div>
                      Accessibility settings
                    </li>
                  </ul>
                </div>

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-orange-600', 'bg-orange-500')}`}>
                      <FaExclamationTriangle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-orange-900', 'text-gray-100')}`}>
                      Marketing Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-orange-800', 'text-white')}`}>
                    These cookies are used to deliver relevant advertisements and track campaign effectiveness.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-orange-700', 'text-white')}`}>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Ad targeting and personalization
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Social media integration
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Conversion tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Retargeting campaigns
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-3"></div>
                      Cross-site tracking
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Third-Party Cookies */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-red-600 to-pink-600', 'bg-gradient-to-r from-red-500 to-pink-500')}`}>
                  <FaShieldAlt className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Third-Party Cookies
                </h3>
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Google Services
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        Google Analytics for website analytics
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        Google OAuth for authentication
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        Google Fonts for typography
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        Google reCAPTCHA for security
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Other Services
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        Stripe for payment processing
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        GitHub for repository integration
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        Socket.io for real-time communication
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        Cloudinary for image optimization
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookie Management */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-green-600 to-emerald-600', 'bg-gradient-to-r from-green-500 to-emerald-500')}`}>
                  <FaCog className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Managing Your Cookie Preferences
                </h3>
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                <div className="space-y-6">
                  <div>
                    <h4 className={`text-lg font-semibold mb-3 ${getThemeClasses('text-green-900', 'text-gray-100')}`}>
                      Browser Settings
                    </h4>
                    <p className={`mb-4 ${getThemeClasses('text-green-800', 'text-white')}`}>
                      You can control cookies through your browser settings. Most browsers allow you to:
                    </p>
                    <ul className={`space-y-2 ${getThemeClasses('text-green-700', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Block all cookies
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Block third-party cookies only
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Delete existing cookies
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Set cookie expiration preferences
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className={`text-lg font-semibold mb-3 ${getThemeClasses('text-green-900', 'text-gray-100')}`}>
                      TeamLabs Cookie Settings
                    </h4>
                    <p className={`mb-4 ${getThemeClasses('text-green-800', 'text-white')}`}>
                      You can manage your cookie preferences directly in your TeamLabs account:
                    </p>
                    <ul className={`space-y-2 ${getThemeClasses('text-green-700', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Go to Settings → Privacy & Security
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Toggle analytics cookies on/off
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Manage marketing preferences
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3"></div>
                        Clear stored cookie data
                      </li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-xl ${getThemeClasses('bg-green-100 border border-green-300', 'bg-gray-900/60 border border-gray-800')}`}>
                    <div className="flex items-start">
                      <FaExclamationTriangle className={`w-5 h-5 mr-3 mt-0.5 ${getThemeClasses('text-green-600', 'text-green-400')}`} />
                      <div>
                        <p className={`font-semibold ${getThemeClasses('text-green-800', 'text-white')}`}>
                          Important Note:
                        </p>
                        <p className={`text-sm ${getThemeClasses('text-green-700', 'text-white')}`}>
                          Disabling essential cookies may affect the functionality of our website and your user experience.
                          Some features may not work properly without these cookies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookie Retention */}
            <div>
              <div className="flex items-center mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-purple-600 to-indigo-600', 'bg-gradient-to-r from-purple-500 to-indigo-500')}`}>
                  <FaChartBar className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Cookie Retention Periods
                </h3>
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-900/60 border-gray-800')}`}>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Session Cookies
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Authentication tokens: Until logout
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Shopping cart: Until session ends
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Form data: Until page refresh
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        User preferences: Until browser close
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Persistent Cookies
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-white')}`}>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                        Analytics data: 2 years
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                        Marketing cookies: 1 year
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                        Theme preferences: 1 year
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                        Language settings: 6 months
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-gray-900/60 border border-gray-800 ' : 'bg-gray-200/60 border border-orange-100'} ${getThemeClasses('border border-orange-100', 'border border-gray-800')}`}>
              <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center ${getThemeClasses('text-orange-800', 'text-orange-200')}`}>
                <FaEnvelope className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <p className={`mb-4 ${getThemeClasses('text-orange-700', 'text-white')}`}>
                If you have questions about our Cookie Policy or need help managing your cookie preferences, please contact us:
              </p>
              <div className="space-y-2">
                <p className={`flex items-center ${getThemeClasses('text-orange-700', 'text-white')}`}>
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  Email: tejassggprojects@gmail.com
                </p>
                <p className={`flex items-center ${getThemeClasses('text-orange-700', 'text-white')}`}>
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
              <p className={`leading-relaxed ${getThemeClasses('text-gray-600', 'text-white')}`}>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational,
                legal, or regulatory reasons. We will notify users of any material changes via email or through our platform.
                Your continued use of our service after any modifications constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 border-t backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-[#030712]/90 border-white/5' : 'bg-slate-50/85 border-slate-200/80'}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 sm:p-6">
            <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              TeamLabs Cookie Policy • Version 1.0
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
                className={`w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white rounded-xl font-bold hover:opacity-95 transition-all duration-200 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 text-sm ${isAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default CookiePolicyModal;
