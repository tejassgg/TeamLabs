import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'next/head';
import { GlobalProvider } from '../context/GlobalContext';
import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppContainer({ Component, pageProps }) {
  const { theme } = useTheme();
  return (
    <div className={theme} style={{ minHeight: '100vh' }}>
      <Component {...pageProps} />
    </div>
  );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <ThemeProvider>
            <GlobalProvider>
              <Head>
                <title>TeamLabs - Project Management</title>
                <meta name="description" content="TeamLabs - Streamline your project management" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </Head>
              <AppContainer Component={Component} pageProps={pageProps} />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </GlobalProvider>
          </ThemeProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </SessionProvider>
  );
}

export default MyApp; 