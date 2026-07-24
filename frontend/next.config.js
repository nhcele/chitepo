/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

// Make .env / .env.production vars available to this config (basePath, etc.).
try { require('@next/env').loadEnvConfig(process.cwd()); } catch (e) {}
const { i18n } = require('./next-i18next.config');
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  .replace(/\/api\/?$/i, '')
  .replace(/\/$/, '');

const nextConfig = {
  // Lint/type errors are checked in CI/dev; do not fail production builds on them.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH } : {}),
  reactStrictMode: true,
  swcMinify: true,
  i18n,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.mindelta.com', pathname: '/**' },
      { protocol: 'https', hostname: 'mindelta.com', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    ],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
    loader: 'default',
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverComponentsExternalPackages: ['@mindelta/shared'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
