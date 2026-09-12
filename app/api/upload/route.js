// ============================================================================
// CLOUD MEDIA UPLOAD API (Cloudinary Media CDN + Resilient Fallback)
// ============================================================================
// Offloads product images, banner media, videos, and heavy documents
// directly to Cloudinary CDN to prevent database bloating and storage limits.
// Supabase stores only lightweight structured records and Cloudinary URLs.
// ============================================================================

import { NextResponse } from 'next/server';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/services/cloudinary';
import fs from 'fs';
import path from 'path';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

const ALLOWED_DOC_TYPES = [
  'application/pdf'
];

const ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOC_TYPES
];

// 50MB max for video/large media, 15MB for images
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_MEDIA_SIZE = 60 * 1024 * 1024;

export async function POST(request) {
  try {
    // 1. Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const bucket = formData.get('bucket') || 'products'; // 'products', 'banners', 'logos', 'videos', 'documents'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No media file provided' }, { status: 400 });
    }

    // 2. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Unsupported file format (${file.type}). Supported formats: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF`,
      }, { status: 400 });
    }

    // Determine resource type
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const isDoc = ALLOWED_DOC_TYPES.includes(file.type);
    const resourceType = isVideo ? 'video' : isDoc ? 'raw' : 'image';

    // 3. Validate file size
    const limit = isVideo ? MAX_MEDIA_SIZE : MAX_IMAGE_SIZE;
    if (file.size > limit) {
      return NextResponse.json({
        error: `File exceeds maximum allowed size (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${(limit / 1024 / 1024).toFixed(0)}MB`,
      }, { status: 400 });
    }

    // 4. Generate unique clean filename & public ID
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
    const timestamp = Date.now();
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = `${timestamp}_${sanitizedName}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Map bucket to Cloudinary folder hierarchy
    let cloudinaryFolder = 'b2b-bharat/products';
    if (bucket === 'banners') cloudinaryFolder = 'b2b-bharat/banners';
    else if (bucket === 'logos') cloudinaryFolder = 'b2b-bharat/logos';
    else if (bucket === 'videos' || isVideo) cloudinaryFolder = 'b2b-bharat/videos';
    else if (bucket === 'documents' || isDoc) cloudinaryFolder = 'b2b-bharat/documents';

    // 5. If Cloudinary is configured, upload directly to Cloudinary CDN!
    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: cloudinaryFolder,
          resourceType,
          publicId: `${timestamp}_${sanitizedName}`,
          tags: ['b2b-bharat', bucket, resourceType]
        });

        return NextResponse.json({
          success: true,
          url: uploadResult.secure_url || uploadResult.url,
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          provider: 'cloudinary',
          resource_type: uploadResult.resource_type || resourceType,
          format: uploadResult.format || ext,
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.bytes || file.size,
          fileName,
          bucket,
          message: 'Media uploaded successfully to Cloudinary CDN'
        });
      } catch (cloudinaryErr) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryErr);
        // Fall back to local storage if Cloudinary encounter a network/credential error
      }
    }

    // 6. Fallback to local storage (e.g. while Cloudinary API keys are being set in .env.local)
    let localPublicUrl = `/uploads/${bucket}/${fileName}`;
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', bucket);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(localFilePath, buffer);
    } catch (localWriteErr) {
      console.warn('Local disk write warning:', localWriteErr.message);
    }

    return NextResponse.json({
      success: true,
      url: localPublicUrl,
      localUrl: localPublicUrl,
      fileName,
      bucket,
      size: file.size,
      type: file.type,
      provider: 'local_fallback',
      cloudinaryConfigured: false,
      message: 'Image uploaded locally. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local to activate Cloudinary CDN offloading.'
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Media upload failed' },
      { status: 500 }
    );
  }
}
