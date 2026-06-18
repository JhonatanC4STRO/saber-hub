import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
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
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com; " +
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; " +
      "media-src 'self' https://res.cloudinary.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; " +
      "connect-src 'self' https://api.cloudinary.com;",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    proxyClientMaxBodySize: '500mb',
  },
};

const withMDX = createMDX();
export default withMDX(nextConfig);
