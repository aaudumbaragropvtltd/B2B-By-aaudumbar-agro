// ============================================================================
// ADMIN CLOUDINARY STATUS & HEALTH CHECK API
// ============================================================================

import { NextResponse } from 'next/server';
import { checkCloudinaryHealth, isCloudinaryConfigured } from '@/services/cloudinary';

export async function GET() {
  try {
    const isConfigured = isCloudinaryConfigured();
    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        message: 'Cloudinary credentials missing in .env.local',
        requiredKeys: [
          'CLOUDINARY_CLOUD_NAME',
          'CLOUDINARY_API_KEY',
          'CLOUDINARY_API_SECRET'
        ],
        alternative: 'CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME'
      });
    }

    const health = await checkCloudinaryHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error.message
    }, { status: 500 });
  }
}
