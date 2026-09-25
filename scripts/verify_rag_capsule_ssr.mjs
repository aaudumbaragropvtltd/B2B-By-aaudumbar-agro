import http from 'http';

async function verify() {
  try {
    const res = await fetch('http://localhost:3000/directory/product/salem-double-polish-turmeric-finger');
    console.log('HTTP Status:', res.status);
    const html = await res.text();
    console.log('HTML Total Bytes:', html.length);
    
    console.log('RAG Answer Capsule present:', html.includes('id="rag-answer-capsule"'));
    console.log('Reverse Prompt Matrix present:', html.includes('id="reverse-prompt-matrix"'));
    console.log('Regulatory Entities present:', html.includes('id="regulatory-entities"'));
    console.log('FAQPage Schema present:', html.includes('"@type":"FAQPage"'));
    console.log('Product Schema present:', html.includes('"@type":"Product"'));
    
    // Check if capsule contains key commercial anchors
    console.log('Mentions 10% Escrow Protection:', html.includes('10%') && html.toLowerCase().includes('escrow'));
    console.log('Mentions Pre-Shipment Inspection:', html.toLowerCase().includes('pre-shipment') || html.toLowerCase().includes('inspection'));
    console.log('Mentions APMC / Mandi / Benchmark:', html.toLowerCase().includes('mandi') || html.toLowerCase().includes('apmc') || html.toLowerCase().includes('benchmark'));
    
    // Extract FAQ questions
    const faqQuestions = [...html.matchAll(/itemProp="name"[^>]*>([^<]+)<\/h3>/gi)].map(m => m[1]);
    console.log('Extracted FAQ Questions count:', faqQuestions.length);
    if (faqQuestions.length > 0) {
      faqQuestions.forEach((q, i) => console.log(`  FAQ ${i+1}: ${q.trim()}`));
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

verify();
