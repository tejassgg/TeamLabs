import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { useTheme } from '../context/ThemeContext';
import { landingService } from '../services/api';
import { FaMoon, FaSun, FaRocket, FaChartLine, FaUsers, FaShieldAlt, FaRobot, FaCheckCircle, FaArrowRight, FaPlay, FaStar, FaGithub, FaGoogle, FaSignOutAlt, FaChevronRight, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';

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
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for small teams',
    features: [
      '3 Projects',
      '3 User Stories',
      '20 Tasks per Story',
      'Basic Support',
    ],
    highlight: false,
    badge: 'Current Plan',
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Premium Monthly',
    price: '$99',
    period: '/month',
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
    badge: 'Popular',
    cta: 'Upgrade',
    disabled: false,
  },
  {
    name: 'Premium Annual',
    price: '$59',
    period: '/month',
    annualTotal: '$708',
    save: 'Save $480/year',
    description: 'Save 40% with annual billing',
    features: [
      'Unlimited Projects',
      'Unlimited User Stories',
      'Unlimited Tasks',
      'Advanced Analytics',
      'Priority Support',
      'All Members Premium',
      '40% Annual Discount',
    ],
    highlight: true,
    badge: 'Best Value',
    cta: 'Upgrade',
    disabled: false,
  },
];

// Add a custom hook for reveal animation
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onScroll = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        node.classList.add('reveal-visible');
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return ref;
}

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
    window.location.reload();
  };

  const openLogin = () => {
    setModalType('login');
    setModalOpen(true);
  };
  
  const openRegister = () => {
    setModalType('register');
    setModalOpen(true);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Head>
        <title>TeamLabs | AI-Powered Project Management Platform</title>
        <meta name="description" content="Transform your team's productivity with AI-powered project management, real-time collaboration, and advanced analytics." />
        <meta name="keywords" content="project management, team collaboration, kanban board, AI assistant, analytics dashboard" />
      </Head>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${resolvedTheme === 'dark' ? 'bg-gray-900/95 backdrop-blur-sm border-b border-gray-800' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'}`}>
        <div className="sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 w-full">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
                TeamLabs
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Features</a>
              <a href="#testimonials" className={`text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Reviews</a>
              <a href="#pricing" className={`text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Pricing</a>
            </div>

            {/* Right-aligned buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-yellow-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
                title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
              
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className={`px-4 py-2 text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className={`px-4 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                    <FaSignOutAlt className="text-sm" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={openLogin} className={`px-4 py-2 text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>
                    Sign In
                  </button>
                  <button onClick={openRegister} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
                    Get Started
                  </button>
                </>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-4">
                <a href="#features" className={`text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Features</a>
                <a href="#pricing" className={`text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Pricing</a>
                <a href="#testimonials" className={`text-sm font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Reviews</a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background */}
        <div className={`absolute inset-0 ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob ${resolvedTheme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 ${resolvedTheme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
          <div className={`absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${resolvedTheme === 'dark' ? 'bg-pink-600' : 'bg-pink-400'}`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 ${resolvedTheme === 'dark' ? 'bg-blue-900/50 text-blue-200 border border-blue-700' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
              <FaRocket className="mr-2" />
              Trusted by {stats[0].number}+ teams worldwide
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <span className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}>
                Project Management
              </span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Transform your team's productivity with intelligent task management, real-time collaboration, 
              and AI-powered insights that drive results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              {isAuthenticated ? (
                <Link href="/dashboard" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <button onClick={openRegister} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
                  Start Free Trial
                </button>
              )}
              <button className={`px-8 py-4 border-2 rounded-xl font-semibold text-lg transition-all flex items-center ${resolvedTheme === 'dark' ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                <FaPlay className="mr-2" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold mb-2 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {stat.number}{stat.label == "Projects Completed" ? "+" : stat.label == "Active Teams" ? "+" : ""}
                  </div>
                  <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-24 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Everything you need to succeed
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Powerful features designed to streamline your workflow and boost team productivity
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const colorClasses = {
                blue: resolvedTheme === 'dark' ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-600',
                purple: resolvedTheme === 'dark' ? 'bg-purple-900 text-purple-400' : 'bg-purple-100 text-purple-600',
                green: resolvedTheme === 'dark' ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600',
                red: resolvedTheme === 'dark' ? 'bg-red-900 text-red-400' : 'bg-red-100 text-red-600'
              };
              
              return (
                <div key={index} className={`p-6 rounded-2xl transition-all hover:transform hover:scale-105 ${resolvedTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[feature.color]}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className={`py-24 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Smart Analytics Dashboard
              </h2>
              <p className={`text-xl mb-8 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Get real-time insights into your team's performance with AI-powered analytics and beautiful visualizations
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <FaCheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Real-time metrics and live updates</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <FaCheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Team performance insights</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <FaCheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Customizable widgets and charts</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="/static/dashboard.jpg" 
                  alt="Analytics Dashboard" 
                  className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${resolvedTheme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                />
              </div>
              <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-400 to-purple-400'}`}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Kanban Board Section */}
      <section className={`py-24 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="relative z-10">
                <img 
                  src="/static/kanbanboard.jpg" 
                  alt="Kanban Board" 
                  className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${resolvedTheme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                />
              </div>
              <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-green-600 to-blue-600' : 'bg-gradient-to-r from-green-400 to-blue-400'}`}></div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Kanban Board & Task Management
              </h2>
              <p className={`text-xl mb-8 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Intuitive drag-and-drop interface with AI-powered task classification and smart automation
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Drag-and-drop task management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>AI-powered task classification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Smart workflow automation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Bulk operations support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`py-24 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Loved by Teams Worldwide
            </h2>
            <p className={`text-xl ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              See what our customers have to say about TeamLabs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`rounded-2xl p-8 shadow-lg transition-all hover:transform hover:scale-105 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-6 italic text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</div>
                    <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
      <section id="pricing" className={`py-24 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Simple, Transparent Pricing
            </h2>
            <p className={`text-xl ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Choose the plan that's right for your team
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => {
              const revealRef = useReveal();
              return (
                <div ref={revealRef} key={index} className={`reveal relative rounded-2xl p-8 shadow-lg transition duration-500 ease-in-out transform hover:scale-105 hover:shadow-2xl ${plan.highlight ? 'ring-2 ring-blue-500' : ''} ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                    <div className="mb-2">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-4xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                        <span className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{plan.period}</span>
                      </div>
                      {plan.annualTotal && (
                        <div className={`text-sm mt-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {plan.annualTotal} billed annually
                        </div>
                      )}
                    </div>
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <FaCheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={plan.name === 'Free' ? openRegister : openRegister}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.highlight 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                        : resolvedTheme === 'dark' 
                          ? 'bg-gray-700 text-white hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using TeamLabs to boost their productivity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all">
                Go to Dashboard
              </Link>
            ) : (
              <button onClick={openRegister} className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all">
                Start Free Trial
              </button>
            )}
            <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TeamLabs
              </span>
              <p className={`mt-4 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                AI-powered project management platform for modern teams.
              </p>
            </div>
            
            <div>
              <h3 className={`font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Product</h3>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Features</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Pricing</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Integrations</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className={`font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Company</h3>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>About</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Blog</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Careers</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className={`font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Support</h3>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Help Center</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Documentation</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Status</a></li>
                <li><a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center ${resolvedTheme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}>
            <p className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              &copy; {new Date().getFullYear()} TeamLabs. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                <FaGithub className="w-5 h-5" />
              </a>
              <a href="#" className={`transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                <FaGoogle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {modalType === 'login' ? (
          <>
            <LoginForm onSuccess={() => setModalOpen(false)} />            
          </>
        ) : (
          <>
            <RegisterForm onSuccess={() => setModalOpen(false)} />
            <div className="text-center mt-4">
              <span className="text-gray-600 dark:text-gray-300">Already have an account? </span>
              <button className="text-blue-700 dark:text-blue-400 font-bold hover:underline" onClick={() => setModalType('login')}>Login</button>
            </div>
          </>
        )}
      </Modal>

      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        .reveal-visible {
          opacity: 1;
          transform: none;
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
} 