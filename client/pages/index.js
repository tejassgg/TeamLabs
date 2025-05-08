import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun } from 'react-icons/fa';

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login'); // 'login' or 'register'

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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#232323] text-white' : 'bg-gradient-to-br from-purple-100 to-blue-100 text-gray-900'}`}>
      <Head>
        <title>TeamLabs | Project Management Platform</title>
      </Head>
      <header className="flex justify-between items-center px-8 py-6">
        <span className="text-3xl font-extrabold text-primary">TeamLabs</span>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full focus:outline-none ${theme === 'dark' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-purple-700 transition">Go to Dashboard</Link>
              <button onClick={handleLogout} className="px-6 py-2 rounded-lg bg-white text-primary font-bold border border-primary hover:bg-primary hover:text-white transition">Logout</button>
            </>
          ) : (
            <>
              <button onClick={openLogin} className="px-6 py-2 rounded-lg bg-white text-primary font-bold border border-primary hover:bg-primary hover:text-white transition">Login</button>
              <button onClick={openRegister} className="px-6 py-2 rounded-lg bg-white text-primary font-bold border border-primary hover:bg-primary hover:text-white transition">Sign Up</button>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className={`text-5xl md:text-6xl font-extrabold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Streamline Your Project Management</h1>
        <p className={`text-xl md:text-2xl mb-10 max-w-2xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          TeamLabs is your all-in-one platform for managing projects, teams, and tasks. Collaborate, track progress, and achieve your goals with powerful dashboards, multi-project support, and seamless team communication.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mb-16">
          <div className={`rounded-xl shadow p-6 ${theme === 'dark' ? 'bg-[#333] text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="text-xl font-bold mb-2 text-primary">Multi-Project Support</h3>
            <p>Manage multiple projects with ease, switch between teams, and keep everything organized in one place.</p>
          </div>
          <div className={`rounded-xl shadow p-6 ${theme === 'dark' ? 'bg-[#333] text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="text-xl font-bold mb-2 text-primary">Dynamic Dashboards</h3>
            <p>Visualize your progress, deadlines, and team activity with beautiful, customizable dashboards.</p>
          </div>
          <div className={`rounded-xl shadow p-6 ${theme === 'dark' ? 'bg-[#333] text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="text-xl font-bold mb-2 text-primary">Team Collaboration</h3>
            <p>Communicate, assign tasks, and share files with your team—all in one secure platform.</p>
          </div>
        </div>
        <div>
          {isAuthenticated ? (
            <Link href="/dashboard" className="px-10 py-4 rounded-lg bg-primary text-white font-bold text-lg hover:bg-purple-700 transition">Go to Dashboard</Link>
          ) : (
            <button onClick={openRegister} className="px-10 py-4 rounded-lg bg-primary text-white font-bold text-lg hover:bg-purple-700 transition">Get Started Free</button>
          )}
        </div>
      </main>
      <footer className={`text-center py-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>&copy; {new Date().getFullYear()} TeamLabs. All rights reserved.</footer>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {modalType === 'login' ? (
          <>
            <LoginForm onSuccess={() => setModalOpen(false)} />
            <div className="text-center mt-4">
              <span className="text-gray-600">Don't have an account? </span>
              <button className="text-primary font-bold hover:underline" onClick={() => setModalType('register')}>Sign Up</button>
            </div>
          </>
        ) : (
          <>
            <RegisterForm onSuccess={() => setModalOpen(false)} />
            <div className="text-center mt-4">
              <span className="text-gray-600">Already have an account? </span>
              <button className="text-primary font-bold hover:underline" onClick={() => setModalType('login')}>Login</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
} 