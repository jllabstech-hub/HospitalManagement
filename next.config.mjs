import { withSentryConfig } from '@sentry/nextjs';

const mediaCdnHost = (process.env.MEDIA_CDN_HOST || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const imgSrc = [
  "'self'",
  'data:',
  'blob:',
  'https://images.unsplash.com',
  'https://*.amazonaws.com',
  'https://storage.googleapis.com',
  mediaCdnHost ? `https://${mediaCdnHost}` : '',
]
  .filter(Boolean)
  .join(' ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream', '@aws-sdk/client-s3', 'ws', '@neondatabase/serverless', '@prisma/adapter-neon', 'sharp'],
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
      config.optimization = config.optimization || {};
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
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
    // Disable custom security header overrides in dev mode to let Next.js dev server serve HMR chunks cleanly
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src " + imgSrc,
              "font-src 'self' data:",
              "connect-src 'self' https://*.sentry.io",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
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
