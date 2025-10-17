import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Helper function to optimize image for email
const optimizeImageForEmail = async (buffer, mimeType) => {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  // Check if image has transparency
  const hasAlpha = metadata.channels === 4 || metadata.hasAlpha;
  
  // For email compatibility: use JPEG for photos, PNG for graphics with transparency
  if (hasAlpha) {
    return {
      buffer: await image
        .resize(600, null, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .png({ 
          quality: 100,
          compressionLevel: 9 
        })
        .toBuffer(),
      format: 'png',
      contentType: 'image/png'
    };
  } else {
    return {
      buffer: await image
        .resize(600, null, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true,
          mozjpeg: true 
        })
        .toBuffer(),
      format: 'jpg',
      contentType: 'image/jpeg'
    };
  }
};

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const storeId = formData.get('storeId');
    const feedName = formData.get('feedName');
    const purpose = formData.get('purpose') || 'webfeed';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!storeId || !feedName) {
      return NextResponse.json(
        { error: 'Store ID and Feed Name are required' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.' },
        { status: 400 }
      );
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    try {
      // Convert file to buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // Optimize image for email (convert to JPEG/PNG)
      const optimized = await optimizeImageForEmail(fileBuffer, file.type);
      
      // Generate unique filename
      const imageId = randomUUID();
      const fileName = `${imageId}.${optimized.format}`;
      
      // Follow R2_IMAGE_STORAGE.md structure:
      // /stores/{store-id}/webfeeds/{feed-name}/{image-uuid}.{jpg|png}
      const key = `stores/${storeId}/webfeeds/${feedName}/${fileName}`;
      
      // Upload to R2 wzl-store bucket
      const uploadParams = {
        Bucket: 'wzl-store',
        Key: key,
        Body: optimized.buffer,
        ContentType: optimized.contentType,
        CacheControl: 'public, max-age=86400', // 24 hours cache
        Metadata: {
          type: 'webfeed-image',
          storeId: storeId,
          feedName: feedName,
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      };
      
      await r2Client.send(new PutObjectCommand(uploadParams));
      
      // Construct public URL
      // Use the public URL if available, otherwise use the direct R2 URL
      const publicUrl = process.env.R2_STORE_PUBLIC 
        ? `${process.env.R2_STORE_PUBLIC}/${key}`
        : `${process.env.R2_STORE}/${key}`;
      
      return NextResponse.json({
        success: true,
        url: publicUrl,
        key: key,
        format: optimized.format,
        message: 'Image uploaded and optimized for email'
      });
    } catch (uploadError) {
      console.error('R2 upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image to storage' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// Handle image URL fetching (for importing from URL)
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, storeId, feedName } = await request.json();
    
    if (!imageUrl || !storeId || !feedName) {
      return NextResponse.json(
        { error: 'Image URL, Store ID, and Feed Name are required' },
        { status: 400 }
      );
    }
    
    try {
      // Fetch image from URL
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch image from URL' },
          { status: 400 }
        );
      }
      
      const contentType = response.headers.get('content-type');
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      
      if (!contentType || !allowedTypes.includes(contentType)) {
        return NextResponse.json(
          { error: 'Invalid image type from URL' },
          { status: 400 }
        );
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Check size
      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image from URL exceeds 10MB limit' },
          { status: 400 }
        );
      }
      
      // Optimize image for email
      const optimized = await optimizeImageForEmail(buffer, contentType);
      
      // Generate unique filename
      const imageId = randomUUID();
      const fileName = `${imageId}.${optimized.format}`;
      
      // Follow R2_IMAGE_STORAGE.md structure
      const key = `stores/${storeId}/webfeeds/${feedName}/${fileName}`;
      
      // Upload to R2 wzl-store bucket
      const uploadParams = {
        Bucket: 'wzl-store',
        Key: key,
        Body: optimized.buffer,
        ContentType: optimized.contentType,
        CacheControl: 'public, max-age=86400',
        Metadata: {
          type: 'webfeed-image',
          storeId: storeId,
          feedName: feedName,
          originalUrl: imageUrl,
          uploadedAt: new Date().toISOString()
        }
      };
      
      await r2Client.send(new PutObjectCommand(uploadParams));
      
      // Construct public URL
      const publicUrl = process.env.R2_STORE_PUBLIC 
        ? `${process.env.R2_STORE_PUBLIC}/${key}`
        : `${process.env.R2_STORE}/${key}`;
      
      return NextResponse.json({
        success: true,
        url: publicUrl,
        key: key,
        format: optimized.format,
        message: 'Image fetched and optimized for email'
      });
    } catch (uploadError) {
      console.error('Image processing error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to process image from URL' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('URL import error:', error);
    return NextResponse.json(
      { error: 'Failed to import image from URL' },
      { status: 500 }
    );
  }
}