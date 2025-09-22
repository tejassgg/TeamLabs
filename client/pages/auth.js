import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import RegisterForm from '../components/auth/RegisterForm';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AuthNavbar from '../components/auth/AuthNavbar';

const Auth = () => {
  const { theme } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('type') === 'login';
    }
    return router?.query?.type === 'login';
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Removed the post-mount toggle to avoid flicker when type=login is present

  const openLogin = () => {
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
  };

  if (loading) return null;
  if (isAuthenticated) return null;

  return (
    <>
      <Head>
        <title>Auth | TeamLabs</title>
      </Head>
      <AuthNavbar openLogin={openLogin} />
      <div className={`min-h-screen w-full flex flex-col justify-center items-center pt-16 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gray-100'
      }`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 ${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
          <div className={`absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${theme === 'dark' ? 'bg-pink-600' : 'bg-pink-400'}`}></div>
        </div>

        <div className={`relative w-full ${showLogin ? 'max-w-2xl' : 'max-w-5xl'} px-4 sm:px-6 lg:px-8 z-10`}>
          <div className={`rounded-xl overflow-hidden shadow-lg p-4 sm:p-6 lg:p-8 transition-all duration-700 ease-in-out transform ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative overflow-hidden">
              <div className={`transition-all duration-500 ease-in-out transform ${
                showLogin 
                  ? 'translate-x-0 opacity-100' 
                  : '-translate-x-full opacity-0 absolute inset-0'
              }`}>
                <LoginForm onSuccess={() => router.push('/dashboard')} onOpenRegister={openRegister} />
              </div>
              <div className={`transition-all duration-500 ease-in-out transform ${
                showLogin 
                  ? 'translate-x-full opacity-0 absolute inset-0' 
                  : 'translate-x-0 opacity-100'
              }`}>
                <RegisterForm onOpenLogin={openLogin} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromRight {
          0% { opacity: 0; transform: translateX(100px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          0% { opacity: 0; transform: translateX(-100px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-slideInFromRight { animation: slideInFromRight 0.6s ease-out forwards; }
        .animate-slideInFromLeft { animation: slideInFromLeft 0.6s ease-out forwards; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </>
  );
};

Auth.displayName = 'Auth';

export default Auth;


