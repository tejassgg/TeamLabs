import React from 'react';
import { FaTimes, FaCookieBite, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { acceptPolicy, isPolicyAccepted, getPolicyAcceptanceData } from '../../utils/policyAcceptance';

const sections = [
  { id: 'what-are-cookies', label: 'What Are Cookies?' },
  { id: 'types-cookies', label: 'Types of Cookies' },
  { id: 'third-party-cookies', label: 'Third-Party Cookies' },
  { id: 'manage-cookies', label: 'Managing Preferences' },
  { id: 'retention-cookies', label: 'Cookie Retention' },
  { id: 'contact-info', label: 'Contact Information' },
  { id: 'policy-updates', label: 'Policy Updates' }
];

const CookiePolicyModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = React.useState('what-are-cookies');

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
        root: document.getElementById('cookie-content-scroll-container'),
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
    acceptPolicy('COOKIE_POLICY');
    showToast('Cookie Policy accepted!', 'success');
    onClose();
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get acceptance data if policy is accepted
  const acceptanceData = getPolicyAcceptanceData('COOKIE_POLICY');
  const isAccepted = isPolicyAccepted('COOKIE_POLICY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div id="cookie-policy-modal" className={`relative w-full sm:max-w-5xl h-[85vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 bg-white border-slate-200 text-slate-700 shadow-slate-200/50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:shadow-slate-950/80`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-all duration-300 border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
              <FaCookieBite className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none flex items-center gap-2">
                Cookie Policy
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
            className={`p-2 rounded-lg transition-colors hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200`}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sticky Left Sidebar Navigation */}
          <div className={`hidden md:flex w-60 shrink-0 border-r flex-col p-4 overflow-y-auto space-y-1 border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40`}>
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
            id="cookie-content-scroll-container"
            className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 scroll-smooth"
          >
            {/* What Are Cookies */}
            <section id="what-are-cookies" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  1. What Are Cookies?
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Cookies are small text files that are stored on your device when you visit our website.
                They help us provide you with a better experience by remembering your preferences,
                analyzing site usage, and enabling essential functionality.
              </p>
            </section>

            {/* Types of Cookies */}
            <section id="types-cookies" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  2. Types of Cookies We Use
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Essential Cookies
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    These cookies are necessary for the website to function properly and cannot be disabled.
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Authentication and login sessions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Security and fraud prevention
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Load balancing and performance
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      User preferences and settings
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Shopping cart and checkout process
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Analytics Cookies
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    These cookies help us understand how visitors interact with our website.
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Page views and user behavior
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Performance monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Error tracking and debugging
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Feature usage statistics
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      A/B testing and optimization
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Functional Cookies
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    These cookies enable enhanced functionality and personalization.
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Theme preferences (dark/light mode)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Language and region settings
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Dashboard layout preferences
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Notification preferences
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Accessibility settings
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Marketing Cookies
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    These cookies deliver relevant advertisements and track campaign effectiveness.
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Ad targeting and personalization
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Social media integration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Conversion tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Retargeting campaigns
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Cross-site tracking
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section id="third-party-cookies" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  3. Third-Party Cookies
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Some cookies are managed by trusted partners to supply analytical tools and integrate integrations:
              </p>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Google Services
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Google Analytics for usage patterns
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Google OAuth for account authentication
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Google Fonts for styling delivery
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Google reCAPTCHA for spam security
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Other Services
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Stripe for securing billing transitions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      GitHub for linked developer utilities
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Socket.io for live database syncing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0"></span>
                      Cloudinary for avatar assets delivery
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cookie Management */}
            <section id="manage-cookies" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  4. Managing Cookie Preferences
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                You can review or clear your preferences through multiple workflows:
              </p>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Browser Settings
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-555/80 dark:bg-indigo-500/80 shrink-0 bg-indigo-500"></span>
                      Block all cookies globally
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Block third-party cookies strictly
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Delete cookies on closing window
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Add specific domain allowances
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    TeamLabs Preferences
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Go to Settings → Privacy & Security
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Toggle analytics tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Adjust target promotional flags
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Wipe offline database entries
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pl-4 py-2 border-l-2 border-indigo-500/20 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Important Note:</span>
                Disabling essential cookies may affect the functionality of our website and your user experience.
                Some features may not work properly without these cookies.
              </div>
            </section>

            {/* Cookie Retention */}
            <section id="retention-cookies" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  5. Cookie Retention Periods
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Session Cookies
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-500/80 shrink-0 bg-indigo-500"></span>
                      Authentication tokens: Active until logout
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Backlog filters: Retained until session terminates
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Form cache: Wiped on window reload
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      User interface metrics: Wiped on browser close
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Persistent Cookies
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Analytics profile identifiers: 2 years
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Promotional identifiers: 1 year
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Theme preference settings: 1 year
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Locale configurations: 6 months
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section id="contact-info" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  6. Contact Information
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                If you have questions about our Cookie Policy or need help managing your cookie preferences, please contact us:
              </p>
              <div className="pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1 border-l border-slate-100 dark:border-slate-800">
                <p>Email: <span className="font-semibold text-slate-800 dark:text-slate-200">support@team-labs.app</span></p>
                <p>Phone: <span className="font-semibold text-slate-800 dark:text-slate-200">+1 (559) 388-6490</span></p>
              </div>
            </section>

            {/* Updates */}
            <section id="policy-updates" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  7. Policy Updates
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational,
                legal, or regulatory reasons. We will notify users of any material changes via email or through our platform.
                Your continued use of our service after any modifications constitutes acceptance of the updated policy.
              </p>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4 border-t transition-all duration-300 border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950`}>
          <div className="text-xs font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
            TeamLabs Cookie Policy • Version 1.0
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold transition-all border text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white`}
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
              {isAccepted ? '✓ Accepted' : 'I Understand'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CookiePolicyModal;
