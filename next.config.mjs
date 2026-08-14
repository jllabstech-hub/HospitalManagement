import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      // Disable Webpack cache in development mode to prevent stale chunk ID mismatches on Windows
      config.cache = false;
    }
    return config;
  },

  async redirects() {
    return [
      {
        source: '/faqs',
        destination: '/patient-resources/faq',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        // Exclude _next/static, _next/image, and favicon.ico from strict nosniff header matching to prevent browser MIME rejection errors in dev mode
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

const isDev = process.env.NODE_ENV === 'development';

export default isDev
  ? nextConfig
  : withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG || 'hospital-system',
      project: process.env.SENTRY_PROJECT || 'hospital-frontend',
    });
