import sitemap from '../app/sitemap.js';

const INDEXNOW_KEY = 'b2bindia8f764a39b9c1d2e3f4a5b6c7';
const HOST = 'www.b2bindia.site';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

async function pingIndexNow() {
  console.log('Generating sitemap URLs for IndexNow...');
  const entries = await sitemap();
  const urlList = entries.map(e => e.url);
  console.log(`Total URLs to submit: ${urlList.length}`);

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList.slice(0, 100), // IndexNow batch 1
  };

  console.log('Submitting to IndexNow (Bing / Copilot / ChatGPT)...');
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    console.log('IndexNow Response Status:', res.status, res.statusText);
    if (res.status === 200 || res.status === 202) {
      console.log('SUCCESS: URLs submitted to IndexNow! Search engines have been pinged for immediate crawling.');
    } else {
      const errText = await res.text();
      console.log('IndexNow response body:', errText);
    }
  } catch (err) {
    console.error('Error submitting to IndexNow:', err.message);
  }
}

pingIndexNow();
