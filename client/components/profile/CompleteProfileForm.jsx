import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { authService, commonTypeService } from '../../services/api';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCity, FaGlobe, FaTimesCircle, FaUserCircle, FaTimes } from 'react-icons/fa';
import CustomModal from '../shared/CustomModal';
import CustomDropdown from '../shared/CustomDropdown';

const CompleteProfileForm = ({ onComplete, onCancel, mode = 'onboarding' }) => {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const { refreshOrganizations } = useGlobal(); // Use global context for refresh
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    middleName: '',
    address: '',
    aptNumber: '',
    zipCode: '',
    city: '',
    state: '',
    country: '',
    role: '',
    phoneExtension: ''
  });
  const [roleOptions, setRoleOptions] = useState([]);
  const [phoneExtensions, setPhoneExtensions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch and populate user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await authService.getUserProfile();
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          middleName: profile.middleName || '',
          address: profile.address || '',
          aptNumber: profile.aptNumber || '',
          zipCode: profile.zipCode || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || '',
          role: profile.role || 'User',
          phoneExtension: profile.phoneExtension || ''
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch roles and phone extensions for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const { userRoles, phoneExtensions } = await commonTypeService.getDropdownData();
        // Filter out Admin role if user is not an admin
        const filteredRoles = userRoles.filter(role => {
          if (user?.role !== 'Admin' && role.Value === 'Admin') {
            return false;
          }
          return true;
        });
        setRoleOptions(filteredRoles);
        setPhoneExtensions(phoneExtensions);
      } catch (err) {
        setRoleOptions([]);
        setPhoneExtensions([]);
      }
    };
    fetchDropdownData();
  }, [user?.role]);

  const totalSteps = 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authService.completeProfile(formData);
      
      // Only update onboarding status if we're in onboarding mode, not profile editing mode
      if (mode === 'onboarding') {
        // Calculate the current onboarding progress
        const currentProgress = {
          profileComplete: true, // This step is being completed
          organizationComplete: false,
          teamCreated: false,
          projectCreated: false,
          onboardingComplete: false
        };
        
        // Advance onboarding step to 'organization' after profile completion
        await authService.updateOnboardingStatus(false, 'organization', currentProgress);
      }
      
      // Refresh global context (user overview, onboarding, etc.)
      if (typeof refreshOrganizations === 'function') {
        await refreshOrganizations();
      }
      
      // Pass profile completion data without organization info
      onComplete({
        ...data
      });
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Row 1: First Name | Last Name */}
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="First Name"
                />
              </div>
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="Last Name"
                />
              </div>
            </div>
            {/* Row 2: Middle Name | Ext | Phone Number */}
            <div className="flex gap-4 mt-4">
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  placeholder="Optional"
                />
              </div>
              <div className="w-[12%] min-w-[70px]">
                <div className="relative z-[9999]" >
                  <CustomDropdown
                    value={formData.phoneExtension}
                    onChange={(value) => setFormData({ ...formData, phoneExtension: value })}
                    options={phoneExtensions.map(ext => ({
                      value: ext.Value,
                      label: ext.Value + ' - ' + ext.Description
                    }))}
                    placeholder="Ext"
                    label="Ext"
                    required={true}
                    variant="default"
                    size="md"
                    width="w-full"
                    maxHeight="max-h-64"
                    className="[&>button]:border [&>button]:border-solid"
                  />
                </div>
              </div>
              <div className="w-[36%]">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="+1 (555) 555-5555"
                />
              </div>
            </div>
            {/* Row 3: Role */}
            <div className="flex gap-4 mt-4">
              <div className="w-1/2">
                <div className="relative z-[9999]">
                  <CustomDropdown
                    value={formData.role}
                    onChange={(value) => setFormData({ ...formData, role: value })}
                    options={roleOptions.map(role => ({
                      value: role.Value,
                      label: role.Value
                    }))}
                    placeholder="Select Role"
                    label="Role"
                    required={true}
                    variant="default"
                    size="md"
                    width="w-full"
                    maxHeight="max-h-64"
                    className="[&>button]:border [&>button]:border-solid"
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="Enter your street address"
                />
              </div>
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Apt/Suite Number</label>
                <input
                  type="text"
                  name="aptNumber"
                  value={formData.aptNumber}
                  onChange={(e) => setFormData({ ...formData, aptNumber: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="12345"
                />
              </div>
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="New York"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="NY"
                />
              </div>
              <div className="w-1/2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-transparent text-white focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                  }`}
                  required
                  placeholder="United States"
                />
              </div>
            </div>

          </>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className={`${theme === 'dark' ? 'bg-transparent border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl shadow-lg p-8 divide-y divide-blue-100 dark:divide-gray-800`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
                {/* Contact Details */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    <FaUser className="text-blue-500" />
                    Contact Details
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-4">
                      <FaEnvelope className="text-blue-400 text-xl" />
                      <div>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">Email Address</span>
                        <span className={`block text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{user?.email}</span>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <FaPhone className="text-blue-400 text-xl" />
                      <div>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">Phone Number</span>
                        <span className={`block text-base font-medium ${formData.phone ? (theme === 'dark' ? 'text-white' : 'text-gray-800') : 'text-yellow-500'}`}>
                          {formData.phone || <span className="italic flex items-center gap-1"><FaTimesCircle className="inline text-yellow-400" /> Not provided</span>}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <FaUserCircle className="text-blue-400 text-xl" />
                      <div>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">Role</span>
                        <span className={`block text-base font-medium ${formData.role ? (theme === 'dark' ? 'text-white' : 'text-gray-800') : 'text-yellow-500'}`}>
                          {roleOptions.find(role => role.Value === formData.role)?.Value || <span className="italic flex items-center gap-1"><FaTimesCircle className="inline text-yellow-400" /> Not provided</span>}
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
                {/* Location Details */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    <FaMapMarkerAlt className="text-blue-500" />
                    Location Details
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-4">
                      <FaMapMarkerAlt className="text-blue-400 text-xl" />
                      <div>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">Street Address</span>
                        <span className={`block text-base font-medium ${formData.address ? (theme === 'dark' ? 'text-white' : 'text-gray-800') : 'text-yellow-500'}`}>
                          {formData.address || <span className="italic flex items-center gap-1"><FaTimesCircle className="inline text-yellow-400" /> Not provided</span>}
                          {formData.aptNumber && (
                            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} ml-1`}>#{formData.aptNumber}</span>
                          )}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <FaCity className="text-blue-400 text-xl" />
                      <div>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">City</span>
                        <span className={`block text-base font-medium ${formData.city ? (theme === 'dark' ? 'text-white' : 'text-gray-800') : 'text-yellow-500'}`}>
                          {formData.city || <span className="italic flex items-center gap-1"><FaTimesCircle className="inline text-yellow-400" /> Not provided</span>}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <FaGlobe className="text-blue-400 text-xl" />
                      <div>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">State</span>
                        <span className={`block text-base font-medium ${formData.state ? (theme === 'dark' ? 'text-white' : 'text-gray-800') : 'text-yellow-500'}`}>
                          {formData.state || <span className="italic flex items-center gap-1"><FaTimesCircle className="inline text-yellow-400" /> Not provided</span>}
                        </span>
                      </div>
                    </li>
                    <li className="flex items-center gap-4">
                      <FaGlobe className="text-blue-400 text-xl" />
                      <div>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">Country</span>
                        <span className={`block text-base font-medium ${formData.country ? (theme === 'dark' ? 'text-white' : 'text-gray-800') : 'text-yellow-500'}`}>
                          {formData.country || <span className="italic flex items-center gap-1"><FaTimesCircle className="inline text-yellow-400" /> Not provided</span>}
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Update Profile Information</h3>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4">
          {renderStepContent()}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Saving...' : currentStep < totalSteps ? 'Next' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfileForm; 