import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser, googleLogin, isAuthenticated } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const fileInputRef = useRef();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      let imageUrl = '';
      if (profileImage) {
        // Upload image to backend
        const formData = new FormData();
        formData.append('image', profileImage);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await res.json();
        imageUrl = result.url;
      }
      const result = await registerUser({ ...data, profileImage: imageUrl });
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await googleLogin(credentialResponse.credential);
      if (response.success) {
        router.push('/dashboard');
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
    <>
      <Head>
        <title>Register | TeamLabs</title>
      </Head>

      <div className="flex min-h-screen">
        {/* Left side - dark background with welcome message */}
        <div className="hidden lg:flex w-1/2 flex-col bg-dark text-white p-12 justify-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6">Join Us.</h1>
            <p className="text-xl">
              Create your account and start streamlining your project management today. Our robust platform offers everything you need.
            </p>
          </div>
        </div>

        {/* Right side - registration form */}
        <div className="w-full lg:w-1/2 auth-container p-6 flex items-center justify-center">
          <div className="w-full max-w-md auth-form rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h2 className="text-primary text-3xl font-bold mb-2">TeamLabs</h2>
              <h3 className="text-xl font-semibold text-dark">REGISTER</h3>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile Preview" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button type="button" className="btn btn-google" onClick={() => fileInputRef.current.click()}>
                  Choose Profile Image
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="First Name"
                    className="input-field"
                    {...register("firstName", { required: "First name is required" })}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="input-field"
                    {...register("lastName", { required: "Last name is required" })}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Middle Name (Optional)"
                  className="input-field"
                  {...register("middleName")}
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Username"
                  className="input-field"
                  {...register("username", { required: "Username is required" })}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
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

              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="input-field"
                  {...register("phone")}
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="input-field"
                  {...register("password", { 
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="input-field"
                  {...register("confirmPassword", { 
                    required: "Please confirm your password",
                    validate: value => value === password || "Passwords do not match"
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Address"
                    className="input-field"
                    {...register("address")}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Apt Number"
                    className="input-field"
                    {...register("aptNumber")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="City"
                    className="input-field"
                    {...register("city")}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="State"
                    className="input-field"
                    {...register("state")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Zip Code"
                    className="input-field"
                    {...register("zipCode")}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Country"
                    className="input-field"
                    {...register("country")}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <div className="mt-6">
              <p className="text-center text-sm text-gray-600 mb-4">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
              </p>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or register with</span>
                </div>
              </div>

              <div className="mt-4">
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                  useOneTap
                  theme="outline"
                  text="signup_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register; 