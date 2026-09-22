async function check() {
  const res = await fetch('https://www.b2bindia.site/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 11; moto g power)' }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('HTML Length:', html.length);
  
  // Find all <link rel="preload" ...>
  const preloads = html.match(/<link[^>]+rel=["']preload["'][^>]*>/gi) || [];
  console.log('Preload links count:', preloads.length);
  preloads.forEach((p, i) => console.log(`[${i}]:`, p));
  
  // Find LCP hero image
  console.log('Contains slide-0-h1 (from 238d94d)?', html.includes('slide-0-h1'));
  console.log('Contains duplicate preload?', html.includes('fetchPriority="high" imageSrcSet'));
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  console.log('H1 tag:', h1Match ? h1Match[0] : 'None');
}
check().catch(console.error);
