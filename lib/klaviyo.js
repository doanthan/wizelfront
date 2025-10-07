// Klaviyo API Helper Library
import { klaviyoRequest } from './klaviyo-api';

const BASE_URL = "https://a.klaviyo.com/api/";
const REVISION = process.env.NEXT_PUBLIC_KLAVIYO_REVISION || "2025-07-15";

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
export async function fetchScheduledCampaignsForStores(stores, startDate, endDate, statusFilter = null) {
  try {
    const { buildKlaviyoAuthOptions } = await import('./klaviyo-auth-helper');
    const allCampaigns = [];

    // Filter stores with valid auth
    const validStores = stores.filter(store => {
      try {
        buildKlaviyoAuthOptions(store);
        return true;
      } catch {
        return false; // Skip stores without valid auth
      }
    });

    // Process stores sequentially to respect rate limits per store
    // Each store has its own rate limit, so we process them one by one
    for (const store of validStores) {
      try {
        console.log(`Fetching campaigns for store: ${store.name}`);

        // Build auth options for this store
        const authOptions = buildKlaviyoAuthOptions(store);

        let campaigns;

        // If specific status filter is provided, use the appropriate function
        if (statusFilter === 'scheduled') {
          // For dashboard - only scheduled/sending campaigns
          campaigns = await fetchScheduledCampaigns(authOptions, 'all');
        } else {
          // For calendar - all draft/scheduled/sending campaigns
          campaigns = await fetchFutureCampaigns(
            authOptions,
            startDate,
            endDate
          );
        }

        // Format campaigns with store info
        const formattedCampaigns = campaigns.map(campaign => ({
          ...campaign,
          storeInfo: {
            id: store._id || store.id,
            publicId: store.public_id,
            name: store.name,
            klaviyoPublicId: store.klaviyo_integration.public_id
          }
        }));

        allCampaigns.push(...formattedCampaigns);

        console.log(`Found ${campaigns.length} campaigns for store ${store.name}`);

        // Add delay between stores to prevent overwhelming the API
        // Each store has its own rate limit, but we add a small delay for safety
        if (validStores.indexOf(store) < validStores.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error fetching campaigns for store ${store.name}:`, error);
        // Continue with other stores even if one fails
      }
    }

    console.log(`Total campaigns fetched across all stores: ${allCampaigns.length}`);
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
 * Fetch only scheduled campaigns (status = "Scheduled") for a specific channel
 * @param {Object} authOptions - Authentication options (from buildKlaviyoAuthOptions)
 * @param {string} channel - Channel filter: 'email', 'sms', 'mobile_push', or 'all'
 * @returns {Promise<Array>} Array of scheduled campaign objects
 */
export async function fetchScheduledCampaigns(authOptions, channel = 'all') {
  try {
    const allCampaigns = [];

    // Define channels to query
    const channels = channel === 'all'
      ? [
          { name: 'email', filter: 'email' },
          { name: 'sms', filter: 'sms' },
          { name: 'push', filter: 'mobile_push' }
        ]
      : [{ name: channel, filter: channel === 'push' ? 'mobile_push' : channel }];

    // Query each channel sequentially to respect rate limits
    for (const channelObj of channels) {
      try {
        // Build filter: channel AND (status = "Scheduled" OR status = "Sending" OR status = "Queued without Recipients")
        // Using any() operator to check for multiple statuses
        // Including "Queued without Recipients" for campaigns that are queued but don't have recipients yet
        const filter = `equals(messages.channel,'${channelObj.filter}'),any(status,["Scheduled","Sending"])`;

        // Include audiences field - use exact syntax from successful Postman request
        const endpoint = `campaigns/?filter=${encodeURIComponent(filter)}&fields[campaign]=name,status,send_time,scheduled_at,audiences.included,audiences.excluded,send_strategy,send_options,tracking_options,created_at,updated_at&include=campaign-messages&sort=-scheduled_at`;

        console.log(`Fetching ${channelObj.name} campaigns with filter:`, filter);

        const data = await klaviyoRequest('GET', endpoint, authOptions);
        const campaigns = data.data || [];
        const included = data.included || [];

        console.log(`Found ${campaigns.length} ${channelObj.name} campaigns`);

        // Debug: Log the raw campaign data to check audiences
        if (campaigns.length > 0) {
          console.log(`[fetchScheduledCampaigns] Raw API response for ${channelObj.name}:`, {
            endpoint: endpoint,
            campaign_count: campaigns.length,
            first_campaign: campaigns[0] ? {
              id: campaigns[0].id,
              name: campaigns[0].attributes?.name,
              status: campaigns[0].attributes?.status,
              audiences: campaigns[0].attributes?.audiences,
              full_attributes: campaigns[0].attributes
            } : null
          });
        }

        // Add channel info and included data to each campaign
        campaigns.forEach(campaign => {
          campaign._channel = channelObj.filter;
          campaign._included = included;

          // Ensure audiences are properly set on the campaign attributes
          if (!campaign.attributes) {
            campaign.attributes = {};
          }

          // Preserve audiences if they exist
          if (!campaign.attributes.audiences && campaign.audiences) {
            campaign.attributes.audiences = campaign.audiences;
          }
        });

        allCampaigns.push(...campaigns);

        // Add small delay between channel requests to respect rate limits
        if (channels.indexOf(channelObj) < channels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error fetching scheduled ${channelObj.name} campaigns:`, error);
        // Continue with other channels even if one fails
      }
    }

    return allCampaigns;

  } catch (error) {
    console.error('Error fetching scheduled campaigns:', error);
    throw error;
  }
}

/**
 * Fetch only scheduled campaigns for multiple stores (status = "Scheduled" only)
 * @param {Array} stores - Array of store objects with klaviyo_integration
 * @param {string} channel - Channel filter: 'email', 'sms', 'mobile_push', or 'all'
 * @returns {Promise<Array>} Array of scheduled campaigns with store info
 */
export async function fetchOnlyScheduledCampaigns(stores, channel = 'all') {
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
          const authOptions = buildKlaviyoAuthOptions(store);
          const campaigns = await fetchScheduledCampaigns(authOptions, channel);

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
          console.error(`Error fetching scheduled campaigns for store ${store.name}:`, error);
          return [];
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
        // Build filter: channel AND status - include all non-sent statuses
        // This gets ALL draft/scheduled campaigns regardless of date
        // Including: Draft, Scheduled, Sending, Queued without Recipients
        const filter = `equals(messages.channel,'${channel.filter}'),any(status,["Draft","Scheduled","Sending"])`;

        // Include audiences field - use exact syntax from successful Postman request
        const endpoint = `campaigns/?filter=${encodeURIComponent(filter)}&fields[campaign]=name,status,send_time,scheduled_at,audiences.included,audiences.excluded,send_strategy,send_options,tracking_options,created_at,updated_at&include=campaign-messages&sort=scheduled_at`;

        console.log(`[fetchFutureCampaigns] Full API endpoint for ${channel.name}:`, endpoint);
        const data = await klaviyoRequest('GET', endpoint, authOptions);
        let campaigns = data.data || [];
        const included = data.included || []; // Get the included array with campaign-messages

        // Debug: Log the raw campaign data to check audiences
        if (campaigns.length > 0) {
          console.log(`[fetchFutureCampaigns] Raw API response for ${channel.name}:`, {
            endpoint: endpoint,
            campaign_count: campaigns.length,
            first_campaign: campaigns[0] ? {
              id: campaigns[0].id,
              name: campaigns[0].attributes?.name,
              status: campaigns[0].attributes?.status,
              audiences: campaigns[0].attributes?.audiences,
              full_attributes: campaigns[0].attributes
            } : null
          });
        }
          
          // Only filter out SENT campaigns from the past - keep ALL drafts/scheduled/queued
          const now = new Date();
          campaigns = campaigns.filter(campaign => {
            const status = campaign.attributes?.status;

            // Get the display date for the campaign - use send_time for scheduled campaigns
            const displayDate = campaign.attributes?.send_time ||
                              campaign.attributes?.send_strategy?.datetime ||
                              campaign.attributes?.scheduled_at ||
                              campaign.attributes?.updated_at ||
                              campaign.attributes?.created_at;

            if (!displayDate) {
              return false;
            }

            const campaignDate = new Date(displayDate);

            // Keep ALL campaigns with these statuses regardless of date
            const keepStatuses = [
              'Draft',
              'Scheduled',
              'Sending'
            ];

            if (keepStatuses.includes(status)) {
              return true;
            }

            // Exclude any other status
            return false;
          });
          
          
        // Add channel info and included data to each campaign for easier processing
        campaigns.forEach(campaign => {
          campaign._channel = channel.filter; // Store the channel type
          campaign._included = included; // Attach the included array for access to campaign-messages

          // Ensure audiences are properly set on the campaign attributes
          if (!campaign.attributes) {
            campaign.attributes = {};
          }

          // Preserve audiences if they exist
          if (!campaign.attributes.audiences && campaign.audiences) {
            campaign.attributes.audiences = campaign.audiences;
          }
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
    
    return allCampaigns;
    
  } catch (error) {
    console.error('Error fetching future campaigns:', error);
    throw error;
  }
}