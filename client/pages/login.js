import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import { FaMoon, FaSun } from 'react-icons/fa';

const Login = () => {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if user is authenticated
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Don't render if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Login | TeamLabs</title>
      </Head>
      {/* Header/Nav from landing page */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${resolvedTheme === 'dark' ? 'bg-gray-900/95 backdrop-blur-sm border-b border-gray-800' : 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'}`}>
        <div className="sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 w-full">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent select-none">
                TeamLabs
              </Link>
            </div>
            {/* Theme toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'text-gray-400 hover:text-yellow-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
                title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="min-h-screen w-full flex flex-col md:flex-row pt-16">
        {/* Left Side - Welcome Section */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gray-800 text-white p-12">
          <div className="max-w-md text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">Welcome.</h1>
            <p className="text-lg md:text-xl font-medium text-gray-200">
              Streamline your project management with our robust platform. From multi-project support to dynamic dashboards, we've got you covered!
            </p>
          </div>
        </div>
        {/* Right Side - Login Form Section */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gray-100 p-8 md:rounded-r-xl min-h-screen">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-700 mb-2">USER LOGIN</h2>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login; 