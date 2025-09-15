import { logAuditEvent } from './posthog-audit';

export async function logAuthEvent(type, user, request, success = true, metadata = {}) {
  const eventMap = {
    login: 'USER_LOGIN',
    logout: 'USER_LOGOUT',
    failed_login: 'FAILED_LOGIN',
    impersonation: 'USER_IMPERSONATION',
    unauthorized: 'UNAUTHORIZED_ACCESS',
  };

  const action = eventMap[type] || type.toUpperCase();
  
  // Extract IP address from request
  let ip = null;
  let userAgent = null;
  
  if (request) {
    ip = request.headers?.get?.('x-forwarded-for') || 
         request.headers?.get?.('x-real-ip') ||
         request.headers?.['x-forwarded-for'] ||
         request.headers?.['x-real-ip'] ||
         request.ip;
    
    userAgent = request.headers?.get?.('user-agent') || 
                request.headers?.['user-agent'];
  }

  const auditData = {
    action,
    userId: user?.id || user?._id?.toString() || 'anonymous',
    userEmail: user?.email || metadata.attemptedEmail || 'unknown',
    ip,
    userAgent,
    severity: success ? 'info' : 'warning',
    success,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      session_id: request?.sessionID,
    }
  };

  try {
    await logAuditEvent(auditData);
  } catch (error) {
    console.error('Failed to log auth audit event:', error);
    // Don't throw - audit logging should not break authentication
  }
}

// Helper for logging store-related actions
export async function logStoreAction(action, user, store, request, metadata = {}) {
  const auditData = {
    action: action.toUpperCase().replace(/\s+/g, '_'),
    userId: user?.id || user?._id?.toString(),
    userEmail: user?.email,
    storeId: store?.public_id || store?._id?.toString(),
    ip: request?.headers?.get?.('x-forwarded-for') || request?.headers?.get?.('x-real-ip'),
    userAgent: request?.headers?.get?.('user-agent'),
    severity: 'info',
    success: true,
    metadata: {
      store_name: store?.name,
      ...metadata
    }
  };

  try {
    await logAuditEvent(auditData);
  } catch (error) {
    console.error('Failed to log store audit event:', error);
  }
}

// Helper for logging payment/financial actions
export async function logPaymentAction(action, user, request, metadata = {}) {
  const auditData = {
    action: `PAYMENT_${action.toUpperCase()}`,
    userId: user?.id || user?._id?.toString(),
    userEmail: user?.email,
    ip: request?.headers?.get?.('x-forwarded-for') || request?.headers?.get?.('x-real-ip'),
    userAgent: request?.headers?.get?.('user-agent'),
    severity: 'critical', // Financial actions are always critical
    success: metadata.success !== false,
    metadata: {
      amount: metadata.amount,
      currency: metadata.currency || 'USD',
      payment_method: metadata.payment_method,
      stripe_session_id: metadata.stripe_session_id,
      ...metadata
    }
  };

  try {
    await logAuditEvent(auditData);
  } catch (error) {
    console.error('Failed to log payment audit event:', error);
  }
}