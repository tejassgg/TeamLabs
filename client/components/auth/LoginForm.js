import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

const LoginForm = ({ onSuccess, onOpenRegister }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { login, verifyLogin2FA, googleLogin } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await login(data.usernameOrEmail, data.password);
      if (result.success) {
        if (result.twoFactorEnabled) {
          setShow2FA(true);
        } else {
          if (onSuccess) onSuccess();
          router.push('/dashboard');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during login');
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
        router.push('/dashboard');
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
        if (onSuccess) onSuccess();
        router.push('/dashboard');
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
          <h2 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Two-Factor Authentication</h2>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Please enter the 6-digit code from your authenticator app</p>
        </div>
        {error && (
          <div className={`border px-4 py-3 rounded-xl text-sm ${theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
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
              className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center tracking-widest ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShow2FA(false)}
              className={`w-1/2 px-4 py-2.5 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 focus:ring-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500'}`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className={`w-1/2 px-4 py-2.5 text-sm font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'text-white bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 focus:ring-blue-800' : 'text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500'}`}
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
        <div className={`border px-4 py-3 rounded-xl text-sm ${theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 w-full">
        <div className="text-left">
          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 w-full ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Welcome <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Back</span>
          </h1>
          <p className={`text-sm sm:text-base md:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in to your account to continue your journey
          </p>
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-4 justify-start">
            <div className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme === 'dark'
              ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
              <span className="text-xs sm:text-sm font-medium">✓ Secure Login</span>
            </div>
            <div className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme === 'dark'
              ? 'bg-green-900/30 text-green-300 border border-green-700'
              : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
              <span className="text-xs sm:text-sm font-medium">✓ Quick Access</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Username or Email Address</label>
          <input
            type="text"
            placeholder="Enter your username or email"
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base ${theme === 'dark' ? 'bg-transparent border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
            {...register("usernameOrEmail", {
              required: "Username or email is required"
            })}
          />
          {errors.usernameOrEmail && (
            <p className={`mt-1 text-xs sm:text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errors.usernameOrEmail.message}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base ${theme === 'dark' ? 'bg-transparent border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {showPassword ? <FaEyeSlash className="text-sm sm:text-base" /> : <FaEye className="text-sm sm:text-base" />}
            </button>
          </div>
          {errors.password && (
            <p className={`mt-1 text-xs sm:text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded ${theme === 'dark' ? 'bg-gray-900 text-blue-400 border-gray-700' : 'bg-white text-blue-500 border-gray-300'}`}
              {...register("remember")}
            />
            <label htmlFor="remember" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" className={`text-sm transition-colors duration-200 ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>
            Forgot password?
          </Link>
        </div>
        {/* Button layout aligned with RegisterForm */}
        <div className="mt-2 flex flex-col items-center gap-4">
          <div className="w-full flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                className={`w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-base flex items-center justify-center gap-2 ${theme === 'dark'
                  ? 'bg-white hover:bg-gray-100 focus:ring-gray-500 border border-gray-300 text-gray-900'
                  : 'bg-white hover:bg-gray-50 focus:ring-gray-500 border border-gray-300 text-gray-900'
                  }`}
              >
                <FcGoogle className="text-lg" />
                <span>Sign in</span>
              </button>
              <div className="absolute inset-0 z-10 opacity-0">
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                />
              </div>
            </div>
            <span className={`text-sm sm:mx-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>or</span>
            <button
              type="submit"
              className={`w-full sm:w-auto py-3 sm:py-3.5 px-6 rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-base ${theme === 'dark' ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white hover:from-blue-800 hover:to-purple-800 focus:ring-blue-800' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:ring-blue-500'}`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </form>

      <div className="text-center mt-4 sm:mt-6">
        <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Don't have an account? </span>
        {onOpenRegister ? (
          <button
            type="button"
            onClick={onOpenRegister}
            className={`font-bold hover:underline text-sm sm:text-base ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}
          >
            Sign Up
          </button>
        ) : (
          <Link href="/auth" className={`font-bold hover:underline text-sm sm:text-base ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>Sign Up</Link>
        )}
      </div>
    </div>
  );
};

export default LoginForm; 
