import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'next/head';
import { GlobalProvider } from '../context/GlobalContext';
// import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../context/ToastContext';
import RouteProtection from '../components/RouteProtection';

function AppContainer({ Component, pageProps }) {
  const { theme } = useTheme();
  return (
    <div className={theme} style={{ minHeight: '100vh' }}>
      <RouteProtection>
        <Component {...pageProps} />
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