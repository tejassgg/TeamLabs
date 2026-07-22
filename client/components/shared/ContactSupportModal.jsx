import React, { useState } from 'react';
import { FaTimes, FaHeadset, FaPaperclip, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../services/api';

const ContactSupportModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    name: '',
    email: '',
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      // Validate file type
      const allowedTypes = [
        'image/',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      const isValidType = allowedTypes.some(type =>
        file.type.startsWith(type) || file.type === type
      );

      if (!isValidType) {
        setError('File type not allowed. Please upload images, PDFs, or documents.');
        continue;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        continue;
      }

      try {
        // Upload file using existing local upload endpoint
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/local-upload?filename=' + encodeURIComponent(file.name), {
          method: 'POST',
          body: file
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData?.success || !uploadData?.url) {
          throw new Error(uploadData?.message || 'Upload failed');
        }

        // Add to attachments with URL
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            file: file,
            url: uploadData.url,
            filename: file.name,
            size: file.size,
            mimetype: file.type
          }]
        }));

      } catch (error) {
        console.error('Error uploading file:', error);
        setError(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    // Clear the input
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a problem title');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description of the problem');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare attachments data (only URLs and metadata, not the actual files)
      const attachmentsData = formData.attachments.map(attachment => ({
        url: attachment.url,
        filename: attachment.filename,
        size: attachment.size,
        mimetype: attachment.mimetype
      }));

      const response = await api.post('/contact-support', {
        title: formData.title,
        description: formData.description,
        name: formData.name,
        email: formData.email,
        attachments: attachmentsData
      });

      if (response.data.success) {
        setSuccess(true);
        setTicketNumber(response.data.ticketNumber);
        setTaskId(response.data.taskId || '');
        // Reset form
        setFormData({
          title: '',
          description: '',
          name: '',
          email: '',
          attachments: []
        });
      }
    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.error || 'Failed to submit support request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        name: '',
        email: '',
        attachments: []
      });
      setError('');
      setSuccess(false);
      setTicketNumber('');
      setTaskId('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const labelClass = "block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-200";
  const inputClass = "w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:outline-none transition-all duration-200 bg-transparent placeholder-gray-400 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:border-zinc-800 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400";

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="relative w-full sm:max-w-3xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border bg-white border-gray-200 dark:bg-dark-bg dark:border-dark-card">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 dark:bg-dark-bg dark:border-b dark:border-dark-card">
          <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 gap-3">
            <div className="flex items-start sm:items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-3 sm:mr-4 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <FaHeadset className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Contact Support</h1>
                <p className="text-xs sm:text-sm mt-1 text-gray-500 dark:text-gray-400">We typically respond within 24 hours.</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-450 hover:text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="p-4 sm:p-8">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 dark:bg-green-900/30">
                  <FaCheckCircle className="w-8 h-8 animate-pulse text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-green-900 dark:text-white">
                  Request Submitted Successfully!
                </h3>
                <div className="mb-4">
                  <p className="text-green-600 dark:text-green-400 mb-2">
                    We've received your support request and will get back to you within 24 hours.
                  </p>
                  <div className="rounded-lg p-3 mb-3 border bg-green-50 border-green-200 dark:bg-gray-900/60 dark:border-gray-800">
                    <p className="text-sm font-medium mb-1 text-green-800 dark:text-white">Your Ticket Number:</p>
                    <p className="text-lg font-bold font-mono text-green-600 dark:text-green-400">#{ticketNumber}</p>
                  </div>
                </div>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  A confirmation email has been sent to your email address.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
                  <div className="w-full sm:w-1/2">
                    <label className={labelClass}>
                      Full Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={inputClass}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className={labelClass}>
                      Email Address<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className={inputClass}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Problem Title<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief description of your issue"
                    className={inputClass}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Problem Description<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable"
                    rows={4}
                    className={inputClass}
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-transparent dark:text-gray-300 dark:hover:bg-zinc-800/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaHeadset className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 dark:bg-dark-bg dark:border-t dark:border-dark-card">
          <div className="p-4">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              We typically respond within 24 hours. For urgent issues, please call our support line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupportModal;
