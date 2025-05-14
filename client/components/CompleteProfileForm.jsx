import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService, commonTypeService } from '../services/api';

const CompleteProfileForm = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    middleName: '',
    address: '',
    aptNumber: '',
    zipCode: '',
    city: '',
    state: '',
    country: '',
    organizationID: '',
    role: '',
    phoneExtension: ''
  });
  const [orgOptions, setOrgOptions] = useState([]);
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
          phone: profile.phone || '',
          middleName: profile.middleName || '',
          address: profile.address || '',
          aptNumber: profile.aptNumber || '',
          zipCode: profile.zipCode || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || '',
          organizationID: profile.organizationID || '',
          role: profile.role || 'User',
          phoneExtension: profile.phoneExtension || ''
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch organizations and roles for dropdowns
  useEffect(() => {

    Promise.all([
      commonTypeService.getOrganizations(),
      commonTypeService.getUserRoles(),
      commonTypeService.getPhoneExtensions()
    ])
      .then(([orgs, roles, extensions]) => {
        setOrgOptions(orgs);
        // Filter out Admin role if user is not an admin
        const filteredRoles = roles.filter(role => {
          // If user is not an admin, hide the Admin role
          if (user?.role !== 'Admin' && role.Value === 'Admin') {
            return false;
          }
          return true;
        });
        setRoleOptions(filteredRoles);
        setPhoneExtensions(extensions);
      })
      .catch(() => {
        setOrgOptions([]);
        setRoleOptions([]);
      });
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
      onComplete(data);
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
            <div>
              <div className="flex gap-4">
                <div className="w-[25%]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ext</label>
                  <select
                    name="phoneExtension"
                    value={formData.phoneExtension}
                    onChange={e => setFormData({ ...formData, phoneExtension: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  >
                    {phoneExtensions.map(ext => (
                      <option key={ext.Code} value={ext.Value}>{ext.Value}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                    placeholder="+1 (555) 555-5555"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              >
                <option value="">Select Role</option>
                {roleOptions.map(role => (
                  <option key={role.Code} value={role.Value}>{role.Value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
              <select
                name="organizationID"
                value={formData.organizationID}
                onChange={e => setFormData({ ...formData, organizationID: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              >
                <option value="">Select Organization</option>
                {orgOptions.map(org => (
                  <option key={org._id} value={org.Code}>{org.Value}</option>
                ))}
              </select>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                placeholder="Enter your street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apartment/Suite Number</label>
              <input
                type="text"
                name="aptNumber"
                value={formData.aptNumber}
                onChange={(e) => setFormData({ ...formData, aptNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                placeholder="12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                placeholder="NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
                placeholder="United States"
              />
            </div>
          </>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Review Your Information</h3>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="mt-1 text-gray-700">{formData.phone || 'Not provided'}</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">Middle Name</p>
                  <p className="mt-1 text-gray-700">{formData.middleName || 'Not provided'}</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="mt-1 text-gray-700">
                    {roleOptions.find(role => role.Code === formData.role)?.Value || 'Not provided'}
                  </p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">Organization</p>
                  <p className="mt-1 text-gray-700">
                    {orgOptions.find(org => org.Code === formData.organizationID)?.Value || 'Not provided'}
                  </p>
                </div>
                <div className="col-span-2 bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1 text-gray-700">
                    {formData.address}
                    {formData.aptNumber && `, ${formData.aptNumber}`}
                  </p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">City</p>
                  <p className="mt-1 text-gray-700">{formData.city}</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">State</p>
                  <p className="mt-1 text-gray-700">{formData.state}</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">ZIP Code</p>
                  <p className="mt-1 text-gray-700">{formData.zipCode}</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-500">Country</p>
                  <p className="mt-1 text-gray-700">{formData.country}</p>
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
        <h3 className="text-lg font-medium text-gray-700">Update Profile Information</h3>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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