import mongoose from 'mongoose';

const StoreStatSyncSchema = new mongoose.Schema({
  storeId: {
    type: String,
    required: true,
    index: true
  },
  klaviyoId: {
    type: String,
    required: true,
    index: true
  },
  syncType: {
    type: String,
    required: true,
    enum: ['campaigns', 'flows', 'segments', 'metrics', 'orders', 'full'],
    default: 'full'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'running', 'completed', 'failed', 'paused'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  lastSyncAt: {
    type: Date
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  processedRecords: {
    type: Number,
    default: 0
  },
  errorCount: {
    type: Number,
    default: 0
  },
  errors: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  syncedDateRange: {
    start: Date,
    end: Date
  }
}, {
  timestamps: true,
  collection: 'store_stat_syncs'
});

// Compound indexes for better query performance
StoreStatSyncSchema.index({ storeId: 1, syncType: 1 });
StoreStatSyncSchema.index({ klaviyoId: 1, syncType: 1 });
StoreStatSyncSchema.index({ status: 1, startedAt: -1 });

// Instance methods
StoreStatSyncSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress = 100;
  return this.save();
};

StoreStatSyncSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.completedAt = new Date();
  if (error) {
    this.errors.push({
      message: error.message || error,
      timestamp: new Date(),
      data: error
    });
    this.errorCount++;
  }
  return this.save();
};

StoreStatSyncSchema.methods.updateProgress = function(processed, total) {
  this.processedRecords = processed;
  this.totalRecords = total;
  this.progress = total > 0 ? Math.round((processed / total) * 100) : 0;
  return this.save();
};

// Static methods
StoreStatSyncSchema.statics.findActiveSync = function(storeId, syncType) {
  return this.findOne({
    storeId,
    syncType,
    status: { $in: ['pending', 'running'] }
  });
};

StoreStatSyncSchema.statics.getLatestSync = function(storeId, syncType) {
  return this.findOne({
    storeId,
    syncType
  }).sort({ startedAt: -1 });
};

StoreStatSyncSchema.statics.createSync = function(storeId, klaviyoId, syncType = 'full', metadata = {}) {
  return this.create({
    storeId,
    klaviyoId,
    syncType,
    status: 'pending',
    metadata
  });
};

export default mongoose.models.StoreStatSync || mongoose.model('StoreStatSync', StoreStatSyncSchema);