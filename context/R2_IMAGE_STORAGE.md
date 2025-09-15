# R2 Image Storage Architecture

This document outlines the image storage strategy for the AI CMO email builder using Cloudflare R2 buckets.

## Bucket Overview

We use three R2 buckets with distinct purposes and lifecycle policies:

| Bucket | Purpose | Retention | Use Cases |
|--------|---------|-----------|-----------|
| wzl-temp | Temporary assets | 7-180 days (automatic) | AI-generated images, drafts|
| wzl-perm | Production assets | Permanent | Confirmed campaign images, email templates |
| wzl-store | Store assets | Permanent | Logos, brand assets, store-specific resources, web feed cache  |

## Bucket Structure

### wzl-temp (Temporary Assets)

```
/ai-generated/{store-id}/{date}/{session-id}/{image-uuid}.webp
  � Expires: 180 days
  � Use: AI-generated images during email creation

/drafts/{store-id}/{campaign-id}/{image-uuid}.webp
  � Expires: 180 days
  � Use: Images in draft campaigns



### wzl-perm (Production Assets)

```
/campaigns/{store-id}/{year}/{month}/{campaign-id}/{image-name}.{jpg|png}
  → Retention: Permanent
  → Use: Images in scheduled/sent campaigns
  → Format: JPEG for photos, PNG for graphics/logos

/templates/{store-id}/{template-id}/{image-name}.{jpg|png}
  → Retention: Permanent
  → Use: Reusable email template images
  → Format: JPEG for photos, PNG for graphics/logos
```

### wzl-store (Store Assets)

```
/stores/{store-id}/logo.{svg|png|webp}
  � Use: Primary store logo

/stores/{store-id}/brand/{asset-name}.{jpg|png|webp}
  → Use: Brand colors, patterns, headers, footers
  → Format: WebP for web, JPEG/PNG for email

/shared/icons/{icon-name}.svg
  � Use: Common icons used across all stores

/stores/{store-id}/webfeeds/{feed-name}/{image-uuid}.{jpg|png}
  → Use: Web feed product images for email campaigns
  → Format: JPEG for product photos, PNG for logos/graphics
  → Retention: Permanent (managed by feed lifecycle)
```
```

## Usage Guide

### Uploading Images

#### 1. AI-Generated Images

```javascript
// Upload AI-generated image to temp bucket
const uploadAIImage = async (imageBuffer, storeId, sessionId) => {
  const date = new Date().toISOString().split('T')[0];
  const imageId = crypto.randomUUID();
  const key = `ai-generated/${storeId}/${date}/${sessionId}/${imageId}.webp`;
  
  await uploadToR2('wzl-temp', key, imageBuffer, {
    metadata: {
      type: 'ai-generated',
      storeId,
      sessionId,
      expiresAt: addDays(new Date(), 180).toISOString()
    }
  });
  
  return `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-temp/${key}`;
};
```

#### 2. Draft Campaign Images

```javascript
// Upload draft image
const uploadDraftImage = async (imageBuffer, storeId, campaignId) => {
  const imageId = crypto.randomUUID();
  const key = `drafts/${storeId}/${campaignId}/${imageId}.webp`;
  
  await uploadToR2('wzl-temp', key, imageBuffer, {
    metadata: {
      type: 'draft',
      storeId,
      campaignId,
      expiresAt: addDays(new Date(), 30).toISOString()
    }
  });
  
  return `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-temp/${key}`;
};
```

#### 3. Store Logo Upload

```javascript
// Upload store logo to store bucket
const uploadStoreLogo = async (logoBuffer, storeId, format = 'png') => {
  const key = `stores/${storeId}/logo.${format}`;
  
  await uploadToR2('wzl-store', key, logoBuffer, {
    metadata: {
      type: 'logo',
      storeId,
      updatedAt: new Date().toISOString()
    },
    cacheControl: 'public, max-age=604800' // 7 days
  });
  
  return `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-store/${key}`;
};
```

### Migrating Images to Production

When a campaign is confirmed and scheduled, migrate images from temp to permanent storage:

```javascript
const confirmCampaignImages = async (campaignId, storeId) => {
  // 1. List all draft images
  const draftImages = await listR2Objects('wzl-temp', {
    prefix: `drafts/${storeId}/${campaignId}/`
  });
  
  // 2. Convert and copy each image to production bucket
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const productionUrls = [];
  
  for (const image of draftImages) {
    // Download the WebP image
    const webpData = await getR2Object('wzl-temp', image.key);
    
    // Determine output format based on image type
    // Use PNG for images with transparency, JPEG for photos
    const hasTransparency = await checkImageTransparency(webpData);
    const format = hasTransparency ? 'png' : 'jpg';
    
    // Convert WebP to email-compatible format
    const convertedImage = await sharp(webpData)
      .toFormat(format, {
        quality: format === 'jpg' ? 85 : undefined,
        progressive: true, // Progressive JPEG for better loading
        mozjpeg: format === 'jpg' // Use mozjpeg encoder for better compression
      })
      .toBuffer();
    
    // Generate new filename with correct extension
    const originalName = image.key.split('/').pop().replace('.webp', '');
    const newFilename = `${originalName}.${format}`;
    const newKey = `campaigns/${storeId}/${year}/${month}/${campaignId}/${newFilename}`;
    
    // Upload converted image to production bucket
    await uploadToR2('wzl-perm', newKey, convertedImage, {
      contentType: format === 'jpg' ? 'image/jpeg' : 'image/png',
      cacheControl: 'public, max-age=31536000, immutable', // 1 year cache for production images
      metadata: {
        type: 'campaign-image',
        storeId,
        campaignId,
        originalFormat: 'webp',
        convertedFormat: format
      }
    });
    
    productionUrls.push(`https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-perm/${newKey}`);
  }
  
  // 3. Update campaign with new URLs
  await updateCampaignImageUrls(campaignId, productionUrls);
  
  // 4. Delete draft images
  await deleteR2Objects('wzl-temp', draftImages.map(img => img.key));
  
  return productionUrls;
};

// Helper function to check if image has transparency
const checkImageTransparency = async (imageBuffer) => {
  const metadata = await sharp(imageBuffer).metadata();
  return metadata.channels === 4 || metadata.hasAlpha;
};
```

## Lifecycle Rules Configuration

Configure these lifecycle rules in Cloudflare dashboard:

### wzl-temp Bucket Rules

```json
{
  "rules": [
    {
      "id": "cleanup-ai-generated",
      "status": "Enabled",
      "filter": { "prefix": "ai-generated/" },
      "actions": {
        "expiration": { "days": 180 }
      }
    },
    {
      "id": "cleanup-drafts",
      "status": "Enabled",
      "filter": { "prefix": "drafts/" },
      "actions": {
        "expiration": { "days": 30 }
      }
    },
    {
      "id": "cleanup-webfeed",
      "status": "Enabled",
      "filter": { "prefix": "webfeed-cache/" },
      "actions": {
        "expiration": { "days": 7 }
      }
    }
  ]
}
```

## Image Optimization

All images should be optimized before storage:

```javascript
const optimizeImage = async (imageBuffer, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = 'webp',
    purpose = 'draft' // 'draft', 'production', 'email'
  } = options;
  
  // Use Sharp for image optimization
  let pipeline = sharp(imageBuffer)
    .resize(maxWidth, maxHeight, { 
      fit: 'inside',
      withoutEnlargement: true 
    });
  
  // Format based on purpose
  if (purpose === 'production' || purpose === 'email') {
    // For production emails, use JPEG/PNG
    const metadata = await sharp(imageBuffer).metadata();
    const hasAlpha = metadata.channels === 4 || metadata.hasAlpha;
    
    if (hasAlpha) {
      pipeline = pipeline.png({ 
        quality: 100,
        compressionLevel: 9 
      });
    } else {
      pipeline = pipeline.jpeg({ 
        quality,
        progressive: true,
        mozjpeg: true 
      });
    }
  } else {
    // For drafts and temporary assets, use WebP for efficiency
    pipeline = pipeline.webp({ quality });
  }
  
  return pipeline.toBuffer();
};
```

## URL Structure

### CDN URLs (Public Access)
- **Temp**: `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-temp/{path}`
- **Perm**: `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-perm/{path}`
- **Store**: `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-store/{path}`

### Public URLs (If configured)
- **Temp**: `https://wzl-temp.{custom-domain}.com/{path}`
- **Perm**: `https://wzl-perm.{custom-domain}.com/{path}`
- **Store**: `https://wzl-store.{custom-domain}.com/{path}`

## Database Schema

Track all images in your database:

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  bucket_name VARCHAR(20) NOT NULL CHECK (bucket_name IN ('wzl-temp', 'wzl-perm', 'wzl-store')),
  object_key VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  type VARCHAR(50) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  metadata JSONB DEFAULT '{}',
  size_bytes BIGINT,
  mime_type VARCHAR(100),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  migrated_at TIMESTAMP,
  
  UNIQUE(bucket_name, object_key),
  INDEX idx_store_images (store_id, created_at DESC),
  INDEX idx_campaign_images (campaign_id),
  INDEX idx_expiring_images (expires_at) WHERE expires_at IS NOT NULL
);
```

## Helper Functions

### Core R2 Client Setup

```javascript
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  CopyObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command 
} from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Upload helper
export const uploadToR2 = async (bucket, key, buffer, options = {}) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: options.contentType || 'image/webp',
    CacheControl: options.cacheControl || 'public, max-age=3600',
    Metadata: options.metadata || {}
  });
  
  await r2Client.send(command);
};

// Get object helper
export const getR2Object = async (bucket, key) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  const response = await r2Client.send(command);
  const chunks = [];
  
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
};

// Copy helper
export const copyR2Object = async (sourceBucket, sourceKey, destBucket, destKey) => {
  const command = new CopyObjectCommand({
    CopySource: `${sourceBucket}/${sourceKey}`,
    Bucket: destBucket,
    Key: destKey
  });
  
  await r2Client.send(command);
};

// List objects helper
export const listR2Objects = async (bucket, options = {}) => {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: options.prefix,
    MaxKeys: options.maxKeys || 1000
  });
  
  const response = await r2Client.send(command);
  return response.Contents || [];
};

// Delete objects helper
export const deleteR2Objects = async (bucket, keys) => {
  for (const key of keys) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });
    await r2Client.send(command);
  }
};
```

## Environment Variables

```env
# R2 Configuration
R2_ACCESS_KEY_ID=749dff249549e71d67675b887bc2d30b
R2_SECRET_ACCESS_KEY=f3054e3346b024660e290a66b4d86d3881edb1b64b1dd6598176a82e32b14266
R2_ACCOUNT_ID=d1cae03186a2e9610764ccfdeff62915

# Bucket Endpoints
R2_TEMP=https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-temp
R2_PERM=https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-perm
R2_STORE=https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-store

# Public URLs (if configured)
R2_PUBLIC_URL_TEMP=<public_url_if_enabled>
R2_PUBLIC_URL_PERM=<public_url_if_enabled>
R2_PUBLIC_URL_STORE=<public_url_if_enabled>
```

## Monitoring & Maintenance

### Weekly Tasks
- Review storage metrics per store
- Check for failed migrations
- Monitor lifecycle rule execution

### Monthly Tasks
- Analyze image access patterns
- Review and optimize frequently accessed images
- Audit wzl-store bucket for unused assets

### Alerts to Configure
- Storage quota approaching (80% of limit)
- Failed image migrations
- Unusual upload patterns (potential abuse)

## Cost Optimization

- Use WebP format for all non-logo images (70% smaller than PNG)
- Implement lazy loading for email preview images
- Set appropriate cache headers based on image type
- Use Cloudflare Image Resizing for on-the-fly variants
- Monitor per-store usage to identify heavy users

## Security Considerations

- Never expose direct R2 URLs without authentication
- Implement signed URLs for sensitive content
- Set CORS policies appropriately for each bucket
- Regular audit of public vs private access settings
- Rate limit upload endpoints to prevent abuse
- Use presigned URLs for direct browser uploads

## Support & Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Image not loading | Check CDN cache, verify URL path, check bucket permissions |
| Migration failed | Check for network timeout, retry with exponential backoff |
| Storage costs high | Review lifecycle rules, check for orphaned images |
| Slow uploads | Implement client-side compression, use Workers for processing |
| CORS errors | Configure CORS rules in R2 bucket settings |
| Access denied | Verify R2 credentials, check IAM permissions |

## Implementation Examples

### Web Feed Image Caching

```javascript
// Store web feed images in store bucket with email-compatible formats
const storeWebFeedImage = async (imageUrl, storeId, feedName) => {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  // Optimize for email: convert to JPEG/PNG
  const optimized = await optimizeImage(Buffer.from(buffer), {
    purpose: 'email',
    maxWidth: 600, // Standard email width
    quality: 85
  });
  
  // Determine format from optimized image
  const metadata = await sharp(optimized).metadata();
  const format = metadata.format === 'png' ? 'png' : 'jpg';
  const imageId = crypto.randomUUID();
  const key = `stores/${storeId}/webfeeds/${feedName}/${imageId}.${format}`;
  
  await uploadToR2('wzl-store', key, optimized, {
    contentType: format === 'png' ? 'image/png' : 'image/jpeg',
    cacheControl: 'public, max-age=86400', // 24 hours cache
    metadata: {
      type: 'webfeed-image',
      storeId,
      feedName,
      originalUrl: imageUrl,
      uploadedAt: new Date().toISOString()
    }
  });
  
  return `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-store/${key}`;
};

// Clean up old web feed images when feed is updated
const cleanupWebFeedImages = async (storeId, feedName) => {
  const prefix = `stores/${storeId}/webfeeds/${feedName}/`;
  
  // List existing images
  const existingImages = await listR2Objects('wzl-store', {
    prefix: prefix
  });
  
  // Delete all old images
  if (existingImages.length > 0) {
    await deleteR2Objects('wzl-store', existingImages.map(img => img.key));
  }
};
```

### Batch Image Upload

```javascript
// Upload multiple images efficiently
const batchUploadImages = async (images, storeId, campaignId) => {
  const uploadPromises = images.map(async (image) => {
    const optimized = await optimizeImage(image.buffer);
    const key = `drafts/${storeId}/${campaignId}/${image.name}`;
    
    await uploadToR2('wzl-temp', key, optimized, {
      metadata: {
        type: 'draft',
        storeId,
        campaignId,
        originalName: image.originalName
      }
    });
    
    return {
      name: image.name,
      url: `https://d1cae03186a2e9610764ccfdeff62915.r2.cloudflarestorage.com/wzl-temp/${key}`
    };
  });
  
  return Promise.all(uploadPromises);
};
```