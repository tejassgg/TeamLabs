import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
    { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

export default function ResetPasswordPage() {
    const router = useRouter();
    const { key } = router.query;
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [step, setStep] = useState('form');
    const [showPassword, setShowPassword] = useState(false);
    const { resetPassword, verifyResetPassword } = useAuth();
    const [loadingScreen, setLoadingScreen] = useState(true);

    useEffect(() => {
        if (key === undefined) {
            setStep('invalid');
            setLoadingScreen(false);
        } else {
            setLoadingScreen(true);
            verifyResetPassword(key).then(result => {
                if (result.status == 201) {
                    setError(result.data.message);
                    setStep('invalid');
                } else {
                    setStep('reset');
                }

                setLoadingScreen(false);
            });
        }
    }, [key]);

    const isPasswordValid = passwordRequirements.every(r => r.test(newPassword));

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
            const res = await resetPassword(key, newPassword);
            if (res.status == 200) {
                setMessage('Your password has been reset successfully. You can now log in.');
                setStep('done');
            } else {
                setError(res.message || 'Failed to reset password');
            }
        } catch (err) {
            setError('Server error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
            {/* Branding */}
            <div className="mb-6 text-3xl font-extrabold text-center" style={{ color: '#2563eb', letterSpacing: '1px' }}>TeamLabs</div>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                {loadingScreen ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px]">
                        <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span className="text-blue-600 font-medium">Validating reset link...</span>
                    </div>
                ) : (
                    <>
                        {step === 'reset' && (
                            <>
                                <h2 className="text-2xl font-bold text-blue-700 mb-2">Set a new password</h2>
                                <p className="text-gray-600 mb-6">Enter your new password below. It must be different from your previous password.</p>
                                {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">{error}</div>}
                                <form onSubmit={handleReset} className="space-y-5">
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
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
                        {step === 'done' && (
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-blue-700 mb-2">Password Reset!</h2>
                                <p className="text-gray-600 mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
                                <button
                                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
                                    onClick={() => router.push('/')}
                                >Back to Home</button>
                            </div>
                        )}
                        {step === 'invalid' && (
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-red-600 mb-2">{error}</h2>
                                <button
                                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
                                    onClick={() => router.push('/forgot-password')}
                                >Request Reset</button>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Footer branding */}
            <footer className="mt-8 text-gray-400 text-sm text-center">&copy; {new Date().getFullYear()} TeamLabs. All rights reserved.</footer>
        </div>
    );
} 