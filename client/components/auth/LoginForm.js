import { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { IoMdRefresh } from "react-icons/io";

const LoginForm = ({ onSuccess, onOpenRegister }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { verifyLogin2FA, googleLogin, requestSignInCode, verifySignInCode } = useGlobal();
  const router = useRouter();
  const { showToast } = useToast();
  const { theme } = useTheme();

  // Code Login States
  const [otpStep, setOtpStep] = useState('request'); // 'request' or 'verify'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resending verification code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!otpEmail) {
      setError('Email address is required');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await requestSignInCode(otpEmail);
      if (result.success) {
        setOtpStep('verify');
        setCountdown(60);
        showToast('Verification code sent!', 'success');
      } else {
        setError(result.message);
        showToast(result.message, 'error');
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await requestSignInCode(otpEmail);
      if (result.success) {
        setCountdown(60);
        showToast('New verification code sent!', 'success');
      } else {
        setError(result.message);
        showToast(result.message, 'error');
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await verifySignInCode(otpEmail, otpCode);
      if (result.success) {
        if (result.twoFactorEnabled) {
          setShow2FA(true);
        } else {
          showToast('Login Successful!', 'success');
          if (onSuccess) onSuccess();
        }
      } else {
        setError(result.message);
        showToast(result.message, 'error');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await verifyLogin2FA(verificationCode);
      if (result.success) {
        if (onSuccess) onSuccess();
        showToast('Login Successful!', 'success');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to verify 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await googleLogin(credentialResponse.credential);
      if (response.success) {
        showToast('Login Successful!', 'success');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      setError('Failed to login with Google');
      console.error(error);
    }
  };

  const handleGoogleLoginError = () => {
    setError('Google login failed');
  };

  if (show2FA) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={`text-xl font-bold mb-2 text-gray-700 dark:text-white`}>Two-Factor Authentication</h2>
          <p className={`text-sm mb-4 text-gray-500 dark:text-gray-400`}>Please enter the 6-digit code from your authenticator app</p>
        </div>
        {error && (
          <div className={`border px-4 py-3 rounded-xl text-sm bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300`}>
            {error}
          </div>
        )}
        <form onSubmit={handle2FASubmit} className="space-y-5">
          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center tracking-widest bg-white border-gray-200 text-gray-900 placeholder-gray-400 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500`}
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShow2FA(false)}
              className={`w-1/2 px-4 py-2.5 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-dark-hover dark:focus:ring-gray-600`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className={`w-1/2 px-4 py-2.5 text-sm font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 dark:text-white dark:bg-gradient-to-r dark:from-blue-700 dark:to-blue-900 dark:hover:from-blue-800 dark:hover:to-blue-950 dark:focus:ring-blue-800`}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className={`border px-4 py-3 rounded-xl text-sm bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300`}>
          {error}
        </div>
      )}

      {otpStep === 'request' ? (
        <>
          {/* Header Section */}
          <div className="mb-6 w-full">
            <div className="text-left">
              <h1 className={`text-3xl lg:text-5xl font-bold mb-2 sm:mb-4 w-full text-gray-900 dark:text-white`}>
                Sign In with <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Code</span>
              </h1>
              <p className={`text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300`}>
                Enter your email address to receive a secure login code
              </p>
            </div>
          </div>

          <form onSubmit={handleRequestCode} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200`}>Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base bg-white border-gray-200 text-gray-900 placeholder-gray-400 dark:bg-transparent dark:border-gray-700 dark:text-white dark:placeholder-gray-500`}
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                required
              />
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                  theme="outline"
                  shape="rectangular"
                />
                <span className={`text-sm sm:mx-1 text-gray-500 dark:text-gray-400`}>or</span>
                <button
                  type="submit"
                  disabled={isLoading || !otpEmail}
                  className={`w-auto py-1 sm:py-2 px-8 sm:px-6 rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-base bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:ring-blue-500 dark:bg-gradient-to-r dark:from-blue-700 dark:to-purple-700 dark:text-white dark:hover:from-blue-800 dark:hover:to-purple-800 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </div>
            </div>
          </form>
        </>
      ) : (
        <>
          {/* Header Section */}
          <div className="mb-6 w-full">
            <div className="text-left">
              <h1 className={`text-2xl lg:text-4xl font-bold mb-2 sm:mb-4 w-full text-gray-900 dark:text-white`}>
                Verify <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Your Code</span>
              </h1>
              <p className={`text-sm sm:text-base md:text-md text-gray-600 dark:text-gray-300`}>
                We sent a 6-digit verification code to <span className="font-semibold text-blue-500">{otpEmail}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200`}>Verification Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className={`w-full px-2 py-1.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center tracking-[0.5em] text-2xl font-mono font-bold bg-white border-gray-200 text-gray-900 placeholder-gray-400 dark:bg-transparent dark:border-gray-700 dark:text-white dark:placeholder-gray-600`}
                maxLength={6}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setOtpStep('request');
                  setOtpCode('');
                  setError('');
                }}
                className={`font-semibold hover:underline text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300`}
              >
                Change Email
              </button>

              {countdown > 0 ? (
                <span className="text-gray-500 dark:text-gray-400">
                  Resend code in <strong className="text-blue-500">{countdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className={`font-semibold hover:underline flex items-center text-blue-600 dark:text-blue-400`}
                >
                  Resend code <IoMdRefresh size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOtpStep('request');
                  setOtpCode('');
                  setError('');
                }}
                className={`w-1/2 py-2.5 px-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500 dark:bg-gray-800 dark:hover:bg-dark-hover dark:text-gray-200 dark:focus:ring-gray-600`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className={`w-1/2 py-2.5 px-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:ring-blue-500 dark:bg-gradient-to-r dark:from-blue-700 dark:to-purple-700 dark:hover:from-blue-800 dark:hover:to-purple-800 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Navigation Switcher */}
      <div className="text-center mt-4 sm:mt-6 border-t pt-4 border-gray-100 dark:border-gray-700/50">
        <span className={`text-sm sm:text-base text-gray-600 dark:text-gray-400`}>Don't have an account? </span>
        {onOpenRegister ? (
          <button
            type="button"
            onClick={onOpenRegister}
            className={`font-bold hover:underline text-sm sm:text-base text-blue-700 dark:text-blue-400`}
          >
            Sign Up
          </button>
        ) : (
          <Link href="/auth" className={`font-bold hover:underline text-sm sm:text-base text-blue-700 dark:text-blue-400`}>Sign Up</Link>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
