import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'llms.txt');
    const content = fs.readFileSync(filePath, 'utf-8');

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return new Response('# B2B India (b2bindia.site)\n\nIndia\'s premier verified B2B wholesale marketplace.', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}
