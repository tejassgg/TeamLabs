import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

const ForgotPasswordModal = ({ isOpen, onClose, resetKey = null }) => {
  const [step, setStep] = useState(resetKey ? 'reset' : 'request');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { forgotPassword, resetPassword } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();

  // Request reset link
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await forgotPassword(usernameOrEmail);
      if (result.success) {
        setMessage('If the user exists, a password reset link has been sent to the registered email.');
        setStep('done');
        showToast('Password reset link sent!', 'success');
      } else {
        setError(result.data.message || 'Failed to send reset link');
        showToast(result.data.message || 'Failed to send reset link', 'error');
      }
    } catch (err) {
      setError(err.data.message || 'Server error');
      showToast(err.data.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Password requirements validation
  const isPasswordValid = passwordRequirements.every(r => r.test(newPassword));

  // Reset password
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      setLoading(false);
      return;
    }
    try {
      const res = await resetPassword(resetKey, newPassword);
      if (res.success) {
        setMessage('Your password has been reset successfully. You can now log in.');
        setStep('reset-done');
        showToast('Password reset successfully!', 'success');
      } else {
        setError(res.message || 'Failed to reset password');
        showToast(res.message || 'Failed to reset password', 'error');
      }
    } catch (err) {
      setError(err.message || 'Server error');
      showToast(err.message || 'Server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(resetKey ? 'reset' : 'request');
    setUsernameOrEmail('');
    setNewPassword('');
    setError('');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-xl transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors duration-200 ${
            theme === 'dark' 
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaTimes size={16} />
        </button>

        <div className="p-6 sm:p-8">
          {step === 'request' && (
            <>
              <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-blue-700'}`}>
                Forgot your password?
              </h2>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter your username or email and we'll send you a link to reset your password.
              </p>
              {error && (
                <div className={`border px-4 py-2 rounded mb-4 text-sm ${
                  theme === 'dark' 
                    ? 'bg-red-900/20 border-red-700 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  {error}
                </div>
              )}
              <form onSubmit={handleRequest} className="space-y-5">
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Username or Email"
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                    theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
                  }`}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center">
              <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-blue-700'}`}>
                Check your email
              </h2>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                If the user exists, a password reset link has been sent to the registered email address.
              </p>
              <button
                className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          )}

          {step === 'reset' && (
            <>
              <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-blue-700'}`}>
                Set a new password
              </h2>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter your new password below. It must be different from your previous password.
              </p>
              {error && (
                <div className={`border px-4 py-2 rounded mb-4 text-sm ${
                  theme === 'dark' 
                    ? 'bg-red-900/20 border-red-700 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  {error}
                </div>
              )}
              <form onSubmit={handleReset} className="space-y-5">
                <input
                  type="password"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                {/* Password requirements checklist */}
                <ul className="mb-2 text-sm">
                  {passwordRequirements.map((r, i) => (
                    <li key={i} className={`flex items-center ${
                      r.test(newPassword) 
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-600' 
                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <span className="mr-2">{r.test(newPassword) ? '✔' : '✖'}</span>
                      {r.label}
                    </li>
                  ))}
                </ul>
                <button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className={`w-full px-4 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                    theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
                  }`}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {step === 'reset-done' && (
            <div className="text-center">
              <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-blue-700'}`}>
                Password Reset!
              </h2>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button
                className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
