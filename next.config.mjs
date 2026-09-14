/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external images from Unsplash for hero graphics and product photos
  images: {
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
};

export default nextConfig;
