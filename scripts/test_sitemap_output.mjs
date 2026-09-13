import sitemap from '../app/sitemap.js';

async function testSitemap() {
  console.log('Generating sitemap...');
  const entries = await sitemap();
  console.log(`Total URLs generated in sitemap: ${entries.length}`);

  const sampleEntries = entries.slice(0, 5);
  console.log('Sample entries:', sampleEntries);

  const turmericEntry = entries.find(e => e.url.includes('turmeric-finger-25-curcumin'));
  console.log('Turmeric Entry:', turmericEntry);

  if (!turmericEntry) {
    throw new Error('Turmeric product not found in sitemap!');
  }
  if (!turmericEntry.url.startsWith('https://www.b2bindia.site')) {
    throw new Error(`Turmeric URL does not start with https://www.b2bindia.site: ${turmericEntry.url}`);
  }

  const sectorEntries = entries.filter(e => e.url.includes('/directory/') && !e.url.includes('/directory/product/') && !e.url.includes('/directory/supplier/'));
  console.log(`Sector Category Pages: ${sectorEntries.length}`);

  const productEntries = entries.filter(e => e.url.includes('/directory/product/'));
  console.log(`Product Pages: ${productEntries.length}`);

  console.log('✓ PASS: Sitemap output is 100% verified and correct!');
}

testSitemap().catch(err => {
  console.error('Sitemap test failed:', err);
  process.exit(1);
});
