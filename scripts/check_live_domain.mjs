async function checkLive() {
  const urls = [
    'https://www.b2bindia.site',
    'https://b2bindia.site',
    'https://www.b2bindia.site/sitemap.xml',
    'https://www.b2bindia.site/directory/product/turmeric-finger-25-curcumin',
    'https://www.b2bindia.site/terms',
    'https://www.b2bindia.site/refund-policy'
  ];

  console.log('Testing live domain accessibility...');
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      console.log(`[${res.status}] ${url}`);
    } catch (err) {
      console.log(`[FAIL] ${url} -> ${err.message}`);
    }
  }
}

checkLive();
