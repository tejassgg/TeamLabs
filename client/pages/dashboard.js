import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import ProjectStatusDropdown from '../components/ProjectStatusDropdown';
import { FaProjectDiagram, FaUsers, FaClock, FaUserFriends, FaTrash, FaCheckCircle, FaPauseCircle, FaExclamationCircle, FaTimes, FaCode, FaVial, FaShieldAlt, FaRocket, FaQuestionCircle, FaCog, FaCalendarAlt, FaTasks, FaChevronRight, FaVideo, FaChalkboardTeacher, FaCoffee, FaPowerOff, FaUserSlash, FaChartBar, FaUserCog } from 'react-icons/fa';
import api from '../services/api';
import { projectService } from '../services/api';

// Dynamic import for charts
let DashboardCharts = null;
let SimpleCharts = null;

// Try to load Chart.js components, fallback to simple charts
try {
  DashboardCharts = require('../components/DashboardCharts').default;
} catch (error) {
  // If Chart.js is not available, use simple charts
  SimpleCharts = require('../components/SimpleCharts').default;
}

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

const getStatusConfig = (status) => {
  const config = {
    'Active': {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: FaCheckCircle,
      label: 'Active'
    },
    'In a Meeting': {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: FaVideo,
      label: 'In a Meeting'
    },
    'Presenting': {
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      icon: FaChalkboardTeacher,
      label: 'Presenting'
    },
    'Away': {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      icon: FaCoffee,
      label: 'Away'
    },
    'Busy': {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      icon: FaUserSlash,
      label: 'Busy'
    },
    'Offline': {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      icon: FaPowerOff,
      label: 'Offline'
    }
  };
  return config[status] || config['Offline'];
};

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { projectStatuses, getProjectStatus } = useGlobal();
  const { showToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingUser, setRemovingUser] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');

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

    if (user?.role === 'Admin') {
      setIsAdmin(true);
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

  const handleProjectStatusUpdate = async (projectId, newStatusId) => {
    try {
      await projectService.updateProject(projectId, { ProjectStatusID: newStatusId });
      
      // Update the local stats to reflect the change
      setStats(prevStats => ({
        ...prevStats,
        recentProjects: prevStats.recentProjects.map(project => 
          project.id === projectId 
            ? { 
                ...project, 
                projectStatusId: newStatusId,
                projectStatus: getProjectStatus(newStatusId).Value 
              }
            : project
        )
      }));
      
      showToast('Project status updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update project status', 'error');
      console.error('Error updating project status:', err);
      throw err; // Re-throw to let the dropdown component handle the error
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
      <div className="mx-auto">
        {/* Breadcrumb Navigation */}
        <div className={`flex items-center text-sm mb-4 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>
          <span className={theme === 'dark' ? 'text-[#F3F6FA] font-medium' : 'text-gray-700 font-medium'}>Dashboard</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>{stats?.organizationName}</h1>
            <p className={`text-lg mt-1 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Welcome to your workspace</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`${activeTab === 'metrics'
                  ? theme === 'dark'
                    ? 'border-blue-400 text-blue-400'
                    : 'border-blue-600 text-blue-600'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
              >
                <FaChartBar size={16} />
                <span>Metrics & Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`${activeTab === 'manage'
                  ? theme === 'dark'
                    ? 'border-blue-400 text-blue-400'
                    : 'border-blue-600 text-blue-600'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200`}
              >
                <FaProjectDiagram size={16} />
                <span>Manage Organization</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Dashboard Charts */}
            {DashboardCharts ? (
              <DashboardCharts stats={stats} theme={theme} />
            ) : SimpleCharts ? (
              <SimpleCharts stats={stats} theme={theme} />
            ) : (
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border p-6 mb-8`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Dashboard Analytics</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>
                  Install chart.js and react-chartjs-2 for enhanced visualizations: npm install chart.js react-chartjs-2
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Recent Projects and Organization Members - Single Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border`}>
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Recent Projects</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${theme === 'dark' ? 'bg-[#232323] border-[#424242]' : 'bg-gray-50 border-gray-200'}`}>
                        <th className="py-3 px-4 text-left">Project</th>
                        <th className="py-3 px-4 text-left">Deadline</th>
                        <th className="py-3 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentProjects?.map(project => {
                        const currentStatus = getProjectStatus(project.projectStatusId || 1);
                        
                        return (
                          <tr 
                            key={project.id} 
                            className={`transition-colors last:border-b-0 ${theme === 'dark' ? 'border-[#424242] hover:bg-[#232323]' : 'border-gray-100 hover:bg-gray-50'} border-b cursor-pointer`}
                            onClick={() => router.push(`/project/${project.id}`)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className={`font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>
                                  {project.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>
                                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div onClick={(e) => e.stopPropagation()}>
                                <ProjectStatusDropdown
                                  currentStatus={currentStatus}
                                  availableStatuses={projectStatuses}
                                  onStatusChange={handleProjectStatusUpdate}
                                  projectId={project.id}
                                  theme={theme}
                                  disabled={!isAdmin}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {(!stats?.recentProjects || stats.recentProjects.length === 0) && (
                        <tr>
                          <td colSpan={3} className={`text-center py-8 ${theme === 'dark' ? 'text-[#B0B8C1] bg-[#232323]' : 'text-gray-400 bg-gray-50'}`}>
                            No Recent Projects
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Organization Members Table */}
              <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] text-[#F3F6FA] border-[#424242]' : 'bg-white text-gray-900 border-gray-200'} rounded-xl shadow-sm border`}>
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#424242]' : 'border-gray-200'}`}>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>Organization Members</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${theme === 'dark' ? 'bg-[#232323] border-[#424242]' : 'bg-gray-50 border-gray-200'}`}>
                        <th className="py-3 px-4 text-left">Member</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Role</th>
                        {isAdmin && user.organizationID && <th className="py-3 px-4 text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.members?.slice(0, 5).map(member => {
                        const statusConfig = getStatusConfig(member.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <tr key={member.id} className={`transition-colors last:border-b-0 ${theme === 'dark' ? 'border-[#424242] hover:bg-[#232323]' : 'border-gray-100 hover:bg-gray-50'} border-b`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'}`}>
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-medium ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>
                                    {member.name}
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    <span className={`text-xs ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-500'}`}>
                                      <strong>{member.username}</strong> | {member.email}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                              ${theme === 'dark'
                                  ? 'bg-[#232323] border border-[#424242]'
                                  : 'bg-white border border-gray-200'}`}
                              >
                                <StatusIcon className={`${statusConfig.color} text-sm`} />
                                <span className={theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-700'}>
                                  {statusConfig.label}
                                </span>
                                {member.status === 'Active' && (
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color.replace('text', 'bg')} animate-pulse`}></span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm ${theme === 'dark' ? 'text-[#F3F6FA]' : 'text-gray-900'}`}>
                                {member.role}
                              </span>
                            </td>
                            {isAdmin && user.organizationID && (
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setRemovingUser(member);
                                      setShowRemoveDialog(true);
                                    }}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition shadow-sm ${theme === 'dark' ? 'text-red-300 bg-[#424242] hover:bg-red-900' : 'text-red-700 bg-red-100 hover:bg-red-200'}`}
                                    title="Remove Member"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {(!stats?.members || stats.members.length === 0) && (
                        <tr>
                          <td colSpan={isAdmin && user.organizationID ? 4 : 3} className={`text-center py-8 ${theme === 'dark' ? 'text-[#B0B8C1] bg-[#232323]' : 'text-gray-400 bg-gray-50'}`}>
                            No members found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Member Confirmation Dialog */}
        {showRemoveDialog && removingUser && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'}`}>
            <div className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border ${theme === 'dark' ? 'bg-[#232323] border-[#424242] text-[#F3F6FA]' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[#F3F6FA]' : ''}`}>Remove Member</h3>
              </div>
              <p className={`mb-6 ${theme === 'dark' ? 'text-[#B0B8C1]' : 'text-gray-600'}`}>Are you sure you want to remove {removingUser.name} from the organization? They will no longer have access to organization resources.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemovingUser(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl border transition-all duration-200 ${theme === 'dark' ? 'text-[#B0B8C1] border-[#424242] hover:bg-[#232323]' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveUser(removingUser.id)}
                  className={`px-4 py-2.5 rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r ${theme === 'dark' ? 'from-red-700 to-red-900 hover:from-red-800 hover:to-red-900' : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'}`}
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