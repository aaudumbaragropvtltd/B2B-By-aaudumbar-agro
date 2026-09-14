export default function manifest() {
  return {
    name: 'B2B India — Verified B2B Wholesale Marketplace',
    short_name: 'B2B India',
    description: "India's premier B2B platform connecting verified manufacturers and wholesale buyers across 38 sectors.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#006aff',
    icons: [
      {
        src: '/favicon-48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
