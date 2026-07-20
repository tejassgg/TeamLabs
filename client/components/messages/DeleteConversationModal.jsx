import React from 'react';
import { FaTimes } from 'react-icons/fa';

const DeleteConversationModal = ({
  showDeleteDialog,
  setShowDeleteDialog,
  theme,
  selectedConversation,
  isDeleting,
  handleDeleteConversation
}) => {
  if (!showDeleteDialog) return null;

  const getThemeClasses = (light, dark) => (theme === 'dark' ? dark : light);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteDialog(false)} />
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border ${theme === 'dark' ? 'bg-dark-bg text-white border-dark-border' : 'bg-white text-gray-900 border-gray-200'} p-6 shadow-xl`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
            <FaTimes />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Delete Group</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to delete "{selectedConversation?.name || 'Group'}"?
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            This action will:
          </p>
          <ul className={`text-sm mt-2 space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Delete all messages from the conversation</li>
            <li>• Remove all members from the conversation</li>
            <li>• Permanently delete the conversation</li>
          </ul>
          <p className={`text-sm mt-3 font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowDeleteDialog(false)}
            className={getThemeClasses(
              'px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors',
              'dark:text-gray-400 dark:hover:bg-gray-700 dark:border-gray-600'
            )}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteConversation}
            disabled={isDeleting}
            className={getThemeClasses(
              'px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800'
            )}
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </span>
            ) : (
              'Delete Group'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConversationModal;
