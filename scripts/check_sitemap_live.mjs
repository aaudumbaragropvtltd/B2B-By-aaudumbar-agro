async function checkSitemap() {
  const url = 'https://www.b2bindia.site/sitemap.xml';
  console.log('Fetching', url);
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
  });
  console.log('Status:', res.status, res.statusText);
  for (const [k, v] of res.headers.entries()) {
    console.log(`${k}: ${v}`);
  }

  if (res.status >= 300 && res.status < 400) {
    console.log('REDIRECT LOCATION:', res.headers.get('location'));
    const res2 = await fetch(res.headers.get('location'));
    console.log('Followed redirect, status:', res2.status);
    const body2 = await res2.text();
    console.log('Body length:', body2.length);
    console.log('First 300 chars:\n', body2.slice(0, 300));
    return;
  }

  const text = await res.text();
  console.log('Body length:', text.length);
  console.log('First 500 chars:\n', text.slice(0, 500));
}

checkSitemap().catch(console.error);
