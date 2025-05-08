/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000/api',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
}

module.exports = nextConfig 