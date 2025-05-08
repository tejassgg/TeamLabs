import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Head>
          <title>TeamLabs - Project Management</title>
          <meta name="description" content="TeamLabs - Streamline your project management" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp; 