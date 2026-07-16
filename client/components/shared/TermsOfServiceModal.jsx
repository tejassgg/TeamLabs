import React from 'react';
import { FaTimes, FaFileContract, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { acceptPolicy, isPolicyAccepted, getPolicyAcceptanceData } from '../../utils/policyAcceptance';

const sections = [
  { id: 'agreement', label: 'Agreement to Terms' },
  { id: 'service-desc', label: 'Service Description' },
  { id: 'user-resp', label: 'User Responsibilities' },
  { id: 'sub-terms', label: 'Subscription Terms' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'contact-info', label: 'Contact Information' },
  { id: 'terms-updates', label: 'Terms Updates' }
];

const TermsOfServiceModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = React.useState('agreement');

  React.useEffect(() => {
    if (!isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: document.getElementById('terms-content-scroll-container'),
        rootMargin: '-20px 0px -60% 0px',
        threshold: 0
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isOpen]);

  const handleAccept = () => {
    acceptPolicy('TERMS_OF_SERVICE');
    showToast('Terms of Service accepted!', 'success');
    onClose();
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get acceptance data if policy is accepted
  const acceptanceData = getPolicyAcceptanceData('TERMS_OF_SERVICE');
  const isAccepted = isPolicyAccepted('TERMS_OF_SERVICE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div id="terms-of-service-modal" className={`relative w-full sm:max-w-5xl h-[85vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ${theme === 'dark'
        ? 'bg-slate-955 bg-slate-950 border-slate-800 text-slate-300 shadow-slate-950/80'
        : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
        }`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-all duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'
          }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
              <FaFileContract className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none flex items-center gap-2">
                Terms of Service
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                {isAccepted && acceptanceData && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-semibold">
                    <FaCheckCircle className="w-3.5 h-3.5" />
                    Accepted on {new Date(acceptanceData.acceptedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })} • Version {acceptanceData.version}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'hover:bg-slate-900 text-slate-400 hover:text-slate-205 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sticky Left Sidebar Navigation */}
          <div className={`hidden md:flex w-60 shrink-0 border-r flex-col p-4 overflow-y-auto space-y-1 ${theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
            }`}>
            <span className="text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-3 mb-2 block">
              Document Index
            </span>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeSection === sec.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold border-l-2 border-indigo-600 dark:border-indigo-500 pl-2.5'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/55 dark:hover:bg-slate-900/60'
                  }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Right Scrollable Panel */}
          <div
            id="terms-content-scroll-container"
            className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 scroll-smooth"
          >
            {/* Agreement */}
            <section id="agreement" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Agreement to Terms
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                By accessing and using TeamLabs, you accept and agree to be bound by the terms and provision of this agreement.
                These Terms of Service govern your use of our AI-powered project management platform and all related services.
              </p>
            </section>

            {/* Service Description */}
            <section id="service-desc" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  2. Service Description
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                TeamLabs provides a comprehensive project management platform that includes:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pl-4 border-l border-slate-100 dark:border-slate-800">
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    Project and task management tools
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    Team collaboration features
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    AI-powered assistant and analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    Real-time messaging and notifications
                  </li>
                </ul>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    File sharing and document management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    Kanban boards and workflow automation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    Third-party integrations (GitHub, Google)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                    Subscription and billing management
                  </li>
                </ul>
              </div>
            </section>

            {/* User Responsibilities */}
            <section id="user-resp" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  3. User Responsibilities
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Users are expected to manage their access responsibly and maintain compliance with standard security principles.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Account Security
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Maintain accurate account information
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Keep login credentials secure
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Enable two-factor authentication
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Report suspicious activity immediately
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Update contact information promptly
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Acceptable Use
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Use service for legitimate business purposes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Respect intellectual property rights
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Comply with applicable laws and regulations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Maintain professional conduct
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Report violations promptly
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Prohibited Activities
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Unauthorized access to accounts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Malicious software or hacking attempts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Spam or unsolicited communications
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Harassment or inappropriate content
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Reverse engineering or data scraping
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Legal Compliance
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Follow data protection regulations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Respect privacy rights of others
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Comply with export control laws
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Adhere to industry standards
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Maintain audit trails when required
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Subscription Terms */}
            <section id="sub-terms" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  4. Subscription Terms
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Billing & Payments
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Subscriptions are billed in advance
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Payment processing via Stripe
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Automatic renewal unless cancelled
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Prorated refunds for annual plans
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Cancellation & Refunds
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Cancel anytime from account settings
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      30-day money-back guarantee
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      No refunds for partial months
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Downgrade options available
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section id="intellectual-property" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  5. Intellectual Property
                </h2>
              </div>
              <div className="space-y-4 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    TeamLabs Ownership
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    All rights, title, and interest in and to TeamLabs, including all intellectual property rights,
                    are and will remain the exclusive property of TeamLabs and its licensors.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    User Content
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    You retain ownership of content you create, upload, or share through our platform. By using our service,
                    you grant us a limited license to use, store, and process your content solely to provide our services.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Third-Party Content
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Our platform may include third-party content, services, or integrations. Such content is subject to
                    the respective third-party terms and conditions.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section id="liability" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  6. Limitation of Liability
                </h2>
              </div>
              <div className="space-y-2 pl-4 text-xs text-slate-600 dark:text-slate-400 border-l border-slate-100 dark:border-slate-800">
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Service Availability:</strong> We strive to maintain high service availability but cannot guarantee
                  uninterrupted access. We are not liable for temporary service disruptions.
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Data Loss:</strong> While we implement robust backup systems, users are responsible for maintaining
                  their own data backups. We are not liable for data loss.
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Third-Party Services:</strong> We are not responsible for the availability, content, or security
                  of third-party services integrated with our platform.
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Maximum Liability:</strong> Our total liability shall not exceed the amount paid by you for the
                  service in the 12 months preceding the claim.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section id="contact-info" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  7. Contact Information
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1 border-l border-slate-100 dark:border-slate-800">
                <p>Email: <span className="font-semibold text-slate-800 dark:text-slate-200">support@team-labs.app</span></p>
                <p>Phone: <span className="font-semibold text-slate-800 dark:text-slate-200">+1 (559) 388-6490</span></p>
              </div>
            </section>

            {/* Updates */}
            <section id="terms-updates" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  8. Terms Updates
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                We may update these Terms of Service from time to time. We will notify users of material changes via email
                or through our platform. Your continued use of our service after any modifications constitutes acceptance
                of the updated terms.
              </p>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4 border-t transition-all duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'
          }`}>
          <div className="text-xs font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
            TeamLabs Terms of Service • Version 1.0
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold transition-all border text-xs ${theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              Close
            </button>
            <button
              onClick={isAccepted ? undefined : handleAccept}
              disabled={isAccepted}
              className={`w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${isAccepted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20'
                }`}
            >
              {isAccepted ? '✓ Accepted' : 'I Agree'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TermsOfServiceModal;
