import mongoose from 'mongoose';

const AICreditsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  storeId: {
    type: String,
    index: true
  },
  credits: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalCreditsEverPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCreditsEverUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseAt: {
    type: Date
  },
  lastUsedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'ai_credits'
});

// Compound indexes for better query performance
AICreditsSchema.index({ userId: 1, storeId: 1 }, { unique: true });
AICreditsSchema.index({ credits: 1 });

// Instance methods
AICreditsSchema.methods.addCredits = function(amount, source = 'purchase') {
  this.credits += amount;
  this.totalCreditsEverPurchased += amount;
  this.lastPurchaseAt = new Date();
  this.metadata.lastPurchaseSource = source;
  return this.save();
};

AICreditsSchema.methods.consumeCredits = function(amount, reason = 'usage') {
  if (this.credits < amount) {
    throw new Error('Insufficient credits');
  }

  this.credits -= amount;
  this.totalCreditsEverUsed += amount;
  this.lastUsedAt = new Date();
  this.metadata.lastUsedReason = reason;
  return this.save();
};

AICreditsSchema.methods.canConsume = function(amount) {
  return this.credits >= amount;
};

// Static methods
AICreditsSchema.statics.getUserCredits = function(userId, storeId = null) {
  const query = { userId };
  if (storeId) {
    query.storeId = storeId;
  }
  return this.findOne(query);
};

AICreditsSchema.statics.createUserCredits = function(userId, storeId = null, initialCredits = 0) {
  return this.create({
    userId,
    storeId,
    credits: initialCredits,
    totalCreditsEverPurchased: initialCredits,
    lastPurchaseAt: initialCredits > 0 ? new Date() : null
  });
};

AICreditsSchema.statics.getOrCreateUserCredits = async function(userId, storeId = null) {
  let credits = await this.getUserCredits(userId, storeId);

  if (!credits) {
    credits = await this.createUserCredits(userId, storeId, 0);
  }

  return credits;
};

AICreditsSchema.statics.addCreditsToUser = async function(userId, amount, storeId = null, source = 'purchase') {
  const credits = await this.getOrCreateUserCredits(userId, storeId);
  return credits.addCredits(amount, source);
};

AICreditsSchema.statics.consumeUserCredits = async function(userId, amount, storeId = null, reason = 'usage') {
  const credits = await this.getOrCreateUserCredits(userId, storeId);
  return credits.consumeCredits(amount, reason);
};

AICreditsSchema.statics.getUserCreditBalance = async function(userId, storeId = null) {
  const credits = await this.getUserCredits(userId, storeId);
  return credits ? credits.credits : 0;
};

export default mongoose.models.AICredits || mongoose.model('AICredits', AICreditsSchema);