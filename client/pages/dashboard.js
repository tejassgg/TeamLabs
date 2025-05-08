import { useState, useEffect } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

    fetchUserProfile();
  }, []);

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard | TeamLabs</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-primary shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-white">Welcome, {user.firstName}</span>
              )}
              <button 
                onClick={logout}
                className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
            </div>
            <div className="border-t border-gray-200">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : profile ? (
                <dl>
                  <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.firstName} {profile.middleName && profile.middleName + ' '}{profile.lastName}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.username}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.email}</dd>
                  </div>
                  <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.phone || 'Not provided'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.address ? (
                        <>
                          {profile.address}
                          {profile.aptNumber && `, Apt ${profile.aptNumber}`}<br />
                          {profile.city && `${profile.city}, `}
                          {profile.state && `${profile.state} `}
                          {profile.zipCode && profile.zipCode}<br />
                          {profile.country && profile.country}
                        </>
                      ) : (
                        'Not provided'
                      )}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Last login</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Not available'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Account created</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.createdDate ? new Date(profile.createdDate).toLocaleString() : 'Not available'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="p-4 text-center text-red-500">Failed to load user profile</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard; 