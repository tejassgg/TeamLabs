import React, { useState, useEffect, useRef } from 'react';
import { FaFile, FaSearch, FaFilter, FaTh, FaTable, FaDownload, FaTrash, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileImage, FaFileVideo, FaFileAudio, FaFileArchive, FaFileCode, FaFileAlt, FaEllipsisV, FaUpload, FaPlus, FaSpinner } from 'react-icons/fa';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CustomModal from '../shared/CustomModal';
import { subscribe } from '../../services/socket';
import { attachmentService } from '../../services/api';

const ProjectFilesTab = ({ projectId }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }
      
      @keyframes shimmer {
        0% {
          background-position: -200px 0;
        }
        100% {
          background-position: calc(200px + 100%) 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // State variables
  const [projectAttachments, setProjectAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [fileFilter, setFileFilter] = useState('all');
  const [fileViewMode, setFileViewMode] = useState('table'); // 'table', 'grid'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);

  // Add state for kebab menu
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Add state for file upload
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  // Function to get file type icon
  const getFileTypeIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(extension)) {
      return <FaFileImage className="text-blue-500" />;
    } else if (['pdf'].includes(extension)) {
      return <FaFilePdf className="text-red-500" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FaFileWord className="text-blue-600" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <FaFileExcel className="text-green-600" />;
    } else if (['ppt', 'pptx'].includes(extension)) {
      return <FaFilePowerpoint className="text-orange-500" />;
    } else if (['txt', 'md'].includes(extension)) {
      return <FaFileAlt className="text-gray-500" />;
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return <FaFileArchive className="text-purple-500" />;
    } else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension)) {
      return <FaFileVideo className="text-red-600" />;
    } else if (['mp3', 'wav', 'flac'].includes(extension)) {
      return <FaFileAudio className="text-green-500" />;
    } else if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(extension)) {
      return <FaFileCode className="text-yellow-600" />;
    } else {
      return <FaFile className="text-gray-400" />;
    }
  };

  // Function to check if file is an image
  const isImageFile = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(extension);
  };

  // Function to check if file is a video
  const isVideoFile = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension);
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to get user initials
  const getUserInitials = (user) => {
    if (!user) return '';
    let split = user.fullName.split(' ');
    return (split[0].charAt(0) + split[split.length - 1].charAt(0)).toUpperCase();
  };

  // Function to get theme classes
  const getThemeClasses = (baseClasses, darkClasses) => {
    return theme === 'dark' ? `${baseClasses} ${darkClasses}` : baseClasses;
  };

  // Handle delete button click
  const handleDeleteClick = (attachment) => {
    setAttachmentToDelete(attachment);
    setShowDeleteModal(true);
  };

  // Delete attachment function
  const deleteAttachment = async () => {
    if (!attachmentToDelete) return;
    
    try {
      await attachmentService.deleteAttachment(attachmentToDelete.AttachmentID);
      showToast('Attachment deleted successfully', 'success');
      setProjectAttachments((prev) => prev.filter((a) => a.AttachmentID !== attachmentToDelete.AttachmentID));
      setShowDeleteModal(false);
      setAttachmentToDelete(null);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      showToast('Failed to delete attachment', 'error');
    }
  };

  // Fetch project attachments
  const fetchProjectAttachments = async () => {
    try {
      setAttachmentsLoading(true);
      const response = await api.get(`/attachments/project/${projectId}`);
      setProjectAttachments(response.data);
    } catch (error) {
      console.error('Error fetching project attachments:', error);
      showToast('Failed to fetch project attachments', 'error');
    } finally {
      setAttachmentsLoading(false);
    }
  };

  // Fetch attachments when component mounts
  useEffect(() => {
    if (projectId) {
      fetchProjectAttachments();
    }
  }, [projectId]);

  // Realtime project attachment updates
  useEffect(() => {
    if (!projectId) return;
    const offAdded = subscribe('project.attachment.added', (payload) => {
      const { data } = payload || {};
      console.log('data', data.attachment);
      if (!data || data.projectId !== projectId) return;
      setProjectAttachments((prev) => [data.attachment, ...prev]);
    });
    const offRemoved = subscribe('project.attachment.removed', (payload) => {
      const { data } = payload || {};
      if (!data || data.projectId !== projectId) return;
      setProjectAttachments((prev) => prev.filter((a) => a.AttachmentID !== data.attachmentId));
    });
    return () => {
      offAdded && offAdded();
      offRemoved && offRemoved();
    };
  }, [projectId]);

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    if (!user) {
      showToast('User not authenticated', 'error');
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', projectId);
          formData.append('userId', user._id);
          formData.append('filename', file.name);

          const uploadRes = await attachmentService.uploadAttachment(formData);
          const uploaded = uploadRes?.attachment || uploadRes; // tolerate either shape

          if (!uploaded || !uploaded.FileURL) {
            throw new Error('Upload failed');
          }
          
          showToast(`${file.name} uploaded successfully`, 'success');
        } catch (error) {
          console.error('Error uploading file:', error);
          showToast(`Failed to upload ${file.name}`, 'error');
        }
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Filter attachments based on search and filter
  const filteredAttachments = projectAttachments.filter(attachment => {
    const matchesSearch = attachment.Filename.toLowerCase().includes(fileSearch.toLowerCase());
    const matchesFilter = fileFilter === 'all' || 
      (fileFilter === 'images' && attachment.Filename.match(/\.(jpg|jpeg|png|gif|svg)$/i)) ||
      (fileFilter === 'documents' && attachment.Filename.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)) ||
      (fileFilter === 'pdf' && attachment.Filename.match(/\.pdf$/i)) ||
      (fileFilter === 'code' && attachment.Filename.match(/\.(js|jsx|ts|tsx|html|css|json|xml|py|java|cpp|c|php|rb|go|rs)$/i));
    return matchesSearch && matchesFilter;
  });

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="min-h-[400px]"
    >
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <FaSearch className={getThemeClasses("absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", "dark:text-gray-500")} size={16} />
          <input
            type="text"
            placeholder="Search files..."
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            className={getThemeClasses(
              "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "dark:bg-transparent dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            )}
          />
        </div>
        <div className="flex gap-2">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={getThemeClasses(
              "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              "dark:bg-blue-500 dark:hover:bg-blue-600"
            )}
          >
            {uploading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaUpload />
            )}
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept="*/*"
          />
          
          <select
            value={fileFilter}
            onChange={(e) => setFileFilter(e.target.value)}
            className={getThemeClasses(
              "px-3 py-2 rounded-lg border border-gray-300",
              "dark:bg-transparent dark:text-gray-100 dark:border-gray-600"
            )}
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
            <option value="pdf">PDFs</option>
            <option value="code">Code Files</option>
          </select>
          <div className={getThemeClasses("flex border border-gray-300 rounded-lg overflow-hidden","dark:border-gray-600")}> 
            <button
              onClick={() => setFileViewMode('table')}
              className={`px-3 py-2 ${fileViewMode === 'table' ? getThemeClasses('bg-blue-500 text-white', 'dark:bg-blue-600') : getThemeClasses('bg-white text-gray-700', 'dark:bg-transparent dark:text-gray-300')}`}
            >
              <FaTable size={14} />
            </button>
            <button
              onClick={() => setFileViewMode('grid')}
              className={`px-3 py-2 ${fileViewMode === 'grid' ? getThemeClasses('bg-blue-500 text-white', 'dark:bg-blue-600') : getThemeClasses('bg-white text-gray-700', 'dark:bg-transparent dark:text-gray-300')}`}
            >
              <FaTh size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Files Content */}
      {attachmentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={getThemeClasses("ml-3 text-gray-500", "dark:text-gray-400")}>Loading files...</span>
        </div>
      ) : projectAttachments.length === 0 ? (
        <div className={getThemeClasses("text-center py-12 text-gray-500", "dark:text-gray-400")}>
          <FaFile size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No files found</p>
          <p className="text-sm">Upload files to this project or files uploaded to tasks will appear here.</p>
        </div>
      ) : (
        <div>
          {fileViewMode === 'table' && (
            <div className={getThemeClasses("bg-white rounded-xl shadow border border-gray-200", "dark:bg-transparent dark:border-gray-700")}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={getThemeClasses("border-b border-gray-200", "dark:border-gray-700")}>
                      <th className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900", "dark:text-gray-100")}>File</th>
                      <th className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900", "dark:text-gray-100")}>Task</th>
                      <th className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900", "dark:text-gray-100")}>Uploaded By</th>
                      <th className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900", "dark:text-gray-100")}>Uploaded On</th>
                      <th className={getThemeClasses("text-left py-3 px-4 font-medium text-gray-900", "dark:text-gray-100")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttachments.map(attachment => (
                      <tr key={attachment.AttachmentID} className={getThemeClasses("border-b border-gray-200 hover:bg-gray-50", "dark:border-gray-700 dark:hover:bg-gray-800")}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getFileTypeIcon(attachment.Filename)}</span>
                            <div className="flex flex-col">
                              <span className={getThemeClasses("text-gray-900", "dark:text-gray-100")}>{attachment.Filename}</span>
                              <span className={getThemeClasses("text-xs text-gray-500", "dark:text-gray-400")}>
                                {attachment.FileSize ? formatFileSize(attachment.FileSize) : 'Unknown size'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>{attachment.taskDetails?.Name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={getThemeClasses(
                              'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm',
                              'dark:from-blue-600 dark:to-blue-700'
                            )}>
                              {getUserInitials(attachment.uploaderDetails)}
                            </div>
                            <div className="flex flex-col">
                              <span className={getThemeClasses("text-gray-900", "dark:text-gray-100")}>{attachment.uploaderDetails?.fullName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getThemeClasses("text-gray-700", "dark:text-gray-300")}>{new Date(attachment.UploadedAt).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={attachment.FileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={getThemeClasses("p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full", "dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30")}
                              title="Download"
                            >
                              <FaDownload size={14} />
                            </a>
                            <button
                              onClick={() => handleDeleteClick(attachment)}
                              className={getThemeClasses("p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full", "dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30")}
                              title="Delete attachment"
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
            </div>
          )}

          {fileViewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredAttachments.map((attachment, index) => (
                <div 
                  key={attachment.AttachmentID} 
                  className={getThemeClasses(
                    "group relative bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 ease-out hover:scale-105",
                    "dark:bg-transparent dark:border-gray-700 dark:hover:shadow-gray-900/50"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* File Title */}
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="text-lg">{getFileTypeIcon(attachment.Filename)}</div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <p className={getThemeClasses("font-medium text-gray-900 text-sm truncate", "dark:text-gray-100")} title={attachment.Filename}>
                            {attachment.Filename.length > 20 ? attachment.Filename.substring(0, 20) + '...' : attachment.Filename}
                          </p>
                          <p className={getThemeClasses("text-xs text-gray-500 truncate", "dark:text-gray-400")}>
                            {attachment.FileSize ? formatFileSize(attachment.FileSize) : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          className={getThemeClasses(
                            "p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all duration-200",
                            "dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                          )}
                          onClick={() => setOpenMenuId(openMenuId === attachment.AttachmentID ? null : attachment.AttachmentID)}
                          aria-label="Open actions menu"
                        >
                          <FaEllipsisV size={14} />
                        </button>
                        {openMenuId === attachment.AttachmentID && (
                          <div className={getThemeClasses(
                            "absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 flex flex-col z-20",
                            "dark:bg-gray-800 dark:border-gray-700"
                          )}>
                            <a
                              href={attachment.FileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={getThemeClasses(
                                "px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center gap-2",
                                "dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                              )}
                              onClick={() => setOpenMenuId(null)}
                            >
                              <FaDownload size={14} /> Download
                            </a>
                            <button
                              onClick={() => { setOpenMenuId(null); handleDeleteClick(attachment); }}
                              className={getThemeClasses(
                                "px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer flex items-center gap-2 w-full text-left",
                                "dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                              )}
                            >
                              <FaTrash size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Preview */}
                  <div className="p-2">
                    {isImageFile(attachment.Filename) ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700">
                        <img
                          src={attachment.FileURL}
                          alt={attachment.Filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700" style={{ display: 'none' }}>
                          <div className="text-3xl">{getFileTypeIcon(attachment.Filename)}</div>
                        </div>
                      </div>
                    ) : isVideoFile(attachment.Filename) ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700">
                        <video
                          src={attachment.FileURL}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-0.5"></div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700" style={{ display: 'none' }}>
                          <div className="text-3xl">{getFileTypeIcon(attachment.Filename)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">{getFileTypeIcon(attachment.Filename)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {attachment.Filename.split('.').pop()?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAttachmentToDelete(null);
        }}
        title="Delete Attachment"
        getThemeClasses={getThemeClasses}
        actions={
          <>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setAttachmentToDelete(null);
              }}
              className={getThemeClasses(
                "px-4 py-2 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50",
                "dark:text-gray-300 dark:hover:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
              )}
            >
              Cancel
            </button>
            <button
              onClick={deleteAttachment}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className={getThemeClasses("text-gray-600", "dark:text-gray-300")}>
          Are you sure you want to delete "{attachmentToDelete?.Filename}"? This action cannot be undone.
        </p>
      </CustomModal>
    </div>
  );
};

export default ProjectFilesTab; 