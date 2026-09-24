// ============================================================================
// ADMIN CMS BANNERS API
// ============================================================================
// Endpoint: GET /api/admin/cms/banners
// Endpoint: POST /api/admin/cms/banners
// Endpoint: PUT /api/admin/cms/banners
// Endpoint: DELETE /api/admin/cms/banners
// ============================================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '@/utils/platformBanners';
import { logPlatformEvent } from '@/utils/platformLogs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const banners = await getAllBanners();
    return NextResponse.json(
      { success: true, banners },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.title || !body.hero_image_url) {
      return NextResponse.json({ success: false, error: 'Title and Image URL are required' }, { status: 400 });
    }

    const created = await createBanner(body);

    try {
      revalidatePath('/');
      revalidatePath('/admin/cms');
      revalidatePath('/api/banners');
    } catch (e) {}

    await logPlatformEvent({
      level: 'INFO',
      service: 'cms_banners',
      message: `Created banner: ${created.title}`,
      metadata: { bannerId: created.id },
    });

    return NextResponse.json(
      { success: true, banner: created },
      { status: 201, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
    }

    const updated = await updateBanner(body.id, body);

    try {
      revalidatePath('/');
      revalidatePath('/admin/cms');
      revalidatePath('/api/banners');
    } catch (e) {}

    await logPlatformEvent({
      level: 'INFO',
      service: 'cms_banners',
      message: `Updated banner: ${updated.title} (active: ${updated.is_active})`,
      metadata: { bannerId: body.id, is_active: updated.is_active },
    });

    return NextResponse.json(
      { success: true, banner: updated },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
    }

    await deleteBanner(id);

    try {
      revalidatePath('/');
      revalidatePath('/admin/cms');
      revalidatePath('/api/banners');
    } catch (e) {}

    await logPlatformEvent({
      level: 'WARN',
      service: 'cms_banners',
      message: `Deleted banner ID: ${id}`,
      metadata: { bannerId: id },
    });

    return NextResponse.json(
      { success: true, message: 'Banner deleted' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
