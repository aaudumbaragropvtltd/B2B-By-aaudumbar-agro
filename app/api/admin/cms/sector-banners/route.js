// ============================================================================
// ADMIN CMS SECTOR & CATEGORY BANNERS API
// ============================================================================
// Endpoint: GET /api/admin/cms/sector-banners
// Endpoint: PUT /api/admin/cms/sector-banners
// ============================================================================

import { NextResponse } from 'next/server';
import { getAllSectorBanners, updateSectorBanner } from '@/utils/platformBanners';
import { logPlatformEvent } from '@/utils/platformLogs';

export async function GET() {
  try {
    const sectorBannersMap = await getAllSectorBanners();
    const sectorBanners = Object.entries(sectorBannersMap).map(([slug, data]) => ({
      slug,
      ...data,
    }));

    return NextResponse.json({ success: true, sectorBanners });
  } catch (error) {
    console.error('Error fetching sector banners:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { slug, hero_image_url, subtitle, badge_text, name, is_active } = body;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Sector slug is required' }, { status: 400 });
    }

    const updated = await updateSectorBanner(slug, {
      hero_image_url,
      subtitle,
      badge_text,
      name,
      ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
    });

    await logPlatformEvent({
      level: 'INFO',
      service: 'cms_sector_banners',
      message: `Updated category banner for ${slug}`,
      metadata: { slug, hero_image_url },
    });

    return NextResponse.json({ success: true, sectorBanner: { slug, ...updated } });
  } catch (error) {
    console.error('Error updating sector banner:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
