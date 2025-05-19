import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { FaProjectDiagram, FaUsers, FaClock, FaUserFriends, FaTrash, FaCheckCircle, FaPauseCircle, FaExclamationCircle, FaTimes, FaCode, FaVial, FaShieldAlt, FaRocket, FaQuestionCircle, FaCog, FaCalendarAlt, FaTasks, FaChevronRight } from 'react-icons/fa';
import api from '../services/api';

const getProjectStatusStyle = (status) => {
  switch (status) {
    case 'Not Assigned':
      return {
        bgColor: 'from-gray-50 to-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        icon: 'FaTimes',
        iconColor: 'text-gray-500'
      };
    case 'Assigned':
      return {
        bgColor: 'from-blue-50 to-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: 'FaCheckCircle',
        iconColor: 'text-blue-500'
      };
    case 'In Progress':
      return {
        bgColor: 'from-yellow-50 to-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        icon: 'FaClock',
        iconColor: 'text-yellow-500'
      };
    case 'Development':
      return {
        bgColor: 'from-purple-50 to-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        icon: 'FaCode',
        iconColor: 'text-purple-500'
      };
    case 'Testing':
      return {
        bgColor: 'from-orange-50 to-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        icon: 'FaVial',
        iconColor: 'text-orange-500'
      };
    case 'QA':
      return {
        bgColor: 'from-indigo-50 to-indigo-100',
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-200',
        icon: 'FaShieldAlt',
        iconColor: 'text-indigo-500'
      };
    case 'Deployment':
      return {
        bgColor: 'from-pink-50 to-pink-100',
        textColor: 'text-pink-700',
        borderColor: 'border-pink-200',
        icon: 'FaRocket',
        iconColor: 'text-pink-500'
      };
    case 'Completed':
      return {
        bgColor: 'from-green-50 to-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        icon: 'FaCheckCircle',
        iconColor: 'text-green-500'
      };
    default:
      return {
        bgColor: 'from-gray-50 to-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        icon: 'FaQuestionCircle',
        iconColor: 'text-gray-500'
      };
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingUser, setRemovingUser] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

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

  const handleRemoveUser = async (userId) => {
    setRemovingUser(userId);
    try {
      await api.patch(`/users/${userId}/remove-from-org`, {
        ModifiedBy: user._id
      });
      const response = await api.get(`/dashboard/${user.organizationID}`);
      setStats(response.data);
    } catch (err) {
      setError('Failed to remove member from organization');
      console.error(err);
    } finally {
      setRemovingUser(null);
      setShowRemoveDialog(false);
    }
  };

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
      <Head>
        <title>Dashboard | TeamLabs</title>
      </Head>
      <div className="max-w-7xl mx-auto py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="text-gray-700 font-medium">Dashboard</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats?.organizationName}</h1>
            <p className="text-lg text-gray-600 mt-1">Welcome to your workspace</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
            </div>
            <div className="overflow-x-auto">
              <div className="space-y-4 p-4">
                {stats?.recentProjects?.map(project => {
                  const statusStyle = getProjectStatusStyle(project.projectStatus);
                  const IconComponent = {
                    FaTimes,
                    FaCheckCircle,
                    FaClock,
                    FaCode,
                    FaVial,
                    FaShieldAlt,
                    FaRocket,
                    FaQuestionCircle
                  }[statusStyle.icon];

                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
                      onClick={() => router.push(`/project/${project.id}`)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-500">
                          {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm bg-gradient-to-r ${statusStyle.bgColor} ${statusStyle.textColor} border ${statusStyle.borderColor}`}>
                          <IconComponent className={statusStyle.iconColor} size={14} />
                          <span>{project.projectStatus}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!stats?.recentProjects || stats.recentProjects.length === 0) && (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                    No Recent Projects
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Deadlines</h2>
            </div>
            <div className="overflow-x-auto">
              <div className="space-y-4 p-4">
                {stats?.deadlineDetails?.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
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
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                    No Upcoming Deadlines
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Organization Members Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Organization Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left">Member</th>
                  <th className="hidden md:table-cell py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Last Login</th>
                  {user.role === 'Admin' && user.organizationID && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {stats?.members?.map(member => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.name}</span>
                          <span className="md:hidden text-xs text-gray-500">{member.email}</span>
                          {/* Show status on mobile */}
                          <div className="md:hidden mt-1">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                              {member.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      <span className="text-gray-600">{member.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      {member.lastLogin ? (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {new Date(member.lastLogin).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(member.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </td>
                    {user.role === 'Admin' && user.organizationID && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setRemovingUser(member);
                              setShowRemoveDialog(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 shadow-sm transition"
                            title="Remove Member"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(!stats?.members || stats.members.length === 0) && (
                  <tr>
                    <td colSpan={user.role === 'Admin' && user.organizationID ? 5 : 4} className="text-center py-8 text-gray-400 bg-gray-50">
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remove Member Confirmation Dialog */}
        {showRemoveDialog && removingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className="text-lg font-semibold">Remove Member</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove {removingUser.name} from the organization? They will no longer have access to organization resources.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemovingUser(null);
                  }}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveUser(removingUser.id)}
                  className="px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  disabled={removingUser === removingUser?.id}
                >
                  {removingUser === removingUser?.id ? 'Removing...' : 'Remove from Organization'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard; 