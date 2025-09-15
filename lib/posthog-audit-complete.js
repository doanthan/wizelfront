import { PostHog } from 'posthog-node';
import { logAuditEvent as baseLogAuditEvent } from './posthog-audit';

// Comprehensive audit event categories for ISO 27001 & SOC2
const AUDIT_EVENTS = {
  // Authentication & Authorization (ISO 27001 A.9, SOC2 CC6.1)
  AUTH: {
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
    LOGOUT: 'auth.logout',
    PASSWORD_RESET_REQUEST: 'auth.password.reset_request',
    PASSWORD_RESET_COMPLETE: 'auth.password.reset_complete',
    PASSWORD_CHANGE: 'auth.password.change',
    SESSION_EXPIRED: 'auth.session.expired',
    MFA_ENABLED: 'auth.mfa.enabled',
    MFA_DISABLED: 'auth.mfa.disabled',
    TOKEN_REFRESH: 'auth.token.refresh',
    IMPERSONATION_START: 'auth.impersonation.start',
    IMPERSONATION_END: 'auth.impersonation.end',
  },

  // Store Management (ISO 27001 A.9.2, SOC2 CC7.1)
  STORE: {
    CREATE: 'store.create',
    UPDATE: 'store.update',
    DELETE: 'store.delete',
    ARCHIVE: 'store.archive',
    RESTORE: 'store.restore',
    SETTINGS_CHANGE: 'store.settings.change',
    TRANSFER_OWNERSHIP: 'store.transfer.ownership',
    SUBSCRIPTION_CHANGE: 'store.subscription.change',
    TRIAL_START: 'store.trial.start',
    TRIAL_END: 'store.trial.end',
  },

  // Integrations (ISO 27001 A.13, SOC2 CC7.2)
  INTEGRATION: {
    KLAVIYO_CONNECT: 'integration.klaviyo.connect',
    KLAVIYO_DISCONNECT: 'integration.klaviyo.disconnect',
    KLAVIYO_SYNC_START: 'integration.klaviyo.sync.start',
    KLAVIYO_SYNC_COMPLETE: 'integration.klaviyo.sync.complete',
    KLAVIYO_SYNC_FAILED: 'integration.klaviyo.sync.failed',
    KLAVIYO_OAUTH_AUTHORIZE: 'integration.klaviyo.oauth.authorize',
    KLAVIYO_OAUTH_REVOKE: 'integration.klaviyo.oauth.revoke',
    API_KEY_CREATE: 'integration.api_key.create',
    API_KEY_REVOKE: 'integration.api_key.revoke',
    WEBHOOK_CREATE: 'integration.webhook.create',
    WEBHOOK_DELETE: 'integration.webhook.delete',
    WEBHOOK_FAILED: 'integration.webhook.failed',
  },

  // Data Operations (ISO 27001 A.12, SOC2 CC8.1)
  DATA: {
    EXPORT_REQUEST: 'data.export.request',
    EXPORT_COMPLETE: 'data.export.complete',
    IMPORT_START: 'data.import.start',
    IMPORT_COMPLETE: 'data.import.complete',
    BULK_UPDATE: 'data.bulk.update',
    BULK_DELETE: 'data.bulk.delete',
    BACKUP_CREATE: 'data.backup.create',
    BACKUP_RESTORE: 'data.backup.restore',
    SCRAPE_START: 'data.scrape.start',
    SCRAPE_COMPLETE: 'data.scrape.complete',
    SCRAPE_FAILED: 'data.scrape.failed',
  },

  // User & Permission Management (ISO 27001 A.9.2, SOC2 CC6.3)
  USER: {
    CREATE: 'user.create',
    UPDATE: 'user.update',
    DELETE: 'user.delete',
    SUSPEND: 'user.suspend',
    REACTIVATE: 'user.reactivate',
    ROLE_ASSIGN: 'user.role.assign',
    ROLE_REVOKE: 'user.role.revoke',
    PERMISSION_GRANT: 'user.permission.grant',
    PERMISSION_REVOKE: 'user.permission.revoke',
    CONTRACT_SEAT_ADD: 'user.contract_seat.add',
    CONTRACT_SEAT_REMOVE: 'user.contract_seat.remove',
    STORE_ACCESS_GRANT: 'user.store_access.grant',
    STORE_ACCESS_REVOKE: 'user.store_access.revoke',
  },

  // Financial Operations (ISO 27001 A.10, SOC2 A1.1)
  PAYMENT: {
    ATTEMPT: 'payment.attempt',
    SUCCESS: 'payment.success',
    FAILED: 'payment.failed',
    REFUND_REQUEST: 'payment.refund.request',
    REFUND_COMPLETE: 'payment.refund.complete',
    SUBSCRIPTION_CREATE: 'payment.subscription.create',
    SUBSCRIPTION_UPDATE: 'payment.subscription.update',
    SUBSCRIPTION_CANCEL: 'payment.subscription.cancel',
    CREDITS_PURCHASE: 'payment.credits.purchase',
    CREDITS_USE: 'payment.credits.use',
    INVOICE_GENERATE: 'payment.invoice.generate',
    INVOICE_SEND: 'payment.invoice.send',
  },

  // AI & Analytics (ISO 27001 A.12.1, SOC2 CC7.1)
  AI: {
    CHAT_START: 'ai.chat.start',
    CHAT_MESSAGE: 'ai.chat.message',
    CREDITS_CONSUME: 'ai.credits.consume',
    ANALYSIS_REQUEST: 'ai.analysis.request',
    ANALYSIS_COMPLETE: 'ai.analysis.complete',
    REPORT_GENERATE: 'ai.report.generate',
    REPORT_EXPORT: 'ai.report.export',
  },

  // Campaign & Marketing (ISO 27001 A.13.1, SOC2 CC7.2)
  CAMPAIGN: {
    CREATE: 'campaign.create',
    UPDATE: 'campaign.update',
    DELETE: 'campaign.delete',
    SEND: 'campaign.send',
    SCHEDULE: 'campaign.schedule',
    CANCEL: 'campaign.cancel',
    ARCHIVE: 'campaign.archive',
    TEMPLATE_CREATE: 'campaign.template.create',
    TEMPLATE_UPDATE: 'campaign.template.update',
    TEMPLATE_DELETE: 'campaign.template.delete',
  },

  // Web Feeds (ISO 27001 A.13.1, SOC2 CC7.2)
  WEBFEED: {
    CREATE: 'webfeed.create',
    UPDATE: 'webfeed.update',
    DELETE: 'webfeed.delete',
    SYNC_START: 'webfeed.sync.start',
    SYNC_COMPLETE: 'webfeed.sync.complete',
    SYNC_FAILED: 'webfeed.sync.failed',
    CACHE_UPDATE: 'webfeed.cache.update',
    PUBLISH: 'webfeed.publish',
    UNPUBLISH: 'webfeed.unpublish',
  },

  // Security Events (ISO 27001 A.16, SOC2 CC7.1)
  SECURITY: {
    UNAUTHORIZED_ACCESS: 'security.unauthorized.access',
    SUSPICIOUS_ACTIVITY: 'security.suspicious.activity',
    RATE_LIMIT_EXCEEDED: 'security.rate_limit.exceeded',
    BLOCKED_IP: 'security.blocked.ip',
    CSRF_ATTEMPT: 'security.csrf.attempt',
    XSS_ATTEMPT: 'security.xss.attempt',
    SQL_INJECTION_ATTEMPT: 'security.sql_injection.attempt',
    BRUTE_FORCE_DETECTED: 'security.brute_force.detected',
    MALWARE_DETECTED: 'security.malware.detected',
    DATA_BREACH_SUSPECTED: 'security.data_breach.suspected',
  },

  // Superuser Operations (ISO 27001 A.9.4, SOC2 CC6.1)
  SUPERUSER: {
    ACCESS: 'superuser.access',
    USER_VIEW: 'superuser.user.view',
    USER_MODIFY: 'superuser.user.modify',
    SYSTEM_CONFIG_CHANGE: 'superuser.system.config.change',
    DATABASE_ACCESS: 'superuser.database.access',
    LOGS_ACCESS: 'superuser.logs.access',
    COMPLIANCE_REPORT: 'superuser.compliance.report',
    AUDIT_EXPORT: 'superuser.audit.export',
    EMERGENCY_ACCESS: 'superuser.emergency.access',
  },

  // Contract Management (ISO 27001 A.15, SOC2 CC9.2)
  CONTRACT: {
    CREATE: 'contract.create',
    UPDATE: 'contract.update',
    DELETE: 'contract.delete',
    OWNER_CHANGE: 'contract.owner.change',
    BILLING_UPDATE: 'contract.billing.update',
    SEAT_ADD: 'contract.seat.add',
    SEAT_REMOVE: 'contract.seat.remove',
    LIMIT_CHANGE: 'contract.limit.change',
    RENEWAL: 'contract.renewal',
    TERMINATION: 'contract.termination',
  },

  // Compliance & Audit (ISO 27001 A.18, SOC2 CC3.1)
  COMPLIANCE: {
    AUDIT_LOG_ACCESS: 'compliance.audit_log.access',
    AUDIT_LOG_EXPORT: 'compliance.audit_log.export',
    AUDIT_LOG_DELETE: 'compliance.audit_log.delete',
    COMPLIANCE_CHECK: 'compliance.check',
    POLICY_ACCEPT: 'compliance.policy.accept',
    CONSENT_GRANT: 'compliance.consent.grant',
    CONSENT_REVOKE: 'compliance.consent.revoke',
    GDPR_REQUEST: 'compliance.gdpr.request',
    GDPR_DELETE: 'compliance.gdpr.delete',
    INCIDENT_REPORT: 'compliance.incident.report',
  },
};

// Enhanced audit logging with ISO 27001 & SOC2 metadata
export async function logComplianceEvent(eventType, eventData = {}) {
  const {
    userId,
    userEmail,
    storeId,
    storeName,
    ip,
    userAgent,
    sessionId,
    metadata = {},
    success = true,
    errorMessage = null,
    request = null,
  } = eventData;

  // Determine severity based on event type
  const severity = determineSeverity(eventType);
  
  // Determine compliance categories
  const complianceCategories = determineComplianceCategories(eventType);

  // Build comprehensive audit entry
  const auditEntry = {
    // Core event data
    action: eventType,
    userId: userId || 'anonymous',
    userEmail: userEmail || 'unknown',
    distinctId: userId || sessionId || 'anonymous',
    
    // Context data
    storeId,
    storeName,
    ip: ip || extractIpFromRequest(request),
    userAgent: userAgent || extractUserAgentFromRequest(request),
    sessionId,
    
    // Event metadata
    severity,
    success,
    errorMessage,
    
    // Compliance metadata
    compliance: {
      iso27001: complianceCategories.iso27001,
      soc2: complianceCategories.soc2,
      gdpr: complianceCategories.gdpr,
      required: complianceCategories.required,
    },
    
    // Timestamp with timezone
    timestamp: new Date().toISOString(),
    timestamp_unix: Date.now(),
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    compliance_level: process.env.COMPLIANCE_LEVEL || 'basic',
    
    // Additional metadata
    metadata: {
      ...metadata,
      event_version: '2.0',
      audit_standard: 'ISO27001_SOC2',
    },
  };

  // Log to PostHog
  try {
    await baseLogAuditEvent(auditEntry);
  } catch (error) {
    console.error('Failed to log compliance event:', error);
    // Consider fallback logging to file or database
    await fallbackLogging(auditEntry);
  }

  return auditEntry;
}

// Determine event severity
function determineSeverity(eventType) {
  const criticalEvents = [
    AUDIT_EVENTS.SECURITY.DATA_BREACH_SUSPECTED,
    AUDIT_EVENTS.SECURITY.MALWARE_DETECTED,
    AUDIT_EVENTS.PAYMENT.FAILED,
    AUDIT_EVENTS.USER.DELETE,
    AUDIT_EVENTS.STORE.DELETE,
    AUDIT_EVENTS.SUPERUSER.EMERGENCY_ACCESS,
  ];

  const highEvents = [
    ...Object.values(AUDIT_EVENTS.SECURITY),
    ...Object.values(AUDIT_EVENTS.SUPERUSER),
    AUDIT_EVENTS.AUTH.IMPERSONATION_START,
    AUDIT_EVENTS.DATA.EXPORT_REQUEST,
    AUDIT_EVENTS.CONTRACT.OWNER_CHANGE,
  ];

  const mediumEvents = [
    ...Object.values(AUDIT_EVENTS.USER),
    ...Object.values(AUDIT_EVENTS.INTEGRATION),
    ...Object.values(AUDIT_EVENTS.PAYMENT),
  ];

  if (criticalEvents.includes(eventType)) return 'critical';
  if (highEvents.includes(eventType)) return 'high';
  if (mediumEvents.includes(eventType)) return 'medium';
  return 'low';
}

// Determine compliance categories
function determineComplianceCategories(eventType) {
  const categories = {
    iso27001: [],
    soc2: [],
    gdpr: false,
    required: true,
  };

  // ISO 27001 mapping
  if (eventType.startsWith('auth.')) {
    categories.iso27001.push('A.9.2', 'A.9.4');
    categories.soc2.push('CC6.1', 'CC6.2');
  }
  if (eventType.startsWith('security.')) {
    categories.iso27001.push('A.16.1');
    categories.soc2.push('CC7.1', 'CC7.2');
  }
  if (eventType.startsWith('data.')) {
    categories.iso27001.push('A.12.1', 'A.12.3');
    categories.soc2.push('CC8.1');
    categories.gdpr = true;
  }
  if (eventType.startsWith('payment.')) {
    categories.iso27001.push('A.10.1');
    categories.soc2.push('A1.1', 'C1.1');
  }
  if (eventType.startsWith('compliance.')) {
    categories.iso27001.push('A.18.1');
    categories.soc2.push('CC3.1', 'CC5.2');
    categories.gdpr = true;
  }
  if (eventType.startsWith('superuser.')) {
    categories.iso27001.push('A.9.4');
    categories.soc2.push('CC6.1', 'CC6.8');
  }

  return categories;
}

// Extract IP from request
function extractIpFromRequest(request) {
  if (!request) return null;
  
  return request.headers?.get?.('x-forwarded-for') ||
         request.headers?.get?.('x-real-ip') ||
         request.headers?.['x-forwarded-for'] ||
         request.headers?.['x-real-ip'] ||
         request.ip ||
         null;
}

// Extract user agent from request
function extractUserAgentFromRequest(request) {
  if (!request) return null;
  
  return request.headers?.get?.('user-agent') ||
         request.headers?.['user-agent'] ||
         null;
}

// Fallback logging when PostHog is unavailable
async function fallbackLogging(auditEntry) {
  // Log to console in structured format
  console.log('AUDIT_FALLBACK:', JSON.stringify(auditEntry));
  
  // TODO: Implement fallback to database or file
  // await AuditLog.create(auditEntry);
}

// Middleware helper for automatic audit logging
export function withComplianceAudit(eventType, handler) {
  return async (req, res, ...args) => {
    const startTime = Date.now();
    let success = true;
    let errorMessage = null;
    let responseData = null;

    try {
      // Execute handler
      const result = await handler(req, res, ...args);
      responseData = result;
      return result;
    } catch (error) {
      success = false;
      errorMessage = error.message;
      throw error;
    } finally {
      // Log audit event
      const duration = Date.now() - startTime;
      
      await logComplianceEvent(eventType, {
        userId: req.session?.user?.id,
        userEmail: req.session?.user?.email,
        request: req,
        success,
        errorMessage,
        metadata: {
          duration_ms: duration,
          method: req.method,
          path: req.url,
          status_code: res.statusCode,
        },
      });
    }
  };
}

// Batch logging for high-volume events
class AuditBatcher {
  constructor(flushInterval = 5000, maxBatchSize = 100) {
    this.queue = [];
    this.flushInterval = flushInterval;
    this.maxBatchSize = maxBatchSize;
    this.timer = null;
  }

  add(eventType, eventData) {
    this.queue.push({ eventType, eventData, timestamp: Date.now() });
    
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.maxBatchSize);
    clearTimeout(this.timer);
    this.timer = null;
    
    // Log all events in batch
    await Promise.all(
      batch.map(({ eventType, eventData }) => 
        logComplianceEvent(eventType, eventData)
      )
    );
  }
}

// Export singleton batcher
export const auditBatcher = new AuditBatcher();

// Export event types for use in application
export { AUDIT_EVENTS };