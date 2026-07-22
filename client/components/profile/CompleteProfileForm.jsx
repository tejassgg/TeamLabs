import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { authService, commonTypeService } from '../../services/api';
import { FaUser, FaEnvelope, FaPhone, FaTimesCircle, FaUserCircle, FaTimes } from 'react-icons/fa';
import CustomDropdown from '../shared/CustomDropdown';

const CompleteProfileForm = ({ onComplete, onCancel, mode = 'onboarding', profileDraft, setProfileDraft }) => {
  const {userDetails} = useGlobal();
  const { theme } = useTheme();
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

  // Initialize from draft if available, else fetch user profile once
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (profileDraft) {
        setFormData(prev => ({ ...prev, ...profileDraft }));
        return;
      }
      try {
        const profile = await authService.getUserProfile();
        if (!mounted) return;
        const next = {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          middleName: profile.middleName || '',
          address: '',
          aptNumber: '',
          zipCode: '',
          city: '',
          state: '',
          country: '',
          role: profile.role || 'User',
          phoneExtension: profile.phoneExtension || ''
        };
        setFormData(next);
        setProfileDraft && setProfileDraft(next);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    init();
    return () => { mounted = false; };
  }, [profileDraft, setProfileDraft]);

  // Fetch roles and phone extensions for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const { userRoles, phoneExtensions } = await commonTypeService.getDropdownData();
        // Filter out Admin role if user is not an admin
        const filteredRoles = userRoles.filter(role => {
          if (userDetails?.role !== 'Admin' && role.Value === 'Admin') {
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
  }, [userDetails?.role]);

  const totalSteps = 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.completeProfile(formData, mode === 'onboarding', 'organization');
      
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
    return (
      <>
        {/* Row 1: Role Dropdown (above everything) */}
        <div className="w-full">
          <div className="relative z-[9999]">
            <CustomDropdown
              value={formData.role}
              onChange={(value) => { setFormData({ ...formData, role: value }); setProfileDraft && setProfileDraft({ ...formData, role: value }); }}
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

        {/* Row 2: First Name | Last Name */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="w-full sm:w-1/2">
            <label className={`block text-sm font-medium text-gray-900 dark:text-white mb-2`}>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={e => { const v = e.target.value; setFormData({ ...formData, firstName: v }); setProfileDraft && setProfileDraft({ ...formData, firstName: v }); }}
              className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:border-gray-700 dark:bg-transparent dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:placeholder-gray-400`}
              required
              placeholder="First Name"
            />
          </div>
          <div className="w-full sm:w-1/2">
            <label className={`block text-sm font-medium text-gray-900 dark:text-white mb-2`}>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={e => { const v = e.target.value; setFormData({ ...formData, lastName: v }); setProfileDraft && setProfileDraft({ ...formData, lastName: v }); }}
              className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 border-gray-200 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:border-gray-700 dark:bg-transparent dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:placeholder-gray-400`}
              required
              placeholder="Last Name"
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <form id="onboarding-profile-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4">
          {renderStepContent()}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {mode !== 'onboarding' && (
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CompleteProfileForm;