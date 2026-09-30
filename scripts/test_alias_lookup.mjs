import { getProductById } from '../utils/catalogResolver.js';

async function testAliases() {
  console.log('Testing lookup for "turmeric"...');
  const p1 = await getProductById('turmeric');
  console.log('Lookup turmeric ->', p1?.title, '| slug:', p1?.slug);

  console.log('Testing lookup for "haldi"...');
  const p2 = await getProductById('haldi');
  console.log('Lookup haldi ->', p2?.title, '| slug:', p2?.slug);

  console.log('Testing lookup for real product slug "salem-organic-turmeric-powder-export-grade-wholesale-supplier"...');
  const p3 = await getProductById('salem-organic-turmeric-powder-export-grade-wholesale-supplier');
  console.log('Lookup exact slug ->', p3?.title, '| slug:', p3?.slug);

  console.log('Testing lookup for non-existent product "anything-at-all"...');
  const p4 = await getProductById('anything-at-all');
  console.log('Lookup fake product ->', p4);

  if (!p1 || !p2 || !p3) {
    throw new Error('One or more lookups failed!');
  }
  if (p4 !== null) {
    throw new Error('Fake product should return null but returned a mock object!');
  }
  console.log('✓ PASS: Alias lookups resolve to real products, and non-existent products return null!');
}

testAliases().catch(err => {
  console.error('Alias test failed:', err);
  process.exit(1);
});
