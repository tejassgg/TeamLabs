import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Link from 'next/link';
import { authService, commonTypeService } from '../services/api';
import CompleteProfileForm from '../components/profile/CompleteProfileForm';
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding, FaCity, FaGlobe,
  FaGithub, FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaEdit, FaHistory,
  FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaGoogle, FaSignInAlt, FaSignOutAlt, FaUserEdit,
  FaBuilding as FaOrganization, FaChevronRight, FaUserCircle, FaChartLine
} from 'react-icons/fa';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  });
  const [isEditing, setIsEditing] = useState(false);

  // Add page size options
  const pageSizeOptions = [5, 10, 15];

  // Add handler for page size change
  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({
      ...prev,
      limit: newSize,
      page: 1 // Reset to first page when changing page size
    }));
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfile = await authService.getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await authService.getUserActivities(pagination.page, pagination.limit);
        setActivities(response.activities);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching user activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };

    const fetchOrganizations = async () => {
      try {
        const response = await commonTypeService.getOrganizations();
        setOrganizations(response);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchUserProfile();
    fetchUserActivities();
    fetchOrganizations();
  }, [pagination.page, pagination.limit]);

  const handleProfileComplete = async (updatedProfile) => {
    try {
      // Update the profile state
      setProfile(updatedProfile);
      // Update the user's organization ID in the auth context
      if (updatedProfile.organizationID) {
        updateUser({ ...user, organizationID: updatedProfile.organizationID });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (activity) => {
    switch (activity.type) {
      case 'login':
        return activity.loginMethod === 'google' ? (
          <FaGoogle className="text-blue-500" size={24} />
        ) : (
          <FaSignInAlt className="text-green-500" size={24} />
        );
      case 'logout':
        return <FaSignOutAlt className="text-red-500" size={24} />;
      case 'login_failed':
        return <FaTimesCircle className="text-red-500" size={24} />;
      case 'profile_update':
        return <FaUserEdit className="text-blue-500" size={24} />;
      default:
        return <FaHistory className="text-gray-500" size={24} />;
    }
  };

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'login':
        return activity.loginMethod === 'google'
          ? 'Google Login'
          : 'Email Login';
      case 'login_failed':
        return activity.loginMethod === 'google'
          ? 'Google Login Failed'
          : 'Login Failed';
      default:
        return activity.type.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getDateRange = (activities) => {
    if (activities.length === 0) return null;

    const dates = activities.map(a => new Date(a.timestamp));
    const oldest = new Date(Math.min(...dates));
    const newest = new Date(Math.max(...dates));

    return {
      oldest: formatDate(oldest),
      newest: formatDate(newest)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile | TeamLabs</title>
      </Head>
      <div className="mx-auto">

        <div className="mx-auto sm:px-6 lg:px-1">
          {/* Welcome Message */}
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
            Manage your profile information and view your activity history
          </p>

          {/* Full Width Tabs */}
          <div className="mb-6">
            <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${activeTab === 'profile'
                    ? theme === 'dark' ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                    : theme === 'dark' ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <FaUserCircle size={16} />
                  <span>Profile Information</span>
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`${activeTab === 'activity'
                    ? theme === 'dark' ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                    : theme === 'dark' ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <FaChartLine size={16} />
                  <span>Activity History</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Content */}
            <div className="lg:col-span-2">

              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div className={`${theme === 'dark' ? 'bg-transparent' : 'bg-white'} rounded-2xl shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className={`text-2xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <FaUserCircle className="text-blue-500" size={28} />
                        Review Your Information
                      </h2>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <FaEdit />
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-4">
                        <CompleteProfileForm
                          mode="editing"
                          onComplete={(updatedProfile) => {
                            setProfile(updatedProfile);
                            setIsEditing(false);
                          }}
                          onCancel={() => setIsEditing(false)}
                        />
                      </div>
                    ) : (
                      <div className="divide-y divide-blue-100 dark:divide-gray-800">
                        {/* Contact & Location Details Unified Card */}
                        <div className="pb-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.email || '-'}</div>
                                  </div>
                                </li>
                                <li className="flex items-center gap-4">
                                  <FaPhone className="text-blue-400 text-xl" />
                                  <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Phone</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.phone || '-'}</div>
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
                                  <FaBuilding className="text-blue-400 text-xl" />
                                  <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Address</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.address || '-'}</div>
                                  </div>
                                </li>
                                <li className="flex items-center gap-4">
                                  <FaCity className="text-blue-400 text-xl" />
                                  <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>City</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.city || '-'}</div>
                                  </div>
                                </li>
                                <li className="flex items-center gap-4">
                                  <FaGlobe className="text-blue-400 text-xl" />
                                  <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>State</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.state || '-'}</div>
                                  </div>
                                </li>
                                <li className="flex items-center gap-4">
                                  <FaGlobe className="text-blue-400 text-xl" />
                                  <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Zip Code</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.zipCode || '-'}</div>
                                  </div>
                                </li>
                                <li className="flex items-center gap-4">
                                  <FaGlobe className="text-blue-400 text-xl" />
                                  <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Country</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.country || '-'}</div>
                                  </div>
                                </li>
                                <li className="flex items-center gap-4">
                                  <FaOrganization className="text-blue-400 text-xl" />
                                  <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Organization</div>
                                    <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.orgName || profile?.organization?.name || '-'}</div>
                                  </div>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity History Tab */}
              {activeTab === 'activity' && (
                <div className={`${theme === 'dark' ? 'bg-transparent' : 'bg-white'} rounded-xl shadow-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="p-8">
                    <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity History</h2>
                    {loadingActivities ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : activities.length > 0 ? (
                      <>
                        {/* Activity Statistics */}
                        <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-gray-50'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                            <div className={`p-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'} rounded-xl shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total Activities</p>
                              <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{pagination.total}</p>
                            </div>
                            <div className={`p-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'} rounded-xl shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Date Range</p>
                              <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {getDateRange(activities) ? `${getDateRange(activities).oldest} to ${getDateRange(activities).newest}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Activity List */}
                        <div className="space-y-2">
                          {activities.map((activity) => (
                            <div
                              key={activity._id}
                              className={`flex items-center space-x-3 p-4 rounded-xl ${theme === 'dark' ? 'hover:bg-gray-800/50 border border-gray-700' : 'hover:bg-gray-50'} transition-colors duration-200`}
                            >
                              <div className="flex-shrink-0">
                                {getActivityIcon(activity)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`font-medium text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{getActivityTitle(activity)}</p>
                                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} whitespace-nowrap ml-2`}>
                                    {formatDate(activity.timestamp)}
                                  </span>
                                </div>
                                {activity.details && (
                                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>{activity.details}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Information and Controls */}
                        <div className="mt-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <div className={`p-4 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'} rounded-xl shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Showing</p>
                              <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <label htmlFor="pageSize" className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Items per page:
                              </label>
                              <select
                                id="pageSize"
                                value={pagination.limit}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className={`block w-20 rounded-xl shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${theme === 'dark' ? 'border-gray-700 bg-transparent text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                              >
                                {pageSizeOptions.map(size => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Pagination Controls */}
                          {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-2">
                              <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className={`px-4 py-2 rounded-xl ${pagination.page === 1
                                  ? theme === 'dark' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                  }`}
                              >
                                Previous
                              </button>

                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Page {pagination.page} of {pagination.totalPages}
                              </span>

                              <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className={`px-4 py-2 rounded-xl ${pagination.page === pagination.totalPages
                                  ? theme === 'dark' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                  }`}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FaHistory className="mx-auto mb-4" size={32} />
                        <p>No activity history available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Profile Header and Social Links */}
            <div className="lg:col-span-1">
              <div className={`${theme === 'dark' ? 'bg-transparent' : 'bg-white'} rounded-xl shadow-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`relative h-40 ${theme === 'dark' ? 'bg-transparent' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                      <img
                        src={user?.profileImage || profile?.profileImage || '/static/default-avatar.png'}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/static/default-avatar.png';
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-16 pb-8 px-8 text-center">
                  <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                    {profile?.firstName} {profile?.middleName} {profile?.lastName}
                  </h1>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} mb-4`}>{profile?.username}</p>

                  {/* Social Media Links */}
                  <div className="mt-6">
                    <button
                      onClick={() => setShowSocialLinks(!showSocialLinks)}
                      className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'} transition-colors duration-200 flex items-center justify-center mx-auto space-x-2`}
                    >
                      <span>{showSocialLinks ? 'Hide Social Links' : 'Show Social Links'}</span>
                      <FaGlobe className="text-sm" />
                    </button>

                    {showSocialLinks && (
                      <div className="mt-4 flex justify-center space-x-4">
                        <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'} transition-colors duration-200`}>
                          <FaGithub size={24} />
                        </a>
                        <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'} transition-colors duration-200`}>
                          <FaLinkedin size={24} />
                        </a>
                        <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'} transition-colors duration-200`}>
                          <FaTwitter size={24} />
                        </a>
                        <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'} transition-colors duration-200`}>
                          <FaFacebook size={24} />
                        </a>
                        <a href="#" className={`${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'} transition-colors duration-200`}>
                          <FaInstagram size={24} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Profile; 