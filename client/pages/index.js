import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { useTheme } from '../context/ThemeContext';
import { landingService } from '../services/api';
import { FaMoon, FaSun, FaRocket, FaChartLine, FaUsers, FaShieldAlt, FaRobot, FaCheckCircle, FaArrowRight, FaPlay, FaStar, FaGithub, FaGoogle, FaSignOutAlt } from 'react-icons/fa';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Product Manager",
    company: "TechFlow Inc",
    content: "TeamLabs transformed our development workflow. The AI assistant alone saved us 10+ hours per week!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Engineering Lead",
    company: "StartupXYZ",
    content: "The analytics dashboard gives us insights we never had before. Our team productivity increased by 40%.",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Scrum Master",
    company: "Digital Solutions",
    content: "Best project management tool we've used. The Kanban board is intuitive and the collaboration features are amazing.",
    rating: 5
  }
];

const defaultStats = [
  { number: "0", label: "Active Teams" },
  { number: "0", label: "Projects Completed" },
  { number: "99.9%", label: "Uptime" },
  { number: "24/7", label: "Support" }
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
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 w-full">
            {/* Logo - far left, bigger */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
                TeamLabs
              </span>
            </div>

            {/* Centered navigation links */}
            <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
              <a href="#features" className={`transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Features</a>
              <a href="#pricing" className={`transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Pricing</a>
              <a href="#testimonials" className={`transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>Reviews</a>
            </div>

            {/* Right-aligned theme mode, dashboard, and auth buttons */}
            <div className="flex items-center space-x-4 justify-end">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-yellow-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
                title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className={`px-4 py-2 font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${resolvedTheme === 'dark' ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                    <FaSignOutAlt className="text-lg" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={openLogin} className={`px-4 py-2 font-medium transition-colors ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>
                    Sign In
                  </button>
                  <button onClick={openRegister} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Width */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className={`absolute inset-0 ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob ${resolvedTheme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 ${resolvedTheme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
          <div className={`absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${resolvedTheme === 'dark' ? 'bg-pink-600' : 'bg-pink-400'}`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 ${resolvedTheme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
              <FaRocket className="mr-2" />
              Trusted by {stats[0].number}+ teams worldwide
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <span className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}>
                Project Management
              </span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Transform your team's productivity with intelligent task management, real-time collaboration, 
              and AI-powered insights that drive results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
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

      {/* Smart Analytics Dashboard Section - Full Width */}
      <section className={`py-20 ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-gray-50 to-blue-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              📊 Smart Analytics Dashboard
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Get real-time insights into your team's performance with AI-powered analytics and beautiful visualizations
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <FaChartLine className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Real-Time Metrics</h3>
                  <p className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Monitor project progress, team velocity, and resource utilization with live updates and instant notifications.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                  <FaUsers className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Team Performance Insights</h3>
                  <p className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Identify bottlenecks, track individual contributions, and optimize team productivity with detailed analytics.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                  <FaCheckCircle className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Customizable Widgets</h3>
                  <p className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Build your perfect dashboard with drag-and-drop widgets, custom charts, and personalized metrics.
                  </p>
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

      {/* Kanban Board & Task Management Section - Full Width */}
      <section className={`py-20 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
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
                📋 Kanban Board & Task Management
              </h2>
              <p className={`text-xl mb-8 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Intuitive drag-and-drop interface with AI-powered task classification and smart automation
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Drag-and-drop task management with real-time updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>AI-powered task classification (Feature, Bug, Story, Doc)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Smart priority-based workflow automation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Bulk operations for efficient task management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Automated task assignment based on availability</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Details & Team Collaboration Section - Full Width */}
      <section className={`py-20 ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-purple-50 to-pink-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              🗂️ Project Details & Team Collaboration
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Complete project lifecycle management with real-time collaboration and seamless team coordination
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className={`rounded-xl p-6 shadow-lg ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-xl font-semibold mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Full Project Lifecycle</h3>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  From ideation to completion, track every aspect of your project with detailed user stories and task breakdowns.
                </p>
                <div className={`flex items-center font-medium ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  Learn more <FaArrowRight className="ml-2" />
                </div>
              </div>
              
              <div className={`rounded-xl p-6 shadow-lg ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-xl font-semibold mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Real-Time Collaboration</h3>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Work together seamlessly with live activity feeds, instant messaging, and integrated communication tools.
                </p>
                <div className={`flex items-center font-medium ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  Learn more <FaArrowRight className="ml-2" />
                </div>
              </div>
              
              <div className={`rounded-xl p-6 shadow-lg ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-xl font-semibold mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Cross-Project Management</h3>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Manage multiple projects simultaneously with resource optimization and cross-team collaboration.
                </p>
                <div className={`flex items-center font-medium ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  Learn more <FaArrowRight className="ml-2" />
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="/static/projectdetails.jpg" 
                  alt="Project Details" 
                  className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${resolvedTheme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                />
              </div>
              <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Security, AI Assistant & Flexible Plans Section - Full Width */}
      <section className={`py-20 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="/static/subscription.jpg" 
                  alt="Security & AI Features" 
                  className={`rounded-2xl shadow-2xl w-full object-cover border-4 ${resolvedTheme === 'dark' ? 'border-gray-800' : 'border-white'}`}
                />
              </div>
              <div className={`absolute -inset-4 rounded-2xl opacity-20 blur-xl ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-yellow-600 to-red-600' : 'bg-gradient-to-r from-yellow-400 to-red-400'}`}></div>
            </div>
            
            <div>
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                🔐 Security, 🤖 AI Assistant & 💳 Flexible Plans
              </h2>
              <p className={`text-xl mb-8 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Enterprise-grade security, intelligent AI assistance, and flexible pricing for teams of all sizes
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaShieldAlt className="w-5 h-5 text-green-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Multi-Factor Authentication</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaRobot className="w-5 h-5 text-blue-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>AI-Powered Assistant</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaUsers className="w-5 h-5 text-purple-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role-Based Access Control</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Real-Time Security Alerts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Dark/Light Theme Support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                    <span className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Flexible Subscription Plans</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Full Width */}
      <section id="testimonials" className={`py-20 ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
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
              <div key={index} className={`rounded-xl p-6 shadow-lg ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-4 italic ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{testimonial.content}"
                </p>
                <div>
                  <div className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</div>
                  <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Pricing Section - Full Width */}
      <section id="pricing" className={`py-20 ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
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
                      {plan.originalPrice && (
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className={`text-lg line-through ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {plan.originalPrice}
                          </span>
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full">
                            Save 30%
                          </span>
                        </div>
                      )}
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
                    onClick={plan.name === 'Starter' ? openRegister : openRegister}
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

      {/* CTA Section - Full Width */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
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
      <footer className={`py-12 ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
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
            <div className="text-center mt-4">
              <span className="text-gray-600 dark:text-gray-300">Don't have an account? </span>
              <button className="text-blue-700 dark:text-blue-400 font-bold hover:underline" onClick={() => setModalType('register')}>Sign Up</button>
            </div>
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
      `}</style>
    </div>
  );
} 