async function validateXml() {
  const res = await fetch('https://www.b2bindia.site/sitemap.xml');
  const xml = await res.text();
  console.log('Total XML Length:', xml.length);
  
  // Check if unescaped & exists
  const unescapedAmp = xml.match(/&(?!(amp|lt|gt|quot|apos);)/g);
  if (unescapedAmp) {
    console.error('ERROR: Found unescaped ampersands:', unescapedAmp.length);
    // Find where
    const lines = xml.split('\n');
    lines.forEach((line, idx) => {
      if (/&(?!(amp|lt|gt|quot|apos);)/.test(line)) {
        console.error(`Line ${idx+1}: ${line}`);
      }
    });
  } else {
    console.log('PASS: No unescaped ampersands found in XML.');
  }

  // Count <url> and </url>
  const openUrls = (xml.match(/<url>/g) || []).length;
  const closeUrls = (xml.match(/<\/url>/g) || []).length;
  console.log(`Open <url>: ${openUrls}, Close </url>: ${closeUrls}`);
  if (openUrls !== closeUrls) {
    console.error('ERROR: Mismatch in <url> tags!');
  } else {
    console.log('PASS: <url> tags match.');
  }

  // Count <loc> and </loc>
  const openLoc = (xml.match(/<loc>/g) || []).length;
  const closeLoc = (xml.match(/<\/loc>/g) || []).length;
  console.log(`Open <loc>: ${openLoc}, Close </loc>: ${closeLoc}`);
  if (openLoc !== closeLoc) {
    console.error('ERROR: Mismatch in <loc> tags!');
  } else {
    console.log('PASS: <loc> tags match.');
  }

  // Check last 200 chars
  console.log('End of XML:');
  console.log(xml.slice(-200));
}

validateXml().catch(console.error);
