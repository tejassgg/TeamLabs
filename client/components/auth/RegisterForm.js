import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FaGoogle, FaGithub, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GoogleLogin } from '@react-oauth/google';
import { commonTypeService } from '../../services/api';

const RegisterForm = ({ onOpenLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser, googleLogin } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);
  const [phoneExtensions, setPhoneExtensions] = useState([]);
  const fileInputRef = useRef();

  // Get invite token from URL if present
  const inviteToken = router.query.invite;

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

  // Use a single form for both steps, but validate fields per step
  const { register, handleSubmit, watch, trigger, formState: { errors }, getValues } = useForm();
  const password = watch('password');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image size must be less than 5MB');
        return;
      }

      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setError(''); // Clear any previous errors
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step 1 validation
  const validateStep1 = async () => {
    const valid = await trigger([
      'firstName',
      'lastName',
      'middleName',
      'username',
      'email',
      'phone',
    ]);
    return valid;
  };

  // Step 2 validation
  const validateStep2 = async () => {
    const valid = await trigger([
      'password',
      'confirmPassword',
      'address',
      'aptNumber',
      'city',
      'state',
      'zipCode',
      'country',
    ]);
    return valid;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');
    const valid = await validateStep1();
    if (valid) setStep(2);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setError('');
    setStep(1);
  };

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
        router.push('/dashboard');
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
    <div className="space-y-6">
      {error && (
        <div className={`px-4 py-3 rounded-lg text-sm ${resolvedTheme === 'dark'
          ? 'bg-red-900/20 border border-red-800 text-red-400'
          : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
          {error}
        </div>
      )}
      <form onSubmit={step === 2 ? handleSubmit(onSubmit) : handleNext} className="space-y-4">
        {step === 1 && (
          <>
            {/* Header and Profile Image Section */}
            <div className="flex flex-col lg:flex-row mb-4 w-full">
              {/* Left Side - Header */}
              <div className="flex flex-col justify-center w-[70%]">
                <div className="text-center lg:text-left">
                  <h1 className={`text-4xl md:text-5xl font-bold mb-4 w-full ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    Create Your <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Account</span>
                  </h1>
                  <p className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    Join thousands of teams already using TeamLabs to boost their productivity
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 justify-center lg:justify-start">
                    <div className={`flex items-center px-3 py-2 rounded-lg ${resolvedTheme === 'dark'
                      ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                      <span className="text-sm font-medium">✓ Free Trial</span>
                    </div>
                    <div className={`flex items-center px-3 py-2 rounded-lg ${resolvedTheme === 'dark'
                      ? 'bg-green-900/30 text-green-300 border border-green-700'
                      : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                      <span className="text-sm font-medium">✓ No Credit Card</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right Side - Profile Image */}
              <div className="flex flex-col items-center justify-center w-[30%]">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden mb-4 border-2 ${resolvedTheme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-100 border-gray-200'
                  }`}>
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile Preview" className="object-cover w-full h-full" />
                  ) : (
                    <span className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>No Image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className={`text-sm font-medium p-2 rounded-lg transition-colors ${resolvedTheme === 'dark'
                      ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                      }`}
                  >
                    {profileImagePreview ? 'Change Image' : 'Choose Profile Image'}
                  </button>
                  {profileImagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className={`text-sm font-medium p-2 rounded-lg transition-colors ${resolvedTheme === 'dark'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>First Name</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("firstName", { required: "First name is required" })}
                />
                {errors.firstName && (
                  <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Last Name</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("lastName", { required: "Last name is required" })}
                />
                {errors.lastName && (
                  <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Middle Name (Optional)</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("middleName")}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Role</label>
                <select
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  {...register("role", { required: "Role is required" })}
                >
                  <option value="">Select Role</option>
                  {roleOptions.map(role =>
                    <option key={role.Code} value={role.Value}>{role.Value}</option>
                  )}
                </select>
                {errors.role && (
                  <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.role.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email</label>
                <input
                  type="email"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
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
                  <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Username</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("username", { required: "Username is required" })}
                />
                {errors.username && (
                  <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{errors.username.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-4">
                <div className="w-[18%]">
                  <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Ext</label>
                  <select
                    className={`w-full px-2 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                      ? 'bg-transparent border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    {...register("phoneExtension", { required: "Country code is required" })}
                    defaultValue="+1"
                  >
                    {phoneExtensions.map(ext => (
                      <option key={ext.Code} value={ext.Code}>
                        ({ext.Value}) - {ext.Description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Phone Number</label>
                  <input
                    type="tel"
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                      ? 'bg-transparent border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                    {...register("phone", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^[0-9-+() ]{10,15}$/,
                        message: "Invalid phone number format"
                      }
                    })}
                    placeholder="(123) 456-7890"
                  />
                  {errors.phone && (
                    <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`}>{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all mt-2">
                Next
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
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
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Confirm Password</label>
              <input
                type="password"
                className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: value => value === password || "Passwords do not match"
                })}
              />
              {errors.confirmPassword && (
                <p className={`mt-1 text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>{errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Address</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("address")}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Apt Number</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("aptNumber")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>City</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("city")}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>State</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("state")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Zip Code</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("zipCode")}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Country</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${resolvedTheme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  {...register("country")}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleBack}
                className={`w-1/2 py-2.5 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${resolvedTheme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Back
              </button>
              <button
                type="submit"
                className="w-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </>
        )}
      </form>
      <div className="mt-6">
        <p className={`text-center text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
          Already have an account?{' '}
          <button onClick={onOpenLogin} className={`font-medium transition-colors ${resolvedTheme === 'dark'
            ? 'text-blue-400 hover:text-blue-300'
            : 'text-blue-600 hover:text-blue-700'
            }`}>
            Sign In
          </button>
        </p>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-2 ${resolvedTheme === 'dark'
              ? 'bg-gray-800 text-gray-400'
              : 'bg-white text-gray-500'
              }`}>Or register with</span>
          </div>
        </div>
        <div className="flex items-center justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            width="100%"
            theme="outline"
            text="signup_with"
            shape="rectangular"
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 