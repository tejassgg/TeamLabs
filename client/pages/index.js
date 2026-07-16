import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlobal } from '../context/GlobalContext';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { landingService } from '../services/api';
import AuthNavbar from '../components/auth/AuthNavbar';
import {
  FaRocket,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaRobot,
  FaCheckCircle,
  FaSignInAlt,
  FaStar,
  FaGithub,
  FaSignOutAlt,
  FaCrown,
  FaInfinity,
  FaCheck,
  FaPlay,
  FaHourglassHalf,
  FaPaperPlane,
  FaCompass,
  FaChevronRight,
  FaMoon,
  FaSun,
  FaLock,
  FaSyncAlt,
  FaTimesCircle,
  FaBug,
  FaWrench,
  FaFileAlt,
  FaKey,
  FaPaperclip,
  FaPlus,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaCommentAlt,
  FaCalendarAlt,
  FaCookieBite
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { getAllPolicyStatus, acceptPolicy } from '../utils/policyAcceptance';
import { useToast } from '../context/ToastContext';
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
    description: "Get real-time insights into your team's performance with AI-powered analytics and beautiful visualizations.",
    color: "blue"
  },
  {
    icon: FaUsers,
    title: "Team Collaboration",
    description: "Work together seamlessly with live activity feeds, instant messaging, and integrated communication tools.",
    color: "purple"
  },
  {
    icon: FaRobot,
    title: "AI Assistant",
    description: "Intelligent task classification, automated workflows, and smart recommendations to boost productivity.",
    color: "green"
  },
  {
    icon: FaShieldAlt,
    title: "Enterprise Security",
    description: "Multi-factor authentication, role-based access control, and real-time security alerts for peace of mind.",
    color: "red"
  }
];

function Home() {
  const { logout, isAuthenticated } = useGlobal();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [policyStatus, setPolicyStatus] = useState({
    privacyPolicy: false,
    termsOfService: false,
    cookiePolicy: false,
    allAccepted: false
  });

  // REDESIGN STATES
  const [activeTab, setActiveTab] = useState('analytics');

  // AI TERMINAL STATES
  const [selectedPrompt, setSelectedPrompt] = useState('sprint');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalStatus, setTerminalStatus] = useState('ready'); // ready, typing, executing, done
  const terminalScrollRef = useRef(null);

  // TIMESHEET DEMO STATES
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchSeconds, setPunchSeconds] = useState(0);
  const [punchLogs, setPunchLogs] = useState([]);

  // KANBAN DEMO STATES
  const [demoKanbanTasks, setDemoKanbanTasks] = useState([
    {
      id: 'task-testing',
      title: 'Remove Inactive Team Members',
      description: 'Revoke system-level database roles and API keys for offboarded collaborators.',
      type: 'Task',
      priority: 'Medium',
      dueDate: 'Due Sep 26',
      avatar: 'TG',
      avatarColor: 'bg-blue-600 text-white',
      comments: 0,
      attachments: 0,
      subtasks: [],
      column: 'assigned'
    },
    {
      id: 'task-forces',
      title: 'Optimize Team Velocity Metrics',
      description: 'Calibrate backlog distribution vectors to prevent engineer over-allocation and reduce cycle times.',
      type: 'Bug',
      priority: 'Medium',
      dueDate: 'Due Jul 09',
      avatar: 'TG',
      avatarColor: 'bg-emerald-600 text-white',
      comments: 2,
      attachments: 1,
      subtasks: [
        { id: 'sub-1', text: 'Validate new subtask auto-generation telemetry', completed: true },
        { id: 'sub-2', text: 'Verify sprint velocity metric weights and algorithms', completed: true },
        { id: 'sub-3', text: 'Review team resource capacity planning spreadsheets', completed: true },
        { id: 'sub-4', text: 'Test live backlog balance adjustment indicators', completed: false }
      ],
      column: 'in-progress'
    },
    {
      id: 'bug-1',
      title: 'Stripe Webhook Signature Failures',
      description: 'Investigate and resolve signature authorization mismatch issues on local dev environment endpoints.',
      type: 'Bug',
      priority: 'High',
      dueDate: 'Due Jul 13',
      avatar: 'KP',
      avatarColor: 'bg-indigo-600 text-white',
      comments: 5,
      attachments: 3,
      subtasks: [
        { id: 'sub-5', text: 'Verify webhook authentication payload signing secrets', completed: false }
      ],
      column: 'qa'
    },
    {
      id: 'understanding',
      title: 'Audit Auth Role Guard Middleware',
      description: 'Perform end-to-end trace route security audits on role-based client routing controls.',
      type: 'Task',
      priority: 'Low',
      dueDate: 'Due Jul 12',
      avatar: 'KP',
      avatarColor: 'bg-indigo-600 text-white',
      comments: 2,
      attachments: 0,
      subtasks: [
        { id: 'sub-6', text: 'Verify role authorization permissions across system boundaries', completed: true }
      ],
      column: 'qa'
    },
    {
      id: 'api-integration',
      title: 'Performance Tuning: API Gateway',
      description: 'Implement server-side micro-caching policies to optimize large telemetry packet transfers.',
      type: 'Improvement',
      priority: 'Medium',
      dueDate: 'Due Jul 07',
      avatar: 'TG',
      avatarColor: 'bg-blue-600 text-white',
      comments: 3,
      attachments: 2,
      subtasks: [],
      column: 'deployment'
    },
    {
      id: 'google-req',
      title: 'SSO Integration System Docs',
      description: 'Draft complete technical systems handbook outlining Google Workspace integration procedures.',
      type: 'Documentation',
      priority: 'Medium',
      dueDate: 'Due Jul 13',
      avatar: 'TG',
      avatarColor: 'bg-blue-600 text-white',
      comments: 0,
      attachments: 2,
      subtasks: [
        { id: 'sub-7', text: 'Document scope configurations and redirect URL declarations', completed: true }
      ],
      column: 'deployment'
    },
    {
      id: 'feature-2',
      title: 'Real-time Backlog Auto-refresh',
      description: 'Optimize event loops for cache invalidation when shifting project sprints on the server.',
      type: 'Feature',
      priority: 'Medium',
      dueDate: 'Due Jun 09',
      avatar: 'TG',
      avatarColor: 'bg-blue-600 text-white',
      comments: 0,
      attachments: 1,
      subtasks: [
        { id: 'sub-8', text: 'Test websocket synchronization connection latency triggers', completed: true }
      ],
      column: 'completed'
    },
    {
      id: 'websocket',
      title: 'Persistent Socket Handshake Layer',
      description: 'Set up automatic heartbeats and redundant client connection retry paths.',
      type: 'Improvement',
      priority: 'Medium',
      dueDate: 'Due Aug 20',
      avatar: 'CA',
      avatarColor: 'bg-sky-600 text-white',
      comments: 4,
      attachments: 2,
      subtasks: [],
      column: 'completed'
    }
  ]);

  const handleToggleSubtask = (taskId, subtaskId) => {
    setDemoKanbanTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map(sub => {
              if (sub.id === subtaskId) {
                return { ...sub, completed: !sub.completed };
              }
              return sub;
            })
          };
        }
        return task;
      })
    );
  };

  const handleMoveTaskColumn = (taskId) => {
    const columnsOrder = ['assigned', 'in-progress', 'qa', 'deployment', 'completed'];
    setDemoKanbanTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const currentIndex = columnsOrder.indexOf(task.column);
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % columnsOrder.length;
            return { ...task, column: columnsOrder[nextIndex] };
          }
        }
        return task;
      })
    );
  };
  
  // LIVE CHAT DEMO STATES
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Sarah', content: 'Hey team, did we optimize the database response time?', time: '10:02 AM' },
    { sender: 'Alex', content: 'Yes, query performance is optimized! 🚀', time: '10:03 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // AI COPILOT TASK GENERATION STATE
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState([]);
  const [aiGeneratingState, setAiGeneratingState] = useState('idle'); // idle, generating, complete

  // Intersection Observer for Scroll Reveal
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [activeTab]);

  // Fetch landing page statistics
  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        setLoading(true);
        const statsData = await landingService.getStats();
        setStats([
          { number: statsData.activeTeams.toString(), label: "Active Teams" },
          { number: statsData.completedProjects.toString(), label: "Projects Completed" },
          { number: "99.9%", label: "Uptime" },
          { number: "24/7", label: "Support" }
        ]);
      } catch (error) {
        console.error('Error fetching landing stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingStats();
  }, []);

  // Fetch policy acceptance status on mount
  useEffect(() => {
    const status = getAllPolicyStatus();
    setPolicyStatus(status);
  }, []);

  // Show cookie banner if cookie policy is not accepted
  useEffect(() => {
    if (policyStatus && !policyStatus.cookiePolicy) {
      const timer = setTimeout(() => {
        setShowCookieBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowCookieBanner(false);
    }
  }, [policyStatus]);

  const handleAcceptCookies = () => {
    acceptPolicy('COOKIE_POLICY');
    setPolicyStatus(getAllPolicyStatus());
    setShowCookieBanner(false);
    showToast('Cookie Policy accepted!', 'success');
  };

  // AI Terminal Simulation logic
  const runTerminalSimulation = async (promptKey) => {
    setTerminalStatus('typing');
    setTerminalInput('');
    setTerminalOutput([]);

    let queryText = '';
    let responseLines = [];

    if (promptKey === 'sprint') {
      queryText = 'Optimize sprint 3 backlog and balance developer velocity.';
      responseLines = [
        '⚙️ Fetching sprint metrics for active project "TeamLabs Alpha"...',
        '📊 Analyzing 32 unresolved backlog items and current user story allocations...',
        '⚠️ Identified Bottleneck: Developer "Emily" is overallocated by 18 hours (148% capacity).',
        '💡 Optimal Action Plan:',
        '  1. Reassign Task #204 ("MFA API setup") to developer "Alex".',
        '  2. Push Task #112 ("CSS style refinements") to Sprint 4.',
        '🚀 Backlog Balanced. Team velocity optimized. Sprint risk lowered from High to Low.'
      ];
    } else if (promptKey === 'tasks') {
      queryText = 'Generate a high-fidelity backlog breakdown for a Stripe checkout gateway integration.';
      responseLines = [
        '🤖 Initializing User Story breakdown tool...',
        '⚡ Generating epics and actionable subtasks...',
        '✅ Task 1 Created: [🔐 Security] Restrict webhook listener validation using Stripe signatures.',
        '✅ Task 2 Created: [💳 Service] Implement token creation backend controller service.',
        '✅ Task 3 Created: [📊 Frontend] Create responsive pricing success state UI modal.',
        '✨ Automatically synced 3 subtasks to Sprint Kanban Board.'
      ];
    } else if (promptKey === 'blockers') {
      queryText = 'Identify critical blockers and notify stakeholders.';
      responseLines = [
        '🔍 Crawling database event logs and socket heartbeat feeds...',
        '🚨 CRITICAL BLOCKER FOUND:',
        '  - Task #304 ("SaaS Billing Webhooks") is stuck in "Testing".',
        '  - Reason: Awaiting Stripe Sandbox webhook secrets config update.',
        '📬 Triggering immediate platform notification channels...',
        '💬 Sent instant Slack & Mail notifications to Administrator "Sarah".'
      ];
    }

    // Simulate typing character by character
    let typed = '';
    for (let i = 0; i < queryText.length; i++) {
      typed += queryText[i];
      setTerminalInput(typed);
      await new Promise((res) => setTimeout(res, 20));
    }

    setTerminalStatus('executing');
    await new Promise((res) => setTimeout(res, 600));

    // Simulate line by line terminal output
    for (let i = 0; i < responseLines.length; i++) {
      setTerminalOutput((prev) => [...prev, responseLines[i]]);
      if (terminalScrollRef.current) {
        terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
      }
      await new Promise((res) => setTimeout(res, 400));
    }
    setTerminalStatus('done');
  };

  // Run initial terminal simulation on mount
  useEffect(() => {
    runTerminalSimulation('sprint');
  }, []);

  // Timesheet Clock ticker
  useEffect(() => {
    let interval;
    if (isPunchedIn) {
      interval = setInterval(() => {
        setPunchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPunchedIn]);

  // Timesheet Actions
  const handlePunchClick = () => {
    if (!isPunchedIn) {
      setIsPunchedIn(true);
      setPunchSeconds(0);
      const newLog = {
        id: Date.now(),
        type: 'Punch In',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString()
      };
      setPunchLogs((prev) => [newLog, ...prev]);
    } else {
      setIsPunchedIn(false);
      const newLog = {
        id: Date.now(),
        type: 'Punch Out',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString(),
        duration: formatDuration(punchSeconds)
      };
      setPunchLogs((prev) => [newLog, ...prev]);
    }
  };

  const formatDuration = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  // Live Chat Simulator send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'You', content: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Simulate instant AI copilot respond
    setTimeout(() => {
      const aiMsg = {
        sender: 'AI Assistant',
        content: `🤖 Requirement classified: "${userMsg.content}". I have generated a task proposal card for this request.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  };

  // AI Copilot generator simulation
  const handleGenerateWorkflow = () => {
    setAiGeneratingState('generating');
    setAiGeneratedTasks([]);
    setTimeout(() => {
      setAiGeneratedTasks([
        { id: 1, title: 'Define PostgreSQL schema endpoints', priority: 'High', type: 'Database' },
        { id: 2, title: 'Configure secure webhook authentication keys', priority: 'High', type: 'Backend' },
        { id: 3, title: 'Draft mock checkout product catalog interface', priority: 'Medium', type: 'UI Dev' },
        { id: 4, title: 'Validate transactional invoice emails with Mailgun', priority: 'Low', type: 'Integration' }
      ]);
      setAiGeneratingState('complete');
    }, 1800);
  };

  const handleLogout = () => {
    logout();
  };

  // URL Hash and Query Parameter modal auto-open (for Google ID verification deep links)
  useEffect(() => {
    const checkHashAndQuery = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);
      const modalParam = urlParams.get('modal');

      if (hash === '#privacy' || hash === '#privacy-policy' || modalParam === 'privacy') {
        setShowPrivacyPolicy(true);
      } else if (hash === '#terms' || hash === '#terms-of-service' || modalParam === 'terms') {
        setShowTermsOfService(true);
      } else if (hash === '#cookie' || hash === '#cookie-policy' || modalParam === 'cookie') {
        setShowCookiePolicy(true);
      }
    };

    checkHashAndQuery();
    window.addEventListener('hashchange', checkHashAndQuery);
    return () => window.removeEventListener('hashchange', checkHashAndQuery);
  }, [router.query]);

  const openLogin = () => {
    router.push('/auth?type=login');
  };

  const openRegister = () => {
    router.push('/auth');
  };

  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#030712] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Head>
        <title>TeamLabs | AI-Powered Velocity Project Management SaaS</title>
        <meta name="description" content="Unlock hyper-velocity team performance with AI-powered task automation, modular Kanban boards, real-time Slack-like messaging, and advanced analytics dashboards." />
        <meta name="keywords" content="project management, team collaboration, kanban board, AI assistant, analytics dashboard, cloud saas" />
        <link rel="icon" href="/static/logo.png" />
      </Head>

      {/* Futuristic Background Dot Grid and Radial Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
        {/* Glowing Blobs */}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.15] animate-blob ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-400'}`}></div>
        <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.15] animate-blob animation-delay-2000 ${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
        <div className={`absolute top-1/2 left-1/3 w-[350px] h-[350px] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.1] animate-blob animation-delay-4000 ${theme === 'dark' ? 'bg-cyan-500' : 'bg-cyan-400'}`}></div>
        
        {/* SVG Custom Dot Matrix */}
        <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.8]" style={{
          backgroundImage: theme === 'dark'
            ? `radial-gradient(rgba(99, 102, 241, 0.08) 1.5px, transparent 1.5px)`
            : `radial-gradient(rgba(99, 102, 241, 0.12) 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      {/* Main Wrapper */}
      <div className="relative z-10">
        <AuthNavbar openLogin={openLogin} />

        {/* Hero Section */}
        <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-12 w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center w-full">
            
            {/* Hero Left: Pitch & CTA */}
            <div className="lg:col-span-6 flex flex-col justify-center text-left reveal reveal-fade-up">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-wide max-w-max border ${theme === 'dark' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                <FaRocket className="animate-bounce text-indigo-500" />
                <span>MEET THE FUTURE OF PROJECT MANAGEMENT</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
                Redefining
                <br />
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Team Velocity
                </span>
                <br />
                with AI Automation
              </h1>

              <p className={`text-lg md:text-xl leading-relaxed mb-8 max-w-2xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Transform absolute chaos into streamlined sprint progress. Deploy Kanban boards, native team group chat, instant analytics summaries, and live-punch timesheets instantly. 
                <span className="font-semibold text-indigo-500"> Built for modern high-performance organizations.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                {isAuthenticated ? (
                  <div className="flex flex-wrap gap-4 items-center">
                    <Link href="/dashboard" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base hover:opacity-90 shadow-xl shadow-indigo-600/25 transition-transform transform hover:-translate-y-0.5 flex items-center gap-2">
                      Go to Dashboard <FaChevronRight size={14} />
                    </Link>
                    <button onClick={handleLogout} className={`px-4 py-2 border font-bold text-base rounded-xl flex items-center gap-2 transition-all ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'}`}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={openRegister} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base hover:opacity-90 shadow-xl shadow-indigo-600/25 transition-transform transform hover:-translate-y-0.5">
                      Start Free Trial
                    </button>
                    <button onClick={openLogin} className={`px-4 py-2 border font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'}`}>
                      <FaSignInAlt /> Sign In
                    </button>
                  </>
                )}
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-indigo-500/10">
                {stats.map((stat, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      {stat.number === "0" ? "..." : stat.number}{stat.label.includes("Completed") || stat.label.includes("Teams") ? "+" : ""}
                    </span>
                    <span className={`text-xs font-semibold uppercase tracking-wider mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Right: Interactive AI Terminal Mockup */}
            <div className="lg:col-span-6 w-full reveal reveal-fade-left">
              <div className={`relative rounded-2xl border transition-all duration-300 shadow-2xl p-0.5 ${theme === 'dark' ? 'border-white/10 bg-slate-950/70 shadow-slate-950/80' : 'border-slate-200/80 bg-white/70 shadow-slate-200/50'} backdrop-blur-md`}>
                
                {/* Gloss header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-b ${theme === 'dark' ? 'bg-slate-950/80 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 block"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 block"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500/80 block"></span>
                  </div>
                  <span className={`text-xs font-mono font-medium tracking-wide flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <FaRobot className="text-indigo-500" /> terminal@teamlabs
                  </span>
                  <div className="w-12"></div>
                </div>

                {/* Terminal Workspace */}
                <div className={`p-5 min-h-[300px] max-h-[380px] overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed text-left flex flex-col justify-start rounded-b-2xl ${theme === 'dark' ? 'bg-slate-950/40 text-slate-300' : 'bg-slate-50/50 text-slate-800'}`} ref={terminalScrollRef}>
                  
                  {/* Console prompt */}
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-indigo-400 font-bold select-none">&gt;</span>
                    <span className="font-semibold text-indigo-500 dark:text-indigo-300">
                      {terminalInput}
                      {terminalStatus === 'typing' && <span className="typing-cursor">_</span>}
                    </span>
                  </div>

                  {/* Execution Spinner */}
                  {terminalStatus === 'executing' && (
                    <div className="flex items-center gap-2 text-purple-400 py-2 animate-pulse">
                      <FaSyncAlt className="animate-spin" />
                      <span>Optimizing sprint flow...</span>
                    </div>
                  )}

                  {/* Output content */}
                  <div className="space-y-2 mt-2">
                    {terminalOutput.map((line, idx) => (
                      <div key={idx} className="reveal-visible animate-fade-in pl-4 border-l border-indigo-500/20 py-0.5">
                        {line}
                      </div>
                    ))}
                  </div>

                  {/* Done cursor indicator */}
                  {terminalStatus === 'done' && (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold py-2">
                      <FaCheckCircle className="animate-pulse" />
                      <span>Task Completed Successfully.</span>
                    </div>
                  )}
                </div>

                {/* Prompt Controls overlay */}
                <div className={`p-4 border-t rounded-b-2xl flex flex-wrap gap-2 items-center justify-between ${theme === 'dark' ? 'bg-slate-950/80 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">TRY A CHIP:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSelectedPrompt('sprint'); runTerminalSimulation('sprint'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPrompt === 'sprint' ? 'bg-indigo-600 text-white' : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                      disabled={terminalStatus === 'typing' || terminalStatus === 'executing'}
                    >
                      🤖 Optimize Sprint
                    </button>
                    <button
                      onClick={() => { setSelectedPrompt('tasks'); runTerminalSimulation('tasks'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPrompt === 'tasks' ? 'bg-indigo-600 text-white' : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                      disabled={terminalStatus === 'typing' || terminalStatus === 'executing'}
                    >
                      ⚡ Auto-Tasks
                    </button>
                    <button
                      onClick={() => { setSelectedPrompt('blockers'); runTerminalSimulation('blockers'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPrompt === 'blockers' ? 'bg-indigo-600 text-white' : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                      disabled={terminalStatus === 'typing' || terminalStatus === 'executing'}
                    >
                      🔍 Analyze Blocker
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Dynamic Showcase & Sandbox Features Explorer */}
        <section id="features" className="py-24 relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-indigo-500/10">
          <div className="text-center mb-16 reveal reveal-fade-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Everything in One
              <br />
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Integrated Dashboard</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-3xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Don't just take our word for it. Test driving core modular tools in our sandbox workspace right now.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Features Navigation - Left Column */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {[
                { id: 'analytics', label: '📊 Smart Analytics', desc: 'Real-time charts, velocity scores, and visual health.' },
                { id: 'kanban', label: '📋 Kanban Boards', desc: 'Highly intuitive workflow stages and auto task drag-and-drop.' },
                { id: 'chat', label: '💬 Active Chat', desc: 'Real-time integrated channels, direct messages, and AI triggers.' },
                { id: 'copilot', label: '🤖 AI Task Engine', desc: 'Generate task blueprints from simple speech descriptions.' },
                { id: 'timesheet', label: '⏱️ Live Timesheets', desc: 'Instant punch-in, continuous duration timers, and logs.' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-4 rounded-xl text-left border transition-all duration-300 flex flex-col gap-1 ${
                    activeTab === tab.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                        : 'bg-white border-indigo-500/40 shadow-xl shadow-slate-200'
                      : theme === 'dark'
                        ? 'bg-slate-900/20 hover:bg-slate-900/40 border-white/5'
                        : 'bg-white/40 hover:bg-white/80 border-slate-200'
                  }`}
                >
                  <span className={`font-bold text-sm sm:text-base ${activeTab === tab.id ? 'text-indigo-500' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {tab.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Showcase Visualizer Terminal - Right Column */}
            <div className="lg:col-span-8 w-full">
              <div className={`rounded-2xl border transition-all duration-300 shadow-2xl p-6 min-h-[380px] flex flex-col ${theme === 'dark' ? 'bg-slate-950/70 border-white/10 shadow-slate-950/65' : 'bg-white/90 border-slate-200/80 shadow-slate-200/40'} backdrop-blur-md`}>
                
                {/* 1. Analytics Showcase */}
                {activeTab === 'analytics' && (
                  <div className="flex flex-col gap-6 animate-fade-in text-left">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaChartLine className="text-indigo-500" /> Executive Analytics Workspace
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Beautiful visualizations represent metrics for live user story progress and sprint velocity scores.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-6">
                      
                      {/* Metric Card 1 */}
                      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sprint Velocity</span>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/10">
                            <span className="font-extrabold text-indigo-500 text-sm">94%</span>
                          </div>
                          <div>
                            <span className="text-2xl font-bold">480 pts</span>
                            <p className="text-xs text-emerald-500 font-semibold">+12% vs target</p>
                          </div>
                        </div>
                      </div>

                      {/* Metric Card 2 */}
                      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tasks Completed</span>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500/10">
                            <span className="font-extrabold text-emerald-500 text-sm">82%</span>
                          </div>
                          <div>
                            <span className="text-2xl font-bold">124 / 150</span>
                            <p className="text-xs text-slate-500">26 remaining</p>
                          </div>
                        </div>
                      </div>

                      {/* Metric Card 3 */}
                      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Burndown</span>
                        <div className="flex items-center gap-2 mt-4 h-6 items-end">
                          <div className="w-full bg-indigo-500/30 rounded-t h-1/2"></div>
                          <div className="w-full bg-indigo-500/50 rounded-t h-2/3"></div>
                          <div className="w-full bg-indigo-500/70 rounded-t h-4/5"></div>
                          <div className="w-full bg-indigo-500 rounded-t h-full"></div>
                        </div>
                      </div>

                    </div>

                    {/* Chart Container Grid */}
                    <div className={`p-5 rounded-xl border mt-2 flex flex-col gap-4 ${theme === 'dark' ? 'bg-slate-900/20 border-white/5' : 'bg-slate-100 border-slate-200/50'}`}>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Sprint 3 Daily Burndown Forecast</span>
                        <span className="flex items-center gap-1 font-semibold text-indigo-500"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Live</span>
                      </div>
                      
                      {/* SVG Bar Chart with animate transitions */}
                      <svg className="w-full h-24 overflow-visible" viewBox="0 0 400 100">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="400" y2="20" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3" />
                        <line x1="0" y1="50" x2="400" y2="50" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3" />
                        <line x1="0" y1="80" x2="400" y2="80" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3" />

                        {/* Bar charts path */}
                        <path
                          d="M 10 90 L 80 70 L 150 40 L 220 30 L 290 15 L 380 5"
                          fill="none"
                          stroke="url(#chart-grad)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="chart-stroke-anim"
                        />
                        
                        <defs>
                          <linearGradient id="chart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                )}

                {/* 2. Kanban Showcase */}
                {activeTab === 'kanban' && (
                  <div className="flex flex-col gap-4 animate-fade-in text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <FaUsers className="text-indigo-500" /> Modular Scrum Kanban Board
                        </h3>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Interact with the board: click subtasks to toggle progress, or click a card title/body to cycle columns.
                        </p>
                      </div>
                    </div>

                    {/* Horizontal scrollable columns list */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin w-full mt-2" style={{ scrollSnapType: 'x mandatory' }}>
                      {[
                        { id: 'assigned', title: 'Assigned', icon: FaCheckCircle, iconColor: 'text-blue-500', pillBg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400', count: demoKanbanTasks.filter(t => t.column === 'assigned').length },
                        { id: 'in-progress', title: 'In Progress', icon: FaHourglassHalf, iconColor: 'text-amber-500', pillBg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400', count: demoKanbanTasks.filter(t => t.column === 'in-progress').length },
                        { id: 'qa', title: 'QA', icon: FaShieldAlt, iconColor: 'text-purple-500', pillBg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400', count: demoKanbanTasks.filter(t => t.column === 'qa').length },
                        { id: 'deployment', title: 'Deployment', icon: FaRocket, iconColor: 'text-pink-500', pillBg: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400', count: demoKanbanTasks.filter(t => t.column === 'deployment').length },
                        { id: 'completed', title: 'Completed', icon: FaCheckCircle, iconColor: 'text-emerald-500', pillBg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400', count: demoKanbanTasks.filter(t => t.column === 'completed').length }
                      ].map((col) => {
                        const IconComponent = col.icon;
                        const colTasks = demoKanbanTasks.filter(t => t.column === col.id);

                        return (
                          <div key={col.id} className={`p-3.5 rounded-xl border flex flex-col gap-3.5 flex-shrink-0 w-[290px] min-h-[460px] ${theme === 'dark' ? 'bg-slate-900/20 border-white/5' : 'bg-slate-50 border-slate-200'}`} style={{ scrollSnapAlign: 'start' }}>
                            
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-indigo-500/10">
                              <div className="flex items-center gap-2">
                                <IconComponent className={col.iconColor} size={14} />
                                <span className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{col.title}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold border ${col.pillBg}`}>
                                {col.count}
                              </span>
                            </div>

                            {/* Column Body */}
                            <div className="flex-grow flex flex-col gap-3 overflow-y-auto max-h-[380px] scrollbar-thin pr-1">
                              {col.id === 'not-assigned' && (
                                <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-lg p-2.5 text-center text-xs font-bold text-indigo-500 hover:bg-indigo-500/5 transition-all w-full flex items-center justify-center gap-1.5 cursor-pointer select-none bg-white dark:bg-slate-950">
                                  <FaPlus size={10} /> Add New Task
                                </div>
                              )}

                              {colTasks.length === 0 ? (
                                col.id === 'not-assigned' ? (
                                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 text-xs gap-2 select-none">
                                    <FaTimesCircle className="opacity-40" size={20} />
                                    <span className="font-semibold text-slate-400">No tasks</span>
                                  </div>
                                ) : null
                              ) : (
                                colTasks.map((task) => {
                                  const totalSubtasks = task.subtasks.length;
                                  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
                                  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 100;

                                  const getCategoryStyle = (type) => {
                                    switch (type) {
                                      case 'Bug':
                                        return { bg: 'bg-red-500/10 text-red-500 border-red-500/20', icon: FaBug };
                                      case 'Improvement':
                                        return { bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: FaWrench };
                                      case 'Feature':
                                        return { bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: FaKey };
                                      case 'Documentation':
                                        return { bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: FaFileAlt };
                                      default:
                                        return { bg: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: FaCheckCircle };
                                    }
                                  };

                                  const getPriorityStyle = (prio) => {
                                    switch (prio) {
                                      case 'High':
                                        return { bg: 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200 dark:border-red-500/20', icon: FaArrowUp };
                                      case 'Medium':
                                        return { bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 border-amber-200 dark:border-amber-500/20', icon: FaArrowDown };
                                      default:
                                        return { bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border-emerald-200 dark:border-emerald-500/20', icon: FaArrowDown };
                                    }
                                  };

                                  const catStyle = getCategoryStyle(task.type);
                                  const CatIcon = catStyle.icon;

                                  const prioStyle = getPriorityStyle(task.priority);
                                  const PrioIcon = prioStyle.icon;

                                  return (
                                    <div
                                      key={task.id}
                                      className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all duration-200 text-left relative cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] ${theme === 'dark' ? 'bg-slate-950 border-white/10 text-white hover:border-indigo-500/30' : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-500/20'}`}
                                    >
                                      {/* Top Badges Row */}
                                      <div className="flex items-center justify-between text-xs font-extrabold uppercase">
                                        <div className={`px-2 py-0.5 rounded border flex items-center gap-1 ${catStyle.bg}`}>
                                          <CatIcon size={9} />
                                          <span>{task.type}</span>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded border flex items-center gap-1 ${prioStyle.bg}`}>
                                          <PrioIcon size={9} />
                                          <span>{task.priority}</span>
                                        </div>
                                      </div>

                                      {/* Task Text info */}
                                      <div onClick={() => handleMoveTaskColumn(task.id)} title="Click card to progress column">
                                        <h4 className="font-extrabold text-[13px] leading-snug tracking-tight hover:text-indigo-500 transition-colors">
                                          {task.title}
                                        </h4>
                                        {task.description && (
                                          <p className={`text-[11px] leading-relaxed mt-1 line-clamp-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                            {task.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Interactive Subtasks Checklist */}
                                      {task.subtasks.length > 0 && (
                                        <div className="flex flex-col gap-1.5 py-1 border-t border-indigo-500/5 mt-1">
                                          {task.subtasks.map((sub) => (
                                            <div
                                              key={sub.id}
                                              onClick={(e) => { e.stopPropagation(); handleToggleSubtask(task.id, sub.id); }}
                                              className="flex items-start gap-2 cursor-pointer select-none text-[11px] group"
                                            >
                                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${sub.completed ? 'bg-amber-400 border-amber-400 text-white' : 'border-slate-300 dark:border-slate-700 hover:border-amber-400'}`}>
                                                {sub.completed && <FaCheck size={7} />}
                                              </span>
                                              <span className={`leading-tight ${sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300 group-hover:text-amber-500'}`}>
                                                {sub.text}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Progress Bar Row */}
                                      <div className="flex items-center gap-2 border-t border-indigo-500/5 pt-2 mt-1">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold uppercase shrink-0 ${task.avatarColor}`}>
                                          {task.avatar}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 shrink-0">Progress</span>
                                        <div className="flex-grow bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                          <div className={`h-full transition-all duration-300 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progressPercent}%` }}></div>
                                        </div>
                                        <span className="text-xs font-extrabold text-slate-500 shrink-0">{progressPercent}%</span>
                                      </div>

                                      {/* Footer: Date & Comments */}
                                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-1.5 pt-1">
                                        <div className="flex items-center gap-1">
                                          <FaCalendarAlt size={9} />
                                          <span>{task.dueDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                          {task.comments > 0 && (
                                            <span className="flex items-center gap-1">
                                              <FaCommentAlt size={9} />
                                              <span>{task.comments}</span>
                                            </span>
                                          )}
                                          {task.attachments > 0 && (
                                            <span className="flex items-center gap-1">
                                              <FaPaperclip size={9} />
                                              <span>{task.attachments}</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Active Chat Showcase */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col gap-6 animate-fade-in text-left">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaUsers className="text-indigo-500" /> Collaborative Channels Workspace
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Integrated group and direct conversations. Test drive simulated chats below with automated AI bot responses.
                    </p>

                    {/* Chat Terminal Frame */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-4 justify-between h-[220px] ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-200/50'}`}>
                      
                      {/* Active header */}
                      <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                        <span className="font-extrabold tracking-wider uppercase text-slate-500">#sprint-planning</span>
                        <span className="ml-auto text-xs text-slate-400">3 active contributors</span>
                      </div>

                      {/* Chat messages */}
                      <div className="flex-grow overflow-y-auto flex flex-col gap-3 pr-2 scrollbar-thin">
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className="text-xs">
                            <span className={`font-bold mr-1.5 ${msg.sender === 'You' ? 'text-indigo-400' : msg.sender === 'AI Assistant' ? 'text-purple-400 font-extrabold' : 'text-slate-400'}`}>
                              {msg.sender}:
                            </span>
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}>{msg.content}</span>
                            <span className="text-[9px] text-slate-500 float-right mt-0.5">{msg.time}</span>
                          </div>
                        ))}
                      </div>

                      {/* Form sender */}
                      <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type simulated message (e.g. Optimize login flow)..."
                          className={`flex-grow px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-white/10 text-white placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                        <button type="submit" className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0">
                          <FaPaperPlane size={11} />
                        </button>
                      </form>

                    </div>
                  </div>
                )}

                {/* 4. AI Copilot Task Generator */}
                {activeTab === 'copilot' && (
                  <div className="flex flex-col gap-6 animate-fade-in text-left">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaRobot className="text-indigo-500" /> AI Requirement Blueprint Engine
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Input high level feature requirements. Our platform generates task subtrees, assignments, and priorities automatically.
                    </p>

                    <div className="flex flex-col gap-4">
                      {/* Interactive prompt area */}
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 justify-between ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-200/50'}`}>
                        <div className="text-xs text-left">
                          <p className="font-bold text-slate-500 uppercase tracking-wide">Feature Requirement Prompt</p>
                          <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300 italic">"Integrate Stripe subscriptions with monthly and annual choices and direct webhooks."</p>
                        </div>
                        <button
                          onClick={handleGenerateWorkflow}
                          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-xs font-bold text-white shrink-0 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                          disabled={aiGeneratingState === 'generating'}
                        >
                          {aiGeneratingState === 'generating' ? <FaSyncAlt className="animate-spin" /> : <FaPlay />}
                          <span>Generate Task Blueprint</span>
                        </button>
                      </div>

                      {/* Display results */}
                      {aiGeneratingState === 'complete' && (
                        <div className="space-y-2 mt-1">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Generated Task Subtree:</p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {aiGeneratedTasks.map((t) => (
                              <div key={t.id} className={`p-3 rounded-lg border text-xs flex justify-between items-center ${theme === 'dark' ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'}`}>
                                <div>
                                  <p className="font-bold">{t.title}</p>
                                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t.type}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${t.priority === 'High' ? 'bg-red-500/10 text-red-500' : t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                  {t.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Timesheet Clock Showcase */}
                {activeTab === 'timesheet' && (
                  <div className="flex flex-col gap-6 animate-fade-in text-left">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaHourglassHalf className="text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} /> High-Velocity Timesheet Clock
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Integrated punch systems allow developers to sync hourly timesheets on a click. Punch-in below to test it.
                    </p>

                    <div className="grid sm:grid-cols-12 gap-6 items-center">
                      
                      {/* Punch Clock Left */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                        <button
                          onClick={handlePunchClick}
                          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 font-extrabold shadow-xl text-base shrink-0 select-none transform hover:scale-105 ${
                            isPunchedIn
                              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-red-600/35 border-4 border-red-500/30'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-600/35 border-4 border-indigo-500/30'
                          }`}
                        >
                          <FaHourglassHalf className={isPunchedIn ? 'animate-pulse' : ''} />
                          <span>{isPunchedIn ? 'PUNCH OUT' : 'PUNCH IN'}</span>
                        </button>
                        {isPunchedIn && (
                          <p className="text-sm font-mono mt-3 font-extrabold text-indigo-500 tracking-wider">
                            ACTIVE TIMER: {formatDuration(punchSeconds)}
                          </p>
                        )}
                      </div>

                      {/* Punch Clock Logs Right */}
                      <div className="sm:col-span-7 flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Timesheet Punch Event Logs:</span>
                        <div className={`p-4 rounded-xl border mt-2 min-h-[140px] max-h-[160px] overflow-y-auto flex flex-col gap-2 ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-200/50'}`}>
                          {punchLogs.length === 0 ? (
                            <p className="text-xs text-slate-500 italic mt-6 text-center">No logs generated. Punch in to create dynamic timesheet rows.</p>
                          ) : (
                            punchLogs.map((log) => (
                              <div key={log.id} className="text-xs flex items-center justify-between py-1 border-b border-indigo-500/5">
                                <span className={`font-bold flex items-center gap-1 ${log.type === 'Punch In' ? 'text-emerald-500' : 'text-red-500'}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                  {log.type}
                                </span>
                                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                                  {log.date} @ {log.time}
                                </span>
                                {log.duration && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-extrabold text-xs">
                                    Duration: {log.duration}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Details */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-indigo-500/10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const IconComp = feature.icon;
              const colorTheme = {
                blue: theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200',
                purple: theme === 'dark' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200',
                green: theme === 'dark' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200',
                red: theme === 'dark' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200',
              };

              return (
                <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.03] text-left reveal reveal-fade-up reveal-delay-${idx * 100} ${theme === 'dark' ? 'bg-slate-950/40 border-white/5 hover:border-indigo-500/20 hover:bg-slate-900/40' : 'bg-white border-slate-200 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-slate-100'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${colorTheme[feature.color]}`}>
                    <IconComp size={20} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Testimonials Redesign */}
        <section id="testimonials" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-indigo-500/10">
          <div className="text-center mb-16 reveal reveal-fade-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Endorsed by Fast-Growing Teams
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Modern executives and product managers achieve rapid backlog conversions with TeamLabs project suites.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <div key={idx} className={`p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between text-left reveal reveal-fade-up reveal-delay-${idx * 150} ${theme === 'dark' ? 'bg-slate-950/40 border-white/5 hover:border-indigo-500/20' : 'bg-white border-slate-200 hover:shadow-xl hover:border-indigo-500/20'}`}>
                <div>
                  <div className="flex gap-1.5 mb-4">
                    {[...Array(item.rating)].map((_, i) => (
                      <FaStar key={i} className="text-amber-500" size={14} />
                    ))}
                  </div>
                  <p className={`text-base leading-relaxed italic mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    "{item.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-indigo-500/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm select-none">
                    {item.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>{item.role} @ {item.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Workspace */}
        <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-indigo-500/10">
          <div className="text-center mb-16 reveal reveal-fade-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Simple, Dynamic pricing plans
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Optimize sprint cycles on a plan tailored to developer requirements. Save up to 29% annually.
            </p>


          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Card 1: Free */}
            <div className={`p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between text-left reveal reveal-fade-up ${theme === 'dark' ? 'bg-slate-950/30 border-white/5 hover:border-slate-800' : 'bg-white border-slate-200 hover:shadow-xl'}`}>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-extrabold">Basic Free Account</h3>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Perfect for small teams and developers.</p>
                </div>
                <div className="py-2">
                  <span className="text-5xl font-extrabold">$0</span>
                  <span className="text-sm font-semibold text-slate-500">/mo</span>
                </div>
                <hr className="border-indigo-500/10" />
                <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>3 Projects</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>1 Story per Project</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>10 Tasks per Story</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Basic Support</span></li>
                </ul>
              </div>
              <button onClick={openRegister} className={`w-full py-3.5 mt-8 font-bold text-sm rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                Get Started Free
              </button>
            </div>

            {/* Card 2: Premium Monthly */}
            <div className={`p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between text-left relative reveal reveal-fade-up reveal-delay-150 ${theme === 'dark' ? 'bg-slate-950/30 border-indigo-500/40 hover:border-indigo-500' : 'bg-white border-indigo-500/40 hover:shadow-xl shadow-lg shadow-indigo-500/5'}`}>
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg">
                MOST POPULAR
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-extrabold">Premium Monthly</h3>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Best choice for scaling team velocities.</p>
                </div>
                <div className="py-2">
                  <span className="text-5xl font-extrabold">$49</span>
                  <span className="text-sm font-semibold text-slate-500">/mo</span>
                </div>
                <hr className="border-indigo-500/10" />
                <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Unlimited Projects</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Unlimited User Stories</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Unlimited Tasks</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Advanced Analytics</span></li>
                  <li className="flex items-center gap-2.5"><FaCrown className="text-indigo-500 shrink-0 animate-pulse" size={12} /> <span>Priority Support</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>All Members Premium</span></li>
                </ul>
              </div>
              <button onClick={openRegister} className="w-full py-3.5 mt-8 font-bold text-sm text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 shadow-lg shadow-indigo-600/20 transition-all">
                Subscribe Monthly
              </button>
            </div>

            {/* Card 3: Premium Annual */}
            <div className={`p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between text-left relative reveal reveal-fade-up reveal-delay-300 ${theme === 'dark' ? 'bg-slate-950/30 border-white/5 hover:border-slate-800' : 'bg-white border-slate-200 hover:shadow-xl'}`}>
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg">
                BEST VALUE (SAVE 29%)
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-extrabold">Premium Annual</h3>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Max savings for permanent scrums.</p>
                </div>
                <div className="py-2 flex flex-col">
                  <div>
                    <span className="text-5xl font-extrabold">$419</span>
                    <span className="text-sm font-semibold text-slate-500">/yr</span>
                    <span className="text-lg text-slate-400 dark:text-slate-500 line-through ml-2 font-bold">$588</span>
                  </div>
                  <span className="text-xs text-emerald-500 font-extrabold mt-1.5">Equivalent to just $34.91 / month</span>
                </div>
                <hr className="border-indigo-500/10" />
                <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Unlimited Projects</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Unlimited User Stories</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Unlimited Tasks</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>Advanced Analytics</span></li>
                  <li className="flex items-center gap-2.5"><FaCrown className="text-indigo-500 shrink-0 animate-pulse" size={12} /> <span>Priority Support</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>All Members Premium</span></li>
                  <li className="flex items-center gap-2.5"><FaCheck className="text-indigo-500 shrink-0" size={12} /> <span>29% Annual Discount</span></li>
                </ul>
              </div>
              <button onClick={openRegister} className="w-full py-3.5 mt-8 font-bold text-sm text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-lg shadow-purple-600/20 transition-all">
                Subscribe Annual
              </button>
            </div>

          </div>
        </section>

        {/* CTA Footer Wrapper */}
        <section className="py-24 text-center px-4 sm:px-6 lg:px-8 border-t border-indigo-500/10 max-w-7xl mx-auto">
          <div className={`p-12 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center border ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border-indigo-500/20' : 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-600'}`}>
            
            {/* Background mesh glow inside card */}
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none select-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.4),transparent)]"></div>
            
            <div className="relative z-10 max-w-3xl flex flex-col items-center reveal reveal-fade-up">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to accelerate your team sprint velocity?
              </h2>
              <p className="text-base sm:text-lg text-indigo-100 mb-8 max-w-xl">
                Join thousands of agile developers and product managers using TeamLabs. Set up takes less than 3 minutes.
              </p>

              <div className="flex flex-wrap gap-4 items-center justify-center">
                {isAuthenticated ? (
                  <Link href="/dashboard" className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-base hover:bg-slate-50 transition-all shadow-xl shadow-slate-900/15">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <button onClick={openRegister} className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-base hover:bg-slate-50 transition-all shadow-xl shadow-slate-900/15">
                      Start Free Trial
                    </button>
                    <button onClick={openLogin} className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-base hover:bg-white hover:text-indigo-600 transition-all">
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Footer Redesign */}
        <footer className="relative w-full border-t border-indigo-500/10 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-left mb-12">
            
            {/* Brand column */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <FaRocket size={18} />
                </div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">TeamLabs</span>
              </div>
              <p className={`text-sm leading-relaxed max-w-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                Transform operational backlog into structured sprint momentum. Deliver Next.js client tools, secure authentication, timesheet managers, and AI assistants.
              </p>
              
              <div className="flex gap-3 mt-2">
                <a href="https://github.com/tejassgg" target="_blank" className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${theme === 'dark' ? 'bg-slate-900 border-white/10 hover:bg-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'}`}>
                  <FaGithub size={16} />
                </a>
                <a href="#" className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${theme === 'dark' ? 'bg-slate-900 border-white/10 hover:bg-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'}`}>
                  <FaRocket size={16} />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-sm tracking-wide uppercase text-slate-500">Product</h4>
              <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                <li><a href="#features" className="hover:text-indigo-500 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-indigo-500 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">API Keys</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-sm tracking-wide uppercase text-slate-500">Support</h4>
              <ul className="flex flex-col gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Agile Guides</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Security Standards</a></li>
                <li>
                  <button onClick={() => setShowContactSupport(true)} className="hover:text-indigo-500 transition-colors text-left font-semibold">
                    Contact Support
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <p>&copy; {new Date().getFullYear()} TeamLabs. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 items-center">
              <button onClick={() => setShowPrivacyPolicy(true)} className="hover:text-indigo-500 transition-colors flex items-center gap-1">
                Privacy Policy {policyStatus.privacyPolicy && <FaCheck className="text-emerald-500" size={10} />}
              </button>
              <button onClick={() => setShowTermsOfService(true)} className="hover:text-indigo-500 transition-colors flex items-center gap-1">
                Terms of Service {policyStatus.termsOfService && <FaCheck className="text-emerald-500" size={10} />}
              </button>
              <button onClick={() => setShowCookiePolicy(true)} className="hover:text-indigo-500 transition-colors flex items-center gap-1">
                Cookie Policy {policyStatus.cookiePolicy && <FaCheck className="text-emerald-500" size={10} />}
              </button>
            </div>
          </div>
        </footer>

        {/* Cookie Consent Banner */}
        {showCookieBanner && (
          <div className={`fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50 p-5 rounded-2xl border shadow-2xl transition-all duration-500 ease-in-out transform translate-y-0 scale-100 flex flex-col gap-4 animate-fade-in-up ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
              : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
                <FaCookieBite className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold leading-tight">Cookie Consent</h4>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  We use cookies to optimize our AI-powered velocity project management SaaS, analyze site telemetry, and personalize your experience. By clicking &quot;Accept All&quot;, you agree to our cookie storage.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                onClick={() => setShowCookiePolicy(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  theme === 'dark'
                    ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Preferences
              </button>
              <button
                onClick={handleAcceptCookies}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all"
              >
                Accept All
              </button>
            </div>
          </div>
        )}

        {/* Modal Modifiers */}
        <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => { setShowPrivacyPolicy(false); setPolicyStatus(getAllPolicyStatus()); }} />
        <TermsOfServiceModal isOpen={showTermsOfService} onClose={() => { setShowTermsOfService(false); setPolicyStatus(getAllPolicyStatus()); }} />
        <CookiePolicyModal isOpen={showCookiePolicy} onClose={() => { setShowCookiePolicy(false); setPolicyStatus(getAllPolicyStatus()); }} />
        <ContactSupportModal isOpen={showContactSupport} onClose={() => setShowContactSupport(false)} />

      </div>

      {/* Styled JSX Custom CSS Block */}
      <style jsx global>{`
        html, body {
          overflow-x: hidden;
          scroll-behavior: smooth;
        }
        
        .reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        
        .reveal-fade-up {
          transform: translateY(25px);
        }
        
        .reveal-fade-left {
          transform: translateX(-25px);
        }
        
        .reveal-fade-right {
          transform: translateX(25px);
        }
        
        .reveal-visible {
          opacity: 1;
          transform: none !important;
        }
        
        .reveal-delay-100 { transition-delay: 100ms; }
        .reveal-delay-150 { transition-delay: 150ms; }
        .reveal-delay-200 { transition-delay: 200ms; }
        .reveal-delay-300 { transition-delay: 300ms; }
        .reveal-delay-400 { transition-delay: 400ms; }

        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        .animate-blob {
          animation: blob 15s infinite alternate ease-in-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .typing-cursor {
          animation: blink-cursor 1s infinite steps(2);
        }

        @keyframes blink-cursor {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        .animate-fade-in {
          animation: fade-in-up 0.5s ease-out forwards;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chart-stroke-anim {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: draw-chart 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes draw-chart {
          to {
            stroke-dashoffset: 0;
          }
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #6366f130;
          border-radius: 99px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #6366f160;
        }

        @media (max-width: 768px) {
          .reveal-fade-left, .reveal-fade-right {
            transform: translateY(20px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal * {
            transition: none !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

Home.displayName = 'Home';

export default Home;