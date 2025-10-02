import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import RegisterForm from '../components/auth/RegisterForm';
import LoginForm from '../components/auth/LoginForm';
import ResetPasswordForm from '../components/auth/ResetPasswordModal';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { useGlobal } from '../context/GlobalContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AuthNavbar from '../components/auth/AuthNavbar';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';

const Auth = () => {
  const { theme } = useTheme();
  const { loading, isAuthenticated } = useGlobal();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetKey, setResetKey] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [verifyToken, setVerifyToken] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Check for reset, verify, or invite key in URL
  useEffect(() => {
    if (router.isReady) {
      const { invite, type, token } = router.query;
      if (type === 'reset' && token) {
        setResetKey(token);
        setShowResetPassword(true);
        setShowLogin(false);
        setShowVerify(false);
        setVerifyToken(null);
      } else if (type === 'verify' && token) {
        setVerifyToken(token);
        setShowVerify(true);
        setShowResetPassword(false);
        setShowLogin(false);
        setVerifyError('');
      } else if (invite) {
        setResetKey(invite);
        setShowForgotPasswordModal(true);
        setShowLogin(true);
        setShowVerify(false);
        setVerifyToken(null);
      } else if (type === 'login') {
        setShowLogin(true);
        setShowVerify(false);
        setVerifyToken(null);
      }
    }
  }, [router.isReady, router.query]);

  const openLogin = () => {
    setShowLogin(true);
    setShowResetPassword(false);
    router.push('/auth?type=login');
  };

  const openRegister = () => {
    router.push('/auth');
    setShowLogin(false);
  };

  if (loading) return null;
  if (isAuthenticated) return null;

  return (
    <>
      <Head>
        <title>Auth | TeamLabs</title>
      </Head>
      <AuthNavbar openLogin={openLogin} showLogin={showLogin} />
      <div className={`min-h-screen w-full flex flex-col justify-center items-center pt-16 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gray-100'
      }`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 ${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-400'}`}></div>
          <div className={`absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${theme === 'dark' ? 'bg-pink-600' : 'bg-pink-400'}`}></div>
        </div>

        <div className={`relative w-full max-w-2xl px-4 sm:px-6 lg:px-8 z-10`}>
          <div className={`rounded-xl overflow-hidden shadow-lg p-4 sm:p-6 lg:p-8 transition-all duration-700 ease-in-out transform ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative overflow-hidden">
              {showResetPassword ? (
                <ResetPasswordForm token={resetKey} />
              ) : showVerify ? (
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="text-left mb-6 w-full">
                    <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 w-full ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Verify Your <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Email</span>
                    </h1>
                    <p className={`text-sm sm:text-base md:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Please confirm your email address to activate your account
                    </p>
                  </div>

                  {verifyError && (
                    <div className={`border px-4 py-3 rounded-xl text-sm ${theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
                      {verifyError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className={`border px-4 py-3 rounded-xl text-sm ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📧</span>
                        <span>Click the button below to verify your email address and activate your account.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setVerifyError('');
                            const res = await authService.verifyEmail(verifyToken);
                            if (res.success) {
                              showToast('Email verified! You can now log in.', 'success');
                              router.replace('/auth?type=login');
                            } else {
                              const data = res.data;
                              // setVerifyError(data?.message || 'Verification failed');
                              showToast(data?.message || 'Verification failed', 'error');
                            }
                          } catch (e) {
                            // setVerifyError(e?.message || 'Verification failed');
                            showToast(e?.message || 'Verification failed', 'error');
                          }
                        }}
                        className={`w-full sm:w-auto px-6 py-3 text-white font-medium rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-800' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:ring-blue-500'}`}
                      >
                        Confirm Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowVerify(false);
                          setVerifyToken(null);
                          setVerifyError('');
                          setShowLogin(true);
                        }}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 focus:ring-gray-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500'}`}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`transition-all duration-500 ease-in-out transform ${
                    showLogin 
                      ? 'translate-x-0 opacity-100' 
                      : '-translate-x-full opacity-0 absolute inset-0'
                  }`}>
                    <LoginForm 
                      onSuccess={() => router.push('/dashboard')} 
                      onOpenRegister={openRegister}
                      onOpenForgotPassword={() => setShowForgotPasswordModal(true)}
                    />
                  </div>
                  <div className={`transition-all duration-500 ease-in-out transform ${
                    showLogin 
                      ? 'translate-x-full opacity-0 absolute inset-0' 
                      : 'translate-x-0 opacity-100'
                  }`}>
                    <RegisterForm onOpenLogin={openLogin} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal}
        onClose={() => {
          setShowForgotPasswordModal(false);
          setResetKey(null);
        }}
        resetKey={resetKey}
      />

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


