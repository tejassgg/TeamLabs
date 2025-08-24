import { useState } from 'react';
import QRCode from 'react-qr-code';
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { authService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function TwoFactorAuth({ 
  mode = 'setup', // 'setup' or 'verify'
  onComplete,
  onCancel,
  userId,
  email
}) {
  const { user } = useAuth();
  const [step, setStep] = useState('initial');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const startSetup = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user) {
        throw new Error('No active session found');
      }

      const data = await authService.generate2FA(user._id);
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep('qr');
    } catch (error) {
      console.error('2FA Setup Error:', error);
      setError(error.response?.data?.error || 'Failed to start 2FA setup');
      showToast(error.response?.data?.error || 'Failed to start 2FA setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      if (!user) {
        throw new Error('No active session found');
      }

      const data = await authService.verify2FA(verificationCode);

      if (data.success) {
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (mode === 'setup') {
          // For setup mode, enable 2FA
          userData.twoFactorEnabled = true;
        } else if (mode === 'verify') {
          // For verify mode (disable), remove 2FA
          userData.twoFactorEnabled = false;
        }
        
        localStorage.setItem('user', JSON.stringify(userData));

        // Call onComplete callback
        if (typeof onComplete === 'function') {
          onComplete();
        }

        showToast(mode === 'setup' ? '2FA enabled successfully!' : '2FA disabled successfully!', 'success');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('2FA Verification Error:', error);
      setError(error.response?.data?.error || 'Verification failed');
      showToast(error.response?.data?.error || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      if (!user) {
        throw new Error('No active session found');
      }

      const data = await authService.disable2FA(verificationCode);

      if (data.success) {
        // Update user data in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.twoFactorEnabled = false;
        localStorage.setItem('user', JSON.stringify(userData));

        // Call onComplete callback
        if (typeof onComplete === 'function') {
          onComplete();
        }

        showToast('2FA disabled successfully!', 'success');
      } else {
        throw new Error('Failed to disable 2FA');
      }
    } catch (error) {
      console.error('2FA Disable Error:', error);
      setError(error.response?.data?.error || 'Failed to disable 2FA');
      showToast(error.response?.data?.error || 'Failed to disable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'initial' && (
        <div className="text-center">
          <h3 className="text-lg font-medium">
            {mode === 'setup' ? 'Enable Two-Factor Authentication' : 'Verify Your Identity'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {mode === 'setup' 
              ? 'Add an extra layer of security to your account using Google Authenticator'
              : 'Please enter the 6-digit code from your authenticator app'}
          </p>
          {mode === 'setup' && (
            <button
              onClick={startSetup}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Setup'}
            </button>
          )}
          {mode === 'verify' && (
            <div className="mt-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="px-4 py-2 border rounded-lg w-48 text-center tracking-widest"
                maxLength={6}
              />
              {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center justify-center gap-1">
                  <FaExclamationTriangle /> {error}
                </p>
              )}
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'qr' && (
        <div className="text-center">
          <h3 className="text-lg font-medium">Scan QR Code</h3>
          <p className="mt-2 text-sm text-gray-500">
            Scan this QR code with Google Authenticator app
          </p>
          {qrCode && (
            <div className="mt-4 p-4 bg-white rounded-lg inline-block">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          )}
          <div className="mt-4">
            <p className="text-sm font-medium">Backup Code:</p>
            <code className="mt-1 block p-2 bg-gray-100 rounded select-all">
              {secret}
            </code>
            <p className="mt-2 text-xs text-gray-500">
              Save this code in a secure place. You'll need it if you lose access to your authenticator app.
            </p>
          </div>
          <div className="mt-6">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="px-4 py-2 border rounded-lg w-48 text-center tracking-widest"
              maxLength={6}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500 flex items-center justify-center gap-1">
                <FaExclamationTriangle /> {error}
              </p>
            )}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={verifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
            <FaCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-green-600">
            {mode === 'setup' 
              ? 'Two-Factor Authentication Enabled'
              : 'Verification Successful'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {mode === 'setup'
              ? 'Your account is now protected with 2FA'
              : 'You can now proceed'}
          </p>
          <button
            onClick={() => onComplete?.()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
} 