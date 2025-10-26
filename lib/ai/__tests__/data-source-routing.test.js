/**
 * Test suite for intelligent data source routing
 *
 * Run with: npm test lib/ai/__tests__/data-source-routing.test.js
 */

import { analyzeSummaryDataSufficiency, requiresRealtimeMCP } from '../data-source-router';

describe('Data Source Routing', () => {
  describe('analyzeSummaryDataSufficiency', () => {
    test('should detect sufficient summary data for top 10 query', () => {
      const query = "What are my top 10 campaigns by revenue?";
      const summaryData = {
        campaigns: {
          total: 150,
          topPerformers: Array(10).fill({}),
          summaryStats: { totalRevenue: 100000 }
        }
      };

      const result = analyzeSummaryDataSufficiency(query, summaryData);

      expect(result.sufficient).toBe(true);
      expect(result.recommendation).toBe('summary');
    });

    test('should detect insufficient data for top 50 query', () => {
      const query = "Show me top 50 campaigns by revenue";
      const summaryData = {
        campaigns: {
          total: 150,
          topPerformers: Array(10).fill({}),
          summaryStats: { totalRevenue: 100000 }
        }
      };

      const result = analyzeSummaryDataSufficiency(query, summaryData);

      expect(result.sufficient).toBe(false);
      expect(result.reasons).toContain('largeListRequest');
      expect(result.recommendation).toBe('clickhouse');
    });

    test('should detect need for filtering', () => {
      const query = "Show campaigns with open rate above 25%";
      const summaryData = {
        campaigns: {
          total: 150,
          topPerformers: Array(10).fill({}),
        }
      };

      const result = analyzeSummaryDataSufficiency(query, summaryData);

      expect(result.sufficient).toBe(false);
      expect(result.reasons).toContain('specificFilters');
      expect(result.recommendation).toBe('clickhouse');
    });

    test('should detect product-level queries', () => {
      const query = "Which products have the highest conversion rate?";
      const summaryData = {
        campaigns: {
          total: 150,
          topPerformers: Array(10).fill({}),
        }
      };

      const result = analyzeSummaryDataSufficiency(query, summaryData);

      expect(result.sufficient).toBe(false);
      expect(result.reasons).toContain('productLevel');
      expect(result.recommendation).toBe('clickhouse');
    });
  });

  describe('requiresRealtimeMCP', () => {
    test('should detect segment profile count query', () => {
      const query = "How many profiles are in my VIP segment?";
      const result = requiresRealtimeMCP(query);

      expect(result.required).toBe(true);
      expect(result.indicators).toContain('profileCounts');
      expect(result.confidence).toBe('high');
    });

    test('should detect flow status query', () => {
      const query = "Which flows are currently active?";
      const result = requiresRealtimeMCP(query);

      expect(result.required).toBe(true);
      expect(result.indicators).toContain('statusCheck');
    });

    test('should detect list resources query', () => {
      const query = "List all my segments";
      const result = requiresRealtimeMCP(query);

      expect(result.required).toBe(true);
      expect(result.indicators).toContain('listResources');
    });

    test('should not require MCP for historical query', () => {
      const query = "What was my revenue last month?";
      const result = requiresRealtimeMCP(query);

      expect(result.required).toBe(false);
    });
  });
});

// Manual test scenarios
export const TEST_SCENARIOS = [
  {
    name: 'Summary - Top 10',
    query: "What are my top 10 campaigns by revenue?",
    expectedSource: 'summary',
    expectedConfidence: 'high',
    summaryData: {
      campaigns: { total: 150, topPerformers: Array(10).fill({}) }
    }
  },
  {
    name: 'ClickHouse - Top 50',
    query: "Show me top 50 campaigns by revenue last month",
    expectedSource: 'clickhouse',
    expectedConfidence: 'high',
    summaryData: {
      campaigns: { total: 150, topPerformers: Array(10).fill({}) }
    }
  },
  {
    name: 'ClickHouse - Filtering',
    query: "Which campaigns had less than 10% open rate?",
    expectedSource: 'clickhouse',
    expectedConfidence: 'high',
    summaryData: {
      campaigns: { total: 150, topPerformers: Array(10).fill({}) }
    }
  },
  {
    name: 'MCP - Profile Count',
    query: "How many profiles are in my VIP segment right now?",
    expectedSource: 'mcp',
    expectedConfidence: 'high',
    summaryData: {}
  },
  {
    name: 'MCP - Active Flows',
    query: "Show me all active flows",
    expectedSource: 'mcp',
    expectedConfidence: 'high',
    summaryData: {}
  },
  {
    name: 'Summary - Current View',
    query: "What's my average open rate?",
    expectedSource: 'summary',
    expectedConfidence: 'high',
    summaryData: {
      campaigns: {
        summaryStats: { avgOpenRate: 23.5 }
      }
    }
  },
];

/**
 * Run manual tests (for development)
 * Usage: node lib/ai/__tests__/data-source-routing.test.js
 */
export async function runManualTests() {
  const { routeDataSource } = await import('../data-source-router');

  console.log('🧪 Running Manual Routing Tests\n');

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n📝 Test: ${scenario.name}`);
    console.log(`Query: "${scenario.query}"`);

    const routing = await routeDataSource(
      scenario.query,
      scenario.summaryData,
      {}
    );

    const passed = routing.source === scenario.expectedSource;
    const emoji = passed ? '✅' : '❌';

    console.log(`${emoji} Result: ${routing.source} (expected: ${scenario.expectedSource})`);
    console.log(`   Confidence: ${routing.confidence}`);
    console.log(`   Reason: ${routing.reason}`);
    console.log(`   Method: ${routing.method}`);
  }
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  runManualTests().catch(console.error);
}
