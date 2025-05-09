import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { FaGoogle, FaFacebook, FaGithub, FaApple, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import CompleteProfileForm from '../components/CompleteProfileForm';

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin, isAuthenticated, completeProfile } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const result = await googleLogin(response.credential);
      
      if (result.success) {
        if (result.needsAdditionalDetails) {
          setShowProfileForm(true);
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleProfileComplete = async (profileData) => {
    try {
      const result = await completeProfile(profileData);
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <CompleteProfileForm onComplete={handleProfileComplete} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login | TeamLabs</title>
      </Head>

      <div className="flex min-h-screen">
        {/* Left side - dark background with welcome message */}
        <div className="hidden lg:flex w-1/2 flex-col bg-dark text-white p-12 justify-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6">Welcome.</h1>
            <p className="text-xl">
              Streamline your project management with our robust platform. From multi-project support to dynamic dashboards, we've got you covered!
            </p>
          </div>
        </div>

        {/* Right side - login form */}
        <div className="w-full lg:w-1/2 auth-container p-6 flex items-center justify-center">
          <div className="w-full max-w-md auth-form rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h2 className="text-primary text-3xl font-bold mb-2">TeamLabs</h2>
              <h3 className="text-xl font-semibold text-dark">USER LOGIN</h3>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Username..."
                  className="input-field"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password..."
                  className="input-field pr-10"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    {...register("remember")}
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember Me
                  </label>
                </div>
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot your password?
                </a>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6">
              <p className="text-center text-sm text-gray-600 mb-4">
                Don't have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
              </p>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  useOneTap
                  theme="outline"
                  text="signin_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <button className="flex justify-center items-center w-full h-10 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <FaFacebook className="text-blue-600" />
                </button>
                <button className="flex justify-center items-center w-full h-10 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <FaGithub className="text-gray-800" />
                </button>
                <button className="flex justify-center items-center w-full h-10 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <FaApple className="text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login; 