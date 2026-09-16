async function testSeo() {
  try {
    const res = await fetch('http://localhost:3000/');
    const html = await res.text();
    
    // Title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'NOT FOUND';
    console.log('TITLE:', title, `(Length: ${title.length} chars)`);
    
    // Meta Description
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    const desc = descMatch ? descMatch[1] : 'NOT FOUND';
    console.log('META DESC:', desc, `(Length: ${desc.length} chars)`);
    
    // Headings
    const headings = [];
    const hRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = hRegex.exec(html)) !== null) {
      const level = parseInt(match[1][1]);
      const text = match[2].replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
      headings.push({ tag: match[1].toUpperCase(), level, text: text.slice(0, 45) });
    }
    console.log('\nTOTAL HEADINGS FOUND:', headings.length);
    
    const tagCounts = { H1: 0, H2: 0, H3: 0, H4: 0, H5: 0, H6: 0 };
    headings.forEach(h => tagCounts[h.tag]++);
    console.log('HEADING COUNTS:', JSON.stringify(tagCounts));
    
    // Check skips
    let lastLevel = 1;
    let skips = [];
    headings.forEach(h => {
      if (h.level > lastLevel + 1) {
        skips.push(`Skipped from H${lastLevel} to ${h.tag}: "${h.text}"`);
      }
      lastLevel = h.level;
    });
    console.log('SKIPPED HEADING LEVELS:', skips.length ? skips : 'NONE! Clean hierarchy!');
    
    // Schema check
    const jsonLdMatches = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    console.log('\nJSON-LD SCRIPTS COUNT:', jsonLdMatches ? jsonLdMatches.length : 0);
    if (jsonLdMatches) {
      jsonLdMatches.forEach((m, idx) => {
        try {
          const content = m.replace(/<\/?script[^>]*>/gi, '');
          const parsed = JSON.parse(content);
          const types = parsed['@graph'] ? parsed['@graph'].map(x => x['@type']) : parsed['@type'];
          console.log(`Script #${idx+1} types:`, JSON.stringify(types));
        } catch (e) {
          console.log('JSON-LD parse error:', e.message);
        }
      });
    }

    // Check llms.txt
    const llmsRes = await fetch('http://localhost:3000/llms.txt');
    console.log('\n/llms.txt HTTP STATUS:', llmsRes.status);
    
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testSeo();
