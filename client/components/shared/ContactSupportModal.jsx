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
        // Reset form
        setFormData({
          title: '',
          description: '',
          name: '',
          email: '',
          attachments: []
        });
        // Close modal after 3 seconds
        // setTimeout(() => {
        //   setSuccess(false);
        //   setTicketNumber('');
        //   onClose();
        // }, 3000);
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
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Contact Support</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-green-900">
              Request Submitted Successfully!
            </h3>
            <div className="mb-4">
              <p className="text-green-700 mb-2">
                We've received your support request and will get back to you within 24 hours.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 mb-1">Your Ticket Number:</p>
                <p className="text-lg font-bold text-green-900 font-mono">#{ticketNumber}</p>
              </div>
            </div>
            <p className="text-green-700 text-sm">
              A confirmation email has been sent to your email address.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Problem Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Title<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                disabled={loading}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Description<span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable"
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                disabled={loading}
                required
              />
            </div>

            {/*Name & Email */}
            <div className='flex gap-4'>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                disabled={loading}
                required
              />
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                disabled={loading}
                required
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors duration-200">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FaPaperclip className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload files or drag and drop
                  </p>
                  <p className="text-xs mt-1 text-gray-500">
                    PNG, JPG, PDF, DOC, DOCX up to 10MB each
                  </p>
                </label>
              </div>

              {/* Display selected files */}
              {formData.attachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected Files:
                  </h4>
                  <div className="space-y-2">
                    {formData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FaPaperclip className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {attachment.filename} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          disabled={loading}
                          className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <FaExclamationTriangle className="w-4 h-4 mr-2 text-red-600" />
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            We typically respond within 24 hours. For urgent issues, please call our support line.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactSupportModal;
