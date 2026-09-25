async function verifySectorSSR() {
  const sectorsToTest = ['food-agriculture', 'building-construction', 'chemicals-dyes'];
  
  for (const slug of sectorsToTest) {
    console.log(`\n================ Testing Sector: ${slug} ================`);
    const url = `http://localhost:3000/directory/${slug}`;
    const res = await fetch(url);
    console.log(`HTTP Status:`, res.status);
    if (!res.ok) {
      console.error(`Failed to fetch ${url}`);
      continue;
    }
    const html = await res.text();
    console.log(`HTML Total Bytes:`, html.length);
    console.log(`RAG Answer Capsule present:`, html.includes('id="rag-answer-capsule"'));
    console.log(`Regulatory Entities present:`, html.includes('id="regulatory-entities"'));
    console.log(`Reverse Prompt Matrix present:`, html.includes('id="reverse-prompt-matrix"'));
    console.log(`CollectionPage Schema present:`, html.includes('"@type":"CollectionPage"'));
    console.log(`FAQPage Schema present:`, html.includes('"@type":"FAQPage"'));
    console.log(`BreadcrumbList Schema present:`, html.includes('"@type":"BreadcrumbList"'));
    console.log(`Mentions 10% Escrow Protection:`, html.includes('10%') && html.toLowerCase().includes('escrow'));
    console.log(`Mentions Pre-Shipment Inspection:`, html.toLowerCase().includes('pre-shipment') || html.toLowerCase().includes('inspection'));
    
    // Extract questions
    const questions = [...html.matchAll(/itemProp="name"[^>]*>([^<]+)<\/h3>/gi)].map(m => m[1]);
    console.log(`Extracted FAQ Questions (${questions.length}):`);
    questions.forEach((q, i) => console.log(`  [Q${i+1}]: ${q.trim()}`));
  }
}

verifySectorSSR().catch(err => {
  console.error(err);
  process.exit(1);
});
