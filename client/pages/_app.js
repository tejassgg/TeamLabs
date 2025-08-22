import '../styles/globals.css';
import { useEffect } from 'react';
import { connectSocket } from '../services/socket';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'next/head';
import { GlobalProvider } from '../context/GlobalContext';
// import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../context/ToastContext';
import RouteProtection from '../components/RouteProtection';
import Layout from '../components/Layout';

function AppContainer({ Component, pageProps }) {
  useEffect(() => {
    connectSocket();
  }, []);
  const { theme } = useTheme();
  
  // Check if current page is login, register, or landing page
  const isAuthPage = Component.displayName === 'Login' || Component.displayName === 'Register' || Component.displayName === 'Home' || 
                    pageProps?.isAuthPage || 
                    (typeof window !== 'undefined' && ['/login', '/register', '/'].includes(window.location.pathname));
  
  return (
    <div className={theme} style={{ minHeight: '100vh' }}>
      <RouteProtection>
        {isAuthPage ? (
          <Component {...pageProps} />
        ) : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </RouteProtection>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    // <SessionProvider>

    // </SessionProvider>
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <GlobalProvider>
            <ToastProvider>
              <AppContainer Component={Component} pageProps={pageProps} />
            </ToastProvider>
          </GlobalProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp; 