import { useState, useEffect } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarTeam, setSidebarTeam] = useState('Olanthroxx Team');

  // Simple random data for the graph
  const data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 10);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  // Handlers for Navbar dropdown
  const handleProfile = () => alert('My Profile clicked!');
  const handleSettings = () => alert('Settings clicked!');
  const handleLogout = logout;

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard | TeamLabs</title>
      </Head>
      <Layout>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Weekly Activity</h2>
          {/* Simple SVG Bar Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
            <svg width="100%" height="180" viewBox="0 0 350 180">
              {data.map((value, i) => (
                <rect
                  key={i}
                  x={20 + i * 45}
                  y={160 - value}
                  width={30}
                  height={value}
                  fill="#7c3aed"
                  rx={6}
                />
              ))}
              {labels.map((label, i) => (
                <text
                  key={label}
                  x={35 + i * 45}
                  y={175}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#888"
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-primary">Add Task</button>
            <button className="btn btn-primary">View Reports</button>
            <button className="btn btn-primary">Export Data</button>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Dashboard; 