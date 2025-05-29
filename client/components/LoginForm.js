import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaGithub } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '../context/ToastContext';

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
    console.log(credentialResponse);
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
          <h2 className="text-xl font-bold text-gray-700 mb-2">Two-Factor Authentication</h2>
          <p className="text-sm text-gray-500 mb-4">
            Please enter the 6-digit code from your authenticator app
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
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
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center tracking-widest"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShow2FA(false)}
              className="w-1/2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-1/2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Username or Email Address</label>
          <input
            type="text"
            placeholder="Enter your username or email"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            {...register("usernameOrEmail", {
              required: "Username or email is required"
            })}
          />
          {errors.usernameOrEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.usernameOrEmail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
              {...register("remember")}
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600 transition-colors duration-200">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            width="100%"
            theme="outline"
            text="signin_with"
            shape="rectangular"
          />
        </div>
        <button className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200">
          <FaGithub className="text-gray-800 mr-2" />
          <span className="text-sm font-medium text-gray-700">GitHub</span>
        </button>
      </div>
    </div>
  );
};

export default LoginForm; 