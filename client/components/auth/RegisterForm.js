import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { GoogleLogin } from '@react-oauth/google';
import { commonTypeService } from '../../services/api';


const RegisterForm = ({ onOpenLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser, googleLogin } = useGlobal();
  const { theme } = useTheme();
  const router = useRouter();
  const inviteToken = (router?.query?.inviteToken || router?.query?.invite || null);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);
  const [phoneExtensions, setPhoneExtensions] = useState([]);
  const fileInputRef = useRef();

  // Fetch user roles and phone extensions when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roles, extensions] = await Promise.all([
          commonTypeService.getUserRoles(),
          commonTypeService.getPhoneExtensions()
        ]);

        // Filter out Admin role for non-admin users
        const filteredRoles = roles.filter(role => role.Value !== 'Admin');
        setRoleOptions(filteredRoles);
        setPhoneExtensions(extensions);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data');
      }
    };
    fetchData();
  }, []);

  // Use a single form with real-time validation
  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm({ mode: 'onChange' });
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Re-validate confirm password whenever password changes
  useEffect(() => {
    if (password) {
      trigger('confirmPassword');
    }
  }, [password, confirmPassword, trigger]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      let imageUrl = '';
      if (profileImage) {
        const formData = new FormData();
        formData.append('image', profileImage);

        const res = await fetch('/api/local-upload?type=profile', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }

        const result = await res.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to upload profile image');
        }

        imageUrl = result.url;
      }

      const result = await registerUser({ ...data, profileImage: imageUrl, inviteToken });
      if (result.success) {
        showToast('Registration Successful!', 'success');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Social login handlers (unchanged)
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await googleLogin(credentialResponse.credential, inviteToken);
      if (response.success) {
        router.push('/dashboard');
      }
      else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to register with Google');
      console.error(error);
    }
  };
  const handleGoogleLoginError = () => {
    setError('Google login failed');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className={`px-4 py-3 rounded-lg text-sm ${theme === 'dark'
          ? 'bg-red-900/20 border border-red-800 text-red-400'
          : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        {true && (
          <>
            {/* Header and Profile Image Section */}
            <div className="flex flex-col justify-start w-full">
              <div className="text-left">
                <h1 className={`text-3xl lg:text-5xl font-bold mb-2 sm:mb-4 w-full ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create Your <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Account</span>
                </h1>
                <p className={`text-sm sm:text-base md:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  Join TeamLabs to boost your productivity
                </p>
                <div className="mt-3 sm:mt-4 flex flex-row gap-2 sm:gap-4 justify-start">
                  <div className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme === 'dark'
                    ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                    <span className="text-xs sm:text-sm font-medium">✓ Free Trial</span>
                  </div>
                  <div className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${theme === 'dark'
                    ? 'bg-green-900/30 text-green-300 border border-green-700'
                    : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                    <span className="text-xs sm:text-sm font-medium">✓ No Credit Card</span>
                  </div>
                </div>
              </div>
            </div>

            {/* First and Last Name removed as requested */}
            {/* Role dropdown removed as requested */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />
                {errors.email && (
                  <p className={`mt-1 text-xs sm:text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.email.message}</p>
                )}
              </div>
              {/* Username removed as requested */}
            </div>
            {/* Phone and address removed as per request */}
          </>
        )}
        {true && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
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
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {showPassword ? <FaEyeSlash className="text-sm sm:text-base" /> : <FaEye className="text-sm sm:text-base" />}
                  </button>
                </div>
                {errors.password && (
                  <p className={`mt-1 text-xs sm:text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: value => value === password || "Passwords do not match"
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {showConfirmPassword ? <FaEyeSlash className="text-sm sm:text-base" /> : <FaEye className="text-sm sm:text-base" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className={`mt-1 text-xs sm:text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            {/* Address fields removed as per request */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="w-full flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                  width="100%"
                  theme="outline"
                  text="signup_with"
                  shape="rectangular"
                />
                <span className={`text-sm sm:mx-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>or</span>
                <button
                  type="submit"
                  className={`w-full sm:w-auto py-3 sm:py-3.5 px-6 rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-base ${theme === 'dark' ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white hover:from-blue-800 hover:to-purple-800 focus:ring-blue-800' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:ring-blue-500'}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
              <div className="text-center">
                <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Already have an account?  </span>
                {onOpenLogin ? (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className={`font-bold hover:underline text-sm sm:text-base ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}
                  >Sign In
                  </button>
                ) : (
                  <Link href="/auth?type=login" className={`font-bold hover:underline text-sm sm:text-base ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>Sign In</Link>
                )}
              </div>
            </div>
          </>
        )}
      </form>
      {/* Footer Google block removed; combined into button row above */}
    </div>
  );
};

export default RegisterForm; 
