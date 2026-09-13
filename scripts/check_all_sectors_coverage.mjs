import { getAllProducts, getAllSectors } from '../utils/catalogResolver.js';
import { getProductSlug } from '../utils/slugUtils.js';

async function checkAllCategories() {
  const sectors = getAllSectors();
  const allProducts = await getAllProducts();

  console.log('====================================================');
  console.log(`TOTAL SECTORS / CATEGORIES: ${sectors.length}`);
  console.log(`TOTAL PRODUCTS CURRENTLY INDEXED: ${allProducts.length}`);
  console.log('====================================================\n');

  const summary = [];

  sectors.forEach((sec, i) => {
    const prods = allProducts.filter(p => {
      const s = p.sector_id?.slug || p.category || '';
      return (
        s === sec.slug ||
        s.includes(sec.slug) ||
        sec.slug.includes(s) ||
        (sec.slug === 'building-construction' && s === 'construction') ||
        (sec.slug === 'food-agriculture' && (s === 'agriculture' || s === 'food-beverage')) ||
        (sec.slug === 'apparel-garments' && (s === 'apparel-fashion' || s === 'textiles')) ||
        (sec.slug === 'automobile-parts' && s === 'automobile-ev')
      );
    });

    const sample = prods[0];
    const sampleSlug = sample ? getProductSlug(sample) : null;

    summary.push({
      index: i + 1,
      sectorName: sec.name,
      slug: sec.slug,
      productCount: prods.length,
      categoryUrl: `https://www.b2bindia.site/directory/${sec.slug}`,
      sampleProductTitle: sample ? (sample.title || sample.name) : 'Category Onboarding Available',
      sampleProductUrl: sample ? `https://www.b2bindia.site/directory/product/${sampleSlug}` : null
    });
  });

  console.log(JSON.stringify(summary, null, 2));
}

checkAllCategories().catch(console.error);
