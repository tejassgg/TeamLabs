import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import LoadingScreen from './LoadingScreen';

const RouteProtection = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/github-callback', '/welcome'];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(router.pathname);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) return;

    // If user is not authenticated and trying to access a protected route
    if (!isAuthenticated && !isPublicRoute) {
      setIsRedirecting(true);
      // Add a small delay to show loading state
      const redirectTimeout = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(redirectTimeout);
    }

    // Reset redirecting state if we're on a valid route
    setIsRedirecting(false);
  }, [isAuthenticated, loading, router.pathname, isPublicRoute, router]);

  // Show loading screen while checking authentication or redirecting
  if (loading || isRedirecting) {
    return <LoadingScreen />;
  }

  // If user is not authenticated and on protected route, don't render anything
  // (redirect will happen in useEffect)
  if (!isAuthenticated && !isPublicRoute) {
    return <LoadingScreen />;
  }

  // Render children for authenticated users or users on public routes
  return children;
};

export default RouteProtection;
