/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: '**.linkedin.com',
      },
      {
        protocol: 'https',
        hostname: 'digitalfte.s3.amazonaws.com',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
