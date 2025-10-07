"use client";

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const AIContext = createContext({});

export function AIProvider({ children }) {
  // Core AI state with comprehensive marketing context
  const [aiState, setAIState] = useState({
    // Page context
    currentPage: '',
    pageTitle: '',
    pageType: '', // 'dashboard' | 'campaigns' | 'flows' | 'revenue' | 'deliverability' | 'calendar'

    // Account/Store context
    selectedStores: [], // [{ value: 'store_id', label: 'Store Name', klaviyo_id: 'xxx' }]
    selectedKlaviyoIds: [],
    storeMetadata: {}, // Store-specific settings, industry, size, etc.

    // Time context
    dateRange: {
      start: null,
      end: null,
      preset: '', // 'last7days' | 'last30days' | 'last90days' | 'custom'
      comparison: null, // Previous period data for trend analysis
      seasonalContext: '', // 'holiday' | 'back-to-school' | 'summer' | 'normal'
    },

    // Current view data - IMPORTANT: Only store aggregated/summarized data, NOT raw campaign lists
    data: {
      // DO NOT store raw campaign arrays - use aggregated summaries only
      aggregated: {}, // Processed/aggregated data (totals, averages, etc.)

      // Store only TOP performers (max 5-10 items)
      topCampaigns: [], // Top 5-10 campaigns only
      topFlows: [], // Top 3-5 flows only
      topSegments: [], // Top 3-5 segments only

      // Summary statistics only
      summary: {
        totalCampaigns: 0,
        totalRecipients: 0,
        dateRange: '',
        accountsCount: 0,
      },

      // Time-series data for charts (aggregated by day/week, not individual campaigns)
      timeSeries: {
        daily: [], // Max 90 data points for 90 days
        weekly: [], // Max 13 data points for 90 days
      },

      // Distribution data (aggregated)
      distributions: {
        byDay: {}, // Aggregated by day of week
        byHour: {}, // Aggregated by hour of day
        byChannel: {}, // Aggregated by channel
        byType: {}, // Aggregated by campaign type
      },

      audience: {}, // Audience insights (summary only)
    },

    // Filters and segments
    filters: {
      stores: [],
      channels: [], // 'email' | 'sms' | 'push' | 'whatsapp'
      campaigns: [],
      flows: [],
      tags: [],
      status: [], // 'draft' | 'scheduled' | 'sent' | 'paused'
      segmentType: [], // List/segment filters
    },

    // Comprehensive metrics for marketing intelligence
    metrics: {
      // Primary KPIs
      primary: {
        totalRevenue: null,
        totalOrders: null,
        avgOrderValue: null,
        totalRecipients: null,
        openRate: null,
        clickRate: null,
        conversionRate: null,
        unsubscribeRate: null,
        bounceRate: null,
        spamRate: null,
      },

      // Secondary metrics
      secondary: {
        clickToOpenRate: null,
        revenuePerRecipient: null,
        costPerAcquisition: null,
        customerLifetimeValue: null,
        listGrowthRate: null,
        engagementScore: null,
      },

      // Period-over-period comparisons
      comparisons: {
        revenue: { current: null, previous: null, change: null, trend: null },
        openRate: { current: null, previous: null, change: null, trend: null },
        clickRate: { current: null, previous: null, change: null, trend: null },
        conversionRate: { current: null, previous: null, change: null, trend: null },
      },

      // Channel-specific metrics
      byChannel: {
        email: {},
        sms: {},
        push: {},
      },

      // Campaign-specific metrics
      campaigns: {
        totalCampaigns: null,
        avgCampaignsPerWeek: null,
        bestSendTime: null,
        bestSendDay: null,
        topPerformingCampaign: null,
      },

      // Flow metrics
      flows: {
        totalFlows: null,
        activeFlows: null,
        flowRevenue: null,
        topPerformingFlow: null,
      },

      // Audience metrics
      audience: {
        totalProfiles: null,
        activeProfiles: null,
        growthRate: null,
        churnRate: null,
        topSegments: [],
      },
    },

    // Marketing intelligence & insights
    insights: {
      automated: [], // System-generated insights
      anomalies: [], // Detected anomalies with severity
      opportunities: [], // Growth opportunities
      warnings: [], // Performance warnings
      recommendations: [], // Actionable recommendations
      benchmarks: {}, // Industry benchmark comparisons
      seasonalTrends: [], // Seasonal patterns detected
      audienceInsights: [], // Audience behavior patterns
      contentInsights: [], // Subject line/content performance
    },

    // Campaign intelligence
    campaigns: {
      upcoming: [], // Scheduled campaigns
      recent: [], // Recently sent
      topPerformers: [], // Best performing campaigns
      underperformers: [], // Campaigns needing attention
      sendTimeAnalysis: {}, // Best send times by day/hour
      subjectLineAnalysis: {}, // Subject line performance patterns
      contentAnalysis: {}, // Content engagement patterns
    },

    // Flow intelligence
    flows: {
      active: [],
      performance: [],
      dropOffPoints: [], // Where users drop off in flows
      optimizationOpportunities: [],
    },

    // Segment intelligence
    segments: {
      topPerforming: [],
      growthSegments: [],
      riskSegments: [], // Segments with declining engagement
      suggestions: [], // New segment ideas
    },

    // User interaction history for personalization
    userContext: {
      recentQueries: [], // Chat history
      focusAreas: [], // What user seems interested in
      expertise: 'unknown', // 'beginner' | 'intermediate' | 'advanced' | 'expert'
      preferences: {
        preferredMetrics: [],
        preferredViews: [],
        industryType: '', // e.g., 'ecommerce', 'saas', 'media'
      },
      goals: [], // User's stated goals
    },

    // Competitive & benchmark context
    benchmarks: {
      industry: {},
      similar: {}, // Similar-sized businesses
      historical: {}, // Historical performance
    },

    // Metadata
    timestamp: new Date().toISOString(),
    dataFreshness: null, // When data was last updated
    version: '2.0', // Context schema version
  });

  // History for context awareness
  const conversationHistory = useRef([]);
  const MAX_HISTORY = 20;

  // Update AI state with validation
  const updateAIState = useCallback((newState) => {
    setAIState(prevState => {
      const updated = {
        ...prevState,
        ...newState,
        timestamp: new Date().toISOString()
      };

      // Track state changes for context
      conversationHistory.current.unshift({
        timestamp: new Date().toISOString(),
        change: newState,
        page: newState.currentPage || prevState.currentPage
      });

      // Keep history limited
      if (conversationHistory.current.length > MAX_HISTORY) {
        conversationHistory.current = conversationHistory.current.slice(0, MAX_HISTORY);
      }

      return updated;
    });
  }, []);

  // Smart context builder for Claude with marketing focus
  const getAIContext = useCallback(() => {
    const context = {
      ...aiState,
      conversationHistory: conversationHistory.current.slice(0, 5), // Recent context
      formattedContext: formatAIContextForClaude(aiState),
      enrichedContext: enrichContextWithInsights(aiState),
      suggestedActions: generateSuggestedActions(aiState),
      marketingIntelligence: generateMarketingIntelligence(aiState),
    };

    return context;
  }, [aiState]);

  // Track user queries for better responses
  const trackUserQuery = useCallback((query, response) => {
    setAIState(prev => ({
      ...prev,
      userContext: {
        ...prev.userContext,
        recentQueries: [
          { query, response, timestamp: new Date().toISOString() },
          ...prev.userContext.recentQueries.slice(0, 9)
        ]
      }
    }));
  }, []);

  // Analyze user expertise level based on queries
  const updateUserExpertise = useCallback((interactions) => {
    const expertiseLevel = analyzeExpertiseLevel(interactions);
    setAIState(prev => ({
      ...prev,
      userContext: {
        ...prev.userContext,
        expertise: expertiseLevel
      }
    }));
  }, []);

  // Generate comprehensive marketing insights
  const generateInsights = useCallback((data, metrics) => {
    const insights = {
      automated: generateAutomatedInsights(data, metrics),
      anomalies: detectAnomalies(data, metrics),
      opportunities: findOpportunities(data, metrics),
      warnings: generateWarnings(data, metrics),
      recommendations: generateRecommendations(data, metrics),
    };

    setAIState(prev => ({
      ...prev,
      insights
    }));

    return insights;
  }, []);

  return (
    <AIContext.Provider value={{
      aiState,
      updateAIState,
      getAIContext,
      trackUserQuery,
      updateUserExpertise,
      generateInsights,
      // Utility functions for common operations
      utils: {
        formatCurrency: (value) => formatCurrency(value),
        formatPercentage: (value) => formatPercentage(value),
        formatNumber: (value) => formatNumber(value),
        calculateTrend: (current, previous) => calculateTrend(current, previous),
        calculateGrowthRate: (current, previous) => calculateGrowthRate(current, previous),
        categorizePerformance: (metric, value) => categorizePerformance(metric, value),
      }
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

// Enhanced context formatter for Claude with marketing intelligence
function formatAIContextForClaude(state) {
  const {
    currentPage,
    pageTitle,
    pageType,
    selectedStores,
    dateRange,
    data,
    filters,
    metrics,
    insights,
    campaigns,
    flows,
    segments,
    userContext,
    benchmarks,
  } = state;

  let context = `# Wizel AI Marketing Intelligence Context\n\n`;

  // Page and account context
  context += `## Current View\n`;
  context += `**Page:** ${pageTitle || currentPage} (${pageType})\n`;
  if (selectedStores.length > 0) {
    context += `**Selected Accounts:** ${selectedStores.map(s => s.label).join(', ')}\n`;
  }
  context += '\n';

  // Time context with seasonal awareness
  if (dateRange.start && dateRange.end) {
    context += `## Time Period\n`;
    context += `**Date Range:** ${formatDateRange(dateRange)}\n`;
    if (dateRange.comparison) {
      context += `**Comparing to:** Previous period\n`;
    }
    if (dateRange.seasonalContext) {
      context += `**Seasonal Context:** ${dateRange.seasonalContext}\n`;
    }
    context += '\n';
  }

  // Active filters
  const activeFilters = Object.entries(filters).filter(([_, value]) =>
    value && (Array.isArray(value) ? value.length > 0 : true)
  );

  if (activeFilters.length > 0) {
    context += `## Active Filters\n`;
    activeFilters.forEach(([key, value]) => {
      context += `- **${formatMetricName(key)}:** ${formatFilterValue(value)}\n`;
    });
    context += '\n';
  }

  // Primary KPIs with trends
  if (metrics.primary && Object.keys(metrics.primary).length > 0) {
    context += `## Key Performance Indicators\n`;
    Object.entries(metrics.primary).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const comparison = metrics.comparisons?.[key];
        context += `- **${formatMetricName(key)}:** ${formatMetricValue(key, value)}`;
        if (comparison?.change !== null) {
          const trendIcon = comparison.change > 0 ? '📈' : comparison.change < 0 ? '📉' : '➡️';
          context += ` ${trendIcon} ${formatPercentage(comparison.change)} vs previous period`;
        }
        context += '\n';
      }
    });
    context += '\n';
  }

  // Channel performance
  if (metrics.byChannel && Object.keys(metrics.byChannel).length > 0) {
    context += `## Channel Performance\n`;
    Object.entries(metrics.byChannel).forEach(([channel, channelMetrics]) => {
      if (channelMetrics && Object.keys(channelMetrics).length > 0) {
        context += `### ${channel.toUpperCase()}\n`;
        Object.entries(channelMetrics).forEach(([metric, value]) => {
          context += `- ${formatMetricName(metric)}: ${formatMetricValue(metric, value)}\n`;
        });
      }
    });
    context += '\n';
  }

  // Campaign intelligence
  if (campaigns.topPerformers?.length > 0 || campaigns.recent?.length > 0) {
    context += `## Campaign Intelligence\n`;

    if (campaigns.topPerformers?.length > 0) {
      context += `### Top Performing Campaigns\n`;
      campaigns.topPerformers.slice(0, 3).forEach((campaign, i) => {
        context += `${i + 1}. **${campaign.name}**\n`;
        context += `   - Revenue: ${formatCurrency(campaign.revenue || 0)}\n`;
        context += `   - Open Rate: ${formatPercentage(campaign.openRate || 0)}\n`;
        context += `   - Click Rate: ${formatPercentage(campaign.clickRate || 0)}\n`;
      });
      context += '\n';
    }

    if (campaigns.sendTimeAnalysis && Object.keys(campaigns.sendTimeAnalysis).length > 0) {
      context += `### Send Time Analysis\n`;
      context += `- **Best Day:** ${campaigns.sendTimeAnalysis.bestDay || 'N/A'}\n`;
      context += `- **Best Time:** ${campaigns.sendTimeAnalysis.bestTime || 'N/A'}\n`;
      context += '\n';
    }
  }

  // Flow intelligence
  if (flows.active?.length > 0 || flows.performance?.length > 0) {
    context += `## Flow Intelligence\n`;
    context += `- **Active Flows:** ${flows.active?.length || 0}\n`;
    if (flows.performance?.length > 0) {
      context += `- **Top Flow:** ${flows.performance[0]?.name || 'N/A'} (${formatCurrency(flows.performance[0]?.revenue || 0)})\n`;
    }
    if (flows.dropOffPoints?.length > 0) {
      context += `- **Optimization Opportunities:** ${flows.dropOffPoints.length} drop-off points detected\n`;
    }
    context += '\n';
  }

  // Audience insights
  if (metrics.audience && Object.keys(metrics.audience).length > 0) {
    context += `## Audience Insights\n`;
    if (metrics.audience.totalProfiles) {
      context += `- **Total Profiles:** ${formatNumber(metrics.audience.totalProfiles)}\n`;
    }
    if (metrics.audience.growthRate) {
      context += `- **List Growth Rate:** ${formatPercentage(metrics.audience.growthRate)}\n`;
    }
    if (metrics.audience.topSegments?.length > 0) {
      context += `- **Top Segments:** ${metrics.audience.topSegments.slice(0, 3).map(s => s.name).join(', ')}\n`;
    }
    context += '\n';
  }

  // AI-generated insights
  if (insights.automated?.length > 0) {
    context += `## AI-Generated Insights\n`;
    insights.automated.slice(0, 5).forEach((insight, i) => {
      context += `${i + 1}. ${insight}\n`;
    });
    context += '\n';
  }

  // Opportunities
  if (insights.opportunities?.length > 0) {
    context += `## Growth Opportunities\n`;
    insights.opportunities.slice(0, 3).forEach((opp, i) => {
      context += `${i + 1}. ${opp}\n`;
    });
    context += '\n';
  }

  // Warnings and anomalies
  if (insights.warnings?.length > 0 || insights.anomalies?.length > 0) {
    context += `## Alerts & Anomalies\n`;
    insights.warnings?.forEach((warning) => {
      context += `⚠️ **WARNING:** ${warning}\n`;
    });
    insights.anomalies?.forEach((anomaly) => {
      context += `🔍 **ANOMALY:** ${anomaly}\n`;
    });
    context += '\n';
  }

  // Recommendations
  if (insights.recommendations?.length > 0) {
    context += `## Actionable Recommendations\n`;
    insights.recommendations.forEach((rec, i) => {
      context += `${i + 1}. ${rec.action} - *${rec.impact}*\n`;
    });
    context += '\n';
  }

  // Benchmark comparisons
  if (benchmarks.industry && Object.keys(benchmarks.industry).length > 0) {
    context += `## Industry Benchmarks\n`;
    Object.entries(benchmarks.industry).forEach(([metric, bench]) => {
      const userValue = metrics.primary?.[metric];
      if (userValue !== null && userValue !== undefined) {
        const comparison = userValue > bench.value ? 'above' : 'below';
        context += `- **${formatMetricName(metric)}:** You're ${comparison} industry average (${formatMetricValue(metric, bench.value)})\n`;
      }
    });
    context += '\n';
  }

  // User context for personalization
  if (userContext.expertise !== 'unknown') {
    context += `## User Profile\n`;
    context += `- **Expertise Level:** ${userContext.expertise}\n`;
    if (userContext.focusAreas?.length > 0) {
      context += `- **Focus Areas:** ${userContext.focusAreas.join(', ')}\n`;
    }
    if (userContext.goals?.length > 0) {
      context += `- **Goals:** ${userContext.goals.join(', ')}\n`;
    }
    context += '\n';
  }

  return context;
}

// Generate marketing-specific intelligence
function generateMarketingIntelligence(state) {
  const intelligence = {
    performanceCategory: categorizeOverallPerformance(state.metrics),
    trendDirection: analyzeTrendDirection(state.metrics.comparisons),
    urgentActions: identifyUrgentActions(state.insights),
    quickWins: identifyQuickWins(state.metrics, state.insights),
    contentStrategy: analyzeContentStrategy(state.campaigns),
    audienceHealth: analyzeAudienceHealth(state.metrics.audience),
    channelMix: analyzeChannelMix(state.metrics.byChannel),
  };

  return intelligence;
}

// Enrich context with business insights
function enrichContextWithInsights(state) {
  const { metrics, data } = state;
  const enriched = {
    performance: categorizeOverallPerformance(metrics),
    trends: identifyTrends(data),
    benchmarks: compareToBenchmarks(metrics),
    seasonality: detectSeasonality(data),
    channelRecommendations: generateChannelRecommendations(metrics.byChannel),
    segmentationOpportunities: findSegmentationOpportunities(state.segments),
  };

  return enriched;
}

// Generate suggested actions based on context
function generateSuggestedActions(state) {
  const suggestions = [];
  const { metrics, insights, pageType, campaigns, flows } = state;

  // Campaign-specific suggestions
  if (pageType === 'campaigns') {
    if (metrics.primary?.clickRate < 0.02) {
      suggestions.push({
        type: 'improvement',
        action: 'A/B test subject lines and preview text',
        message: 'Click rates are below industry average (2.62%). Consider A/B testing subject lines.',
        priority: 'high',
        estimatedImpact: '15-30% improvement in click rate'
      });
    }

    if (metrics.campaigns?.avgCampaignsPerWeek < 2) {
      suggestions.push({
        type: 'opportunity',
        action: 'Increase email frequency',
        message: 'You\'re sending fewer campaigns than optimal. Consider increasing to 2-3 per week.',
        priority: 'medium',
        estimatedImpact: '20-40% revenue increase'
      });
    }
  }

  // Deliverability suggestions
  if (pageType === 'deliverability') {
    if (metrics.primary?.bounceRate > 0.05) {
      suggestions.push({
        type: 'warning',
        action: 'Clean email list immediately',
        message: 'High bounce rate detected (>5%). This can damage sender reputation.',
        priority: 'critical',
        estimatedImpact: 'Prevent deliverability issues'
      });
    }

    if (metrics.primary?.spamRate > 0.001) {
      suggestions.push({
        type: 'warning',
        action: 'Review content and list quality',
        message: 'Spam complaint rate is elevated. Review unsubscribe process and content relevance.',
        priority: 'high',
        estimatedImpact: 'Protect sender reputation'
      });
    }
  }

  // Flow optimization suggestions
  if (pageType === 'flows' && flows.dropOffPoints?.length > 0) {
    suggestions.push({
      type: 'optimization',
      action: 'Optimize flow timing and content',
      message: `${flows.dropOffPoints.length} drop-off points detected in your flows. Review timing and messaging.`,
      priority: 'medium',
      estimatedImpact: '10-25% improvement in flow revenue'
    });
  }

  // Revenue suggestions
  if (pageType === 'revenue') {
    if (metrics.primary?.avgOrderValue && metrics.comparisons?.avgOrderValue?.change < 0) {
      suggestions.push({
        type: 'opportunity',
        action: 'Implement upsell/cross-sell campaigns',
        message: 'AOV is declining. Consider product bundling or post-purchase upsell flows.',
        priority: 'high',
        estimatedImpact: '15-30% AOV increase'
      });
    }
  }

  // General audience health
  if (metrics.audience?.churnRate > 0.05) {
    suggestions.push({
      type: 'retention',
      action: 'Create re-engagement campaign',
      message: 'Churn rate is above 5%. Launch a win-back campaign for inactive subscribers.',
      priority: 'high',
      estimatedImpact: 'Reduce churn by 20-40%'
    });
  }

  // Anomaly-based suggestions
  insights.anomalies?.forEach(anomaly => {
    suggestions.push({
      type: 'investigate',
      action: 'Investigate anomaly',
      message: anomaly,
      priority: 'medium',
      estimatedImpact: 'Identify root cause'
    });
  });

  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Helper functions for formatting and analysis

function formatDateRange(dateRange) {
  if (dateRange.preset) {
    return dateRange.preset.replace(/([A-Z])/g, ' $1').toLowerCase();
  }
  if (dateRange.start && dateRange.end) {
    return `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
  }
  return 'N/A';
}

function formatFilterValue(value) {
  if (Array.isArray(value)) {
    return value.length > 3 ? `${value.slice(0, 3).join(', ')}... (${value.length} total)` : value.join(', ');
  }
  return String(value);
}

function formatMetricName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatMetricValue(metricType, value) {
  if (value === null || value === undefined) return 'N/A';

  // Currency metrics
  if (metricType.toLowerCase().includes('revenue') ||
      metricType.toLowerCase().includes('value') ||
      metricType.toLowerCase().includes('aov')) {
    return formatCurrency(value);
  }

  // Rate/percentage metrics
  if (metricType.toLowerCase().includes('rate') ||
      metricType.toLowerCase().includes('percentage')) {
    return formatPercentage(value);
  }

  // Count metrics
  return formatNumber(value);
}

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  const percentage = value < 1 ? value * 100 : value; // Handle both decimal and percentage
  const formatted = percentage.toFixed(1);
  return value > 0 ? `+${formatted}%` : `${formatted}%`;
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(value);
}

function calculateTrend(current, previous) {
  if (!previous || previous === 0) return 'new';
  const change = ((current - previous) / previous);
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'flat';
}

function calculateGrowthRate(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous);
}

function categorizePerformance(metric, value) {
  // Benchmark-based categorization
  const benchmarks = {
    openRate: { excellent: 0.25, good: 0.20, average: 0.15 },
    clickRate: { excellent: 0.03, good: 0.02, average: 0.01 },
    conversionRate: { excellent: 0.03, good: 0.02, average: 0.01 },
    bounceRate: { excellent: 0.02, good: 0.03, average: 0.05 },
  };

  const bench = benchmarks[metric];
  if (!bench || value === null) return 'unknown';

  // Inverse for negative metrics
  const isNegativeMetric = metric.includes('bounce') || metric.includes('unsubscribe') || metric.includes('spam');

  if (isNegativeMetric) {
    if (value <= bench.excellent) return 'excellent';
    if (value <= bench.good) return 'good';
    if (value <= bench.average) return 'average';
    return 'needs improvement';
  } else {
    if (value >= bench.excellent) return 'excellent';
    if (value >= bench.good) return 'good';
    if (value >= bench.average) return 'average';
    return 'needs improvement';
  }
}

function categorizeOverallPerformance(metrics) {
  if (!metrics.primary) return 'unknown';

  const openRate = metrics.primary.openRate || 0;
  const clickRate = metrics.primary.clickRate || 0;

  if (openRate > 0.25 && clickRate > 0.03) return 'excellent';
  if (openRate > 0.20 && clickRate > 0.02) return 'good';
  if (openRate > 0.15 && clickRate > 0.01) return 'average';
  return 'needs improvement';
}

function analyzeTrendDirection(comparisons) {
  if (!comparisons || Object.keys(comparisons).length === 0) return 'unknown';

  const trends = Object.values(comparisons)
    .filter(comp => comp.change !== null)
    .map(comp => comp.change > 0 ? 1 : comp.change < 0 ? -1 : 0);

  const avgTrend = trends.reduce((sum, t) => sum + t, 0) / trends.length;

  if (avgTrend > 0.1) return 'strongly positive';
  if (avgTrend > 0) return 'positive';
  if (avgTrend < -0.1) return 'strongly negative';
  if (avgTrend < 0) return 'negative';
  return 'stable';
}

function identifyTrends(data) {
  const trends = [];

  if (data.aggregated?.revenueGrowth > 0.1) {
    trends.push('Strong revenue growth detected');
  }
  if (data.aggregated?.engagementTrend === 'increasing') {
    trends.push('Improving engagement rates');
  }

  return trends;
}

function compareToBenchmarks(metrics) {
  // Industry benchmarks (email marketing averages)
  const benchmarks = {
    openRate: 0.2133, // 21.33%
    clickRate: 0.0262, // 2.62%
    conversionRate: 0.0148, // 1.48%
    bounceRate: 0.0096, // 0.96%
    unsubscribeRate: 0.001, // 0.1%
  };

  const comparison = {};

  if (metrics.primary) {
    Object.entries(benchmarks).forEach(([metric, benchmark]) => {
      const userValue = metrics.primary[metric];
      if (userValue !== null && userValue !== undefined) {
        comparison[metric] = {
          value: benchmark,
          userValue: userValue,
          status: userValue > benchmark ? 'above' : 'below',
          difference: userValue - benchmark,
        };
      }
    });
  }

  return comparison;
}

function detectSeasonality(data) {
  // Placeholder for seasonality detection
  return {
    detected: false,
    pattern: null
  };
}

function generateAutomatedInsights(data, metrics) {
  const insights = [];

  if (metrics.comparisons?.openRate?.change > 0.2) {
    insights.push(`Open rates have increased by ${formatPercentage(metrics.comparisons.openRate.change)} compared to the previous period - great job!`);
  }

  if (metrics.comparisons?.revenue?.change < -0.1) {
    insights.push(`Revenue has declined by ${formatPercentage(Math.abs(metrics.comparisons.revenue.change))}. Consider reviewing campaign frequency and targeting.`);
  }

  if (data.aggregated?.topPerformer) {
    insights.push(`"${data.aggregated.topPerformer.name}" is your top performing campaign with ${formatCurrency(data.aggregated.topPerformer.revenue)} in revenue`);
  }

  if (metrics.campaigns?.bestSendTime) {
    insights.push(`Your campaigns perform best when sent on ${metrics.campaigns.bestSendDay} at ${metrics.campaigns.bestSendTime}`);
  }

  return insights;
}

function detectAnomalies(data, metrics) {
  const anomalies = [];

  if (metrics.primary?.bounceRate > 0.05) {
    anomalies.push(`Unusually high bounce rate (${formatPercentage(metrics.primary.bounceRate)}) - Review list quality`);
  }

  if (metrics.primary?.unsubscribeRate > 0.01) {
    anomalies.push(`Elevated unsubscribe rate (${formatPercentage(metrics.primary.unsubscribeRate)}) - Review content relevance`);
  }

  if (metrics.comparisons?.clickRate?.change < -0.3) {
    anomalies.push('Significant drop in click rates detected - Investigate recent campaign changes');
  }

  return anomalies;
}

function findOpportunities(data, metrics) {
  const opportunities = [];

  if (metrics.primary?.clickToOpenRate && metrics.primary.clickToOpenRate < 0.10) {
    opportunities.push('Low click-to-open rate suggests content relevance can be improved. Consider better segmentation and personalization.');
  }

  if (metrics.audience?.growthRate < 0.05) {
    opportunities.push('Slow list growth detected. Consider adding lead magnets, exit-intent popups, or social media lead ads.');
  }

  if (!metrics.flows?.activeFlows || metrics.flows.activeFlows < 5) {
    opportunities.push('Limited automation detected. Consider implementing welcome series, abandoned cart, and post-purchase flows.');
  }

  if (metrics.byChannel?.email && !metrics.byChannel?.sms) {
    opportunities.push('SMS channel not utilized. Consider adding SMS for time-sensitive promotions and cart abandonment.');
  }

  return opportunities;
}

function generateWarnings(data, metrics) {
  const warnings = [];

  if (metrics.primary?.bounceRate > 0.05) {
    warnings.push('CRITICAL: Bounce rate exceeds 5% - immediate list cleaning required');
  }

  if (metrics.primary?.spamRate > 0.001) {
    warnings.push('WARNING: Elevated spam complaints detected - review unsubscribe process and content');
  }

  if (metrics.audience?.churnRate > 0.10) {
    warnings.push('HIGH CHURN: More than 10% of audience is disengaging - implement re-engagement campaign');
  }

  return warnings;
}

function generateRecommendations(data, metrics) {
  const recommendations = [];

  // Subject line optimization
  if (metrics.primary?.openRate < 0.20) {
    recommendations.push({
      action: 'Optimize subject lines with A/B testing',
      impact: 'Could increase open rates by 15-30%',
      effort: 'Low',
      priority: 'High'
    });
  }

  // Send time optimization
  if (!metrics.campaigns?.bestSendTime) {
    recommendations.push({
      action: 'Run send time optimization tests',
      impact: 'Could improve engagement by 10-20%',
      effort: 'Medium',
      priority: 'Medium'
    });
  }

  // Segmentation
  if (data.aggregated?.totalCampaigns > 10 && (!data.segments || data.segments.length < 3)) {
    recommendations.push({
      action: 'Implement advanced segmentation strategy',
      impact: 'Could increase revenue by 20-40%',
      effort: 'High',
      priority: 'High'
    });
  }

  return recommendations;
}

function identifyUrgentActions(insights) {
  const urgent = [];

  insights.warnings?.forEach(warning => {
    if (warning.includes('CRITICAL')) {
      urgent.push(warning);
    }
  });

  return urgent;
}

function identifyQuickWins(metrics, insights) {
  const quickWins = [];

  if (metrics.primary?.openRate > 0.20 && metrics.primary?.clickRate < 0.02) {
    quickWins.push('Strong open rates but low clicks - improve CTA placement and copy');
  }

  if (metrics.campaigns?.avgCampaignsPerWeek < 1) {
    quickWins.push('Low send frequency - increase to 2-3 campaigns per week for quick revenue boost');
  }

  return quickWins;
}

function analyzeContentStrategy(campaigns) {
  const strategy = {
    frequency: 'unknown',
    consistency: 'unknown',
    topPerformingTypes: [],
  };

  if (campaigns.avgCampaignsPerWeek) {
    if (campaigns.avgCampaignsPerWeek < 1) strategy.frequency = 'low';
    else if (campaigns.avgCampaignsPerWeek < 3) strategy.frequency = 'moderate';
    else strategy.frequency = 'high';
  }

  return strategy;
}

function analyzeAudienceHealth(audienceMetrics) {
  const health = {
    overall: 'unknown',
    listGrowth: 'unknown',
    engagement: 'unknown',
  };

  if (audienceMetrics?.growthRate) {
    if (audienceMetrics.growthRate > 0.10) health.listGrowth = 'excellent';
    else if (audienceMetrics.growthRate > 0.05) health.listGrowth = 'good';
    else if (audienceMetrics.growthRate > 0) health.listGrowth = 'slow';
    else health.listGrowth = 'declining';
  }

  return health;
}

function analyzeChannelMix(byChannel) {
  const analysis = {
    activeChannels: [],
    recommendations: [],
  };

  if (byChannel) {
    analysis.activeChannels = Object.keys(byChannel).filter(
      channel => byChannel[channel] && Object.keys(byChannel[channel]).length > 0
    );

    if (analysis.activeChannels.length === 1) {
      analysis.recommendations.push('Diversify with additional channels for better reach');
    }
  }

  return analysis;
}

function generateChannelRecommendations(byChannel) {
  const recommendations = [];

  if (!byChannel?.sms) {
    recommendations.push('Add SMS for time-sensitive offers and abandoned cart recovery');
  }

  if (!byChannel?.push) {
    recommendations.push('Implement push notifications for browse abandonment and back-in-stock alerts');
  }

  return recommendations;
}

function findSegmentationOpportunities(segments) {
  const opportunities = [];

  if (!segments || !segments.topPerforming || segments.topPerforming.length < 3) {
    opportunities.push('Create RFM (Recency, Frequency, Monetary) segments for targeted campaigns');
  }

  opportunities.push('Build VIP customer segment for exclusive offers');
  opportunities.push('Create at-risk customer segment for win-back campaigns');

  return opportunities;
}

function analyzeExpertiseLevel(interactions) {
  if (!interactions || interactions.length === 0) return 'unknown';

  const complexQueries = interactions.filter(i => {
    const query = i.query.toLowerCase();
    return query.includes('segmentation') ||
           query.includes('attribution') ||
           query.includes('cohort') ||
           query.includes('ltv') ||
           query.includes('predictive');
  }).length;

  const totalQueries = interactions.length;
  const complexityRatio = complexQueries / totalQueries;

  if (complexityRatio > 0.4) return 'expert';
  if (complexityRatio > 0.2) return 'advanced';
  if (totalQueries > 5) return 'intermediate';
  return 'beginner';
}

// ===================================================================
// SMART DATA AGGREGATION HELPERS
// Use these functions to prepare data BEFORE sending to AI context
// ===================================================================

/**
 * Aggregate large campaign dataset into AI-friendly summary
 * Handles 100s-1000s of campaigns by creating smart summaries
 *
 * @param {Array} campaigns - Full campaign array (can be 900+ items)
 * @returns {Object} - Compact, AI-friendly summary
 */
export function aggregateCampaignsForAI(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return {
      topCampaigns: [],
      aggregated: {},
      summary: { totalCampaigns: 0 },
      distributions: {},
      timeSeries: { daily: [], weekly: [] },
    };
  }

  // 1. Calculate overall aggregates
  const aggregated = {
    totalCampaigns: campaigns.length,
    totalRecipients: campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0),
    totalOpens: campaigns.reduce((sum, c) => sum + (c.opens_unique || 0), 0),
    totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks_unique || 0), 0),
    totalConversions: campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0),
  };

  // Calculate weighted averages
  aggregated.avgOpenRate = aggregated.totalRecipients > 0
    ? aggregated.totalOpens / aggregated.totalRecipients
    : 0;
  aggregated.avgClickRate = aggregated.totalRecipients > 0
    ? aggregated.totalClicks / aggregated.totalRecipients
    : 0;
  aggregated.avgConversionRate = aggregated.totalRecipients > 0
    ? aggregated.totalConversions / aggregated.totalRecipients
    : 0;
  aggregated.revenuePerRecipient = aggregated.totalRecipients > 0
    ? aggregated.totalRevenue / aggregated.totalRecipients
    : 0;

  // 2. Get TOP 10 campaigns by revenue WITH strategic context
  const topCampaigns = campaigns
    .map(c => {
      // Extract strategic context from campaign data
      const name = c.campaign_name || c.name || 'Unnamed Campaign';

      return {
        name,
        revenue: c.revenue || 0,
        recipients: c.recipients || 0,
        openRate: c.recipients > 0 ? (c.opens_unique || 0) / c.recipients : 0,
        clickRate: c.recipients > 0 ? (c.clicks_unique || 0) / c.recipients : 0,
        conversionRate: c.recipients > 0 ? (c.conversions || 0) / c.recipients : 0,
        sendTime: c.send_time || c.sent_at,

        // Strategic context for AI analysis
        subjectLine: c.subject_line || extractSubjectFromName(name),
        campaignType: detectCampaignType(name, c),
        segment: c.segment_name || c.audience_name || 'All Subscribers',
        tags: c.tags || [],
        channel: c.channel || 'email',

        // Content insights (if available)
        hasDiscount: detectDiscount(name, c.subject_line),
        discountAmount: extractDiscountAmount(name, c.subject_line),
        isUrgent: detectUrgency(name, c.subject_line),
        isPersonalized: c.is_personalized || false,
        hasEmoji: detectEmoji(c.subject_line || name),

        // Timing context
        sendDay: c.send_time ? new Date(c.send_time).toLocaleDateString('en-US', { weekday: 'long' }) : null,
        sendHour: c.send_time ? new Date(c.send_time).getHours() : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Only top 10

  // 3. Aggregate by day of week
  const byDay = {};
  campaigns.forEach(campaign => {
    const sendTime = campaign.send_time || campaign.sent_at;
    if (!sendTime) return;

    const day = new Date(sendTime).toLocaleDateString('en-US', { weekday: 'long' });
    if (!byDay[day]) {
      byDay[day] = { campaigns: 0, recipients: 0, opens: 0, clicks: 0, revenue: 0 };
    }

    byDay[day].campaigns += 1;
    byDay[day].recipients += campaign.recipients || 0;
    byDay[day].opens += campaign.opens_unique || 0;
    byDay[day].clicks += campaign.clicks_unique || 0;
    byDay[day].revenue += campaign.revenue || 0;
  });

  // Calculate averages for each day
  Object.keys(byDay).forEach(day => {
    const data = byDay[day];
    data.avgOpenRate = data.recipients > 0 ? data.opens / data.recipients : 0;
    data.avgClickRate = data.recipients > 0 ? data.clicks / data.recipients : 0;
  });

  // 4. Aggregate by hour of day
  const byHour = {};
  campaigns.forEach(campaign => {
    const sendTime = campaign.send_time || campaign.sent_at;
    if (!sendTime) return;

    const hour = new Date(sendTime).getHours();
    if (!byHour[hour]) {
      byHour[hour] = { campaigns: 0, recipients: 0, revenue: 0, opens: 0 };
    }

    byHour[hour].campaigns += 1;
    byHour[hour].recipients += campaign.recipients || 0;
    byHour[hour].revenue += campaign.revenue || 0;
    byHour[hour].opens += campaign.opens_unique || 0;
  });

  // 5. Create daily time series (aggregated by date)
  const dailyMap = {};
  campaigns.forEach(campaign => {
    const sendTime = campaign.send_time || campaign.sent_at;
    if (!sendTime) return;

    const date = new Date(sendTime).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { date, campaigns: 0, revenue: 0, recipients: 0, opens: 0, clicks: 0 };
    }

    dailyMap[date].campaigns += 1;
    dailyMap[date].revenue += campaign.revenue || 0;
    dailyMap[date].recipients += campaign.recipients || 0;
    dailyMap[date].opens += campaign.opens_unique || 0;
    dailyMap[date].clicks += campaign.clicks_unique || 0;
  });

  const daily = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90); // Max 90 days

  // 6. Create weekly time series
  const weeklyMap = {};
  campaigns.forEach(campaign => {
    const sendTime = campaign.send_time || campaign.sent_at;
    if (!sendTime) return;

    const date = new Date(sendTime);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = { week: weekKey, campaigns: 0, revenue: 0, recipients: 0 };
    }

    weeklyMap[weekKey].campaigns += 1;
    weeklyMap[weekKey].revenue += campaign.revenue || 0;
    weeklyMap[weekKey].recipients += campaign.recipients || 0;
  });

  const weekly = Object.values(weeklyMap)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-13); // Max 13 weeks

  // 7. Find best performing day and time
  let bestDay = null;
  let bestDayRevenue = 0;
  Object.entries(byDay).forEach(([day, data]) => {
    if (data.revenue > bestDayRevenue) {
      bestDay = day;
      bestDayRevenue = data.revenue;
    }
  });

  let bestHour = null;
  let bestHourRevenue = 0;
  Object.entries(byHour).forEach(([hour, data]) => {
    if (data.revenue > bestHourRevenue) {
      bestHour = hour;
      bestHourRevenue = data.revenue;
    }
  });

  // 8. Strategic analysis - What's working and why
  const strategicInsights = analyzeStrategicPatterns(topCampaigns, campaigns);

  return {
    topCampaigns,
    aggregated: {
      ...aggregated,
      bestSendDay: bestDay,
      bestSendHour: bestHour ? `${bestHour}:00` : null,
    },
    summary: {
      totalCampaigns: campaigns.length,
      totalRecipients: aggregated.totalRecipients,
      totalRevenue: aggregated.totalRevenue,
    },
    distributions: {
      byDay,
      byHour,
    },
    timeSeries: {
      daily,
      weekly,
    },
    strategicInsights, // NEW: What's working and why
  };
}

/**
 * Aggregate flows data for AI context
 * @param {Array} flows - All flows
 * @returns {Object} - Compact summary
 */
export function aggregateFlowsForAI(flows) {
  if (!flows || flows.length === 0) {
    return { topFlows: [], summary: {}, aggregated: {} };
  }

  const aggregated = {
    totalFlows: flows.length,
    activeFlows: flows.filter(f => f.status === 'active').length,
    totalRevenue: flows.reduce((sum, f) => sum + (f.revenue || 0), 0),
  };

  const topFlows = flows
    .map(f => ({
      name: f.name,
      status: f.status,
      revenue: f.revenue || 0,
      triggers: f.triggers || 0,
      conversions: f.conversions || 0,
      conversionRate: f.triggers > 0 ? (f.conversions || 0) / f.triggers : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Top 5 flows only

  return {
    topFlows,
    aggregated,
    summary: {
      totalFlows: flows.length,
      activeFlows: aggregated.activeFlows,
      totalRevenue: aggregated.totalRevenue,
    },
  };
}

/**
 * Example usage in your component:
 *
 * ```javascript
 * import { useAI, aggregateCampaignsForAI } from '@/app/contexts/ai-context';
 *
 * function CampaignsPage() {
 *   const { updateAIState } = useAI();
 *   const [campaigns, setCampaigns] = useState([]);
 *
 *   useEffect(() => {
 *     // Fetch all 900 campaigns
 *     const allCampaigns = await fetchCampaigns();
 *     setCampaigns(allCampaigns);
 *
 *     // Aggregate into AI-friendly format
 *     const aggregatedData = aggregateCampaignsForAI(allCampaigns);
 *
 *     // Update AI context with ONLY aggregated data
 *     updateAIState({
 *       pageType: 'campaigns',
 *       data: aggregatedData,
 *       metrics: {
 *         primary: {
 *           totalRevenue: aggregatedData.aggregated.totalRevenue,
 *           openRate: aggregatedData.aggregated.avgOpenRate,
 *           clickRate: aggregatedData.aggregated.avgClickRate,
 *         },
 *         campaigns: {
 *           totalCampaigns: aggregatedData.summary.totalCampaigns,
 *           bestSendDay: aggregatedData.aggregated.bestSendDay,
 *           bestSendTime: aggregatedData.aggregated.bestSendHour,
 *         },
 *       },
 *     });
 *   }, [updateAIState]);
 * }
 * ```
 */

// ===================================================================
// STRATEGIC ANALYSIS HELPERS
// Extract WHY campaigns work, not just WHAT the numbers are
// ===================================================================

/**
 * Analyze strategic patterns across campaigns to answer:
 * - Why is this campaign performing better?
 * - What should I do next?
 * - What patterns are working?
 */
function analyzeStrategicPatterns(topCampaigns, allCampaigns) {
  const insights = {
    contentPatterns: analyzeContentPatterns(topCampaigns, allCampaigns),
    audiencePatterns: analyzeAudiencePatterns(topCampaigns, allCampaigns),
    timingPatterns: analyzeTimingPatterns(topCampaigns, allCampaigns),
    campaignTypePatterns: analyzeCampaignTypePatterns(topCampaigns, allCampaigns),
    nextCampaignSuggestions: generateNextCampaignSuggestions(topCampaigns, allCampaigns),
    whyPerformanceDiffers: explainPerformanceDifferences(topCampaigns),
  };

  return insights;
}

/**
 * Analyze what content elements drive performance
 */
function analyzeContentPatterns(topCampaigns, allCampaigns) {
  const patterns = {
    discountPerformance: {},
    urgencyImpact: {},
    personalizationImpact: {},
    emojiImpact: {},
    subjectLineLength: {},
  };

  // Analyze discount performance
  const withDiscount = topCampaigns.filter(c => c.hasDiscount);
  const withoutDiscount = topCampaigns.filter(c => !c.hasDiscount);

  if (withDiscount.length > 0 && withoutDiscount.length > 0) {
    const avgDiscountRevenue = withDiscount.reduce((sum, c) => sum + c.revenue, 0) / withDiscount.length;
    const avgNoDiscountRevenue = withoutDiscount.reduce((sum, c) => sum + c.revenue, 0) / withoutDiscount.length;

    patterns.discountPerformance = {
      withDiscount: { count: withDiscount.length, avgRevenue: avgDiscountRevenue },
      withoutDiscount: { count: withoutDiscount.length, avgRevenue: avgNoDiscountRevenue },
      winner: avgDiscountRevenue > avgNoDiscountRevenue ? 'with_discount' : 'without_discount',
      insight: avgDiscountRevenue > avgNoDiscountRevenue
        ? `Discount campaigns generate ${((avgDiscountRevenue / avgNoDiscountRevenue - 1) * 100).toFixed(0)}% more revenue on average`
        : `Non-discount campaigns generate ${((avgNoDiscountRevenue / avgDiscountRevenue - 1) * 100).toFixed(0)}% more revenue - focus on value over discounts`,
    };
  }

  // Analyze urgency impact
  const withUrgency = topCampaigns.filter(c => c.isUrgent);
  const withoutUrgency = topCampaigns.filter(c => !c.isUrgent);

  if (withUrgency.length > 0 && withoutUrgency.length > 0) {
    const avgUrgentOpen = withUrgency.reduce((sum, c) => sum + c.openRate, 0) / withUrgency.length;
    const avgNormalOpen = withoutUrgency.reduce((sum, c) => sum + c.openRate, 0) / withoutUrgency.length;

    patterns.urgencyImpact = {
      withUrgency: { count: withUrgency.length, avgOpenRate: avgUrgentOpen },
      withoutUrgency: { count: withoutUrgency.length, avgOpenRate: avgNormalOpen },
      insight: avgUrgentOpen > avgNormalOpen
        ? `Urgent language increases open rates by ${((avgUrgentOpen / avgNormalOpen - 1) * 100).toFixed(0)}%`
        : 'Urgent language doesn\'t significantly improve open rates',
    };
  }

  // Analyze emoji impact
  const withEmoji = topCampaigns.filter(c => c.hasEmoji);
  const withoutEmoji = topCampaigns.filter(c => !c.hasEmoji);

  if (withEmoji.length > 0 && withoutEmoji.length > 0) {
    const avgEmojiOpen = withEmoji.reduce((sum, c) => sum + c.openRate, 0) / withEmoji.length;
    const avgNoEmojiOpen = withoutEmoji.reduce((sum, c) => sum + c.openRate, 0) / withoutEmoji.length;

    patterns.emojiImpact = {
      insight: avgEmojiOpen > avgNoEmojiOpen
        ? `Emojis in subject lines increase open rates by ${((avgEmojiOpen / avgNoEmojiOpen - 1) * 100).toFixed(0)}%`
        : 'Emojis don\'t significantly impact open rates for your audience',
    };
  }

  return patterns;
}

/**
 * Analyze audience/segment patterns
 */
function analyzeAudiencePatterns(topCampaigns, allCampaigns) {
  // Group by segment
  const bySegment = {};

  topCampaigns.forEach(campaign => {
    const segment = campaign.segment || 'All Subscribers';
    if (!bySegment[segment]) {
      bySegment[segment] = {
        campaigns: [],
        totalRevenue: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        avgConversionRate: 0,
      };
    }

    bySegment[segment].campaigns.push(campaign);
    bySegment[segment].totalRevenue += campaign.revenue;
  });

  // Calculate averages
  Object.keys(bySegment).forEach(segment => {
    const data = bySegment[segment];
    const count = data.campaigns.length;

    data.avgOpenRate = data.campaigns.reduce((sum, c) => sum + c.openRate, 0) / count;
    data.avgClickRate = data.campaigns.reduce((sum, c) => sum + c.clickRate, 0) / count;
    data.avgConversionRate = data.campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / count;
    data.count = count;
  });

  // Find best segment
  const sortedSegments = Object.entries(bySegment)
    .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue);

  const bestSegment = sortedSegments[0];

  return {
    bySegment,
    bestSegment: bestSegment ? {
      name: bestSegment[0],
      ...bestSegment[1],
      insight: `${bestSegment[0]} is your highest-value segment with $${(bestSegment[1].totalRevenue / 1000).toFixed(1)}K revenue from ${bestSegment[1].count} top campaigns`,
    } : null,
  };
}

/**
 * Analyze timing patterns
 */
function analyzeTimingPatterns(topCampaigns, allCampaigns) {
  const byDay = {};
  const byHour = {};

  topCampaigns.forEach(campaign => {
    if (campaign.sendDay) {
      if (!byDay[campaign.sendDay]) {
        byDay[campaign.sendDay] = { campaigns: 0, revenue: 0 };
      }
      byDay[campaign.sendDay].campaigns += 1;
      byDay[campaign.sendDay].revenue += campaign.revenue;
    }

    if (campaign.sendHour !== null && campaign.sendHour !== undefined) {
      const hour = campaign.sendHour;
      if (!byHour[hour]) {
        byHour[hour] = { campaigns: 0, revenue: 0 };
      }
      byHour[hour].campaigns += 1;
      byHour[hour].revenue += campaign.revenue;
    }
  });

  return {
    byDay,
    byHour,
    insight: 'Your top performers show clear timing patterns - replicate this timing for future campaigns',
  };
}

/**
 * Analyze campaign type patterns
 */
function analyzeCampaignTypePatterns(topCampaigns, allCampaigns) {
  const byType = {};

  topCampaigns.forEach(campaign => {
    const type = campaign.campaignType;
    if (!byType[type]) {
      byType[type] = {
        campaigns: [],
        totalRevenue: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
      };
    }

    byType[type].campaigns.push(campaign);
    byType[type].totalRevenue += campaign.revenue;
  });

  // Calculate averages
  Object.keys(byType).forEach(type => {
    const data = byType[type];
    const count = data.campaigns.length;

    data.avgOpenRate = data.campaigns.reduce((sum, c) => sum + c.openRate, 0) / count;
    data.avgClickRate = data.campaigns.reduce((sum, c) => sum + c.clickRate, 0) / count;
    data.count = count;
  });

  const sortedTypes = Object.entries(byType)
    .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue);

  return {
    byType,
    topType: sortedTypes[0] ? {
      type: sortedTypes[0][0],
      ...sortedTypes[0][1],
      insight: `${sortedTypes[0][0]} campaigns are your strongest performers`,
    } : null,
  };
}

/**
 * Generate suggestions for next campaigns based on patterns
 */
function generateNextCampaignSuggestions(topCampaigns, allCampaigns) {
  const suggestions = [];

  // Analyze top 3 campaigns
  const top3 = topCampaigns.slice(0, 3);

  // Extract common patterns
  const hasDiscounts = top3.filter(c => c.hasDiscount).length;
  const hasUrgency = top3.filter(c => c.isUrgent).length;
  const hasEmoji = top3.filter(c => c.hasEmoji).length;
  const commonSegments = [...new Set(top3.map(c => c.segment))];
  const commonTypes = [...new Set(top3.map(c => c.campaignType))];
  const commonDays = [...new Set(top3.map(c => c.sendDay).filter(Boolean))];
  const commonHours = [...new Set(top3.map(c => c.sendHour).filter(h => h !== null))];

  // Suggestion 1: Replicate winning formula
  if (hasDiscounts >= 2) {
    suggestions.push({
      title: 'Create discount-driven campaign',
      rationale: `${hasDiscounts} of your top 3 campaigns included discounts`,
      action: 'Launch a limited-time offer with a clear discount (30-50% off)',
      expectedImpact: 'High revenue potential based on historical performance',
      priority: 'High',
    });
  }

  // Suggestion 2: Target winning segments
  if (commonSegments.length > 0 && commonSegments[0] !== 'All Subscribers') {
    suggestions.push({
      title: `Create campaign targeting ${commonSegments[0]}`,
      rationale: `This segment appears in ${commonSegments.length} of your top campaigns`,
      action: `Design personalized content for ${commonSegments[0]} highlighting exclusive benefits`,
      expectedImpact: 'Higher conversion rates with targeted messaging',
      priority: 'High',
    });
  }

  // Suggestion 3: Replicate winning timing
  if (commonDays.length > 0 && commonHours.length > 0) {
    suggestions.push({
      title: 'Schedule campaign at proven send time',
      rationale: `Your top campaigns were sent on ${commonDays[0]} around ${commonHours[0]}:00`,
      action: `Schedule next campaign for ${commonDays[0]} at ${commonHours[0]}:00`,
      expectedImpact: 'Improved engagement by leveraging proven timing',
      priority: 'Medium',
    });
  }

  // Suggestion 4: Replicate campaign type
  if (commonTypes.length > 0) {
    suggestions.push({
      title: `Create another ${commonTypes[0]} campaign`,
      rationale: `${commonTypes[0]} campaigns dominate your top performers`,
      action: `Develop a new ${commonTypes[0]} campaign with fresh creative`,
      expectedImpact: 'Consistent performance with proven campaign format',
      priority: 'Medium',
    });
  }

  // Suggestion 5: Test variations
  suggestions.push({
    title: 'A/B test variations of top performer',
    rationale: `${top3[0]?.name} was your highest revenue campaign`,
    action: 'Test different subject lines, discounts, or CTAs with same audience',
    expectedImpact: 'Optimize already-proven campaign formula',
    priority: 'Medium',
  });

  return suggestions;
}

/**
 * Explain WHY one campaign performs better than another
 */
function explainPerformanceDifferences(topCampaigns) {
  if (topCampaigns.length < 2) return [];

  const differences = [];
  const top = topCampaigns[0];
  const comparison = topCampaigns[1];

  // Revenue difference
  const revenueDiff = ((top.revenue - comparison.revenue) / comparison.revenue * 100).toFixed(0);
  differences.push(`Revenue: ${top.name} earned ${revenueDiff}% more than ${comparison.name}`);

  // Open rate difference
  if (top.openRate > comparison.openRate) {
    const openDiff = ((top.openRate - comparison.openRate) / comparison.openRate * 100).toFixed(0);
    const reasons = [];

    if (top.hasEmoji && !comparison.hasEmoji) reasons.push('uses emoji');
    if (top.isUrgent && !comparison.isUrgent) reasons.push('creates urgency');
    if (top.hasDiscount && !comparison.hasDiscount) reasons.push('offers discount');

    differences.push(
      `Open Rate: ${(top.openRate * 100).toFixed(1)}% vs ${(comparison.openRate * 100).toFixed(1)}% (+${openDiff}%)${reasons.length > 0 ? ` - likely because it ${reasons.join(' and ')}` : ''}`
    );
  }

  // Click rate difference
  if (top.clickRate > comparison.clickRate) {
    const clickDiff = ((top.clickRate - comparison.clickRate) / comparison.clickRate * 100).toFixed(0);
    differences.push(
      `Click Rate: ${(top.clickRate * 100).toFixed(2)}% vs ${(comparison.clickRate * 100).toFixed(2)}% (+${clickDiff}%)`
    );
  }

  // Conversion difference
  if (top.conversionRate > comparison.conversionRate) {
    const convDiff = ((top.conversionRate - comparison.conversionRate) / comparison.conversionRate * 100).toFixed(0);
    differences.push(
      `Conversion Rate: ${(top.conversionRate * 100).toFixed(2)}% vs ${(comparison.conversionRate * 100).toFixed(2)}% (+${convDiff}%)`
    );
  }

  // Segment difference
  if (top.segment !== comparison.segment) {
    differences.push(`Audience: "${top.segment}" outperforms "${comparison.segment}" - consider focusing on higher-value segments`);
  }

  // Timing difference
  if (top.sendDay && comparison.sendDay && top.sendDay !== comparison.sendDay) {
    differences.push(`Timing: ${top.sendDay} sends outperform ${comparison.sendDay} sends`);
  }

  return differences;
}

// ===================================================================
// CONTENT DETECTION HELPERS
// ===================================================================

function extractSubjectFromName(name) {
  // Campaign names often ARE the subject line
  return name;
}

function detectCampaignType(name, campaign) {
  const nameLower = (name || '').toLowerCase();
  const subject = (campaign.subject_line || name || '').toLowerCase();

  if (nameLower.includes('welcome') || subject.includes('welcome')) return 'welcome';
  if (nameLower.includes('abandoned') || nameLower.includes('cart')) return 'abandoned_cart';
  if (nameLower.includes('newsletter') || nameLower.includes('weekly') || nameLower.includes('monthly')) return 'newsletter';
  if (nameLower.includes('sale') || nameLower.includes('discount') || nameLower.includes('off')) return 'promotional';
  if (nameLower.includes('new arrival') || nameLower.includes('just in') || nameLower.includes('new collection')) return 'product_launch';
  if (nameLower.includes('vip') || nameLower.includes('exclusive') || nameLower.includes('early access')) return 'vip';
  if (nameLower.includes('back in stock') || nameLower.includes('restock')) return 'back_in_stock';
  if (nameLower.includes('review') || nameLower.includes('feedback')) return 'review_request';
  if (nameLower.includes('thank you') || nameLower.includes('thanks')) return 'thank_you';

  return 'other';
}

function detectDiscount(name, subjectLine) {
  const text = `${name} ${subjectLine}`.toLowerCase();
  return /\d+%\s*off|save\s+\d+%|discount|sale|\d+%/.test(text);
}

function extractDiscountAmount(name, subjectLine) {
  const text = `${name} ${subjectLine}`.toLowerCase();
  const match = text.match(/(\d+)%/);
  return match ? parseInt(match[1]) : null;
}

function detectUrgency(name, subjectLine) {
  const text = `${name} ${subjectLine}`.toLowerCase();
  const urgentWords = ['now', 'today', 'tonight', 'hurry', 'last chance', 'ending', 'expires', 'limited', 'final', 'don\'t miss', 'act fast', 'urgent', '24 hour', 'flash'];
  return urgentWords.some(word => text.includes(word));
}

function detectEmoji(text) {
  if (!text) return false;
  // Simple emoji detection - checks for common emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(text);
}

export default AIContext;