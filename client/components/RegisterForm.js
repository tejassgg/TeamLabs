import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaGithub, FaApple } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import AddressForm from './AddressForm';

const RegisterForm = ({ onSuccess }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState(null);
  const fileInputRef = useRef();
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBasicInfoSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      let imageUrl = '';
      if (profileImage) {
        const formData = new FormData();
        formData.append('image', profileImage);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to upload image');
        }
        const result = await res.json();
        imageUrl = result.url;
      }
      setBasicInfo({ ...data, profileImage: imageUrl });
      setRegistrationStep(2);
    } catch (err) {
      setError(err.message || 'An error occurred while uploading image');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = async (addressData) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await registerUser({ ...basicInfo, ...addressData });
      if (result.success) {
        if (onSuccess) onSuccess();
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

  if (registrationStep === 2) {
    return <AddressForm onSubmit={handleAddressSubmit} isLoading={isLoading} />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(handleBasicInfoSubmit)} className="space-y-4" encType="multipart/form-data">
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
        <input
          type="text"
          placeholder="Full Name"
          className="input-field"
          {...register("firstName", { required: "Full name is required" })}
        />
        <input
          type="email"
          placeholder="Email ID"
          className="input-field"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })}
        />
        <input
          type="text"
          placeholder="Username"
          className="input-field"
          {...register("username", { required: "Username is required" })}
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <input
          type="tel"
          placeholder="Phone No."
          className="input-field"
          {...register("phone")}
        />
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </button>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or sign up with</span>
        </div>
      </div>
      <div className="flex justify-center gap-3 mt-2">
        <button className="social-btn" title="Sign up with Google"><FaGoogle className="text-[#EA4335]" /></button>
        <button className="social-btn" title="Sign up with Facebook"><FaFacebook className="text-[#1877F3]" /></button>
        <button className="social-btn" title="Sign up with GitHub"><FaGithub className="text-gray-800" /></button>
        <button className="social-btn" title="Sign up with Apple"><FaApple className="text-black" /></button>
      </div>
    </div>
  );
};

export default RegisterForm; 