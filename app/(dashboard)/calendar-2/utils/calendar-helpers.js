// Calendar helper functions and utilities

/**
 * Get color classes for campaign channel
 */
export const getChannelColor = (channel) => {
  switch (channel) {
    case 'email':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'sms':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'push-notification':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Get color based on performance rate
 */
export const getPerformanceColor = (rate) => {
  if (rate >= 0.2) return 'text-green-600';
  if (rate >= 0.1) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Check if date ranges overlap
 */
export const dateRangesOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && end1 >= start2;
};

/**
 * Check if date range is cached
 */
export const isDateRangeCached = (cache, startTime, endTime) => {
  if (!cache) return false;
  return cache.startDate <= startTime && cache.endDate >= endTime;
};

/**
 * Format campaign for calendar display
 */
export const formatCampaignForCalendar = (campaign, store) => {
  return {
    ...campaign,
    storeName: store?.name || campaign.storeName || 'Unknown Store',
    storePublicId: store?.public_id,
    formattedDate: campaign.date ? new Date(campaign.date) : null
  };
};

/**
 * Filter campaigns by date
 */
export const filterCampaignsByDate = (campaigns, date) => {
  if (!campaigns || campaigns.length === 0) return [];
  
  return campaigns.filter(campaign => {
    const campaignDate = new Date(campaign.date);
    return (
      campaignDate.getDate() === date.getDate() &&
      campaignDate.getMonth() === date.getMonth() &&
      campaignDate.getFullYear() === date.getFullYear()
    );
  });
};

/**
 * Sort campaigns by date
 */
export const sortCampaignsByDate = (campaigns, direction = 'desc') => {
  return [...campaigns].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return direction === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

/**
 * Get campaign metrics display
 */
export const getCampaignMetrics = (campaign) => {
  const openRate = campaign.performance?.openRate || 0;
  const clickRate = campaign.performance?.clickRate || 0;
  const revenue = campaign.performance?.revenue || 0;
  
  let metricDisplay = '';
  let metricValue = 0;
  
  if (campaign.channel === 'sms') {
    metricDisplay = 'CTR';
    metricValue = clickRate;
  } else {
    metricDisplay = 'Open';
    metricValue = openRate;
  }
  
  return {
    openRate,
    clickRate,
    revenue,
    metricDisplay,
    metricValue
  };
};

/**
 * Check if campaign is scheduled
 */
export const isCampaignScheduled = (campaign) => {
  return campaign.isScheduled || 
         campaign.status === 'scheduled' || 
         campaign.status === 'Draft' || 
         campaign.status === 'Scheduled' ||
         campaign.status === 'Queued without Recipients';
};

/**
 * Update URL with filter parameters
 */
export const updateURLWithFilters = (router, pathname, filters) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        }
      } else if (value instanceof Date) {
        params.set(key, value.toISOString());
      } else {
        params.set(key, value);
      }
    }
  });
  
  const queryString = params.toString();
  const url = queryString ? `${pathname}?${queryString}` : pathname;
  router.push(url, undefined, { shallow: true });
};