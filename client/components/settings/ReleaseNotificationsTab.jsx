import React, { useState, useEffect } from 'react';

import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { releaseNotificationService } from '../../services/api';
import AddReleaseModal from '../shared/AddReleaseModal';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaRocket,
  FaTag,
  FaCalendar,
  FaUser,
  FaFlag,
  FaDownload,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaExternalLinkAlt,
  FaCopy
} from 'react-icons/fa';

const ReleaseNotificationsTab = () => {
  const { showToast } = useToast();

  // State management
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  // Fetch releases on component mount
  useEffect(() => {
    fetchReleases();
    fetchStats();
  }, [currentPage]);

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const response = await releaseNotificationService.getReleaseNotifications({
        page: currentPage,
        limit: 10,
        status: 'all'
      });
      setReleases(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      showToast('Failed to fetch release notifications', 'error');
      console.error('Error fetching releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await releaseNotificationService.getReleaseStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddRelease = (releaseData) => {
    fetchReleases();
    fetchStats();
  };

  const handleUpdateRelease = (releaseId, releaseData) => {
    fetchReleases();
    fetchStats();
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingRelease(null);
  };

  const handleEdit = (release) => {
    setEditingRelease(release);
    setShowCreateModal(true);
  };

  const handleDelete = async (releaseId) => {
    if (!confirm('Are you sure you want to delete this release notification?')) {
      return;
    }

    setLoading(true);
    try {
      await releaseNotificationService.deleteReleaseNotification(releaseId);
      showToast('Release notification deleted successfully', 'success');
      fetchReleases();
      fetchStats();
    } catch (error) {
      showToast(error.message || 'Failed to delete release notification', 'error');
      console.error('Error deleting release:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (releaseId, currentStatus) => {
    setLoading(true);
    try {
      await releaseNotificationService.togglePublishStatus(releaseId, !currentStatus);
      showToast(`Release notification ${!currentStatus ? 'published' : 'unpublished'} successfully`, 'success');
      fetchReleases();
      fetchStats();
    } catch (error) {
      showToast(error.message || 'Failed to update publish status', 'error');
      console.error('Error toggling publish status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold text-gray-900 dark:text-white`}>
            Release Notifications
          </h2>
          <p className={`mt-1 text-sm text-gray-600 dark:text-gray-400`}>
            Manage system release notifications and version updates
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 dark:text-white`}
        >
          <FaPlus size={16} />
          New Release
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className={`p-4 rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-center gap-3">
              <FaRocket className={`text-2xl text-blue-600 dark:text-blue-400`} />
              <div>
                <p className={`text-sm text-gray-600 dark:text-gray-400`}>Total Releases</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white`}>
                  {stats.totalReleases}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-center gap-3">
              <FaEye className={`text-2xl text-green-600 dark:text-green-400`} />
              <div>
                <p className={`text-sm text-gray-600 dark:text-gray-400`}>Published</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white`}>
                  {stats.publishedReleases}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-center gap-3">
              <FaEyeSlash className={`text-2xl text-yellow-600 dark:text-yellow-400`} />
              <div>
                <p className={`text-sm text-gray-600 dark:text-gray-400`}>Drafts</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white`}>
                  {stats.draftReleases}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-center gap-3">
              <FaFlag className={`text-2xl text-red-600 dark:text-red-400`} />
              <div>
                <p className={`text-sm text-gray-600 dark:text-gray-400`}>Critical</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white`}>
                  {stats.criticalReleases}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-center gap-3">
              <FaTag className={`text-2xl text-orange-600 dark:text-orange-400`} />
              <div>
                <p className={`text-sm text-gray-600 dark:text-gray-400`}>High Priority</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white`}>
                  {stats.highPriorityReleases}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Releases List */}
      <div className={`rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-2xl text-blue-600" />
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-12">
            <FaRocket className={`mx-auto text-4xl mb-4 text-gray-400 dark:text-gray-600`} />
            <h3 className={`text-lg font-medium mb-2 text-gray-900 dark:text-gray-300`}>
              No release notifications yet
            </h3>
            <p className={`text-sm text-gray-600 dark:text-gray-400`}>
              Create your first release notification to keep your team informed about updates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b border-gray-200 dark:border-gray-700`}>
                <tr>
                  <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300`}>
                    Version
                  </th>
                  <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300`}>
                    Title
                  </th>
                  <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300`}>
                    Priority
                  </th>
                  <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300`}>
                    Status
                  </th>
                  <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300`}>
                    Created
                  </th>
                  <th className={`text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release._id} className={`border-b border-gray-200 dark:border-gray-700`}>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-sm text-blue-600 dark:text-blue-400`}>
                        v{release.version}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className={`font-medium text-gray-900 dark:text-white`}>
                          {release.title}
                        </p>
                        <p className={`text-sm text-gray-600 dark:text-gray-400`}>
                          {release.description.substring(0, 60)}...
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(release.priority)}`}>
                        {release.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${release.isPublished
                        ? 'text-green-600 bg-green-100'
                        : 'text-yellow-600 bg-yellow-100'
                        }`}>
                        {release.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FaCalendar className={`text-xs text-gray-500 dark:text-gray-400`} />
                        <span className={`text-sm text-gray-600 dark:text-gray-400`}>
                          {new Date(release.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePublish(release._id, release.isPublished)}
                          className={`p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white`}
                          title={release.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {release.isPublished ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                        </button>
                        <button
                          onClick={() => handleEdit(release)}
                          className={`p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white`}
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(release._id)}
                          className={`p-1.5 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors`}
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded transition-colors disabled:opacity-50 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white`}
            >
              Previous
            </button>
            <span className={`px-3 py-1 text-gray-700 dark:text-gray-300`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded transition-colors disabled:opacity-50 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Release Modal */}
      <AddReleaseModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onAddRelease={handleAddRelease}
        onUpdateRelease={handleUpdateRelease}
        editingRelease={editingRelease}
      />
    </div>
  );
};

export default ReleaseNotificationsTab;
