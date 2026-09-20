// ============================================================================
// B2B INDIA — SEO, AEO & GEO VALIDATION SUITE
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('--- 1. Testing LLMS.txt & LLMS-Full.txt (AEO & GEO Standards) ---');
  
  const llmsPath = path.join(rootDir, 'public', 'llms.txt');
  const llmsFullPath = path.join(rootDir, 'public', 'llms-full.txt');
  
  assert(fs.existsSync(llmsPath), 'public/llms.txt exists');
  assert(fs.existsSync(llmsFullPath), 'public/llms-full.txt exists');

  const llmsContent = fs.readFileSync(llmsPath, 'utf8');
  assert(llmsContent.includes('b2bindia.site'), 'llms.txt contains primary domain');
  assert(llmsContent.includes('10% Advance Escrow'), 'llms.txt highlights 10% advance escrow');
  assert(llmsContent.includes('Aaudumbar Agro Pvt. Ltd.'), 'llms.txt identifies legal operating entity');
  assert(llmsContent.includes('llms-full.txt'), 'llms.txt links to full specifications');

  const llmsFullContent = fs.readFileSync(llmsFullPath, 'utf8');
  assert(llmsFullContent.includes('Aaudumbar Agro Pvt. Ltd.'), 'llms-full.txt contains full corporate profile');
  assert(llmsFullContent.includes('Chhatrapati Sambhajinagar'), 'llms-full.txt mentions headquarters coordinates');
  assert(llmsFullContent.includes('Turmeric'), 'llms-full.txt details agricultural commodities');
  assert(llmsFullContent.includes('Reverse Auction'), 'llms-full.txt documents Live RFQ Reverse Auction');

  console.log('\n--- 2. Testing Route Handlers (/llms.txt & /llms-full.txt) ---');
  
  const routeLlms = path.join(rootDir, 'app', 'llms.txt', 'route.js');
  const routeLlmsFull = path.join(rootDir, 'app', 'llms-full.txt', 'route.js');

  assert(fs.existsSync(routeLlms), 'app/llms.txt/route.js exists');
  assert(fs.existsSync(routeLlmsFull), 'app/llms-full.txt/route.js exists');

  const { GET: getLlms } = await import(pathToFileURL(routeLlms).href);
  const res1 = await getLlms();
  assert(res1.status === 200, 'GET /llms.txt returns HTTP 200');
  assert(res1.headers.get('Content-Type').includes('text/plain'), 'GET /llms.txt returns text/plain');

  const { GET: getLlmsFull } = await import(pathToFileURL(routeLlmsFull).href);
  const res2 = await getLlmsFull();
  assert(res2.status === 200, 'GET /llms-full.txt returns HTTP 200');
  assert(res2.headers.get('Content-Type').includes('text/plain'), 'GET /llms-full.txt returns text/plain');

  console.log('\n--- 3. Testing Robots.txt Directives (Search & AI Engines) ---');
  
  const robotsPath = path.join(rootDir, 'app', 'robots.js');
  const { default: robotsConfig } = await import(pathToFileURL(robotsPath).href);
  const config = robotsConfig();

  assert(Array.isArray(config.rules), 'robots.js exports array of rules');
  
  // Verify AI bots
  const userAgents = config.rules.map(r => r.userAgent).flat();
  assert(userAgents.includes('GPTBot'), 'GPTBot explicitly handled');
  assert(userAgents.includes('PerplexityBot'), 'PerplexityBot explicitly handled');
  assert(userAgents.includes('ClaudeBot'), 'ClaudeBot explicitly handled');
  assert(userAgents.includes('Google-Extended'), 'Google-Extended explicitly handled');
  assert(userAgents.includes('Applebot-Extended'), 'Applebot-Extended explicitly handled');

  // Verify paths
  const generalRule = config.rules.find(r => r.userAgent === '*');
  assert(generalRule.allow.includes('/llms.txt'), 'robots.txt allows /llms.txt');
  assert(generalRule.allow.includes('/llms-full.txt'), 'robots.txt allows /llms-full.txt');
  assert(generalRule.allow.includes('/market-rates'), 'robots.txt allows /market-rates');
  assert(generalRule.disallow.includes('/admin/'), 'robots.txt blocks /admin/');
  assert(generalRule.disallow.includes('/dashboard/'), 'robots.txt blocks /dashboard/');

  console.log('\n--- 4. Testing SEO & GEO Utilities (seoUtils.js) ---');
  
  const seoUtils = await import(pathToFileURL(path.join(rootDir, 'utils', 'seoUtils.js')).href);
  
  assert(Array.isArray(seoUtils.INDIAN_STATES_SERVED), 'INDIAN_STATES_SERVED is an array');
  assert(seoUtils.INDIAN_STATES_SERVED.includes('IN-MH'), 'Includes Maharashtra code IN-MH');
  assert(seoUtils.INDIAN_STATES_SERVED.includes('IN-GJ'), 'Includes Gujarat code IN-GJ');

  assert(Boolean(seoUtils.COMMODITY_KEYWORD_MAP.onion), 'Commodity map includes onion');
  assert(Boolean(seoUtils.COMMODITY_KEYWORD_MAP.garlic), 'Commodity map includes garlic');
  assert(Boolean(seoUtils.COMMODITY_KEYWORD_MAP.potato), 'Commodity map includes potato');
  assert(Boolean(seoUtils.COMMODITY_KEYWORD_MAP.gram), 'Commodity map includes gram/chana');
  assert(Boolean(seoUtils.COMMODITY_KEYWORD_MAP.pulses), 'Commodity map includes pulses');

  // HowTo Schema
  const howTo = seoUtils.generateEscrowHowToJsonLd();
  assert(howTo['@type'] === 'HowTo', 'HowTo schema has @type HowTo');
  assert(Array.isArray(howTo.step) && howTo.step.length === 3, 'HowTo schema has 3 procurement steps');

  // FAQ Schema
  const faqs = seoUtils.getPlatformKnowledgeFaqs();
  assert(Array.isArray(faqs) && faqs.length >= 8, 'Knowledge FAQs has 8+ comprehensive Q&As');
  const faqSchema = seoUtils.generateFaqJsonLd(faqs);
  assert(faqSchema['@type'] === 'FAQPage', 'FAQ schema has @type FAQPage');
  assert(faqSchema.mainEntity.length >= 8, 'FAQ mainEntity contains questions and answers');

  // Market Rates Schema
  const marketRatesSchema = seoUtils.generateMarketRatesJsonLd();
  assert(Array.isArray(marketRatesSchema['@graph']), 'Market rates schema has @graph');
  const dataset = marketRatesSchema['@graph'].find(g => g['@type'] === 'Dataset');
  assert(Boolean(dataset), 'Market rates includes Schema.org Dataset entity');

  console.log('\n--- 5. Testing Layouts and Components ---');
  
  const knowledgeHubPath = path.join(rootDir, 'components', 'KnowledgeHubFaq.js');
  assert(fs.existsSync(knowledgeHubPath), 'KnowledgeHubFaq.js component exists');

  const supportLayoutPath = path.join(rootDir, 'app', 'support', 'layout.js');
  assert(fs.existsSync(supportLayoutPath), 'app/support/layout.js exists');

  const marketRatesLayoutPath = path.join(rootDir, 'app', 'market-rates', 'layout.js');
  assert(fs.existsSync(marketRatesLayoutPath), 'app/market-rates/layout.js exists');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} PASSED`);
  console.log(`========================================`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
