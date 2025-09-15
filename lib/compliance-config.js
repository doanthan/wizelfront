/**
 * Compliance Configuration for SOC2 & ISO 27001
 * Lightweight settings to minimize system overhead
 */

export const complianceConfig = {
  // Compliance level: 'none', 'basic', 'standard', 'full'
  level: process.env.COMPLIANCE_LEVEL || 'basic',
  
  // Audit logging configuration
  audit: {
    enabled: process.env.AUDIT_LOGGING !== 'false',
    
    // Only log these critical actions in 'basic' mode
    criticalActions: [
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_IMPERSONATION',
      'DATA_EXPORT',
      'STORE_DELETE',
      'PAYMENT_ATTEMPT',
      'PERMISSION_CHANGE',
      'API_KEY_CREATE',
      'API_KEY_REVOKE',
      'FAILED_LOGIN',
      'UNAUTHORIZED_ACCESS'
    ],
    
    // Log all actions in 'standard' or 'full' mode
    logAllActions: process.env.COMPLIANCE_LEVEL === 'full',
    
    // Retention period in days (2555 days = 7 years for SOC2)
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'),
    
    // Batch size for bulk operations
    batchSize: 100,
    
    // Async logging to avoid blocking
    async: true
  },
  
  // Security headers configuration
  security: {
    headers: {
      enabled: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      csp: {
        enabled: process.env.NODE_ENV === 'production',
        reportOnly: false
      }
    },
    
    // Rate limiting
    rateLimit: {
      enabled: process.env.RATE_LIMITING !== 'false',
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      api: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 30 // Limit API calls to 30 per minute
      }
    },
    
    // Session configuration
    session: {
      timeout: parseInt(process.env.SESSION_TIMEOUT || '3600'), // 1 hour default
      rolling: true, // Reset timeout on activity
      secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    }
  },
  
  // Data protection
  dataProtection: {
    // Encryption for sensitive fields
    encryption: {
      enabled: process.env.ENCRYPT_DATA !== 'false',
      algorithm: 'aes-256-gcm',
      fields: ['apiKey', 'refresh_token', 'oauth_token'] // Fields to encrypt
    },
    
    // PII handling
    pii: {
      mask: process.env.MASK_PII !== 'false',
      fields: ['email', 'phone', 'ssn', 'creditCard'],
      retentionDays: 365 // Auto-delete PII after 1 year
    },
    
    // Backup configuration
    backup: {
      enabled: process.env.BACKUP_ENABLED === 'true',
      frequency: 'daily',
      retention: 30 // Keep backups for 30 days
    }
  },
  
  // Monitoring and alerting
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    
    // Error tracking
    errors: {
      enabled: !!process.env.SENTRY_DSN,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    },
    
    // Performance monitoring
    performance: {
      enabled: process.env.PERFORMANCE_MONITORING === 'true',
      sampleRate: 0.1 // Sample 10% of transactions
    },
    
    // Security alerts
    alerts: {
      failedLogins: 5, // Alert after 5 failed login attempts
      criticalEvents: true, // Alert on critical security events
      channels: ['email', 'slack'] // Alert channels
    }
  },
  
  // Compliance reporting
  reporting: {
    enabled: true,
    schedule: 'monthly', // Generate reports monthly
    formats: ['json', 'csv', 'pdf'],
    recipients: process.env.COMPLIANCE_EMAILS?.split(',') || []
  },
  
  // SOC2 specific controls
  soc2: {
    // Trust Service Criteria
    security: true,     // CC - Common Criteria
    availability: true,  // A - Availability
    processing: true,    // PI - Processing Integrity
    confidentiality: true, // C - Confidentiality
    privacy: false      // P - Privacy (implement if handling EU data)
  },
  
  // ISO 27001 specific controls
  iso27001: {
    // Annex A controls
    accessControl: true,      // A.9
    cryptography: true,       // A.10
    physicalSecurity: false,  // A.11 (not applicable for SaaS)
    operationsSecurity: true, // A.12
    communications: true,     // A.13
    development: true,        // A.14
    supplier: true,          // A.15
    incident: true,          // A.16
    continuity: true         // A.17
  }
};

/**
 * Check if a specific action should be logged based on compliance level
 */
export function shouldAuditLog(action) {
  const { level, audit } = complianceConfig;
  
  if (!audit.enabled || level === 'none') {
    return false;
  }
  
  if (level === 'basic') {
    return audit.criticalActions.includes(action);
  }
  
  // Log everything for standard and full levels
  return true;
}

/**
 * Get risk level for a specific action
 */
export function getActionRiskLevel(action) {
  const riskLevels = {
    critical: [
      'USER_IMPERSONATION',
      'PERMISSION_CHANGE',
      'API_KEY_CREATE',
      'USER_DELETE',
      'STORE_DELETE'
    ],
    high: [
      'PAYMENT_ATTEMPT',
      'DATA_EXPORT',
      'API_KEY_REVOKE',
      'PASSWORD_CHANGE'
    ],
    medium: [
      'USER_UPDATE',
      'STORE_UPDATE',
      'USER_LOGIN',
      'USER_LOGOUT'
    ]
  };
  
  if (riskLevels.critical.includes(action)) return 'critical';
  if (riskLevels.high.includes(action)) return 'high';
  if (riskLevels.medium.includes(action)) return 'medium';
  return 'low';
}

/**
 * Get compliance status summary
 */
export function getComplianceStatus() {
  const status = {
    level: complianceConfig.level,
    soc2: {
      enabled: Object.values(complianceConfig.soc2).some(v => v),
      score: calculateSOC2Score()
    },
    iso27001: {
      enabled: Object.values(complianceConfig.iso27001).some(v => v),
      score: calculateISO27001Score()
    },
    overall: 0
  };
  
  status.overall = Math.round((status.soc2.score + status.iso27001.score) / 2);
  return status;
}

function calculateSOC2Score() {
  const controls = complianceConfig.soc2;
  const enabled = Object.values(controls).filter(Boolean).length;
  const total = Object.keys(controls).length;
  return Math.round((enabled / total) * 100);
}

function calculateISO27001Score() {
  const controls = complianceConfig.iso27001;
  const enabled = Object.values(controls).filter(Boolean).length;
  const total = Object.keys(controls).length;
  return Math.round((enabled / total) * 100);
}

export default complianceConfig;