async function test() {
  const res = await fetch('https://www.b2bindia.site/');
  const html = await res.text();

  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  console.log('Live Title:', titleMatch ? titleMatch[1] : 'Not found');

  const icons = html.match(/<link[^>]*rel="icon"[^>]*>/g) || [];
  console.log('Icons found:', icons);

  const appleIcons = html.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/g) || [];
  console.log('Apple icons found:', appleIcons);

  const hasB2BIndia = html.includes('B2B India');
  console.log('Contains "B2B India":', hasB2BIndia);

  const hasLogoPng = html.includes('/logo.png');
  console.log('Schema references /logo.png:', hasLogoPng);
}

test().catch(console.error);
