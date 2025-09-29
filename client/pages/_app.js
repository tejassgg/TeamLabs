import '../styles/globals.css';
import { useEffect } from 'react';
import Head from 'next/head';
import { connectSocket } from '../services/socket';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { VideoCallProvider } from '../context/VideoCallContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GlobalProvider } from '../context/GlobalContext';
// import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../context/ToastContext';
import RouteProtection from '../components/shared/RouteProtection';
import Layout from '../components/layout/Layout';

function AppContainer({ Component, pageProps }) {
  useEffect(() => {
    connectSocket();
  }, []);
  const { theme } = useTheme();
  // Check if current page is auth-related or landing page
  const isAuthPage = Component.displayName === 'Login' || Component.displayName === 'Register' || Component.displayName === 'Auth' || Component.displayName === 'Home' || 
                    pageProps?.isAuthPage;
  
  return (
    <>
      <Head>
        <meta name="google-site-verification" content="ivQ4dQ4n6SQQQzFKGvExuXcTIGgarOIRsQrEMhuXg34" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
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
    </>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    // <SessionProvider>

    // </SessionProvider>
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <GlobalProvider>
            <ToastProvider>
              <VideoCallProvider>
                <AppContainer Component={Component} pageProps={pageProps} />
              </VideoCallProvider>
            </ToastProvider>
          </GlobalProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp; 