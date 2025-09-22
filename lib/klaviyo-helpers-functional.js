import {
  klaviyoRequest,
  klaviyoGet,
  klaviyoPost,
  klaviyoPatch,
  klaviyoDelete,
  klaviyoGetAll,
  buildQueryString,
  oauth,
  klaviyo
} from './klaviyo-api-functional';

/**
 * Klaviyo Helper Functions (Functional Version)
 * High-level operations for common Klaviyo tasks using functional programming
 */

/**
 * Create a Klaviyo client configuration for a specific store
 * @param {string} apiKey - Store's Klaviyo private API key
 * @param {Object} options - Additional options
 * @returns {Object} Client configuration
 */
export const createKlaviyoClient = (apiKey, options = {}) => {
  if (!apiKey) {
    throw new Error('Klaviyo API key is required');
  }

  const defaultOptions = {
    apiKey,
    debug: process.env.NODE_ENV === 'development',
    ...options
  };

  // Return an object with all klaviyo methods bound to these options
  return {
    // Core methods
    request: (method, endpoint, opts) => klaviyoRequest(method, endpoint, { ...defaultOptions, ...opts }),
    get: (endpoint, opts) => klaviyoGet(endpoint, { ...defaultOptions, ...opts }),
    post: (endpoint, payload, opts) => klaviyoPost(endpoint, payload, { ...defaultOptions, ...opts }),
    patch: (endpoint, payload, opts) => klaviyoPatch(endpoint, payload, { ...defaultOptions, ...opts }),
    delete: (endpoint, opts) => klaviyoDelete(endpoint, { ...defaultOptions, ...opts }),
    getAll: (endpoint, opts) => klaviyoGetAll(endpoint, { ...defaultOptions, ...opts }),
    
    // Convenience methods from klaviyo object
    getProfiles: (params, opts) => klaviyo.getProfiles(params, { ...defaultOptions, ...opts }),
    getProfile: (id, params, opts) => klaviyo.getProfile(id, params, { ...defaultOptions, ...opts }),
    createProfile: (data, opts) => klaviyo.createProfile(data, { ...defaultOptions, ...opts }),
    updateProfile: (id, data, opts) => klaviyo.updateProfile(id, data, { ...defaultOptions, ...opts }),
    createEvent: (data, opts) => klaviyo.createEvent(data, { ...defaultOptions, ...opts }),
    getEvents: (params, opts) => klaviyo.getEvents(params, { ...defaultOptions, ...opts }),
    getLists: (params, opts) => klaviyo.getLists(params, { ...defaultOptions, ...opts }),
    getList: (id, params, opts) => klaviyo.getList(id, params, { ...defaultOptions, ...opts }),
    createList: (data, opts) => klaviyo.createList(data, { ...defaultOptions, ...opts }),
    getSegments: (params, opts) => klaviyo.getSegments(params, { ...defaultOptions, ...opts }),
    getSegment: (id, params, opts) => klaviyo.getSegment(id, params, { ...defaultOptions, ...opts }),
    getCampaigns: (params, opts) => klaviyo.getCampaigns(params, { ...defaultOptions, ...opts }),
    getCampaign: (id, params, opts) => klaviyo.getCampaign(id, params, { ...defaultOptions, ...opts }),
    getFlows: (params, opts) => klaviyo.getFlows(params, { ...defaultOptions, ...opts }),
    getFlow: (id, params, opts) => klaviyo.getFlow(id, params, { ...defaultOptions, ...opts }),
    getMetrics: (params, opts) => klaviyo.getMetrics(params, { ...defaultOptions, ...opts }),
    getMetric: (id, params, opts) => klaviyo.getMetric(id, params, { ...defaultOptions, ...opts }),
    queryMetricAggregates: (data, opts) => klaviyo.queryMetricAggregates(data, { ...defaultOptions, ...opts }),
    getAllPages: (endpoint, opts) => klaviyo.getAllPages(endpoint, { ...defaultOptions, ...opts })
  };
};

/**
 * Filter builder for Klaviyo API (functional approach)
 */
export const createKlaviyoFilter = () => {
  let filters = [];

  const equals = (field, value) => {
    filters.push(`equals(${field},"${value}")`);
    return api;
  };

  const contains = (field, value) => {
    filters.push(`contains(${field},"${value}")`);
    return api;
  };

  const greater = (field, value) => {
    filters.push(`greater-than(${field},${value})`);
    return api;
  };

  const less = (field, value) => {
    filters.push(`less-than(${field},${value})`);
    return api;
  };

  const greaterOrEqual = (field, value) => {
    filters.push(`greater-or-equal(${field},${value})`);
    return api;
  };

  const lessOrEqual = (field, value) => {
    filters.push(`less-or-equal(${field},${value})`);
    return api;
  };

  const any = (field, values) => {
    const valueList = values.map(v => `"${v}"`).join(',');
    filters.push(`any(${field},[${valueList}])`);
    return api;
  };

  const and = () => {
    if (filters.length < 2) {
      throw new Error('AND requires at least 2 filters');
    }
    const combined = `and(${filters.join(',')})`;
    filters = [combined];
    return api;
  };

  const or = () => {
    if (filters.length < 2) {
      throw new Error('OR requires at least 2 filters');
    }
    const combined = `or(${filters.join(',')})`;
    filters = [combined];
    return api;
  };

  const build = () => {
    if (filters.length === 0) return null;
    if (filters.length === 1) return filters[0];
    return `and(${filters.join(',')})`;
  };

  const api = {
    equals,
    contains,
    greater,
    less,
    greaterOrEqual,
    lessOrEqual,
    any,
    and,
    or,
    build
  };

  return api;
};

/**
 * Format date/time for Klaviyo API
 */
const formatDateTime = (date) => {
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return new Date(date).toISOString();
};

/**
 * Common Klaviyo operations (functional style)
 */
export const klaviyoOperations = {
  /**
   * Sync a customer profile with Klaviyo
   */
  syncCustomerProfile: async (client, customerData) => {
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
   */
  trackEvent: async (client, eventData) => {
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
   */
  getCampaignMetrics: async (client, campaignId, options = {}) => {
    const {
      metrics = ['open', 'click', 'bounce', 'unsubscribe'],
      startDate,
      endDate,
      interval = 'day'
    } = options;

    const filter = createKlaviyoFilter();
    
    if (startDate) {
      filter.greaterOrEqual('datetime', formatDateTime(startDate));
    }
    if (endDate) {
      filter.lessOrEqual('datetime', formatDateTime(endDate));
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
   */
  getProfileEngagement: async (client, profileId, options = {}) => {
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
      include: includes,
      'page[size]': limit
    });
  },

  /**
   * Subscribe profiles to a list
   */
  subscribeToList: async (client, listId, profiles) => {
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
    });
  },

  /**
   * Get revenue metrics for a date range
   */
  getRevenueMetrics: async (client, options = {}) => {
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
          filter: `and(greater-or-equal(datetime,${formatDateTime(startDate)}),less-or-equal(datetime,${formatDateTime(endDate)}))`,
          group_by: groupBy
        }
      }
    };

    return await client.queryMetricAggregates(body);
  },

  /**
   * Search profiles by email or phone
   */
  searchProfiles: async (client, searchTerm) => {
    const filter = createKlaviyoFilter();
    
    if (searchTerm.includes('@')) {
      filter.equals('email', searchTerm);
    } else {
      filter.contains('phone_number', searchTerm);
    }

    return await client.getProfiles({
      filter: filter.build(),
      'page[size]': 10
    });
  },

  /**
   * Get abandoned cart profiles
   */
  getAbandonedCarts: async (client, options = {}) => {
    const {
      days = 7,
      limit = 100
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filter = createKlaviyoFilter();
    filter.greater('properties.value', 0);
    filter.greaterOrEqual('datetime', formatDateTime(startDate));

    return await client.get('/events', {
      filter: filter.build(),
      'filter[metric_id]': 'Started Checkout',
      'page[size]': limit,
      include: ['profile']
    });
  }
};

/**
 * Batch operations for efficiency (functional style)
 */
export const klaviyoBatch = {
  /**
   * Batch create profiles
   */
  createProfiles: async (client, profiles, batchSize = 100) => {
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
   */
  trackEvents: async (client, events, batchSize = 100) => {
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

// Default export with all utilities
const klaviyoHelpersFunctional = {
  createKlaviyoClient,
  createKlaviyoFilter,
  klaviyoOperations,
  klaviyoBatch,
  formatDateTime
};

export default klaviyoHelpersFunctional;