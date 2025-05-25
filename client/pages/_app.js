import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'next/head';
import { GlobalProvider } from '../context/GlobalContext';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '../context/ToastContext';

function AppContainer({ Component, pageProps }) {
  const { theme } = useTheme();
  return (
    <div className={theme} style={{ minHeight: '100vh' }}>
      <Component {...pageProps} />
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
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
    </SessionProvider>
  );
}

export default MyApp; 