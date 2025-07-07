/** Modern UI for Task Attachments with Drag-and-Drop Upload **/
import { useEffect, useState, useRef } from 'react';
import { FaPaperclip, FaTimes, FaDownload, FaFile, FaFileImage, FaFilePdf, FaFileWord, FaFileExcel, FaFileCode, FaCloudUploadAlt } from 'react-icons/fa';
import { attachmentService } from '../services/api';
import { useToast } from '../context/ToastContext';

const TaskAttachments = ({ taskId, userId, initialAttachments }) => {
  const [attachments, setAttachments] = useState(initialAttachments || []);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef();
  const { showToast } = useToast();

  useEffect(() => {
    if (initialAttachments) {
      setAttachments(initialAttachments);
    } else if (taskId) {
      fetchAttachments();
    }
    // eslint-disable-next-line
  }, [initialAttachments, taskId]);

  const fetchAttachments = async () => {
    try {
      const data = await attachmentService.getAttachments(taskId);
      setAttachments(data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      showToast('Failed to fetch attachments', 'error');
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <FaFileImage className="text-blue-500" />;
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-600" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
      case 'xml':
        return <FaFileCode className="text-purple-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const fileDate = new Date(date);
    const diffInMinutes = Math.floor((now - fileDate) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return fileDate.toLocaleDateString();
  };

  const validateFileType = (file) => {
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/json',
      'application/xml',
      'text/html',
      'text/css',
      'application/javascript',
      'text/javascript'
    ];
    return allowedTypes.some(type =>
      file.type.startsWith(type) || file.type === type
    );
  };

  const handleUpload = async (file) => {
    if (!file) return;
    // Validate file type
    if (!validateFileType(file)) {
      showToast('File type not allowed. Please upload images, documents, or code files.', 'error');
      return;
    }
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);
      formData.append('userId', userId);
      formData.append('filename', file.name);
      const response = await attachmentService.uploadAttachment(formData);
      if (response.success) {
        const newAttachment = response.attachment;
        setAttachments(prev => [newAttachment, ...prev]);
        showToast('File uploaded successfully', 'success');
      } else {
        showToast('Failed to upload file: ' + (response.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Failed to upload file: ' + (error.message || 'Unknown error'), 'error');
      await fetchAttachments();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleUpload(file);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id) => {
    try {
      await attachmentService.deleteAttachment(id);
      setAttachments(prev => prev.filter(att => att.AttachmentID !== id));
      showToast('Attachment deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      showToast('Failed to delete attachment: ' + (error.message || 'Unknown error'), 'error');
      await fetchAttachments();
    }
  };

  const handleDownload = (attachment) => {
    const link = document.createElement('a');
    link.href = attachment.FileURL;
    link.download = attachment.Filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Attachments List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FaPaperclip className="text-gray-500" />
          <span className="text-lg font-semibold text-gray-900">Attachments</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {attachments.length}
          </span>
        </div>
        {/* Drag-and-drop upload zone */}
      <div
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 mb-6 transition-colors cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'}`}
        onClick={() => !uploading && fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ minHeight: '120px' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInputChange}
          disabled={uploading}
        />
        <FaCloudUploadAlt className={`mb-2 text-4xl ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <div className="text-base font-medium text-gray-700 mb-1">
          {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
        </div>
        <div className="text-xs text-gray-400">Max file size: 10MB. Images, docs, code files allowed.</div>
      </div>
        {attachments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No attachments yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {attachments.map(att => (
              <div key={att.AttachmentID} className="flex flex-col bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group p-4 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">
                    {getFileIcon(att.Filename)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-gray-900 text-base" title={att.Filename}>{att.Filename}</div>
                    <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                      <span>{formatFileSize(att.FileSize)}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(att.UploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-auto">
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    onClick={() => handleDownload(att)}
                  >
                    <FaDownload />
                  </button>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    onClick={() => handleDelete(att.AttachmentID)}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAttachments; 