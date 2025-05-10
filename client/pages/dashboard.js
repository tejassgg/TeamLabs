import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { FaProjectDiagram, FaUsers, FaClock, FaUserFriends } from 'react-icons/fa';
import { useRouter } from 'next/router';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get(`/dashboard/${user.organizationID}`);
        setStats(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.organizationID) {
      fetchDashboardStats();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 text-center p-8">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats?.organizationName}</h1>
            <p className="text-lg text-gray-600 mt-1">Dashboard</p>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Projects Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalProjects || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <FaProjectDiagram className="text-blue-500" size={24} />
              </div>
            </div>
          </div>

          {/* Teams Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalTeams || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <FaUsers className="text-green-500" size={24} />
              </div>
            </div>
          </div>

          {/* Deadlines Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.upcomingDeadlines || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                <FaClock className="text-yellow-500" size={24} />
              </div>
            </div>
          </div>

          {/* People Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total People</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <FaUserFriends className="text-purple-500" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Projects</h2>
            <div className="space-y-4">
              {stats?.recentProjects?.map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
                  onClick={() => router.push(`/project/${project.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                    project.status === 'Active'
                      ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                      : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      project.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></span>
                    {project.status}
                  </span>
                </div>
              ))}
              {(!stats?.recentProjects || stats.recentProjects.length === 0) && (
                <div className="text-center py-8 text-gray-400 border rounded-xl bg-gray-50">
                  No Recent Projects
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Upcoming Deadlines</h2>
            <div className="space-y-4">
              {stats?.deadlineDetails?.map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
                  onClick={() => router.push(`/project/${project.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(project.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-200">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    {project.daysRemaining} days left
                  </span>
                </div>
              ))}
              {(!stats?.deadlineDetails || stats.deadlineDetails.length === 0) && (
                <div className="text-center py-8 text-gray-400 border rounded-xl bg-gray-50">
                  No Upcoming Deadlines
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 