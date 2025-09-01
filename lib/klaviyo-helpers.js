import KlaviyoAPI from './klaviyo-api';

/**
 * Klaviyo Helper Functions
 * High-level operations for common Klaviyo tasks
 */

/**
 * Create a Klaviyo client for a specific store
 * @param {string} apiKey - Store's Klaviyo private API key
 * @param {Object} options - Additional options
 * @returns {KlaviyoAPI}
 */
export function createKlaviyoClient(apiKey, options = {}) {
  if (!apiKey) {
    throw new Error('Klaviyo API key is required');
  }

  return new KlaviyoAPI(apiKey, {
    debug: process.env.NODE_ENV === 'development',
    ...options
  });
}

/**
 * Filter builder for Klaviyo API
 */
export class KlaviyoFilter {
  constructor() {
    this.filters = [];
  }

  equals(field, value) {
    this.filters.push(`equals(${field},"${value}")`);
    return this;
  }

  contains(field, value) {
    this.filters.push(`contains(${field},"${value}")`);
    return this;
  }

  greater(field, value) {
    this.filters.push(`greater-than(${field},${value})`);
    return this;
  }

  less(field, value) {
    this.filters.push(`less-than(${field},${value})`);
    return this;
  }

  greaterOrEqual(field, value) {
    this.filters.push(`greater-or-equal(${field},${value})`);
    return this;
  }

  lessOrEqual(field, value) {
    this.filters.push(`less-or-equal(${field},${value})`);
    return this;
  }

  any(field, values) {
    const valueList = values.map(v => `"${v}"`).join(',');
    this.filters.push(`any(${field},[${valueList}])`);
    return this;
  }

  and() {
    if (this.filters.length < 2) {
      throw new Error('AND requires at least 2 filters');
    }
    const combined = `and(${this.filters.join(',')})`;
    this.filters = [combined];
    return this;
  }

  or() {
    if (this.filters.length < 2) {
      throw new Error('OR requires at least 2 filters');
    }
    const combined = `or(${this.filters.join(',')})`;
    this.filters = [combined];
    return this;
  }

  build() {
    if (this.filters.length === 0) return null;
    if (this.filters.length === 1) return this.filters[0];
    return `and(${this.filters.join(',')})`;
  }
}

/**
 * Common Klaviyo operations
 */
export const klaviyoOperations = {
  /**
   * Sync a customer profile with Klaviyo
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {Object} customerData - Customer data
   */
  async syncCustomerProfile(client, customerData) {
    const {
      email,
      phone,
      firstName,
      lastName,
      organization,
      title,
      image,
      location,
      properties = {}
    } = customerData;

    const profileData = {
      email,
      phone_number: phone,
      first_name: firstName,
      last_name: lastName,
      organization,
      title,
      image,
      location,
      properties: {
        ...properties,
        last_synced: new Date().toISOString()
      }
    };

    // Remove undefined values
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === undefined) {
        delete profileData[key];
      }
    });

    return await client.createProfile(profileData);
  },

  /**
   * Track a custom event
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {Object} eventData - Event data
   */
  async trackEvent(client, eventData) {
    const {
      profileId,
      email,
      metric,
      properties = {},
      time = new Date().toISOString(),
      value = null
    } = eventData;

    const event = {
      properties: {
        ...properties,
        source: 'wizel-api'
      },
      time,
      value,
      metric: {
        data: {
          type: 'metric',
          attributes: {
            name: metric
          }
        }
      }
    };

    // Add profile identifier
    if (profileId) {
      event.profile = {
        data: {
          type: 'profile',
          id: profileId
        }
      };
    } else if (email) {
      event.profile = {
        data: {
          type: 'profile',
          attributes: {
            email
          }
        }
      };
    } else {
      throw new Error('Either profileId or email is required for tracking events');
    }

    return await client.createEvent(event);
  },

  /**
   * Get campaign performance metrics
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options
   */
  async getCampaignMetrics(client, campaignId, options = {}) {
    const {
      metrics = ['open', 'click', 'bounce', 'unsubscribe'],
      startDate,
      endDate,
      interval = 'day'
    } = options;

    const filter = new KlaviyoFilter();
    
    if (startDate) {
      filter.greaterOrEqual('datetime', KlaviyoAPI.formatDateTime(startDate));
    }
    if (endDate) {
      filter.lessOrEqual('datetime', KlaviyoAPI.formatDateTime(endDate));
    }

    const body = {
      data: {
        type: 'metric-aggregate',
        attributes: {
          metric_ids: metrics,
          measurements: ['count', 'unique'],
          interval,
          filter: filter.build(),
          group_by: ['campaign_id'],
          filters: [`equals(campaign_id,"${campaignId}")`]
        }
      }
    };

    return await client.queryMetricAggregates(body);
  },

  /**
   * Get profile's engagement history
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {string} profileId - Profile ID
   * @param {Object} options - Query options
   */
  async getProfileEngagement(client, profileId, options = {}) {
    const {
      includeEvents = true,
      includeLists = true,
      includeSegments = true,
      limit = 50
    } = options;

    const includes = [];
    if (includeEvents) includes.push('events');
    if (includeLists) includes.push('lists');
    if (includeSegments) includes.push('segments');

    return await client.getProfile(profileId, {
      params: {
        include: includes,
        'page[size]': limit
      }
    });
  },

  /**
   * Subscribe profiles to a list
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {string} listId - List ID
   * @param {Array} profiles - Array of profile IDs or emails
   */
  async subscribeToList(client, listId, profiles) {
    const relationships = profiles.map(profile => {
      if (profile.includes('@')) {
        // Email provided
        return {
          type: 'profile',
          attributes: {
            email: profile
          }
        };
      } else {
        // Profile ID provided
        return {
          type: 'profile',
          id: profile
        };
      }
    });

    return await client.post(`/lists/${listId}/relationships/profiles`, {
      data: relationships
    }, {
      burstLimit: 10,
      steadyLimit: 150
    });
  },

  /**
   * Get revenue metrics for a date range
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {Object} options - Query options
   */
  async getRevenueMetrics(client, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      interval = 'day',
      groupBy = []
    } = options;

    const body = {
      data: {
        type: 'metric-aggregate',
        attributes: {
          metric_ids: ['Placed Order'],
          measurements: ['sum_value', 'count', 'unique'],
          interval,
          filter: `and(greater-or-equal(datetime,${KlaviyoAPI.formatDateTime(startDate)}),less-or-equal(datetime,${KlaviyoAPI.formatDateTime(endDate)}))`,
          group_by: groupBy
        }
      }
    };

    return await client.queryMetricAggregates(body);
  },

  /**
   * Search profiles by email or phone
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {string} searchTerm - Email or phone to search
   */
  async searchProfiles(client, searchTerm) {
    const filter = new KlaviyoFilter();
    
    if (searchTerm.includes('@')) {
      filter.equals('email', searchTerm);
    } else {
      filter.contains('phone_number', searchTerm);
    }

    return await client.getProfiles({
      params: {
        filter: filter.build(),
        'page[size]': 10
      }
    });
  },

  /**
   * Get abandoned cart profiles
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {Object} options - Query options
   */
  async getAbandonedCarts(client, options = {}) {
    const {
      days = 7,
      limit = 100
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filter = new KlaviyoFilter();
    filter.greater('properties.value', 0);
    filter.greaterOrEqual('datetime', KlaviyoAPI.formatDateTime(startDate));

    return await client.get('/events', {
      params: {
        filter: filter.build(),
        'filter[metric_id]': 'Started Checkout',
        'page[size]': limit,
        include: ['profile']
      },
      burstLimit: 10,
      steadyLimit: 150
    });
  }
};

/**
 * Batch operations for efficiency
 */
export const klaviyoBatch = {
  /**
   * Batch create profiles
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {Array} profiles - Array of profile data
   * @param {number} batchSize - Number of profiles per batch
   */
  async createProfiles(client, profiles, batchSize = 100) {
    const results = [];
    const errors = [];

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      try {
        const response = await client.post('/profiles', {
          data: batch.map(profile => ({
            type: 'profile',
            attributes: profile
          }))
        }, {
          burstLimit: 10,
          steadyLimit: 150
        });
        
        results.push(...(Array.isArray(response.data) ? response.data : [response.data]));
      } catch (error) {
        errors.push({
          batch: `${i}-${i + batchSize}`,
          error: error.message
        });
      }
    }

    return {
      success: results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length
    };
  },

  /**
   * Batch track events
   * @param {KlaviyoAPI} client - Klaviyo client
   * @param {Array} events - Array of event data
   * @param {number} batchSize - Number of events per batch
   */
  async trackEvents(client, events, batchSize = 100) {
    const results = [];
    const errors = [];

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      try {
        const response = await client.post('/events', {
          data: batch.map(event => ({
            type: 'event',
            attributes: event
          }))
        }, {
          burstLimit: 350,
          steadyLimit: 3500
        });
        
        results.push(...(Array.isArray(response.data) ? response.data : [response.data]));
      } catch (error) {
        errors.push({
          batch: `${i}-${i + batchSize}`,
          error: error.message
        });
      }
    }

    return {
      success: results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length
    };
  }
};

export default {
  createKlaviyoClient,
  KlaviyoFilter,
  klaviyoOperations,
  klaviyoBatch
};