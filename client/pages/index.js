import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { landingService } from '../services/api';
import AuthNavbar from '../components/auth/AuthNavbar';
import { FaRocket, FaChartLine, FaUsers, FaShieldAlt, FaRobot, FaCheckCircle, FaSignInAlt, FaStar, FaGithub, FaSignOutAlt, FaCrown, FaInfinity, FaCheck } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { getAllPolicyStatus } from '../utils/policyAcceptance';
import PrivacyPolicyModal from '../components/shared/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/shared/TermsOfServiceModal';
import CookiePolicyModal from '../components/shared/CookiePolicyModal';
import ContactSupportModal from '../components/shared/ContactSupportModal';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Product Manager",
    company: "TechFlow Inc",
    content: "TeamLabs transformed our development workflow. The AI assistant alone saved us 10+ hours per week!",
    rating: 5,
    avatar: "/static/default-avatar.png"
  },
  {
    name: "Michael Chen",
    role: "Engineering Lead",
    company: "StartupXYZ",
    content: "The analytics dashboard gives us insights we never had before. Our team productivity increased by 40%.",
    rating: 5,
    avatar: "/static/default-avatar.png"
  },
  {
    name: "Emily Rodriguez",
    role: "Scrum Master",
    company: "Digital Solutions",
    content: "Best project management tool we've used. The Kanban board is intuitive and the collaboration features are amazing.",
    rating: 5,
    avatar: "/static/default-avatar.png"
  }
];

const defaultStats = [
  { number: "0", label: "Active Teams" },
  { number: "0", label: "Projects Completed" },
  { number: "99.9%", label: "Uptime" },
  { number: "24/7", label: "Support" }
];

const features = [
  {
    icon: FaChartLine,
    title: "Smart Analytics",
    description: "Get real-time insights into your team's performance with AI-powered analytics and beautiful visualizations",
    color: "blue"
  },
  {
    icon: FaUsers,
    title: "Team Collaboration",
    description: "Work together seamlessly with live activity feeds, instant messaging, and integrated communication tools",
    color: "purple"
  },
  {
    icon: FaRobot,
    title: "AI Assistant",
    description: "Intelligent task classification, automated workflows, and smart recommendations to boost productivity",
    color: "green"
  },
  {
    icon: FaShieldAlt,
    title: "Enterprise Security",
    description: "Multi-factor authentication, role-based access control, and real-time security alerts for peace of mind",
    color: "red"
  }
];

const pricing = [
  {
    id: 'free',
    name: 'Basic Account',
    price: '$0',
    priceValue: '0',
    period: '/mo',
    description: 'Perfect for small teams',
    features: [
      '3 Projects',
      '3 User Stories',
      '20 Tasks per Story',
      'Basic Support',
    ],
    highlight: false,
    badge: null,
    cta: 'Get Started Free',
    disabled: false,
    borderColor: 'border-gray-200 hover:border-gray-300',
    backgroundGradient: 'bg-gradient-to-br from-gray-50 to-white',
    titleGradient: 'from-blue-600 via-purple-600 to-blue-600',
    descriptionColor: 'text-gray-500',
    priceGradient: 'from-blue-600 to-purple-600',
    showPrice: true,
    showSavings: false,
  },
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: '$49',
    priceValue: '49',
    period: '/mo',
    description: 'For growing organizations',
    features: [
      'Unlimited Projects',
      'Unlimited User Stories',
      'Unlimited Tasks',
      'Advanced Analytics',
      'Priority Support',
      'All Members Premium',
    ],
    highlight: false,
    badge: { text: 'POPULAR', color: 'bg-blue-500 text-white' },
    cta: 'Start Premium Trial',
    disabled: false,
    borderColor: 'border-blue-200 hover:border-blue-300',
    backgroundGradient: 'bg-gradient-to-br from-blue-50 to-white',
    titleGradient: 'from-blue-600 via-purple-600 to-blue-600',
    descriptionColor: 'text-gray-500',
    priceGradient: 'from-blue-600 to-purple-600',
    showPrice: true,
    showSavings: false,
  },
  {
    id: 'annual',
    name: 'Premium Annual',
    price: '$419',
    priceValue: '419',
    period: '/mo',
    originalPrice: '$588',
    monthlyEquivalent: '34.92',
    annualTotal: '$419',
    save: 'Save $120/year',
    description: 'Save 29% with annual billing',
    features: [
      'Unlimited Projects',
      'Unlimited User Stories',
      'Unlimited Tasks',
      'Advanced Analytics',
      'Priority Support',
      'All Members Premium',
      '29% Annual Discount',
    ],
    highlight: true,
    badge: { text: 'BEST VALUE', color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' },
    cta: 'Start Premium Trial',
    disabled: false,
    borderColor: 'border-blue-200 hover:border-blue-600',
    backgroundGradient: 'bg-gradient-to-br from-purple-50 to-white',
    titleGradient: 'from-purple-600 via-pink-600 to-purple-600',
    descriptionColor: 'text-gray-500',
    priceGradient: 'from-purple-600 to-pink-600',
    showPrice: true,
    showSavings: true,
  },
];

function Home() {
  const { logout, isAuthenticated } = useGlobal();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [policyStatus, setPolicyStatus] = useState({
    privacyPolicy: false,
    termsOfService: false,
    cookiePolicy: false,
    allAccepted: false
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Check policy acceptance status on mount
  useEffect(() => {
    const status = getAllPolicyStatus();
    setPolicyStatus(status);
  }, []);

  // Subtle reveal animations on scroll - resilient across theme toggles
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          entry.target.setAttribute('data-revealed', 'true');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const attachOrRestore = () => {
      const elements = document.querySelectorAll('.reveal');
      elements.forEach((el) => {
        if (el.getAttribute('data-revealed') === 'true') {
          el.classList.add('reveal-visible');
        } else {
          observer.observe(el);
        }
      });
    };

    attachOrRestore();

    return () => {
      observer.disconnect();
    };
  }, [theme]);

  // Fetch landing page statistics
  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        setLoading(true);

        // Fetch stats only
        const statsData = await landingService.getStats();
        setStats([
          { number: statsData.activeTeams.toString(), label: "Active Teams" },
          { number: statsData.completedProjects.toString(), label: "Projects Completed" },
          { number: "99.9%", label: "Uptime" },
          { number: "24/7", label: "Support" }
        ]);
      } catch (error) {
        console.error('Error fetching landing stats:', error);
        // Keep default stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchLandingStats();
  }, []);

  const handleLogout = () => {
    logout();
    // window.location.reload();
  };

  const openLogin = () => {
    router.push('/auth?type=login');
  };

  const openRegister = () => {
    router.push('/auth');
  };

  const getFeatureIcon = (feature) => {
    if (feature.toLowerCase().includes('unlimited')) return <FaInfinity className="w-3 h-3 text-white" />;
    if (feature.toLowerCase().includes('premium')) return <FaCrown className="w-3 h-3 text-white" />;
    if (feature.toLowerCase().includes('discount')) return <FaStar className="w-3 h-3 text-white" />;
    return <FaCheck className="w-3 h-3 text-white" />;
  };

  const getPlanButtonInfo = (planId) => {
    if (planId === 'free') {
      return {
        text: 'Get Started Free',
        className: theme === 'dark'
          ? 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white shadow-lg hover:shadow-xl'
          : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white shadow-lg hover:shadow-xl',
        disabled: false
      };
    } else if (planId === 'monthly') {
      return {
        text: 'Subscribe Monthly',
        className: theme === 'dark'
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
        disabled: false
      };
    } else {
      return {
        text: 'Subscribe Annual',
        className: theme === 'dark'
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl',
        disabled: false
      };
    }
  };

  return (
    <div className={`min-h-screen w-full overflow-x-hidden  duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Head>
        <title>TeamLabs | AI-Powered Project Management Platform</title>
        <meta name="description" content="Transform your team's productivity with AI-powered project management, real-time collaboration, and advanced analytics." />
        <meta name="keywords" content="project management, team collaboration, kanban board, AI assistant, analytics dashboard" />
      </Head>

      {/* Global Animated Background (visible across entire page to footer) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: 0 }}>
        <div className={`${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'} absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob`}></div>
        <div className={`${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'} absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000`}></div>
        <div className={`${theme === 'dark' ? 'bg-pink-600' : 'bg-pink-400'} absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000`}></div>
      </div>

      {/* Content wrapper to sit above fixed background */}
      <div className="relative z-10">

        <AuthNavbar openLogin={openLogin} />

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 w-full">
          {/* Background (kept for hero gradient) */}
          <div className={`absolute inset-0 bg-transparent`}></div>
          <div className="relative px-4 sm:px-6 lg:px-8 text-center">
            <div>
              <div className={`reveal reveal-fade-up inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 ${theme === 'dark' ? 'bg-blue-900/50 text-blue-200 border border-blue-700' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                <FaRocket className="mr-2" />
                Trusted by {stats[0].number}+ teams worldwide
              </div>

              <h1 className="reveal reveal-fade-up reveal-delay-100 text-5xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  Project Management
                </span>
              </h1>

              <p className={`reveal reveal-fade-up reveal-delay-150 text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Transform your team's productivity with intelligent task management, real-time collaboration,
                and AI-powered insights that drive results. Delivered as a cloud‑hosted SaaS — no installs, automatic updates.
              </p>

              <div className="reveal reveal-fade-up reveal-delay-200 flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                {isAuthenticated ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Link href="/dashboard" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg">
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`px-6 py-3 border-2 rounded-xl font-semibold text-lg ${theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} flex items-center gap-2`}
                    >
                      <FaSignOutAlt className="text-sm" /> Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => window.location.href = '#pricing'} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg">
                      Start Free Trial
                    </button>
                    <button onClick={openLogin} className={`px-8 py-4 border-2 rounded-xl font-semibold text-lg flex items-center ${theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                      <FaSignInAlt className="mr-2" /> Login
                    </button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="reveal reveal-fade-up reveal-delay-300 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-3xl md:text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                      {stat.number}{stat.label == "Projects Completed" ? "+" : stat.label == "Active Teams" ? "+" : ""}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={`max-w-[90%] mx-auto py-24 bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal reveal-fade-up text-center mb-16 ">
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Everything you need to succeed
              </h2>
              <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Powerful features designed to streamline your workflow and boost team productivity
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                const colorClasses = {
                  blue: theme === 'dark' ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-600',
                  purple: theme === 'dark' ? 'bg-purple-900 text-purple-400' : 'bg-purple-100 text-purple-600',
                  green: theme === 'dark' ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600',
                  red: theme === 'dark' ? 'bg-red-900 text-red-400' : 'bg-red-100 text-red-600'
                };

                return (
                  <div key={index} className={`reveal reveal-fade-up ${'reveal-delay-' + (index * 100)} p-6 rounded-2xl transition-all hover:transform hover:scale-105 ${theme === 'dark' ? 'bg-gray-800/10 hover:bg-gray-700/10' : 'bg-gray-300/10 hover:bg-gray-500/10'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[feature.color]}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="reveal reveal-fade-right">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Smart Analytics <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Dashboard</span>
                </h2>
                <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Get real-time insights into your team's performance with AI-powered analytics and beautiful visualizations
                </p>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                      <FaCheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Real-time metrics and live updates</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                      <FaCheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Team performance insights</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                      <FaCheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Customizable widgets and charts</span>
                  </div>
                </div>
              </div>

              <div className="relative reveal reveal-fade-left">
                <div className="relative z-10">
                  <img
                    src="/static/dashboard.jpg"
                    alt="Analytics Dashboard"
                    className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                  />
                </div>
                <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-400 to-purple-400'}`}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Kanban Board Section */}
        <section className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1 reveal reveal-fade-right">
                <div className="relative z-10">
                  <img
                    src="/static/kanbanboard.jpg"
                    alt="Kanban Board"
                    className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                  />
                </div>
                <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${theme === 'dark' ? 'bg-gradient-to-r from-green-600 to-blue-600' : 'bg-gradient-to-r from-green-400 to-blue-400'}`}></div>
              </div>

              <div className="order-1 lg:order-2 reveal reveal-fade-left">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Kanban Board & Task</span> Management
                </h2>
                <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Intuitive drag-and-drop interface with AI-powered task classification and smart automation
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Drag-and-drop task management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>AI-powered task classification</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Smart workflow automation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Bulk operations support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Messages & Communication Section */}
        <section className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="reveal reveal-fade-right reveal-delay-100 ">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Real-Time <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Messaging & Collaboration</span>
                </h2>
                <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Seamless team communication with group chats, direct messages, and file sharing capabilities
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Group and direct messaging</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>File and media sharing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Real-time notifications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Search conversations</span>
                  </div>
                </div>
              </div>

              <div className="relative reveal reveal-fade-left reveal-delay-200  ">
                <div className="relative z-10">
                  <img
                    src="/static/messages.jpg"
                    alt="Team Messaging Interface"
                    className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                  />
                </div>
                <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Query Board & Task Management Section */}
        <section className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1 reveal reveal-fade-right reveal-delay-100  ">
                <div className="relative z-10">
                  <img
                    src="/static/queryboard.jpg"
                    alt="Query Board Interface"
                    className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                  />
                </div>
                <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${theme === 'dark' ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-orange-400 to-red-400'}`}></div>
              </div>

              <div className="order-1 lg:order-2 reveal reveal-fade-left reveal-delay-200  ">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Advanced <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Task Query</span> & Management
                </h2>
                <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Powerful search, filtering, and bulk operations for efficient task management and team coordination
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Advanced search and filtering</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Bulk task operations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Export and reporting</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Team assignment tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Task Details Section */}
        <section className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="reveal reveal-fade-right reveal-delay-100 ">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Comprehensive <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Task Management</span>
                </h2>
                <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Detailed task views with attachments, comments, subtasks, and real-time collaboration features
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Rich task details and descriptions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>File attachments and comments</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Subtasks and dependencies</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Progress tracking and time logs</span>
                  </div>
                </div>
              </div>

              <div className="relative reveal reveal-fade-left reveal-delay-200  ">
                <div className="relative z-10">
                  <img
                    src="/static/taskdetails.jpg"
                    alt="Task Details Interface"
                    className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                  />
                </div>
                <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-gradient-to-r from-indigo-400 to-blue-400'}`}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Details Section */}
        <section className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1 reveal reveal-fade-right reveal-delay-100  ">
                <div className="relative z-10">
                  <img
                    src="/static/teamdetails.jpg"
                    alt="Team Management Interface"
                    className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                  />
                </div>
                <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${theme === 'dark' ? 'bg-gradient-to-r from-teal-600 to-green-600' : 'bg-gradient-to-r from-teal-400 to-green-400'}`}></div>
              </div>

              <div className="order-1 lg:order-2 reveal reveal-fade-left reveal-delay-200  ">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Team Management &<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"> Collaboration</span>
                </h2>
                <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Comprehensive team management with member roles, permissions, and project assignments
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Team member management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role-based permissions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Project assignments</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Performance analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Details Section */}
        <section className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="reveal reveal-fade-right reveal-delay-100 ">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Project Overview </span>
                  & Management
                </h2>
                <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Complete project lifecycle management with teams, user stories, tasks, and progress tracking
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Project planning and setup</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Team and resource allocation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>User story management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Progress monitoring and reporting</span>
                  </div>
                </div>
              </div>

              <div className="relative reveal reveal-fade-left reveal-delay-200  ">
                <div className="relative z-10">
                  <img
                    src="/static/projectdetails.jpg"
                    alt="Project Management Interface"
                    className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                  />
                </div>
                <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-cyan-400 to-blue-400'}`}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-transparent`}>
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal reveal-fade-up text-center mb-16 ">
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Loved by Teams Worldwide
              </h2>
              <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                See what our customers have to say about TeamLabs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className={`reveal reveal-fade-up ${'reveal-delay-' + (index * 150)} rounded-2xl p-8 shadow-lg ${theme === 'dark' ? 'bg-gray-800/10 hover:bg-gray-700/10' : 'bg-gray-300/10 hover:bg-gray-500/10'}`}>
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="w-5 h-5 text-yellow-400" />
                    ))}
                  </div>
                  <p className={`mb-6 italic text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className={`max-w-[90%] mx-auto py-24 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}   bg-transparent`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal reveal-fade-up text-center mb-16 ">
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Simple, Transparent Pricing
              </h2>
              <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Choose the plan that's right for your team
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricing.map((plan, index) => {
                const containerBg = 'bg-transparent';
                const containerBorder = theme === 'dark'
                  ? (plan.id === 'monthly' ? 'border-blue-500/50 hover:border-blue-400' : 'border-gray-700 hover:border-gray-600')
                  : plan.borderColor;

                return (
                  <div key={index} className={`reveal reveal-fade-up ${'reveal-delay-' + (index * 150)} group relative p-8 rounded-2xl border-2 transition-all duration-500 ${plan.id === 'monthly' ? 'scale-105' : ''} hover:scale-105 hover:shadow-2xl ${containerBg} ${containerBorder} ${theme === 'dark' ? '' : 'shadow-lg hover:shadow-xl'}`}>
                    {plan.badge && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-xs font-bold ${plan.badge.color} shadow-lg`}>
                          {plan.badge.text}
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex flex-col items-center mb-4">
                        <h3 className={`mb-1 text-3xl font-bold bg-gradient-to-r ${plan.titleGradient} bg-clip-text text-transparent`}>
                          {plan.name}
                        </h3>
                        <p className={`text-md ${theme === 'dark' ? 'text-gray-400' : plan.descriptionColor}`}>{plan.description}</p>
                      </div>

                      <div className="text-center mb-6">
                        {plan.showPrice && (
                          <>
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {plan.showSavings && (
                                <div className="line-through">
                                  <span className={`text-md font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                    {plan.originalPrice}
                                  </span>
                                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                                </div>
                              )}
                              <span className={`text-5xl font-bold bg-gradient-to-r ${plan.priceGradient} bg-clip-text text-transparent`}>
                                ${plan.priceValue}
                              </span>
                              <span className={`text-md mt-6 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                {plan.period}
                              </span>
                            </div>
                            {plan.showSavings && (
                              <div className="flex items-center justify-center gap-2">
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`text-md font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                    ${plan.monthlyEquivalent}
                                  </span>
                                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                                </div>
                                <div className="absolute -top-12 -right-1 transform translate-x-1/4">
                                  <div className={`px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg`}>
                                    Save 29%
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className={`w-16 h-0.5 mx-auto rounded-full bg-gradient-to-r ${plan.priceGradient} ${plan.showSavings ? 'mt-2' : ''}`}></div>
                          </>
                        )}
                      </div>

                      <div className="flex-grow">
                        <ul className="space-y-4 mb-4">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${plan.id === 'free'
                                ? theme === 'dark' ? 'bg-green-600/20' : 'bg-green-400'
                                : feature.toLowerCase().includes('discount')
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : plan.id === 'monthly'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                                }`}>
                                {getFeatureIcon(feature)}
                              </div>
                              <span className={`text-md ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        disabled={getPlanButtonInfo(plan.id).disabled}
                        onClick={openRegister}
                        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${getPlanButtonInfo(plan.id).className}`}
                      >
                        {getPlanButtonInfo(plan.id).text}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-24 bg-gradient-to-r from-blue-600 to-purple-600`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="reveal reveal-fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Team?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of teams already using TeamLabs to boost their productivity
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Link href="/dashboard" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 ">
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-6 py-3 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600  flex items-center gap-2"
                    >
                      <FaSignOutAlt className="text-sm" /> Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => window.location.href = '#pricing'} className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 ">
                      Start Free Trial
                    </button>
                    <button onClick={openLogin} className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 ">
                      Login
                    </button>
                  </>
                )}
                {/* <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 ">
                Schedule Demo
              </button> */}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`relative w-[90%] mx-auto overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="relative w-full mx-auto p-4 sm:px-3 lg:px-4 ">
            {/* Main Footer Content */}
            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12 ">
              {/* Brand Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
                    <FaRocket className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    TeamLabs
                  </span>
                </div>
                <p className={`text-lg mb-6 max-w-lg leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Transform your team's productivity with AI-powered project management, real-time collaboration, and intelligent insights.
                </p>

                {/* Social Links */}
                <div className="flex space-x-4">
                  <a href="https://github.com/tejassgg" target="_blank" className={`w-10 h-10 rounded-lg flex items-center justify-center  duration-200 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}>
                    <FaGithub className="w-5 h-5" />
                  </a>
                  <a href="#" className={`w-10 h-10 rounded-lg flex items-center justify-center  duration-200 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}>
                    <FcGoogle className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div className='lg:col-span-2 flex justify-evenly gap-4'>
                {/* Product Links */}
                <div>
                  <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Product</h3>
                  <ul className={`space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li>
                      <a href="#features" className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                        Features
                      </a>
                    </li>
                    <li>
                      <a href="#pricing" className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a href="#" className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                        Integrations
                      </a>
                    </li>
                    <li>
                      <a href="#" className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                        API Documentation
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Support Links */}
                <div>
                  <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Support</h3>
                  <ul className={`space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li>
                      <a href="#" className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a href="#" className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a href="#" className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                        Security & Privacy
                      </a>
                    </li>
                    <li>
                      <button
                        onClick={() => setShowContactSupport(true)}
                        className={` hover:text-blue-600 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
                      >
                        Contact Support
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Newsletter Signup
          <div className={`mt-16 p-8 rounded-2xl ${theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
            <div className="text-center max-w-2xl mx-auto">
              <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Stay Updated
              </h3>
              <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Get the latest updates, tips, and insights delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className={`flex-1 px-4 py-3 rounded-lg border  ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'}`}
                />
                <button className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700  duration-200 transform `}>
                  Subscribe
                </button>
              </div>
            </div>
          </div> */}

            {/* Bottom Bar */}
            <div className={`border-t mt-4 pt-4 flex flex-col lg:flex-row justify-between items-center ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                &copy; {new Date().getFullYear()} TeamLabs. All rights reserved. Built with ❤️ for modern teams.
              </p>
              <div className="flex items-center space-x-6 mt-4 lg:mt-0">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Privacy Policy
                  {policyStatus.privacyPolicy && <FaCheck className="text-green-500" size={12} />}
                </button>
                <button
                  onClick={() => setShowTermsOfService(true)}
                  className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Terms of Service
                  {policyStatus.termsOfService && <FaCheck className="text-green-500" size={12} />}
                </button>
                <button
                  onClick={() => setShowCookiePolicy(true)}
                  className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Cookie Policy
                  {policyStatus.cookiePolicy && <FaCheck className="text-green-500" size={12} />}
                </button>
              </div>
            </div>
          </div>
        </footer>

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal
          isOpen={showPrivacyPolicy}
          onClose={() => {
            setShowPrivacyPolicy(false);
            // Refresh policy status after modal closes
            const status = getAllPolicyStatus();
            setPolicyStatus(status);
          }}
        />

        {/* Terms of Service Modal */}
        <TermsOfServiceModal
          isOpen={showTermsOfService}
          onClose={() => {
            setShowTermsOfService(false);
            // Refresh policy status after modal closes
            const status = getAllPolicyStatus();
            setPolicyStatus(status);
          }}
        />

        {/* Cookie Policy Modal */}
        <CookiePolicyModal
          isOpen={showCookiePolicy}
          onClose={() => {
            setShowCookiePolicy(false);
            // Refresh policy status after modal closes
            const status = getAllPolicyStatus();
            setPolicyStatus(status);
          }}
        />

        {/* Contact Support Modal */}
        <ContactSupportModal
          isOpen={showContactSupport}
          onClose={() => setShowContactSupport(false)}
        />

        {/* End content wrapper */}
      </div>

      <style jsx global>{`
      html, body { overflow-x: hidden; }
      .reveal { opacity: 0; transform: translateY(25px); transition: opacity 600ms ease, transform 600ms ease; will-change: opacity, transform; }
      .reveal-fade-up { transform: translateY(25px); }
      .reveal-fade-left { transform: translateX(-25px); }
      .reveal-fade-right { transform: translateX(25px); }
      .reveal-fade-in { transform: scale(0.98); }
      .reveal-visible { opacity: 1; transform: none; }
      .reveal-delay-100 { transition-delay: 0.1s; }
      .reveal-delay-150 { transition-delay: 0.15s; }
      .reveal-delay-200 { transition-delay: 0.2s; }
      .reveal-delay-300 { transition-delay: 0.3s; }
      .reveal-delay-400 { transition-delay: 0.4s; }
      @keyframes blob {
        0% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(0, 50vh) scale(1.05); }
        50% { transform: translate(10vw, 25vh) scale(0.95); }
        75% { transform: translate(-10vw, 60vh) scale(1.08); }
        100% { transform: translate(0, 0) scale(1); }
      }
      .animate-blob { animation: blob 18s ease-in-out infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }
      @media (max-width: 640px) {
        .reveal-fade-left, .reveal-fade-right { transform: translateY(25px); }
      }
      @media (prefers-reduced-motion: reduce) {
        .reveal, .reveal * { transition: none !important; transform: none !important; }
      }
    `}</style>

    </div>
  );
}

Home.displayName = 'Home';

export default Home;