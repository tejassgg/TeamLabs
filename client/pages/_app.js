import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'next/head';
import { TeamProvider } from '../context/TeamContext';
import { GlobalProvider } from '../context/GlobalContext';

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
    <TeamProvider>
      <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <ThemeProvider>
            <GlobalProvider>
              <Head>
                <title>TeamLabs - Project Management</title>
                <meta name="description" content="TeamLabs - Streamline your project management" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
              </Head>
              <AppContainer Component={Component} pageProps={pageProps} />
            </GlobalProvider>
          </ThemeProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </TeamProvider>
  );
}

export default MyApp; 