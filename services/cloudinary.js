// ============================================================================
// CLOUDINARY MEDIA CDN SERVICE
// ============================================================================
// High-performance media offloading for B2B Bharat.
// Offloads heavy assets (product images, banners, user docs, videos)
// to Cloudinary CDN, keeping Supabase strictly for structured relational data.
// ============================================================================

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  cloudinary.config({
    cloudinary_url: cloudinaryUrl,
    secure: true
  });
} else if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

/**
 * Returns true if Cloudinary environment variables are configured
 */
export function isCloudinaryConfigured() {
  if (process.env.CLOUDINARY_URL) return true;
  const cn = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const ak = process.env.CLOUDINARY_API_KEY;
  const as = process.env.CLOUDINARY_API_SECRET;
  return Boolean(cn && ak && as);
}

/**
 * Upload a media buffer (Image, Video, Document) directly to Cloudinary
 * 
 * @param {Buffer} buffer - File buffer to upload
 * @param {Object} options - Upload options
 * @param {string} [options.folder='b2b-bharat/general'] - Destination folder in Cloudinary
 * @param {string} [options.resourceType='auto'] - 'image' | 'video' | 'raw' | 'auto'
 * @param {string} [options.publicId] - Optional custom public ID
 * @param {Array<string>} [options.tags] - Search tags
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadToCloudinary(buffer, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured in environment variables.');
  }

  const {
    folder = 'b2b-bharat/general',
    resourceType = 'auto',
    publicId,
    tags = ['b2b-marketplace']
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      tags,
      // Automatic quality and modern format (WebP/AVIF) optimization for images
      ...(resourceType === 'image' || resourceType === 'auto' ? {
        quality: 'auto:good',
        fetch_format: 'auto'
      } : {})
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Stream Error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload a Base64 string or remote URL to Cloudinary
 * 
 * @param {string} base64OrUrl - Base64 data string or external image URL
 * @param {Object} options - Upload options
 */
export async function uploadBase64OrUrlToCloudinary(base64OrUrl, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured in environment variables.');
  }

  const {
    folder = 'b2b-bharat/general',
    resourceType = 'auto',
    tags = ['b2b-marketplace']
  } = options;

  const result = await cloudinary.uploader.upload(base64OrUrl, {
    folder,
    resource_type: resourceType,
    tags,
    quality: 'auto:good',
    fetch_format: 'auto'
  });

  return result;
}

/**
 * Delete an asset from Cloudinary
 * 
 * @param {string} publicId - Cloudinary asset public ID
 * @param {string} [resourceType='image'] - 'image' | 'video' | 'raw'
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!isCloudinaryConfigured()) {
    return { skipped: true, reason: 'Cloudinary not configured' };
  }
  return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Test Cloudinary API connection and return cloud status
 */
export async function checkCloudinaryHealth() {
  if (!isCloudinaryConfigured()) {
    return {
      configured: false,
      message: 'Cloudinary environment variables missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
    };
  }

  try {
    const ping = await cloudinary.api.ping();
    return {
      configured: true,
      connected: ping.status === 'ok',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      status: ping.status
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      error: err.message
    };
  }
}

export default cloudinary;
