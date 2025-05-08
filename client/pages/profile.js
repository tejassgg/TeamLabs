import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { authService } from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>My Profile | TeamLabs</title>
      </Head>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="max-w-xl mx-auto py-12">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4">
              <img
                src={user?.profileImage || profile?.profileImage || '/static/default-avatar.png'}
                alt="Profile"
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/static/default-avatar.png';
                }}
              />
            </div>
            <h2 className="text-2xl font-bold mb-2">{profile?.username || user?.username}</h2>
            <p className="mb-2">{profile?.email || user?.email}</p>
            <div className="w-full mt-6 space-y-2">
              <div><span className="font-semibold">Full Name:</span> {profile?.firstName} {profile?.middleName} {profile?.lastName}</div>
              <div><span className="font-semibold">Phone:</span> {profile?.phone}</div>
              <div><span className="font-semibold">Address:</span> {profile?.address}</div>
              <div><span className="font-semibold">City:</span> {profile?.city}</div>
              <div><span className="font-semibold">State:</span> {profile?.state}</div>
              <div><span className="font-semibold">Zip Code:</span> {profile?.zipCode}</div>
              <div><span className="font-semibold">Country:</span> {profile?.country}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile; 