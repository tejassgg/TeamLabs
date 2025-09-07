import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import RegisterForm from '../components/auth/RegisterForm';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AuthNavbar from '../components/auth/AuthNavbar';
import Modal from '../components/shared/Modal';

const Register = () => {
  const { theme, resolvedTheme } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login');

  useEffect(() => {
    // Redirect to dashboard if user is authenticated
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const openLogin = () => {
    setModalType('login');
    setModalOpen(true);
  };

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Don't render if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Register | TeamLabs</title>
      </Head>
      <AuthNavbar openLogin={openLogin} />
      <div className={`min-h-screen w-full flex flex-col justify-center items-center pt-16 transition-colors duration-300 ${
        resolvedTheme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gray-100'
      }`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob ${resolvedTheme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 ${resolvedTheme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
          <div className={`absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${resolvedTheme === 'dark' ? 'bg-pink-600' : 'bg-pink-400'}`}></div>
        </div>
        
        {/* Centered Registration Form Section */}
        <div className="relative w-full max-w-4xl px-8 z-10">
          <div className={`rounded-xl shadow-lg overflow-hidden p-8 transition-colors ${
            resolvedTheme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white'
          }`}>
            <RegisterForm onOpenLogin={openLogin} />
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Welcome Back">
        <LoginForm onSuccess={() => setModalOpen(false)} />
      </Modal>

      <style jsx global>{`
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
    </>
  );
};

Register.displayName = 'Register';

export default Register; 