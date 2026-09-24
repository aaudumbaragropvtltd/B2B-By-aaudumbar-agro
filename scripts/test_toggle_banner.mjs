import { getAllBanners, updateBanner } from '../utils/platformBanners.js';

async function test() {
  console.log('Testing banner toggle...');
  try {
    const banners = await getAllBanners();
    console.log('All banners count:', banners.length);
    console.log('Banners:', banners.map(b => ({ id: b.id, title: b.title, is_active: b.is_active })));

    if (banners.length > 0) {
      const b0 = banners[0];
      console.log('Attempting to toggle banner:', b0.id, 'from', b0.is_active, 'to', !b0.is_active);
      const updated = await updateBanner(b0.id, { is_active: !b0.is_active });
      console.log('Updated result:', updated.id, 'is_active:', updated.is_active);

      // Re-read
      const bannersAfter = await getAllBanners();
      console.log('After toggle:', bannersAfter.map(b => ({ id: b.id, is_active: b.is_active })));

      // Toggle back
      await updateBanner(b0.id, { is_active: b0.is_active });
      console.log('Toggled back to original.');
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
