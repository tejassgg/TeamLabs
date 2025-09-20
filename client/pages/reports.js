import React from 'react';
import Head from 'next/head';

// Simple inline layout component to avoid import issues
const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Simple sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              TeamLabs
            </h1>
            <nav className="mt-6">
              <a href="/dashboard" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Dashboard
              </a>
              <a href="/projects" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Projects
              </a>
              <a href="/reports" className="block py-2 text-blue-600 dark:text-blue-400 font-medium">
                AI Reports
              </a>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const Reports = () => {
  // Simple auth check without complex context
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simple auth check - you can enhance this later
    const checkAuth = () => {
      // Check if user is logged in (simple check)
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SimpleLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access the reports section.
            </p>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <Head>
        <title>AI-Powered Reports - TeamLabs</title>
        <meta name="description" content="Generate intelligent project progress reports using AI" />
      </Head>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          AI-Powered Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Reports functionality is being loaded...
        </p>
        
        {/* Simple report generation button */}
        <div className="mt-6">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={() => {
              // Simple alert for now - you can enhance this later
              alert('Report generation feature will be implemented here!');
            }}
          >
            Generate AI Report
          </button>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default Reports;
