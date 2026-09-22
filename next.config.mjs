/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,

  // Allow external images and optimize formats to AVIF/WebP for high-speed delivery
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '5.imimg.com',
        pathname: '/**',
      },
    ],
  },

  // Optimize serverless function bundling for Vercel Free Tier
  serverExternalPackages: ['firebase-admin'],

  // Ensure /api/sitemap redirects to /api/sitemap.xml
  async rewrites() {
    return [
      {
        source: '/api/sitemap',
        destination: '/api/sitemap.xml',
      },
    ];
  },

  // Performance & Edge Caching Headers for 100% Core Web Vitals & Speed
  async headers() {
    return [
      {
        source: '/(favicon.ico|favicon-48.png|icon-192.png|icon-512.png|logo.png|manifest.webmanifest)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
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

export default nextConfig;
