import mongoose from "mongoose";

/**
 * Benchmark Model
 *
 * Industry benchmarks for email/SMS campaign and flow performance
 * Used by AI to provide contextual performance comparisons
 *
 * Supports ~60 verticals across e-commerce, services, B2B, education, nonprofit, etc.
 * Each vertical includes campaign, flow, and SMS benchmarks with detailed insights
 * Data sources: Klaviyo (167K+ customers), MailerLite (155K+ accounts), Gemini analysis
 */

// Sub-schema for metric ranges
const MetricRangeSchema = new mongoose.Schema({
  median: {
    type: Number,
    required: true,
    min: 0
  },
  top10: {
    type: Number,
    required: true,
    min: 0
  },
  top25: {
    type: Number,
    min: 0
  },
  bottom25: {
    type: Number,
    min: 0
  },
  range: {
    type: [Number],
    validate: {
      validator: function(arr) {
        return arr.length === 0 || arr.length === 2;
      },
      message: 'Range must be empty or contain exactly 2 values [min, max]'
    }
  }
}, { _id: false });

// Sub-schema for flow-specific benchmarks
const FlowBenchmarkSchema = new mongoose.Schema({
  openRate: MetricRangeSchema,
  clickRate: MetricRangeSchema,
  conversionRate: MetricRangeSchema,
  rpr: {
    ...MetricRangeSchema.obj,
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD']
    }
  }
}, { _id: false });

const BenchmarkSchema = new mongoose.Schema({
  // Vertical identifier (matches stores.vertical field)
  // No enum restriction to support ~60 verticals flexibly
  vertical: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },

  // Human-readable display name
  display_name: {
    type: String,
    required: true,
    trim: true
  },

  // Category grouping for UI/filtering
  category: {
    type: String,
    trim: true,
    lowercase: true,
    enum: [
      'ecommerce',
      'services',
      'b2b',
      'education',
      'nonprofit',
      'hospitality',
      'finance',
      'government',
      'health_wellness',
      'real_estate',
      'other'
    ],
    default: 'other'
  },

  // Version control
  year: {
    type: Number,
    required: true,
    min: 2024,
    max: 2030,
    index: true
  },
  version: {
    type: String,
    required: true,
    trim: true,
    // Format: YYYY-QX (e.g., "2025-Q1", "2025-Q2")
    match: /^\d{4}-Q[1-4]$/
  },

  // Campaign benchmarks
  campaigns: {
    openRate: {
      type: MetricRangeSchema,
      required: false  // Made optional for flexibility
    },
    clickRate: {
      type: MetricRangeSchema,
      required: false  // Made optional for flexibility
    },
    // CTOR = Click-to-Open Rate (clicks / opens)
    ctor: {
      type: MetricRangeSchema,
      required: false
    },
    conversionRate: {
      type: MetricRangeSchema,
      required: false
    },
    unsubscribeRate: {
      median: Number,
      top10: Number,
      top25: Number,
      bottom25: Number,
      range: {
        type: [Number],
        validate: {
          validator: function(arr) {
            return arr.length === 0 || arr.length === 2;
          },
          message: 'Range must be empty or contain exactly 2 values [min, max]'
        }
      }
    },
    rpr: {
      median: {
        type: Number,
        required: false,
        min: 0
      },
      top10: {
        type: Number,
        required: false,
        min: 0
      },
      top25: Number,
      bottom25: Number,
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD']
      }
    }
  },

  // Segmented campaigns (for high-performing segmented lists)
  segmentedCampaigns: {
    openRate: {
      median: Number,
      top10: Number
    },
    clickRate: {
      median: Number,
      top10: Number
    },
    rpr: {
      median: Number,
      top10: Number,
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD']
      }
    },
    note: String
  },

  // Flow benchmarks (by flow type)
  flows: {
    abandonedCart: FlowBenchmarkSchema,
    welcome: FlowBenchmarkSchema,
    browseAbandonment: FlowBenchmarkSchema,
    postPurchase: FlowBenchmarkSchema,
    winback: FlowBenchmarkSchema,
    backInStock: FlowBenchmarkSchema,
    priceDropAlert: FlowBenchmarkSchema,
    birthdaySeries: FlowBenchmarkSchema
  },

  // SMS benchmarks
  sms: {
    clickRate: {
      median: Number,
      top10: Number,
      top25: Number,
      bottom25: Number
    },
    conversionRate: {
      median: Number,
      top10: Number,
      top25: Number,
      bottom25: Number
    },
    rpr: {
      median: Number,
      top10: Number,
      top25: Number,
      bottom25: Number,
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD']
      }
    },
    performance: String,  // Optional performance notes
    note: String          // Optional notes
  },

  // Contextual insights for AI
  insights: [{
    type: String,
    trim: true
  }],

  // Data source metadata
  data_source: {
    type: String,  // e.g., "Klaviyo 2025 Benchmark Report, MailerLite 2025 Benchmarks"
    trim: true
  },

  // Sample size (can be string like "167,000+ customers" or number)
  sample_size: {
    type: mongoose.Schema.Types.Mixed,  // Allow string or number
    default: null
  },

  // Active/deprecated flag
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound index for efficient querying
BenchmarkSchema.index({ vertical: 1, year: -1, is_active: 1 });
BenchmarkSchema.index({ version: 1, is_active: 1 });

// Ensure only one active benchmark per vertical per year
BenchmarkSchema.index(
  { vertical: 1, year: 1, is_active: 1 },
  {
    unique: true,
    partialFilterExpression: { is_active: true }
  }
);

/**
 * Static method: Get active benchmark for a vertical
 */
BenchmarkSchema.statics.getActiveBenchmark = async function(vertical, year = null) {
  const query = {
    vertical: vertical.toLowerCase(),
    is_active: true
  };

  if (year) {
    query.year = year;
  }

  return await this.findOne(query).sort({ year: -1, updated_at: -1 }).lean();
};

/**
 * Static method: Get latest benchmarks for all verticals
 */
BenchmarkSchema.statics.getAllActiveBenchmarks = async function(year = null) {
  const query = { is_active: true };

  if (year) {
    query.year = year;
  }

  return await this.find(query).sort({ vertical: 1, year: -1 }).lean();
};

/**
 * Static method: Compare store performance to benchmark
 */
BenchmarkSchema.statics.comparePerformance = function(storeMetrics, benchmark) {
  if (!benchmark) {
    return { error: 'No benchmark data available' };
  }

  const comparison = {
    vertical: benchmark.vertical,
    version: benchmark.version,
    campaigns: {},
    flows: {},
    sms: {}
  };

  // Compare campaign metrics
  if (storeMetrics.campaigns && benchmark.campaigns) {
    comparison.campaigns = {
      openRate: compareMetric(storeMetrics.campaigns.openRate, benchmark.campaigns.openRate),
      clickRate: compareMetric(storeMetrics.campaigns.clickRate, benchmark.campaigns.clickRate),
      conversionRate: compareMetric(storeMetrics.campaigns.conversionRate, benchmark.campaigns.conversionRate),
      rpr: compareMetric(storeMetrics.campaigns.rpr, benchmark.campaigns.rpr)
    };
  }

  // Compare flow metrics (if available)
  if (storeMetrics.flows && benchmark.flows) {
    Object.keys(storeMetrics.flows).forEach(flowType => {
      if (benchmark.flows[flowType]) {
        comparison.flows[flowType] = {
          openRate: compareMetric(storeMetrics.flows[flowType].openRate, benchmark.flows[flowType].openRate),
          clickRate: compareMetric(storeMetrics.flows[flowType].clickRate, benchmark.flows[flowType].clickRate),
          conversionRate: compareMetric(storeMetrics.flows[flowType].conversionRate, benchmark.flows[flowType].conversionRate),
          rpr: compareMetric(storeMetrics.flows[flowType].rpr, benchmark.flows[flowType].rpr)
        };
      }
    });
  }

  // Compare SMS metrics
  if (storeMetrics.sms && benchmark.sms) {
    comparison.sms = {
      clickRate: compareMetric(storeMetrics.sms.clickRate, benchmark.sms.clickRate),
      rpr: compareMetric(storeMetrics.sms.rpr, benchmark.sms.rpr)
    };
  }

  return comparison;
};

/**
 * Helper: Compare individual metric to benchmark
 */
function compareMetric(actualValue, benchmarkRange) {
  if (actualValue === null || actualValue === undefined || !benchmarkRange) {
    return null;
  }

  const value = parseFloat(actualValue);

  let percentile;
  if (value >= benchmarkRange.top10) {
    percentile = 'top10';
  } else if (benchmarkRange.top25 && value >= benchmarkRange.top25) {
    percentile = 'top25';
  } else if (value >= benchmarkRange.median) {
    percentile = 'above_median';
  } else if (benchmarkRange.bottom25 && value >= benchmarkRange.bottom25) {
    percentile = 'below_median';
  } else {
    percentile = 'bottom25';
  }

  return {
    actual: value,
    median: benchmarkRange.median,
    top10: benchmarkRange.top10,
    percentile,
    vs_median_pct: ((value - benchmarkRange.median) / benchmarkRange.median * 100).toFixed(1),
    vs_top10_pct: ((value - benchmarkRange.top10) / benchmarkRange.top10 * 100).toFixed(1)
  };
}

/**
 * Instance method: Deprecate this benchmark (set is_active = false)
 */
BenchmarkSchema.methods.deprecate = async function() {
  this.is_active = false;
  this.updated_at = new Date();
  return await this.save();
};

const Benchmark = mongoose.models.Benchmark || mongoose.model("Benchmark", BenchmarkSchema);

export default Benchmark;
