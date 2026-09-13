export async function GET() {
  return new Response('google-site-verification: google0e8c1d2b0dc6688c.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
