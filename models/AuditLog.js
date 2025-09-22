/**
 * Audit Log Model for SOC2 & ISO 27001 Compliance
 * Tracks all critical system actions for security compliance
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Event Information
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'USER_LOGIN',
      'USER_LOGOUT',
      'AUTH_CALLBACK',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET',
      
      // Access events
      'STORE_ACCESS',
      'KLAVIYO_ACCESS',
      'SUPERUSER_ACCESS',
      'DATA_EXPORT',
      
      // Modification events
      'STORE_CREATE',
      'STORE_UPDATE',
      'STORE_DELETE',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      
      // Sensitive operations
      'USER_IMPERSONATION',
      'PAYMENT_ATTEMPT',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILURE',
      'PERMISSION_CHANGE',
      'API_KEY_ACCESS',
      'API_KEY_CREATE',
      'API_KEY_REVOKE',
      
      // Security events
      'FAILED_LOGIN',
      'SUSPICIOUS_ACTIVITY',
      'RATE_LIMIT_EXCEEDED',
      'UNAUTHORIZED_ACCESS'
    ],
    index: true
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  userEmail: {
    type: String,
    index: true
  },
  
  // Target Information (for operations on other users/resources)
  targetId: {
    type: String,
    sparse: true
  },
  
  targetType: {
    type: String,
    enum: ['user', 'store', 'campaign', 'payment', 'api_key', null]
  },
  
  // Request Information
  ip: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: String,
  
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  
  path: String,
  
  query: {
    type: Map,
    of: String
  },
  
  // Response Information
  statusCode: Number,
  
  success: {
    type: Boolean,
    default: true
  },
  
  errorMessage: String,
  
  // Additional Context
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Compliance Flags
  containsPII: {
    type: Boolean,
    default: false
  },
  
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Data retention
  expiresAt: {
    type: Date,
    default: function() {
      // Keep audit logs for 7 years (SOC2 requirement)
      const date = new Date();
      date.setFullYear(date.getFullYear() + 7);
      return date;
    }
  }
});

// Indexes for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ip: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });

// TTL index for automatic deletion after retention period
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods for common queries
auditLogSchema.statics.logAction = async function(data) {
  try {
    // Determine risk level based on action
    let riskLevel = 'low';
    if (['USER_IMPERSONATION', 'PERMISSION_CHANGE', 'API_KEY_CREATE', 'USER_DELETE'].includes(data.action)) {
      riskLevel = 'critical';
    } else if (['PAYMENT_ATTEMPT', 'DATA_EXPORT', 'STORE_DELETE'].includes(data.action)) {
      riskLevel = 'high';
    } else if (['USER_UPDATE', 'STORE_UPDATE', 'PASSWORD_CHANGE'].includes(data.action)) {
      riskLevel = 'medium';
    }
    
    const log = new this({
      ...data,
      riskLevel,
      timestamp: new Date()
    });
    
    return await log.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the application
    return null;
  }
};

auditLogSchema.statics.getRecentActions = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

auditLogSchema.statics.getSecurityEvents = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    timestamp: { $gte: since },
    riskLevel: { $in: ['high', 'critical'] }
  })
    .sort({ timestamp: -1 })
    .lean();
};

auditLogSchema.statics.getComplianceReport = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          success: '$success',
          riskLevel: '$riskLevel'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        total: { $sum: '$count' },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
          }
        },
        byRiskLevel: {
          $push: {
            riskLevel: '$_id.riskLevel',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { total: -1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp?.toISOString();
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;