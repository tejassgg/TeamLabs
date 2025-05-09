import { useState, useEffect } from 'react';
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
    organizationID: ''
  });
  const [orgOptions, setOrgOptions] = useState([]);
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
          organizationID: profile.organizationID || ''
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch organizations for dropdown
  useEffect(() => {
    commonTypeService.getOrganizations()
      .then(setOrgOptions)
      .catch(() => setOrgOptions([]));
  }, []);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

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

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex items-center ${
                step <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step <= currentStep
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                {step}
              </div>
              <span className="ml-2 text-sm font-medium">
                {step === 1 ? 'Contact' : step === 2 ? 'Address' : 'Review'}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="+1 (555) 555-5555"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <select
                name="organizationID"
                value={formData.organizationID}
                onChange={e => setFormData({ ...formData, organizationID: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="Enter your street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apartment/Suite Number</label>
              <input
                type="text"
                name="aptNumber"
                value={formData.aptNumber}
                onChange={(e) => setFormData({ ...formData, aptNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="United States"
              />
            </div>
          </>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Review Your Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="mt-1">{formData.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Middle Name</p>
                  <p className="mt-1">{formData.middleName || 'Not provided'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1">
                    {formData.address}
                    {formData.aptNumber && `, ${formData.aptNumber}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">City</p>
                  <p className="mt-1">{formData.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">State</p>
                  <p className="mt-1">{formData.state}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ZIP Code</p>
                  <p className="mt-1">{formData.zipCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Country</p>
                  <p className="mt-1">{formData.country}</p>
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
        <h3 className="text-lg font-medium text-gray-900">Update Profile Information</h3>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderStepContent()}
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfileForm; 