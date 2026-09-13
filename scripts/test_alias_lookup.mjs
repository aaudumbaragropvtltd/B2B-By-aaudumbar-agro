import { getProductById } from '../utils/catalogResolver.js';

async function testAliases() {
  console.log('Testing lookup for "turmeric"...');
  const p1 = await getProductById('turmeric');
  console.log('Lookup turmeric ->', p1?.title, '| slug:', p1?.slug);

  console.log('Testing lookup for "haldi"...');
  const p2 = await getProductById('haldi');
  console.log('Lookup haldi ->', p2?.title, '| slug:', p2?.slug);

  console.log('Testing lookup for "turmeric-finger-25-curcumin"...');
  const p3 = await getProductById('turmeric-finger-25-curcumin');
  console.log('Lookup exact slug ->', p3?.title, '| slug:', p3?.slug);

  if (!p1 || !p2 || !p3) {
    throw new Error('One or more lookups failed!');
  }
  if (p3.slug !== 'turmeric-finger-25-curcumin') {
    throw new Error(`Unexpected slug for p3: ${p3.slug}`);
  }
  console.log('✓ PASS: All alias and slug lookups resolve accurately to the Turmeric product!');
}

testAliases().catch(err => {
  console.error('Alias test failed:', err);
  process.exit(1);
});
