import mongoose from 'mongoose';
import { saveWebFeedToR2, deleteWebFeedFromR2, updateWebFeedCache } from '@/lib/r2-webfeed-helpers';

const webFeedItemSchema = new mongoose.Schema({
  field_name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image_url', 'image_html', 'html', 'text'],
    required: true,
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  // Additional fields for image type
  alt_text: {
    type: String,
    default: ''
  },
  link_url: {
    type: String,
    default: ''
  },
  description: String
}, { _id: false });

const webFeedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  store_id: {
    type: String,
    required: true
  },
  klaviyo_account_id: {
    type: String,
    required: true
  },
  feed_url: {
    type: String,
    unique: true,
    sparse: true
  },
  r2_json_url: {
    type: String,
    sparse: true
  },
  r2_cache_key: {
    type: String,
    sparse: true
  },
  feed_type: {
    type: String,
    enum: ['json', 'xml'],
    default: 'json'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  items: [webFeedItemSchema],
  last_synced: Date,
  sync_frequency: {
    type: String,
    enum: ['manual', 'hourly', 'daily', 'weekly'],
    default: 'manual'
  },
  klaviyo_feed_id: {
    type: String,
    sparse: true
  },
  sync_status: {
    type: String,
    enum: ['not_synced', 'synced', 'sync_error'],
    default: 'not_synced'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    total_items: {
      type: Number,
      default: 0
    },
    last_modified: Date,
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Validate unique field names within the feed
webFeedSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    // Migrate old 'image' type to 'image_html' for backward compatibility
    this.items = this.items.map(item => {
      if (item.type === 'image') {
        console.log(`Migrating item ${item.field_name} from 'image' to 'image_html'`);
        item.type = 'image_html';
      }
      return item;
    });
    
    const fieldNames = this.items.map(item => item.field_name);
    const uniqueFieldNames = [...new Set(fieldNames)];
    
    if (fieldNames.length !== uniqueFieldNames.length) {
      return next(new Error('Field names must be unique within the feed'));
    }
  }
  
  if (!this.feed_url) {
    // Set the feed URL to the R2 public URL
    const feedNameSlug = this.name.toLowerCase();
    const r2PublicUrl = process.env.R2_STORE_PUBLIC || 'https://pub-11fe94ca8d0643078a50ec79454961d5.r2.dev';
    this.feed_url = `${r2PublicUrl}/stores/${this.store_id}/webfeeds/${feedNameSlug}.json`;
  }
  
  // Update metadata
  this.metadata.total_items = this.items ? this.items.length : 0;
  this.metadata.last_modified = new Date();
  
  next();
});

// Also validate on findOneAndUpdate
webFeedSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Check if we're using $set (which we now always are from the API route)
  const dataToValidate = update.$set || update;
  
  if (dataToValidate.items && dataToValidate.items.length > 0) {
    // Migrate old 'image' type to 'image_html' for backward compatibility
    dataToValidate.items = dataToValidate.items.map(item => {
      if (item.type === 'image') {
        console.log(`Migrating item ${item.field_name} from 'image' to 'image_html'`);
        return { ...item, type: 'image_html' };
      }
      return item;
    });
    
    const fieldNames = dataToValidate.items.map(item => item.field_name);
    const uniqueFieldNames = [...new Set(fieldNames)];
    
    if (fieldNames.length !== uniqueFieldNames.length) {
      return next(new Error('Field names must be unique within the feed'));
    }
  }
  
  // Update feed URL if name changes
  if (dataToValidate.name && dataToValidate.store_id) {
    // Set the feed URL to the R2 public URL
    const feedNameSlug = dataToValidate.name.toLowerCase();
    const r2PublicUrl = process.env.R2_STORE_PUBLIC || 'https://pub-11fe94ca8d0643078a50ec79454961d5.r2.dev';
    const feedUrl = `${r2PublicUrl}/stores/${dataToValidate.store_id}/webfeeds/${feedNameSlug}.json`;
    
    if (update.$set) {
      update.$set.feed_url = feedUrl;
    } else {
      dataToValidate.feed_url = feedUrl;
    }
  }
  
  // Don't handle metadata here to avoid conflicts
  // Metadata is handled in the API route using proper operators
  
  next();
});

// Virtual for formatted feed output
webFeedSchema.methods.formatForKlaviyo = function() {
  // Convert items array to object with field names as keys
  const feedData = {};
  this.items.forEach(item => {
    if (item.type === 'image_html') {
      // Generate complete HTML img tag for image_html type
      let imgHtml = `<img src="${item.content}" alt="${item.alt_text || ''}" style="max-width: 100%; height: auto;">`;
      
      // Wrap in anchor tag if link URL is provided
      if (item.link_url) {
        imgHtml = `<a href="${item.link_url}" target="_blank">${imgHtml}</a>`;
      }
      
      feedData[item.field_name] = imgHtml;
    } else if (item.type === 'image_url') {
      // For image_url type, just return the URL directly
      feedData[item.field_name] = item.content;
    } else {
      // For text and HTML, return content as-is
      feedData[item.field_name] = item.content;
    }
  });
  
  if (this.feed_type === 'json') {
    return feedData;
  } else {
    // XML format - return as object, will be converted to XML in API
    return {
      feed: feedData
    };
  }
};

// Post-save hook to update R2 cache
webFeedSchema.post('save', async function(doc) {
  try {
    // Update R2 cache after saving
    await updateWebFeedCache(doc);
  } catch (error) {
    console.error('Error updating R2 cache after save:', error);
    // Don't throw - cache errors shouldn't break the save
  }
});

// Post-update hook to update R2 cache
webFeedSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (doc) {
      // Update R2 cache after update
      await updateWebFeedCache(doc);
    }
  } catch (error) {
    console.error('Error updating R2 cache after update:', error);
    // Don't throw - cache errors shouldn't break the update
  }
});

// Pre-remove hook to delete from R2
webFeedSchema.pre('findOneAndDelete', async function() {
  try {
    // Get the document before it's deleted
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      // Store the doc info for post-hook
      this._deletedDoc = {
        store_id: doc.store_id,
        name: doc.name
      };
    }
  } catch (error) {
    console.error('Error in pre-delete hook:', error);
  }
});

// Post-remove hook to clean up R2
webFeedSchema.post('findOneAndDelete', async function() {
  try {
    if (this._deletedDoc) {
      // Delete from R2 - pass the full document
      await deleteWebFeedFromR2(this._deletedDoc);
    }
  } catch (error) {
    console.error('Error deleting from R2 after remove:', error);
    // Don't throw - R2 errors shouldn't break the delete
  }
});

// Add compound index to ensure unique feed names per store
webFeedSchema.index({ store_id: 1, name: 1 }, { unique: true });

const WebFeed = mongoose.models.WebFeed || mongoose.model('WebFeed', webFeedSchema);

export default WebFeed;