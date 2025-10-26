/**
 * Seed Benchmark Data
 *
 * Populates the benchmarks collection with industry-standard performance data
 * Run with: node scripts/seed-benchmarks.js
 */

import connectToDatabase from '../lib/mongoose.js';
import Benchmark from '../models/Benchmark.js';

const benchmarkData = [
  {
    vertical: 'health_beauty',
    year: 2025,
    version: '2025-Q1',
    campaigns: {
      openRate: {
        median: 39.5,
        top10: 54.0,
        top25: 45.0,
        bottom25: 32.0
      },
      clickRate: {
        median: 1.45,
        top10: 4.8,
        top25: 2.2,
        bottom25: 0.9
      },
      conversionRate: {
        median: 4.195,
        top10: 8.0,
        top25: 5.5,
        bottom25: 2.8
      },
      rpr: {
        median: 0.125,
        top10: 0.85,
        top25: 0.35,
        bottom25: 0.06,
        currency: 'USD'
      }
    },
    flows: {
      abandonedCart: {
        openRate: { median: 50.0, top10: 68.0, top25: 58.0, bottom25: 42.0 },
        clickRate: { median: 6.0, top10: 12.0, top25: 8.5, bottom25: 4.0 },
        conversionRate: { median: 3.5, top10: 6.0, top25: 4.5, bottom25: 2.0 },
        rpr: { median: 4.5, top10: 20.0, top25: 8.0, bottom25: 2.0, range: [3, 6], currency: 'USD' }
      },
      welcome: {
        openRate: { median: 51.5, top10: 68.0, top25: 60.0, bottom25: 43.0 },
        clickRate: { median: 4.5, top10: 10.0, top25: 6.5, bottom25: 3.0 },
        conversionRate: { median: 2.8, top10: 5.5, top25: 3.8, bottom25: 1.5 },
        rpr: { median: 2.65, top10: 8.5, top25: 4.5, bottom25: 1.2, currency: 'USD' }
      },
      browseAbandonment: {
        openRate: { median: 45.0, top10: 62.0, top25: 53.0, bottom25: 38.0 },
        clickRate: { median: 3.2, top10: 8.0, top25: 5.0, bottom25: 2.0 },
        conversionRate: { median: 1.8, top10: 4.0, top25: 2.5, bottom25: 1.0 },
        rpr: { median: 1.07, top10: 3.5, top25: 1.8, bottom25: 0.5, currency: 'USD' }
      },
      postPurchase: {
        openRate: { median: 48.0, top10: 65.0, top25: 56.0, bottom25: 40.0 },
        clickRate: { median: 3.8, top10: 8.5, top25: 5.5, bottom25: 2.5 },
        conversionRate: { median: 2.2, top10: 4.8, top25: 3.2, bottom25: 1.2 },
        rpr: { median: 1.2, top10: 4.0, top25: 2.0, bottom25: 0.6, currency: 'USD' }
      },
      winback: {
        openRate: { median: 35.0, top10: 52.0, top25: 42.0, bottom25: 28.0 },
        clickRate: { median: 2.8, top10: 6.5, top25: 4.0, bottom25: 1.8 },
        conversionRate: { median: 1.5, top10: 3.5, top25: 2.2, bottom25: 0.8 },
        rpr: { median: 0.84, top10: 2.5, top25: 1.4, bottom25: 0.4, currency: 'USD' }
      }
    },
    sms: {
      clickRate: { median: 4.0, top10: 12.0, top25: 7.0, bottom25: 2.5 },
      conversionRate: { median: 2.8, top10: 6.5, top25: 4.0, bottom25: 1.5 },
      rpr: { median: 0.12, top10: 0.84, top25: 0.35, bottom25: 0.05, currency: 'USD' }
    },
    insights: [
      'Strong SMS performance in health & beauty vertical',
      'Beauty/cosmetics saw 20.5% → 23.8% YoY open rate improvement',
      'Segmented campaigns perform 2x better than batch-and-blast',
      'Abandoned cart flows show highest ROI with proper timing'
    ],
    data_source: {
      provider: 'Klaviyo',
      sample_size: 2500,
      data_collection_period: {
        start: new Date('2024-10-01'),
        end: new Date('2024-12-31')
      }
    },
    is_active: true
  },

  {
    vertical: 'fashion_apparel',
    year: 2025,
    version: '2025-Q1',
    campaigns: {
      openRate: {
        median: 35.2,
        top10: 48.5,
        top25: 40.0,
        bottom25: 28.0
      },
      clickRate: {
        median: 1.8,
        top10: 5.2,
        top25: 2.8,
        bottom25: 1.0
      },
      conversionRate: {
        median: 3.8,
        top10: 7.5,
        top25: 5.0,
        bottom25: 2.2
      },
      rpr: {
        median: 0.18,
        top10: 1.2,
        top25: 0.45,
        bottom25: 0.08,
        currency: 'USD'
      }
    },
    flows: {
      abandonedCart: {
        openRate: { median: 48.0, top10: 65.0, top25: 55.0, bottom25: 40.0 },
        clickRate: { median: 7.5, top10: 14.0, top25: 10.0, bottom25: 5.0 },
        conversionRate: { median: 4.2, top10: 8.0, top25: 5.5, bottom25: 2.5 },
        rpr: { median: 5.2, top10: 25.0, top25: 10.0, bottom25: 2.5, currency: 'USD' }
      },
      welcome: {
        openRate: { median: 50.0, top10: 66.0, top25: 58.0, bottom25: 42.0 },
        clickRate: { median: 5.5, top10: 12.0, top25: 7.5, bottom25: 3.5 },
        conversionRate: { median: 3.2, top10: 6.5, top25: 4.5, bottom25: 1.8 },
        rpr: { median: 3.2, top10: 10.5, top25: 5.5, bottom25: 1.5, currency: 'USD' }
      },
      browseAbandonment: {
        openRate: { median: 42.0, top10: 58.0, top25: 50.0, bottom25: 35.0 },
        clickRate: { median: 4.0, top10: 9.0, top25: 6.0, bottom25: 2.5 },
        conversionRate: { median: 2.2, top10: 5.0, top25: 3.2, bottom25: 1.2 },
        rpr: { median: 1.4, top10: 4.5, top25: 2.2, bottom25: 0.7, currency: 'USD' }
      },
      postPurchase: {
        openRate: { median: 46.0, top10: 62.0, top25: 54.0, bottom25: 38.0 },
        clickRate: { median: 4.5, top10: 9.5, top25: 6.5, bottom25: 3.0 },
        conversionRate: { median: 2.8, top10: 5.8, top25: 3.8, bottom25: 1.5 },
        rpr: { median: 1.5, top10: 5.0, top25: 2.5, bottom25: 0.8, currency: 'USD' }
      },
      winback: {
        openRate: { median: 32.0, top10: 48.0, top25: 38.0, bottom25: 25.0 },
        clickRate: { median: 3.2, top10: 7.5, top25: 4.8, bottom25: 2.0 },
        conversionRate: { median: 1.8, top10: 4.2, top25: 2.8, bottom25: 1.0 },
        rpr: { median: 1.0, top10: 3.2, top25: 1.8, bottom25: 0.5, currency: 'USD' }
      }
    },
    sms: {
      clickRate: { median: 5.2, top10: 14.0, top25: 8.5, bottom25: 3.0 },
      conversionRate: { median: 3.5, top10: 7.8, top25: 5.0, bottom25: 2.0 },
      rpr: { median: 0.15, top10: 1.05, top25: 0.42, bottom25: 0.06, currency: 'USD' }
    },
    insights: [
      'Browse abandonment flows show strong performance in fashion',
      'Seasonal campaigns (sales, new collections) drive 3x higher engagement',
      'SMS works exceptionally well for flash sales and limited inventory alerts',
      'Influencer-style content drives higher click-through rates'
    ],
    data_source: {
      provider: 'Klaviyo',
      sample_size: 3200,
      data_collection_period: {
        start: new Date('2024-10-01'),
        end: new Date('2024-12-31')
      }
    },
    is_active: true
  },

  {
    vertical: 'general_retail',
    year: 2025,
    version: '2025-Q1',
    campaigns: {
      openRate: {
        median: 33.0,
        top10: 45.0,
        top25: 38.0,
        bottom25: 26.0
      },
      clickRate: {
        median: 1.5,
        top10: 4.2,
        top25: 2.2,
        bottom25: 0.9
      },
      conversionRate: {
        median: 3.5,
        top10: 6.8,
        top25: 4.5,
        bottom25: 2.0
      },
      rpr: {
        median: 0.15,
        top10: 0.95,
        top25: 0.38,
        bottom25: 0.07,
        currency: 'USD'
      }
    },
    flows: {
      abandonedCart: {
        openRate: { median: 46.0, top10: 62.0, top25: 53.0, bottom25: 38.0 },
        clickRate: { median: 6.5, top10: 12.5, top25: 9.0, bottom25: 4.5 },
        conversionRate: { median: 3.8, top10: 7.0, top25: 5.0, bottom25: 2.2 },
        rpr: { median: 4.8, top10: 22.0, top25: 9.0, bottom25: 2.2, currency: 'USD' }
      },
      welcome: {
        openRate: { median: 49.0, top10: 64.0, top25: 56.0, bottom25: 41.0 },
        clickRate: { median: 5.0, top10: 11.0, top25: 7.0, bottom25: 3.5 },
        conversionRate: { median: 3.0, top10: 6.0, top25: 4.2, bottom25: 1.8 },
        rpr: { median: 2.9, top10: 9.5, top25: 5.0, bottom25: 1.4, currency: 'USD' }
      },
      browseAbandonment: {
        openRate: { median: 43.0, top10: 59.0, top25: 51.0, bottom25: 36.0 },
        clickRate: { median: 3.8, top10: 8.5, top25: 5.5, bottom25: 2.5 },
        conversionRate: { median: 2.0, top10: 4.5, top25: 3.0, bottom25: 1.2 },
        rpr: { median: 1.2, top10: 4.0, top25: 2.0, bottom25: 0.6, currency: 'USD' }
      },
      postPurchase: {
        openRate: { median: 47.0, top10: 63.0, top25: 55.0, bottom25: 39.0 },
        clickRate: { median: 4.2, top10: 9.0, top25: 6.0, bottom25: 2.8 },
        conversionRate: { median: 2.5, top10: 5.2, top25: 3.5, bottom25: 1.5 },
        rpr: { median: 1.3, top10: 4.5, top25: 2.2, bottom25: 0.7, currency: 'USD' }
      },
      winback: {
        openRate: { median: 34.0, top10: 50.0, top25: 40.0, bottom25: 27.0 },
        clickRate: { median: 3.0, top10: 7.0, top25: 4.5, bottom25: 2.0 },
        conversionRate: { median: 1.6, top10: 3.8, top25: 2.5, bottom25: 0.9 },
        rpr: { median: 0.9, top10: 2.8, top25: 1.6, bottom25: 0.5, currency: 'USD' }
      }
    },
    sms: {
      clickRate: { median: 4.5, top10: 13.0, top25: 7.5, bottom25: 2.8 },
      conversionRate: { median: 3.2, top10: 7.2, top25: 4.5, bottom25: 1.8 },
      rpr: { median: 0.14, top10: 0.92, top25: 0.38, bottom25: 0.06, currency: 'USD' }
    },
    insights: [
      'General retail shows consistent performance across all channels',
      'Personalization drives 40% higher engagement rates',
      'Cross-sell campaigns in post-purchase flows drive incremental revenue',
      'Mobile optimization critical - 65% of opens on mobile devices'
    ],
    data_source: {
      provider: 'Klaviyo',
      sample_size: 5000,
      data_collection_period: {
        start: new Date('2024-10-01'),
        end: new Date('2024-12-31')
      }
    },
    is_active: true
  }
];

async function seedBenchmarks() {
  try {
    console.log('🌱 Connecting to database...');
    await connectToDatabase();

    console.log('🗑️  Clearing existing benchmarks...');
    await Benchmark.deleteMany({});

    console.log('📊 Inserting benchmark data...');
    const inserted = await Benchmark.insertMany(benchmarkData);

    console.log(`✅ Successfully seeded ${inserted.length} benchmarks:`);
    inserted.forEach(b => {
      console.log(`   - ${b.vertical} (${b.version})`);
    });

    console.log('\n📈 Sample benchmark query:');
    const healthBeauty = await Benchmark.getActiveBenchmark('health_beauty');
    console.log(`   Health & Beauty campaign open rate median: ${healthBeauty.campaigns.openRate.median}%`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding benchmarks:', error);
    process.exit(1);
  }
}

seedBenchmarks();
