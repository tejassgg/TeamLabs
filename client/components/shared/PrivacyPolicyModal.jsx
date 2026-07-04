import React from 'react';
import { FaTimes, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { acceptPolicy, isPolicyAccepted, getPolicyAcceptanceData } from '../../utils/policyAcceptance';

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'info-collected', label: 'Information We Collect' },
  { id: 'how-used', label: 'How We Use Information' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'your-rights', label: 'Your Rights & Choices' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'contact-us', label: 'Contact Us' },
  { id: 'policy-updates', label: 'Policy Updates' }
];

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = React.useState('introduction');

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
        root: document.getElementById('policy-content-scroll-container'),
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
    acceptPolicy('PRIVACY_POLICY');
    showToast('Privacy Policy accepted!', 'success');
    onClose();
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get acceptance data if policy is accepted
  const acceptanceData = getPolicyAcceptanceData('PRIVACY_POLICY');
  const isAccepted = isPolicyAccepted('PRIVACY_POLICY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div id="privacy-policy-modal" className={`relative w-full sm:max-w-5xl h-[85vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ${theme === 'dark'
        ? 'bg-slate-955 bg-slate-950 border-slate-800 text-slate-300 shadow-slate-950/80'
        : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
        }`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-all duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'
          }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
              <FaShieldAlt className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none flex items-center gap-2">
                Privacy Policy
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
              ? 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
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
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-3 mb-2 block">
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
            id="policy-content-scroll-container"
            className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 scroll-smooth"
          >
            {/* Introduction */}
            <section id="introduction" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  1. Introduction
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-400">
                At TeamLabs, we are committed to protecting your privacy and ensuring the security of your personal information.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
                AI-powered project management platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section id="info-collected" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  2. Information We Collect
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-400">
                We collect various types of information to provide a feature-rich, collaborative, and secure experience for our teams.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Personal Information
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Name (first, last, and middle name)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Email address
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Phone number and extension
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Profile image
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Address information
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Username and password (encrypted)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Account & Usage Data
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Organization membership and role
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Team memberships and assignments
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Task creation and completion data
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      User activity logs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Login history and sessions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Two-factor authentication settings
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Payment Information
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Subscription plan details
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Payment method (via Stripe)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Billing history
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Usage limits and access
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Technical & Integration Data
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      IP address and device info
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Browser and OS details
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Usage patterns
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Google OAuth data
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      GitHub integration data
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Error logs and analytics
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section id="how-used" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  3. How We Use Information
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Service Provision
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Account creation and management
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Project and task organization
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Team collaboration features
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      AI assistant functionality
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Analytics and reporting
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Communication
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Account notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Security alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Feature updates
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Support communications
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Marketing (with consent)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Security & Compliance
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Authentication and authorization
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Fraud prevention
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Legal compliance
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      System security monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Data backup and recovery
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Service Improvement
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Service optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Feature development
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      User experience enhancement
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Performance monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Bug fixes and updates
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section id="data-security" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  4. Data Security
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-400">
                We implement industry-standard administrative, physical, and technical safeguards designed to protect the confidentiality, integrity, and availability of your data:
              </p>

              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Technical Safeguards
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      SSL/TLS encryption for data transmission
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Password hashing with bcrypt
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      JWT token-based authentication
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Two-factor authentication support
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Administrative Safeguards
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Role-based access control
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Regular security audits
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Employee training on data protection
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Incident response procedures
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section id="third-party" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  5. Third-Party Services
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-400">
                To run our platform efficiently, we securely integrate with verified third-party partners:
              </p>
              <div className="space-y-3.5 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Google OAuth
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    We use Google OAuth for secure, federated authentication. Google handles your credentials in compliance with their own privacy policy.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Stripe Payment Processing
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Payment workflows are completed strictly via Stripe. We do not inspect or store credit card numbers on our infrastructure.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    GitHub Integration
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Optional repository links process check-ins and logs. Actions adhere to GitHub’s platform standards.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section id="your-rights" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  6. Your Rights & Choices
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-400">
                You retain complete transparency and choices regarding your personal details:
              </p>
              <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Access and Control
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      View and update your profile settings
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Export or download account details
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Delete your account and associations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Manage privacy settings directly
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Communication Preferences
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Opt-out of marketing emails anytime
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Toggle system notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Restrict tracking parameters
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shrink-0"></span>
                      Update support contact defaults
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section id="data-retention" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  7. Data Retention
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-655 dark:text-slate-400">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations.
                Account data is typically retained for the duration of your subscription plus 30 days. Activity logs may be retained
                for up to 2 years for security and compliance purposes. You may request data deletion at any time.
              </p>
            </section>

            {/* Contact Us */}
            <section id="contact-us" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  8. Contact Us
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-655 dark:text-slate-400">
                If you have questions about this Privacy Policy or our data practices, please reach out directly:
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
                  9. Policy Updates
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-655 dark:text-slate-400">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
                the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our service
                after any modifications constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4 border-t transition-all duration-300 ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'
          }`}>
          <div className="text-[10px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
            TeamLabs Privacy Policy • Version 1.0
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
              {isAccepted ? '✓ Accepted' : 'I Understand'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
