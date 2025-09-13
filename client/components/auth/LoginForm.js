import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaGithub } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

const LoginForm = ({ onSuccess }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { login, verifyLogin2FA, googleLogin } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();

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
        // if (response.needsAdditionalDetails) {
        //   router.push('/profile');
        // } else {
        // router.push('/dashboard');
        // }
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
          <h2 className={`text-xl font-bold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Two-Factor Authentication</h2>
          <p className={`text-sm mb-4 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Please enter the 6-digit code from your authenticator app</p>
        </div>
        {error && (
          <div className={`border px-4 py-3 rounded-xl text-sm ${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
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
              className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center tracking-widest ${resolvedTheme === 'dark' ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShow2FA(false)}
              className={`w-1/2 px-4 py-2.5 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${resolvedTheme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 focus:ring-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500'}`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className={`w-1/2 px-4 py-2.5 text-sm font-medium rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${resolvedTheme === 'dark' ? 'text-white bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 focus:ring-blue-800' : 'text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500'}`}
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
        <div className={`border px-4 py-3 rounded-xl text-sm ${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Username or Email Address</label>
          <input
            type="text"
            placeholder="Enter your username or email"
            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${resolvedTheme === 'dark' ? 'bg-transparent border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
            {...register("usernameOrEmail", {
              required: "Username or email is required"
            })}
          />
          {errors.usernameOrEmail && (
            <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errors.usernameOrEmail.message}</p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${resolvedTheme === 'dark' ? 'bg-transparent border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
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
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${resolvedTheme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded ${resolvedTheme === 'dark' ? 'bg-gray-900 text-blue-400 border-gray-700' : 'bg-white text-blue-500 border-gray-300'}`}
              {...register("remember")}
            />
            <label htmlFor="remember" className={`ml-2 block text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" className={`text-sm transition-colors duration-200 ${resolvedTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-lg ${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white hover:from-blue-800 hover:to-purple-800 focus:ring-blue-800' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:ring-blue-500'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="flex items-center my-4">
        <div className={`flex-grow border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
        <span className={`mx-4 text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>or</span>
        <div className={`flex-grow border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
      </div>

      <div className="flex flex-col gap-3">
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={handleGoogleLoginError}
          theme={resolvedTheme === 'dark' ? 'filled_black' : 'outline'}
          width="100%"
        />
        {/* Example: Add GitHub login if needed */}
        {/* <button className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-lg ${resolvedTheme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300'}`}> */}
        {/*   <FaGithub className="text-xl" /> Login with GitHub */}
        {/* </button> */}
      </div>

      <div className="text-center mt-4">
        <span className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Don't have an account? </span>
        <Link href="/register" className={`font-bold hover:underline ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>Sign Up</Link>
      </div>
    </div>
  );
};

export default LoginForm; 