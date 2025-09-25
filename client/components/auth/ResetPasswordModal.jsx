import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/api';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

const ResetPasswordForm = ({ token }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [step, setStep] = useState('loading'); // loading, form, success, error
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const validate = async () => {
      try {
        const res = await authService.verifyResetPassword(token);
        if (res.status === 200) setStep('form');
        else {
          setError(res.data?.message || 'Invalid or expired reset link');
          setStep('error');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to validate reset link');
        setStep('error');
      }
    };
    setStep('loading');
    setError('');
    setNewPassword('');
    setConfirmPassword('');
    validate();
  }, [token]);

  const isPasswordValid = passwordRequirements.every(r => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) { setError('Password does not meet all requirements'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, newPassword);
      setStep('success');
      showToast('Password reset successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Server error. Please try again.');
      showToast(err.message || 'Server error. Please try again.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'loading' && (
        <div className="text-center">
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <svg className="animate-spin h-10 w-10 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className={`opacity-25 ${theme === 'dark' ? 'text-gray-600' : 'text-blue-200'}`} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className={`opacity-75 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Validating reset link...</h2>
          </div>
        </div>
      )}

      {step === 'form' && (
        <>
          <div className="text-left mb-4">
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 w-full ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Set New <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Password</span>
            </h1>
          </div>
          {error && (
            <div className={`border px-4 py-3 rounded-xl text-sm mb-4 ${theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <div className="flex items-center gap-2">
                <FaExclamationCircle size={16} />
                {error}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Passwords do not match</p>
              )}
            </div>
            <div className="space-y-1">
              <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Password Requirements:</h4>
              <ul className="space-y-1">
                {passwordRequirements.map((r, i) => (
                  <li key={i} className={`text-xs flex items-center ${r.test(newPassword) ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                    <span className="mr-2">{r.test(newPassword) ? '✓' : '✗'}</span>
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex w-full items-center justify-center gap-3">
              <button type="submit" disabled={loading || !isPasswordValid || newPassword !== confirmPassword} className={` cursor-pointer px-4 py-3 text-white font-medium ${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} rounded-xl shadow-sm transition-all`}>{loading ? 'Resetting Password...' : 'Reset Password'}</button>
            </div>
          </form>
        </>
      )}

      {step === 'success' && (
        <div className="text-center">
          <FaCheckCircle className={`mx-auto h-14 w-14 mb-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Password Reset Successfully!</h3>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>You can now log in with your new password.</p>
          <button onClick={() => window.location.href = '/auth?type=login'} className={`px-5 py-2 rounded-xl font-semibold ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>Continue to Login</button>
        </div>
      )}

      {step === 'error' && (
        <div className="text-center">
          <FaExclamationCircle className={`mx-auto h-14 w-14 mb-3 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Invalid Reset Link</h3>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>{error || 'This reset link is invalid or has expired.'}</p>
          <button onClick={() => window.location.href = '/auth?type=login'} className={`px-5 py-2 rounded-xl font-semibold ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>Back to Login</button>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordForm;

