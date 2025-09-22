import React from 'react';
import { FaTimes, FaCookieBite, FaShieldAlt, FaCog, FaChartBar, FaUser, FaExclamationTriangle, FaInfoCircle, FaEnvelope, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const CookiePolicyModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  const getThemeClasses = (lightClasses, darkClasses) => 
    theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative max-w-5xl w-full max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl border ${getThemeClasses('bg-white border-gray-200', 'bg-gray-900 border-gray-700')}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 bg-gradient-to-r ${getThemeClasses('from-orange-50 to-amber-50 border-b border-gray-200', 'from-gray-800 to-gray-900 border-b border-gray-700')}`}>
          <div className="flex items-center justify-between p-8">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-orange-600 to-amber-600', 'bg-gradient-to-r from-orange-500 to-amber-500')}`}>
                <FaCookieBite className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Cookie Policy
                </h1>
                <p className={`text-sm mt-1 ${getThemeClasses('text-gray-600', 'text-gray-400')}`}>
                  Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-200 ${getThemeClasses('hover:bg-white hover:shadow-md text-gray-500 hover:text-gray-700', 'hover:bg-gray-700 text-gray-400 hover:text-white')}`}
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="p-8 space-y-10">
            {/* Introduction */}
            <div className={`p-6 rounded-2xl ${getThemeClasses('bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100', 'bg-gradient-to-r from-orange-900/20 to-amber-900/20 border border-orange-800/30')}`}>
              <div className="flex items-start">
                <FaInfoCircle className={`w-6 h-6 mr-4 mt-1 ${getThemeClasses('text-orange-600', 'text-orange-400')}`} />
                <div>
                  <h3 className={`text-2xl font-bold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                    What Are Cookies?
                  </h3>
                  <p className={`text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-gray-300')}`}>
                    Cookies are small text files that are stored on your device when you visit our website. 
                    They help us provide you with a better experience by remembering your preferences, 
                    analyzing site usage, and enabling essential functionality.
                  </p>
                </div>
              </div>
            </div>

            {/* Types of Cookies */}
            <div>
              <div className="flex items-center mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-blue-600 to-indigo-600', 'bg-gradient-to-r from-blue-500 to-indigo-500')}`}>
                  <FaCog className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Types of Cookies We Use
                </h3>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200', 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-blue-600', 'bg-blue-500')}`}>
                      <FaShieldAlt className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-blue-900', 'text-blue-100')}`}>
                      Essential Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-blue-800', 'text-blue-200')}`}>
                    These cookies are necessary for the website to function properly and cannot be disabled.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-blue-700', 'text-blue-300')}`}>
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

                <div className={`p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-green-50 to-emerald-50 border-green-200', 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-green-600', 'bg-green-500')}`}>
                      <FaChartBar className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-green-900', 'text-green-100')}`}>
                      Analytics Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-green-800', 'text-green-200')}`}>
                    These cookies help us understand how visitors interact with our website.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-green-700', 'text-green-300')}`}>
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

                <div className={`p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200', 'bg-gradient-to-br from-purple-900/20 to-violet-900/20 border-purple-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-purple-600', 'bg-purple-500')}`}>
                      <FaUser className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-purple-900', 'text-purple-100')}`}>
                      Functional Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-purple-800', 'text-purple-200')}`}>
                    These cookies enable enhanced functionality and personalization.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-purple-700', 'text-purple-300')}`}>
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

                <div className={`p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200', 'bg-gradient-to-br from-orange-900/20 to-amber-900/20 border-orange-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-orange-600', 'bg-orange-500')}`}>
                      <FaExclamationTriangle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-orange-900', 'text-orange-100')}`}>
                      Marketing Cookies
                    </h4>
                  </div>
                  <p className={`mb-4 ${getThemeClasses('text-orange-800', 'text-orange-200')}`}>
                    These cookies are used to deliver relevant advertisements and track campaign effectiveness.
                  </p>
                  <ul className={`space-y-2 ${getThemeClasses('text-orange-700', 'text-orange-300')}`}>
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
              <div className="flex items-center mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-red-600 to-pink-600', 'bg-gradient-to-r from-red-500 to-pink-500')}`}>
                  <FaShieldAlt className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Third-Party Cookies
                </h3>
              </div>
              
              <div className={`p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-800 border-gray-700')}`}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Google Services
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
              <div className="flex items-center mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${getThemeClasses('bg-gradient-to-r from-green-600 to-emerald-600', 'bg-gradient-to-r from-green-500 to-emerald-500')}`}>
                  <FaCog className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Managing Your Cookie Preferences
                </h3>
              </div>
              
              <div className={`p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-r from-green-50 to-emerald-50 border-green-200', 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700/30')}`}>
                <div className="space-y-6">
                  <div>
                    <h4 className={`text-lg font-semibold mb-3 ${getThemeClasses('text-green-900', 'text-green-100')}`}>
                      Browser Settings
                    </h4>
                    <p className={`mb-4 ${getThemeClasses('text-green-800', 'text-green-200')}`}>
                      You can control cookies through your browser settings. Most browsers allow you to:
                    </p>
                    <ul className={`space-y-2 ${getThemeClasses('text-green-700', 'text-green-300')}`}>
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
                    <h4 className={`text-lg font-semibold mb-3 ${getThemeClasses('text-green-900', 'text-green-100')}`}>
                      TeamLabs Cookie Settings
                    </h4>
                    <p className={`mb-4 ${getThemeClasses('text-green-800', 'text-green-200')}`}>
                      You can manage your cookie preferences directly in your TeamLabs account:
                    </p>
                    <ul className={`space-y-2 ${getThemeClasses('text-green-700', 'text-green-300')}`}>
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

                  <div className={`p-4 rounded-xl ${getThemeClasses('bg-green-100 border border-green-300', 'bg-green-800/30 border border-green-600/30')}`}>
                    <div className="flex items-start">
                      <FaExclamationTriangle className={`w-5 h-5 mr-3 mt-0.5 ${getThemeClasses('text-green-600', 'text-green-400')}`} />
                      <div>
                        <p className={`font-semibold ${getThemeClasses('text-green-800', 'text-green-200')}`}>
                          Important Note:
                        </p>
                        <p className={`text-sm ${getThemeClasses('text-green-700', 'text-green-300')}`}>
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
              
              <div className={`p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-800 border-gray-700')}`}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Session Cookies
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
            <div className={`p-6 rounded-2xl ${getThemeClasses('bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100', 'bg-gradient-to-r from-orange-900/20 to-amber-900/20 border border-orange-800/30')}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center ${getThemeClasses('text-orange-800', 'text-orange-200')}`}>
                <FaEnvelope className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <p className={`mb-4 ${getThemeClasses('text-orange-700', 'text-orange-300')}`}>
                If you have questions about our Cookie Policy or need help managing your cookie preferences, please contact us:
              </p>
              <div className="space-y-2">
                <p className={`flex items-center ${getThemeClasses('text-orange-700', 'text-orange-300')}`}>
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  Email: tejassggprojects@gmail.com
                </p>
                <p className={`flex items-center ${getThemeClasses('text-orange-700', 'text-orange-300')}`}>
                  <FaPhone className="w-4 h-4 mr-2" />
                  Phone: +1 (555) 388-6490
                </p>
              </div>
            </div>

            {/* Updates */}
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                Policy Updates
              </h3>
              <p className={`leading-relaxed ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, 
                legal, or regulatory reasons. We will notify users of any material changes via email or through our platform. 
                Your continued use of our service after any modifications constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 bg-gradient-to-r ${getThemeClasses('from-gray-50 to-gray-100 border-t border-gray-200', 'from-gray-800 to-gray-900 border-t border-gray-700')}`}>
          <div className="flex justify-between items-center p-6">
            <div className={`text-sm ${getThemeClasses('text-gray-500', 'text-gray-400')}`}>
              TeamLabs Cookie Policy • Version 1.0
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${getThemeClasses('bg-gray-200 text-gray-700 hover:bg-gray-300', 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}
              >
                Close
              </button>
              <button
                onClick={onClose}
                className={`px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyModal;
