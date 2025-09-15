// Klaviyo API Helper Library
import { klaviyoRequest } from './klaviyo-api';

const BASE_URL = "https://a.klaviyo.com/api/";
const REVISION = process.env.KLAVIYO_REVISION || "2025-07-15";

/**
 * Fetch campaign message HTML from Klaviyo API
 * @param {string} messageId - The campaign message ID
 * @param {Object} authOptions - Authentication options (from buildKlaviyoAuthOptions)
 * @returns {Promise<Object>} Campaign message data with template HTML
 */
export async function fetchKlaviyoCampaignMessage(messageId, authOptions) {
  try {
    const data = await klaviyoRequest('GET', `campaign-messages/${messageId}?include=template`, authOptions);
    return data;
  } catch (error) {
    console.error('Error fetching Klaviyo campaign message:', error);
    throw error;
  }
}

/**
 * Get campaign by ID
 * @param {string} campaignId - The campaign ID
 * @param {Object} authOptions - Authentication options (from buildKlaviyoAuthOptions)
 * @returns {Promise<Object>} Campaign data
 */
export async function fetchKlaviyoCampaign(campaignId, authOptions) {
  try {
    const data = await klaviyoRequest('GET', `campaigns/${campaignId}?include=campaign-messages`, authOptions);
    return data;
  } catch (error) {
    console.error('Error fetching Klaviyo campaign:', error);
    throw error;
  }
}

/**
 * Fetch all campaigns from Klaviyo API with filtering
 * @param {Object} authOptions - Authentication options (from buildKlaviyoAuthOptions)
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status (Draft, Scheduled, etc.)
 * @param {Date} options.scheduledAfter - Get campaigns scheduled after this date
 * @param {Date} options.scheduledBefore - Get campaigns scheduled before this date
 * @returns {Promise<Object>} Campaigns data
 */
export async function fetchKlaviyoCampaigns(authOptions, options = {}) {
  try {
    // Try combined filter for all channels (email, sms, push-notification)
    const channelFilter = `any(messages.channel,'email','sms','push-notification')`;
    const endpoint = `campaigns/?filter=${encodeURIComponent(channelFilter)}&include=campaign-messages&sort=-created_at`;
    
    try {
      const data = await klaviyoRequest('GET', endpoint, authOptions);
      return data;
    } catch (error) {
      console.warn(`Combined channel filter failed: ${error.message}`);
      
      // Fallback: try just email campaigns (most common)
      const emailEndpoint = `campaigns/?filter=${encodeURIComponent("equals(messages.channel,'email')")}&include=campaign-messages&sort=-created_at`;
      
      try {
        const emailData = await klaviyoRequest('GET', emailEndpoint, authOptions);
        return emailData;
      } catch (emailError) {
        throw new Error(`Both combined and email-only requests failed: ${emailError.message}`);
      }
    }
  } catch (error) {
    console.error('Error fetching Klaviyo campaigns:', error);
    throw error;
  }
}

/**
 * Fetch scheduled campaigns for all stores
 * @param {Array} stores - Array of store objects with klaviyo_integration
 * @param {Date} startDate - Start date for scheduled campaigns
 * @param {Date} endDate - End date for scheduled campaigns
 * @returns {Promise<Array>} Array of formatted campaign objects
 */
export async function fetchScheduledCampaignsForStores(stores, startDate, endDate) {
  try {
    const { buildKlaviyoAuthOptions } = await import('./klaviyo-auth-helper');
    const allCampaigns = [];
    
    // Fetch campaigns from all stores in parallel
    const campaignPromises = stores
      .filter(store => {
        try {
          buildKlaviyoAuthOptions(store);
          return true;
        } catch {
          return false; // Skip stores without valid auth
        }
      })
      .map(async (store) => {
        try {
          // Build auth options for this store
          const authOptions = buildKlaviyoAuthOptions(store);
          
          // Use proper date filtering for future campaigns
          const campaigns = await fetchFutureCampaigns(
            authOptions, 
            startDate, 
            endDate
          );
          
          // Format campaigns with store info
          return campaigns.map(campaign => ({
            ...campaign,
            storeInfo: {
              id: store._id || store.id,
              publicId: store.public_id,
              name: store.name,
              klaviyoPublicId: store.klaviyo_integration.public_id
            }
          }));
        } catch (error) {
          console.error(`Error fetching campaigns for store ${store.name}:`, error);
          return []; // Return empty array on error to not break other stores
        }
      });
    
    const results = await Promise.all(campaignPromises);
    
    // Flatten results
    results.forEach(storeCampaigns => {
      allCampaigns.push(...storeCampaigns);
    });
    
    return allCampaigns;
  } catch (error) {
    console.error('Error fetching scheduled campaigns for stores:', error);
    throw error;
  }
}

/**
 * Fetch all segments for a store
 * @param {string} apiKey - Klaviyo private API key
 * @returns {Promise<Array>} Array of segment objects with id and name
 */
export async function fetchKlaviyoSegments(apiKey) {
  try {
    const allSegments = [];
    let nextPageUrl = `${BASE_URL}segments/?fields[segment]=name`;
    
    while (nextPageUrl) {
      const response = await fetch(nextPageUrl, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Accept': 'application/json',
          'revision': REVISION
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch segments: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Extract segments from response
      if (data.data) {
        allSegments.push(...data.data.map(segment => ({
          id: segment.id,
          name: segment.attributes?.name || 'Unnamed Segment',
          type: 'segment'
        })));
      }
      
      // Check for next page
      nextPageUrl = data.links?.next || null;
      
      // Add delay to respect rate limits (150/min = 2.5/sec)
      if (nextPageUrl) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
    
    return allSegments;
  } catch (error) {
    console.error('Error fetching Klaviyo segments:', error);
    throw error;
  }
}

/**
 * Fetch all lists for a store
 * @param {string} apiKey - Klaviyo private API key
 * @returns {Promise<Array>} Array of list objects with id and name
 */
export async function fetchKlaviyoLists(apiKey) {
  try {
    const allLists = [];
    let nextPageUrl = `${BASE_URL}lists/?fields[list]=name`;
    
    while (nextPageUrl) {
      const response = await fetch(nextPageUrl, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Accept': 'application/json',
          'revision': REVISION
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch lists: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Extract lists from response
      if (data.data) {
        allLists.push(...data.data.map(list => ({
          id: list.id,
          name: list.attributes?.name || 'Unnamed List',
          type: 'list'
        })));
      }
      
      // Check for next page
      nextPageUrl = data.links?.next || null;
      
      // Add delay to respect rate limits
      if (nextPageUrl) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
    
    return allLists;
  } catch (error) {
    console.error('Error fetching Klaviyo lists:', error);
    throw error;
  }
}

/**
 * Fetch segments and lists for a store (combined)
 * @param {string} apiKey - Klaviyo private API key
 * @returns {Promise<Object>} Object with segments and lists arrays
 */
export async function fetchKlaviyoAudiences(apiKey) {
  try {
    // Fetch segments and lists in parallel
    const [segments, lists] = await Promise.all([
      fetchKlaviyoSegments(apiKey),
      fetchKlaviyoLists(apiKey)
    ]);
    
    return {
      segments,
      lists,
      all: [...segments, ...lists] // Combined array for easy lookup
    };
  } catch (error) {
    console.error('Error fetching Klaviyo audiences:', error);
    throw error;
  }
}

/**
 * Fetch draft and scheduled campaigns using status filter
 * Gets all Draft, Scheduled, and Sending campaigns
 * Includes Draft campaigns even if they're in the past
 * Makes sequential API calls for each channel to respect rate limits
 * @param {Object} authOptions - Authentication options (from buildKlaviyoAuthOptions)
 * @param {Date} startDate - Start date for campaigns (used for client-side filtering)
 * @param {Date} endDate - End date for campaigns (used for client-side filtering)
 * @returns {Promise<Array>} Array of campaign objects including past drafts
 */
export async function fetchFutureCampaigns(authOptions, startDate, endDate) {
  try {
    const allCampaigns = [];
    
    // Define channels to query sequentially
    const channels = [
      { name: 'email', filter: 'email' },
      { name: 'sms', filter: 'sms' },
      { name: 'push', filter: 'mobile_push' }
    ];
    
    // Query all channels in parallel to reduce total time
    const channelPromises = channels.map(async (channel) => {
      try {
        // Build filter: channel AND status (Draft, Scheduled, Sending, or Queued without Recipients)
        // This gets ALL draft/scheduled campaigns regardless of date
        // "Queued without Recipients" is for campaigns that were scheduled but have no recipients yet
        const filter = `equals(messages.channel,'${channel.filter}'),any(status,["Draft","Scheduled","Sending","Queued without Recipients"])`;
        
        const endpoint = `campaigns/?filter=${encodeURIComponent(filter)}&include=campaign-messages&sort=scheduled_at`;
        console.log(`Fetching ${channel.name} campaigns with endpoint:`, endpoint);
        console.log(`Filter: ${filter}`);

        const data = await klaviyoRequest('GET', endpoint, authOptions);
        let campaigns = data.data || [];
        const included = data.included || []; // Get the included array with campaign-messages
        console.log(`Raw response for ${channel.name}: ${campaigns.length} campaigns found`);
          
          // Only filter out SENT campaigns from the past - keep ALL drafts/scheduled/queued
          const now = new Date();
          campaigns = campaigns.filter(campaign => {
            const status = campaign.attributes?.status;
            
            // Get the display date for the campaign
            const displayDate = campaign.attributes?.send_time || 
                              campaign.attributes?.scheduled_at ||
                              campaign.attributes?.send_strategy?.datetime ||
                              campaign.attributes?.updated_at ||
                              campaign.attributes?.created_at;
            
            if (!displayDate) {
              console.log(`Excluding ${campaign.attributes?.name} - no valid date field`);
              return false;
            }
            
            const campaignDate = new Date(displayDate);
            
            // Keep ALL Draft and Queued campaigns regardless of date
            if (status === 'Draft' || status === 'Queued without Recipients') {
              return true;
            }
            
            // For Scheduled/Sending campaigns, only keep if in the future
            if (status === 'Scheduled' || status === 'Sending') {
              return campaignDate >= now;
            }
            
            // Exclude any other status
            return false;
          });
          
          console.log(`After filtering: ${campaigns.length} ${channel.name} campaigns to display`);
          
        // Add channel info and included data to each campaign for easier processing
        campaigns.forEach(campaign => {
          campaign._channel = channel.filter; // Store the channel type
          campaign._included = included; // Attach the included array for access to campaign-messages
        });
        
        return campaigns;
        
      } catch (error) {
        console.error(`Error fetching ${channel.name} campaigns:`, error);
        return [];
      }
    });
    
    // Wait for all channel requests to complete in parallel
    const channelResults = await Promise.all(channelPromises);
    
    // Flatten all results
    channelResults.forEach(campaigns => {
      allCampaigns.push(...campaigns);
    });
    
    console.log(`Total future campaigns found: ${allCampaigns.length}`);
    return allCampaigns;
    
  } catch (error) {
    console.error('Error fetching future campaigns:', error);
    throw error;
  }
}