import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Save webfeed JSON to R2 wzl-store bucket
 * Path: /stores/{store-id}/webfeeds/{feed-name}.json
 */
export async function saveWebFeedToR2(webFeed) {
  try {
    // Log to debug
    console.log('Saving webfeed to R2:', {
      name: webFeed.name,
      itemsCount: webFeed.items?.length || 0,
      hasFormatMethod: !!webFeed.formatForKlaviyo
    });
    
    // Format the feed data for public consumption
    const feedData = webFeed.formatForKlaviyo ? webFeed.formatForKlaviyo() : webFeed;
    
    console.log('Formatted feed data:', feedData);
    
    // Create the key path following R2_IMAGE_STORAGE.md structure
    const feedNameSlug = webFeed.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const key = `stores/${webFeed.store_id}/webfeeds/${feedNameSlug}.json`;
    
    // Convert to JSON string
    const jsonContent = JSON.stringify(feedData, null, 2);
    console.log('JSON content length:', jsonContent.length);
    
    // Upload to R2 wzl-store bucket
    const uploadParams = {
      Bucket: 'wzl-store',
      Key: key,
      Body: jsonContent,
      ContentType: 'application/json',
      CacheControl: 'public, max-age=300', // Cache for 5 minutes
      Metadata: {
        type: 'webfeed-json',
        storeId: webFeed.store_id,
        feedName: webFeed.name,
        feedId: webFeed._id.toString(),
        lastModified: new Date().toISOString(),
        version: String(webFeed.metadata?.version || 1)
      }
    };
    
    await r2Client.send(new PutObjectCommand(uploadParams));
    
    // Construct public URL
    const publicUrl = process.env.R2_STORE_PUBLIC 
      ? `${process.env.R2_STORE_PUBLIC}/${key}`
      : `https://pub-11fe94ca8d0643078a50ec79454961d5.r2.dev/${key}`;
    
    console.log(`WebFeed JSON saved to R2: ${key}`);
    
    return {
      success: true,
      key,
      url: publicUrl,
      size: Buffer.byteLength(jsonContent, 'utf8')
    };
  } catch (error) {
    console.error('Error saving webfeed to R2:', error);
    throw error;
  }
}

/**
 * Delete webfeed JSON from R2 wzl-store bucket (legacy function)
 */
async function deleteWebFeedJSONFromR2(storeId, feedName) {
  try {
    const feedNameSlug = feedName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const key = `stores/${storeId}/webfeeds/${feedNameSlug}.json`;
    
    const deleteParams = {
      Bucket: 'wzl-store',
      Key: key
    };
    
    await r2Client.send(new DeleteObjectCommand(deleteParams));
    
    console.log(`WebFeed JSON deleted from R2: ${key}`);
    
    return {
      success: true,
      key,
      message: 'WebFeed JSON deleted from R2'
    };
  } catch (error) {
    // If the object doesn't exist, that's okay
    if (error.Code === 'NoSuchKey') {
      console.log(`WebFeed JSON not found in R2, skipping deletion: ${key}`);
      return {
        success: true,
        key,
        message: 'WebFeed JSON not found in R2'
      };
    }
    console.error('Error deleting webfeed from R2:', error);
    throw error;
  }
}

/**
 * Delete all webfeed assets (images and JSON) from R2
 */
export async function deleteAllWebFeedAssets(storeId, feedName) {
  try {
    const feedNameSlug = feedName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const results = [];
    
    // Delete the JSON file
    const jsonResult = await deleteWebFeedJSONFromR2(storeId, feedName);
    results.push(jsonResult);
    
    // Note: To delete all images, you'd need to list and delete them
    // This would require ListObjectsV2Command to find all images first
    // For now, we'll just delete the JSON
    
    return {
      success: true,
      results,
      message: 'WebFeed assets deleted from R2'
    };
  } catch (error) {
    console.error('Error deleting webfeed assets from R2:', error);
    throw error;
  }
}

/**
 * Get webfeed JSON from R2 (for caching/verification)
 */
export async function getWebFeedFromR2(storeId, feedName) {
  try {
    const feedNameSlug = feedName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const key = `stores/${storeId}/webfeeds/${feedNameSlug}.json`;
    
    const getParams = {
      Bucket: 'wzl-store',
      Key: key
    };
    
    const response = await r2Client.send(new GetObjectCommand(getParams));
    
    // Convert stream to string
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const jsonContent = Buffer.concat(chunks).toString('utf-8');
    
    return {
      success: true,
      key,
      data: JSON.parse(jsonContent),
      metadata: response.Metadata,
      lastModified: response.LastModified
    };
  } catch (error) {
    if (error.Code === 'NoSuchKey') {
      return {
        success: false,
        error: 'WebFeed not found in R2'
      };
    }
    console.error('Error getting webfeed from R2:', error);
    throw error;
  }
}

/**
 * Update webfeed cache in R2 (called after any changes)
 */
export async function updateWebFeedCache(webFeed) {
  try {
    // Only update if the feed is active
    if (webFeed.status !== 'active') {
      console.log(`Skipping R2 cache update for inactive feed: ${webFeed.name}`);
      return { success: true, skipped: true };
    }
    
    // Save the updated feed to R2
    const result = await saveWebFeedToR2(webFeed);
    
    // Update the webfeed document with R2 URLs if not already set
    if (result.success && (!webFeed.r2_json_url || webFeed.r2_json_url !== result.url)) {
      // Only update if different to avoid infinite loop
      webFeed.r2_json_url = result.url;
      webFeed.r2_cache_key = result.key;
      // Use updateOne to avoid triggering hooks again
      await webFeed.constructor.updateOne(
        { _id: webFeed._id },
        { 
          $set: { 
            r2_json_url: result.url,
            r2_cache_key: result.key
          }
        }
      );
    }
    
    // If you have a CDN or cache layer, you might want to purge it here
    // For example, Cloudflare cache purge API call
    
    return result;
  } catch (error) {
    console.error('Error updating webfeed cache:', error);
    // Don't throw - cache update failures shouldn't break the main operation
    return {
      success: false,
      error: error.message
    };
  }
}

// Delete all R2 assets for a web feed (images and JSON)
export async function deleteWebFeedFromR2(webFeed) {
  try {
    if (!r2Client) {
      console.log('R2 client not configured');
      return { success: false, error: 'R2 not configured' };
    }
    
    const deletedAssets = [];
    
    // Delete the JSON file if it exists
    if (webFeed.r2_cache_key) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.R2_STORE_BUCKET || 'wzl-store',
          Key: webFeed.r2_cache_key
        });
        
        await r2Client.send(deleteCommand);
        deletedAssets.push(`JSON: ${webFeed.r2_cache_key}`);
        console.log(`Deleted R2 JSON: ${webFeed.r2_cache_key}`);
      } catch (error) {
        console.error(`Failed to delete JSON ${webFeed.r2_cache_key}:`, error);
      }
    }
    
    // Delete all item images if they exist
    if (webFeed.items && webFeed.items.length > 0) {
      for (const item of webFeed.items) {
        if (item.r2_image_key) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.R2_STORE_BUCKET || 'wzl-store',
              Key: item.r2_image_key
            });
            
            await r2Client.send(deleteCommand);
            deletedAssets.push(`Image: ${item.r2_image_key}`);
            console.log(`Deleted R2 image: ${item.r2_image_key}`);
          } catch (error) {
            console.error(`Failed to delete image ${item.r2_image_key}:`, error);
          }
        }
      }
    }
    
    // Try to list and delete any orphaned files in the feed's directory
    if (webFeed.name && webFeed.store_id) {
      const feedNameSlug = webFeed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const prefix = `stores/${webFeed.store_id}/webfeeds/${feedNameSlug}`;
    
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: process.env.R2_STORE_BUCKET || 'wzl-store',
          Prefix: prefix
        });
        
        const listResponse = await r2Client.send(listCommand);
        
        if (listResponse.Contents && listResponse.Contents.length > 0) {
          // Delete all objects with this prefix
          const deletePromises = listResponse.Contents.map(async (object) => {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.R2_STORE_BUCKET || 'wzl-store',
              Key: object.Key
            });
            
            try {
              await r2Client.send(deleteCommand);
              deletedAssets.push(`Orphaned: ${object.Key}`);
              console.log(`Deleted orphaned R2 object: ${object.Key}`);
            } catch (error) {
              console.error(`Failed to delete orphaned object ${object.Key}:`, error);
            }
          });
          
          await Promise.all(deletePromises);
        }
      } catch (error) {
        console.error('Failed to list/delete orphaned objects:', error);
      }
    }
    
    return {
      success: true,
      deletedAssets,
      message: `Deleted ${deletedAssets.length} assets from R2`
    };
  } catch (error) {
    console.error('Error deleting webfeed from R2:', error);
    return {
      success: false,
      error: error.message
    };
  }
}