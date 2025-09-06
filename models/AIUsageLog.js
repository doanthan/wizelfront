import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const AIUsageLogSchema = new mongoose.Schema({
  user_id: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  store_id: {
    type: ObjectId,
    ref: "Store",
    required: true,
  },
  contract_id: {
    type: ObjectId,
    ref: "Contract",
    required: true,
  },
  action: {
    type: String,
    enum: [
      // Email Generation
      'simple_email',
      'personalized_email', 
      'multi_variant_campaign',
      'campaign_series',
      
      // AI Recommendations
      'content_suggestions',
      'audience_segmentation',
      'performance_predictions',
      
      // Content Optimization
      'grammar_check',
      'image_suggestions',
      'ab_test_variations'
    ],
    required: true,
  },
  credits_consumed: {
    type: Number,
    required: true,
    min: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  }
}, {
  timestamps: false // We're using custom timestamp field
});

// Indexes for better query performance
AIUsageLogSchema.index({ user_id: 1, timestamp: -1 });
AIUsageLogSchema.index({ store_id: 1, timestamp: -1 });
AIUsageLogSchema.index({ contract_id: 1, timestamp: -1 });
AIUsageLogSchema.index({ action: 1, timestamp: -1 });

// Static method to get usage stats for a contract
AIUsageLogSchema.statics.getContractUsageStats = function (contractId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        contract_id: new ObjectId(contractId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        total_credits: { $sum: '$credits_consumed' },
        usage_count: { $sum: 1 },
        avg_credits_per_use: { $avg: '$credits_consumed' }
      }
    },
    {
      $sort: { total_credits: -1 }
    }
  ]);
};

// Static method to get daily usage for a contract
AIUsageLogSchema.statics.getDailyUsage = function (contractId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        contract_id: new ObjectId(contractId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        total_credits: { $sum: '$credits_consumed' },
        actions: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

// Credit costs according to STRIPE_PAYMENTS.md
AIUsageLogSchema.statics.getCreditCosts = function () {
  return {
    // Email Generation
    'simple_email': 1,
    'personalized_email': 2,
    'multi_variant_campaign': 3,
    'campaign_series': 10, // 5 emails
    
    // AI Recommendations  
    'content_suggestions': 1,
    'audience_segmentation': 2,
    'performance_predictions': 1,
    
    // Content Optimization
    'grammar_check': 0.5,
    'image_suggestions': 1,
    'ab_test_variations': 2,
  };
};

// Credit packages according to STRIPE_PAYMENTS.md
AIUsageLogSchema.statics.getCreditPackages = function () {
  return [
    { credits: 10, price: 1000, description: '$10 = 10 credits' }, // 10¢ per credit
    { credits: 25, price: 2500, description: '$25 = 25 credits' }, // 10¢ per credit  
    { credits: 50, price: 4150, description: '$50 = 50 credits' }, // 8.3¢ per credit
    { credits: 100, price: 7700, description: '$100 = 100 credits' }, // 7.7¢ per credit
    { credits: 250, price: 17750, description: '$250 = 250 credits' }, // 7.1¢ per credit
  ];
};

export default mongoose.models.AIUsageLog || mongoose.model("AIUsageLog", AIUsageLogSchema);