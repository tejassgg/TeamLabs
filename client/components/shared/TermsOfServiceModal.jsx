import React from 'react';
import { FaTimes, FaFileContract, FaUser, FaShieldAlt, FaExclamationTriangle, FaInfoCircle, FaGavel, FaEnvelope, FaPhone, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { acceptPolicy, isPolicyAccepted, getPolicyAcceptanceData } from '../../utils/policyAcceptance';

const TermsOfServiceModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const getThemeClasses = (lightClasses, darkClasses) => 
    theme === 'dark' ? `${lightClasses} ${darkClasses}` : lightClasses;

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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-3 ">
      <div className={`relative w-full sm:max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border ${getThemeClasses('bg-white border-gray-200', 'bg-gray-900 border-gray-700')}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 bg-gradient-to-r ${getThemeClasses('from-indigo-50 to-purple-50 border-b border-gray-200', 'from-gray-800 to-gray-900 border-b border-gray-700')}`}>
          <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 gap-3">
            <div className="flex items-start sm:items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 sm:mr-4 ${getThemeClasses('bg-gradient-to-r from-indigo-600 to-purple-600', 'bg-gradient-to-r from-indigo-500 to-purple-500')}`}>
                <FaFileContract className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${getThemeClasses('text-gray-900', 'text-white')}`}>
                  Terms of Service
                </h1>
                <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
                  <p className={`text-xs sm:text-sm mt-1 ${getThemeClasses('text-gray-600', 'text-gray-400')}`}>
                    Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {isAccepted && acceptanceData && (
                    <div className="flex items-center gap-1">
                      <FaCheckCircle className={`w-4 h-4 ${getThemeClasses('text-green-600', 'text-green-400')}`} />
                      <span className={`text-xs sm:text-sm ${getThemeClasses('text-green-700', 'text-green-300')}`}>
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
              className={`p-3 rounded-xl transition-all duration-200 ${getThemeClasses('hover:bg-white hover:shadow-md text-gray-500 hover:text-gray-700', 'hover:bg-gray-700 text-gray-400 hover:text-white')}`}
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="p-4 sm:p-8 space-y-8 sm:space-y-10">
            {/* Introduction */}
            <div className={`p-6 rounded-2xl ${getThemeClasses('bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100', 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-800/30')}`}>
              <div className="flex items-start">
                <FaInfoCircle className={`w-6 h-6 mr-4 mt-1 ${getThemeClasses('text-indigo-600', 'text-indigo-400')}`} />
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                    Agreement to Terms
                  </h3>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-gray-300')}`}>
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
              
              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-800 border-gray-700')}`}>
                <p className={`text-base sm:text-lg leading-relaxed mb-3 sm:mb-4 ${getThemeClasses('text-gray-700', 'text-gray-300')}`}>
                  TeamLabs provides a comprehensive project management platform that includes:
                </p>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  <ul className={`space-y-2 sm:space-y-3 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
                  <ul className={`space-y-2 sm:space-y-3 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-green-50 to-emerald-50 border-green-200', 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-green-600', 'bg-green-500')}`}>
                      <FaUser className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-green-900', 'text-green-100')}`}>
                      Account Security
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-green-800', 'text-green-200')}`}>
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

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200', 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-blue-600', 'bg-blue-500')}`}>
                      <FaShieldAlt className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-blue-900', 'text-blue-100')}`}>
                      Acceptable Use
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-blue-800', 'text-blue-200')}`}>
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

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200', 'bg-gradient-to-br from-purple-900/20 to-violet-900/20 border-purple-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-purple-600', 'bg-purple-500')}`}>
                      <FaExclamationTriangle className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-purple-900', 'text-purple-100')}`}>
                      Prohibited Activities
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-purple-800', 'text-purple-200')}`}>
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

                <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200', 'bg-gradient-to-br from-orange-900/20 to-amber-900/20 border-orange-700/30')}`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getThemeClasses('bg-orange-600', 'bg-orange-500')}`}>
                      <FaGavel className="w-4 h-4 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold ${getThemeClasses('text-orange-900', 'text-orange-100')}`}>
                      Legal Compliance
                    </h4>
                  </div>
                  <ul className={`space-y-2 ${getThemeClasses('text-orange-800', 'text-orange-200')}`}>
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
              
              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-800 border-gray-700')}`}>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Billing & Payments
                    </h4>
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
                    <ul className={`space-y-2 ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
              
              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-white border-gray-200 shadow-sm', 'bg-gray-800 border-gray-700')}`}>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      TeamLabs Ownership
                    </h4>
                    <p className={`${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
                      All rights, title, and interest in and to TeamLabs, including all intellectual property rights, 
                      are and will remain the exclusive property of TeamLabs and its licensors.
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      User Content
                    </h4>
                    <p className={`${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
                      You retain ownership of content you create, upload, or share through our platform. By using our service, 
                      you grant us a limited license to use, store, and process your content solely to provide our services.
                    </p>
                  </div>
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${getThemeClasses('text-gray-900', 'text-white')}`}>
                      Third-Party Content
                    </h4>
                    <p className={`${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
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
              
              <div className={`p-5 sm:p-6 rounded-2xl border ${getThemeClasses('bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200', 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700/30')}`}>
                <div className="space-y-4">
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-gray-300')}`}>
                    <strong>Service Availability:</strong> We strive to maintain high service availability but cannot guarantee 
                    uninterrupted access. We are not liable for temporary service disruptions.
                  </p>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-gray-300')}`}>
                    <strong>Data Loss:</strong> While we implement robust backup systems, users are responsible for maintaining 
                    their own data backups. We are not liable for data loss.
                  </p>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-gray-300')}`}>
                    <strong>Third-Party Services:</strong> We are not responsible for the availability, content, or security 
                    of third-party services integrated with our platform.
                  </p>
                  <p className={`text-base sm:text-lg leading-relaxed ${getThemeClasses('text-gray-700', 'text-gray-300')}`}>
                    <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount paid by you for the 
                    service in the 12 months preceding the claim.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={`p-6 rounded-2xl ${getThemeClasses('bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100', 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-800/30')}`}>
              <h3 className={`text-xl font-semibold mb-4 flex items-center ${getThemeClasses('text-indigo-800', 'text-indigo-200')}`}>
                <FaEnvelope className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <p className={`mb-4 ${getThemeClasses('text-indigo-700', 'text-indigo-300')}`}>
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2">
                <p className={`flex items-center ${getThemeClasses('text-indigo-700', 'text-indigo-300')}`}>
                  <FaEnvelope className="w-4 h-4 mr-2" />
                  Email: tejassggprojects@gmail.com
                </p>
                <p className={`flex items-center ${getThemeClasses('text-indigo-700', 'text-indigo-300')}`}>
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
              <p className={`leading-relaxed ${getThemeClasses('text-gray-600', 'text-gray-300')}`}>
                We may update these Terms of Service from time to time. We will notify users of material changes via email 
                or through our platform. Your continued use of our service after any modifications constitutes acceptance 
                of the updated terms.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 bg-gradient-to-r ${getThemeClasses('from-gray-50 to-gray-100 border-t border-gray-200', 'from-gray-800 to-gray-900 border-t border-gray-700')}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4">
            <div className={`text-xs sm:text-sm ${getThemeClasses('text-gray-500', 'text-gray-400')}`}>
              TeamLabs Terms of Service • Version 1.0
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${getThemeClasses('bg-gray-200 text-gray-700 hover:bg-gray-300', 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}
              >
                Close
              </button>
              <button
                onClick={isAccepted ? undefined : handleAccept}
                className={`w-full ${isAccepted ? 'opacity-50 cursor-not-allowed' : ''} sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                {isAccepted ? 'Accepted' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;
