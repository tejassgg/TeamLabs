import { useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

export default function TwoFactorAuth({ 
  mode = 'setup', // 'setup' or 'verify'
  onComplete,
  onCancel,
  userId,
  email
}) {
  const [step, setStep] = useState('initial');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get JWT token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const startSetup = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'generate' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start 2FA setup');
      }

      const data = await response.json();
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep('verify');
    } catch (error) {
      console.error('2FA Setup Error:', error);
      setError(error.message || 'Failed to start 2FA setup');
      toast.error(error.message || 'Failed to start 2FA setup');
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

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: mode === 'setup' ? 'verify' : 'disable',
          token: verificationCode
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(mode === 'setup' ? '2FA enabled successfully!' : '2FA disabled successfully!');
        onComplete();
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('2FA Verification Error:', error);
      setError(error.message || 'Verification failed');
      toast.error(error.message || 'Verification failed');
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

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'disable',
          token: verificationCode
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('2FA disabled successfully!');
        onComplete();
      } else {
        throw new Error('Failed to disable 2FA');
      }
    } catch (error) {
      console.error('2FA Disable Error:', error);
      setError(error.message || 'Failed to disable 2FA');
      toast.error(error.message || 'Failed to disable 2FA');
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
          <div className="mt-4 p-4 bg-white rounded-lg inline-block">
            <QRCode value={qrCode} size={200} />
          </div>
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