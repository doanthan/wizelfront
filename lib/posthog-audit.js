import { PostHog } from 'posthog-node';

let posthogClient = null;

function getPostHogClient() {
  if (!posthogClient && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        flushAt: 20,
        flushInterval: 10000,
      }
    );
  }
  return posthogClient;
}

export async function logAuditEvent(eventData) {
  const client = getPostHogClient();
  
  if (!client) {
    console.warn('PostHog not configured - skipping audit log');
    return;
  }

  const {
    action,
    userId,
    userEmail,
    storeId,
    ip,
    userAgent,
    metadata = {},
    severity = 'info',
    success = true
  } = eventData;

  try {
    client.capture({
      distinctId: userId || 'anonymous',
      event: `audit_${action.toLowerCase()}`,
      properties: {
        $ip: ip,
        $user_agent: userAgent,
        user_email: userEmail,
        store_id: storeId,
        action: action,
        severity: severity,
        success: success,
        timestamp: new Date().toISOString(),
        compliance_level: process.env.COMPLIANCE_LEVEL || 'basic',
        ...metadata,
        
        // SOC2/ISO27001 required fields
        audit_trail: true,
        audit_retention_days: 2555, // 7 years
        audit_category: getCategoryForAction(action),
      },
      timestamp: new Date(),
    });

    // Flush for critical actions
    if (isCriticalAction(action)) {
      await client.flush();
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the application
  }
}

function getCategoryForAction(action) {
  const categories = {
    USER_LOGIN: 'authentication',
    USER_LOGOUT: 'authentication',
    USER_IMPERSONATION: 'authorization',
    DATA_EXPORT: 'data_access',
    STORE_DELETE: 'data_modification',
    PAYMENT_ATTEMPT: 'financial',
    PERMISSION_CHANGE: 'authorization',
    API_KEY_CREATE: 'security',
    API_KEY_REVOKE: 'security',
    FAILED_LOGIN: 'security_event',
    UNAUTHORIZED_ACCESS: 'security_event',
    KLAVIYO_CONNECT: 'integration',
    KLAVIYO_SYNC: 'data_sync',
  };
  
  return categories[action] || 'general';
}

function isCriticalAction(action) {
  const criticalActions = [
    'USER_IMPERSONATION',
    'STORE_DELETE',
    'PAYMENT_ATTEMPT',
    'PERMISSION_CHANGE',
    'API_KEY_CREATE',
    'API_KEY_REVOKE',
    'UNAUTHORIZED_ACCESS',
  ];
  
  return criticalActions.includes(action);
}

// Query functions for compliance reporting
export async function getAuditTrail(filters = {}) {
  const client = getPostHogClient();
  
  if (!client) {
    return [];
  }

  // PostHog doesn't have a direct query API from Node.js
  // You would typically use their SQL API or export functionality
  // This is a placeholder showing the structure
  console.log('Use PostHog dashboard or SQL API for querying audit trails');
  return [];
}

// Shutdown handler
export async function shutdownAuditLogging() {
  const client = getPostHogClient();
  if (client) {
    await client.shutdown();
  }
}

// Middleware helper for API routes
export function withAuditLogging(handler, action) {
  return async (req, res) => {
    const startTime = Date.now();
    let success = true;
    let responseStatus = 200;

    try {
      // Create a proxy for res to capture the status
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      
      res.status = (code) => {
        responseStatus = code;
        return originalStatus(code);
      };
      
      res.json = (data) => {
        success = responseStatus >= 200 && responseStatus < 400;
        return originalJson(data);
      };

      // Execute the handler
      const result = await handler(req, res);
      
      return result;
    } catch (error) {
      success = false;
      responseStatus = error.status || 500;
      throw error;
    } finally {
      // Log the audit event
      await logAuditEvent({
        action: action,
        userId: req.session?.user?.id,
        userEmail: req.session?.user?.email,
        storeId: req.query?.storePublicId || req.body?.storeId,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: success,
        metadata: {
          method: req.method,
          path: req.url,
          duration_ms: Date.now() - startTime,
          status_code: responseStatus,
        },
      });
    }
  };
}