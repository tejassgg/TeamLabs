import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AuthNavbar from '../components/AuthNavbar';

const Register = () => {
  const { theme } = useTheme();
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
        <title>Register | TeamLabs</title>
      </Head>
      <AuthNavbar />
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
        {/* Right Side - Registration Form Section */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gray-100 p-8 md:rounded-r-xl min-h-screen">
          <div className="w-full max-w-md">
            <div className="text-3xl font-extrabold text-blue-700 mb-6 text-center tracking-tight">TeamLabs</div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-700 mb-2">CREATE ACCOUNT</h2>
              </div>
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Register.displayName = 'Register';

export default Register; 