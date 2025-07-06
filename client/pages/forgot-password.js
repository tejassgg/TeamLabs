import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { key } = router.query;
  const [step, setStep] = useState(key ? 'reset' : 'request');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();
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
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Server error');
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Your password has been reset successfully. You can now log in.');
        setStep('reset-done');
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      {/* Logo */}
      <div className="mb-6 text-3xl font-extrabold text-center" style={{ color: '#2563eb', letterSpacing: '1px' }}>TeamLabs</div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {step === 'request' && (
          <>
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Forgot your password?</h2>
            <p className="text-gray-600 mb-6">Enter your username or email and we'll send you a link to reset your password.</p>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">{error}</div>}
            <form onSubmit={handleRequest} className="space-y-5">
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Username or Email"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        {step === 'done' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">If the user exists, a password reset link has been sent to the registered email address.</p>
            <button
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
              onClick={() => router.push('/login')}
            >Back to Login</button>
          </div>
        )}
        {step === 'reset' && (
          <>
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Set a new password</h2>
            <p className="text-gray-600 mb-6">Enter your new password below. It must be different from your previous password.</p>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">{error}</div>}
            <form onSubmit={handleReset} className="space-y-5">
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              {/* Password requirements checklist */}
              <ul className="mb-2 text-sm">
                {passwordRequirements.map((r, i) => (
                  <li key={i} className={r.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                    <span className="mr-2">{r.test(newPassword) ? '✔' : '✖'}</span>{r.label}
                  </li>
                ))}
              </ul>
              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full px-4 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
        {step === 'reset-done' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Password Reset!</h2>
            <p className="text-gray-600 mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
            <button
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
              onClick={() => router.push('/login')}
            >Back to Login</button>
          </div>
        )}
      </div>
      {/* Footer branding */}
      <footer className="mt-8 text-gray-400 text-sm text-center">&copy; {new Date().getFullYear()} TeamLabs. All rights reserved.</footer>
    </div>
  );
} 