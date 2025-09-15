import { logComplianceEvent, AUDIT_EVENTS } from './posthog-audit-complete';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// Map API routes to audit events
const ROUTE_AUDIT_MAP = {
  // Authentication
  'POST /api/auth/signin': AUDIT_EVENTS.AUTH.LOGIN_SUCCESS,
  'POST /api/auth/signout': AUDIT_EVENTS.AUTH.LOGOUT,
  'POST /api/auth/register': AUDIT_EVENTS.USER.CREATE,
  'POST /api/auth/password-reset': AUDIT_EVENTS.AUTH.PASSWORD_RESET_REQUEST,
  
  // Store Management
  'POST /api/store': AUDIT_EVENTS.STORE.CREATE,
  'PUT /api/store/[id]': AUDIT_EVENTS.STORE.UPDATE,
  'DELETE /api/store/[id]': AUDIT_EVENTS.STORE.DELETE,
  
  // Klaviyo Integration
  'POST /api/store/[id]/klaviyo-connect': AUDIT_EVENTS.INTEGRATION.KLAVIYO_CONNECT,
  'DELETE /api/store/[id]/klaviyo-connect': AUDIT_EVENTS.INTEGRATION.KLAVIYO_DISCONNECT,
  'POST /api/store/[id]/klaviyo-oauth': AUDIT_EVENTS.INTEGRATION.KLAVIYO_OAUTH_AUTHORIZE,
  'POST /api/klaviyo/sync': AUDIT_EVENTS.INTEGRATION.KLAVIYO_SYNC_START,
  
  // User & Permissions
  'POST /api/stores/[id]/permissions': AUDIT_EVENTS.USER.PERMISSION_GRANT,
  'DELETE /api/stores/[id]/permissions': AUDIT_EVENTS.USER.PERMISSION_REVOKE,
  'PUT /api/stores/[id]/permissions': AUDIT_EVENTS.USER.ROLE_ASSIGN,
  
  // Payment & Credits
  'POST /api/credits/purchase': AUDIT_EVENTS.PAYMENT.CREDITS_PURCHASE,
  'POST /api/stripe/webhook': AUDIT_EVENTS.PAYMENT.SUCCESS,
  
  // AI Operations
  'POST /api/ai/consume': AUDIT_EVENTS.AI.CREDITS_CONSUME,
  'POST /api/chat/ai': AUDIT_EVENTS.AI.CHAT_MESSAGE,
  
  // Web Feeds
  'POST /api/webfeeds': AUDIT_EVENTS.WEBFEED.CREATE,
  'PUT /api/webfeeds/[id]': AUDIT_EVENTS.WEBFEED.UPDATE,
  'DELETE /api/webfeeds/[id]': AUDIT_EVENTS.WEBFEED.DELETE,
  'POST /api/webfeeds/klaviyo-sync': AUDIT_EVENTS.WEBFEED.SYNC_START,
  
  // Data Operations
  'POST /api/playwright': AUDIT_EVENTS.DATA.SCRAPE_START,
  'POST /api/store/[id]/products': AUDIT_EVENTS.DATA.IMPORT_START,
  'POST /api/store/[id]/collections': AUDIT_EVENTS.DATA.IMPORT_START,
  
  // Superuser Operations
  'GET /api/superuser/users': AUDIT_EVENTS.SUPERUSER.USER_VIEW,
  'POST /api/superuser/impersonate': AUDIT_EVENTS.SUPERUSER.ACCESS,
  'GET /api/superuser/compliance': AUDIT_EVENTS.SUPERUSER.COMPLIANCE_REPORT,
  
  // Contract Management
  'POST /api/contract': AUDIT_EVENTS.CONTRACT.CREATE,
  'PUT /api/contract': AUDIT_EVENTS.CONTRACT.UPDATE,
  
  // Support
  'POST /api/support/ticket': AUDIT_EVENTS.COMPLIANCE.INCIDENT_REPORT,
};

// Security event detection patterns
const SECURITY_PATTERNS = {
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b|--|\/\*|\*\/)/i,
  XSS: /<script[^>]*>|javascript:|on\w+\s*=/i,
  PATH_TRAVERSAL: /\.\.[\/\\]/,
  COMMAND_INJECTION: /[;&|`$()]/,
};

// Rate limiting tracker (in-memory for now, use Redis in production)
const rateLimitTracker = new Map();

export async function auditMiddleware(request, handler, options = {}) {
  const startTime = Date.now();
  const method = request.method;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Get session
  const session = await getServerSession(authOptions);
  
  // Extract request metadata
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent');
  const sessionId = request.headers.get('x-session-id');
  
  // Check for security threats
  await checkSecurityThreats(request, ip, session);
  
  // Determine audit event type
  const routeKey = `${method} ${pathname.replace(/\/[a-f0-9-]+/g, '/[id]')}`;
  const eventType = ROUTE_AUDIT_MAP[routeKey] || determineEventType(method, pathname);
  
  let success = true;
  let errorMessage = null;
  let responseStatus = 200;
  let responseData = null;

  try {
    // Execute the actual handler
    const response = await handler(request);
    
    // Extract response status
    responseStatus = response.status || 200;
    success = responseStatus >= 200 && responseStatus < 400;
    
    // Clone response to read body if needed
    if (options.captureResponse && response.body) {
      const clonedResponse = response.clone();
      try {
        responseData = await clonedResponse.json();
      } catch {
        // Response might not be JSON
      }
    }
    
    return response;
    
  } catch (error) {
    success = false;
    errorMessage = error.message;
    responseStatus = error.status || 500;
    
    // Log security events
    if (error.type === 'security') {
      await logComplianceEvent(AUDIT_EVENTS.SECURITY.SUSPICIOUS_ACTIVITY, {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        ip,
        userAgent,
        metadata: {
          threat_type: error.threatType,
          blocked: true,
          details: error.message,
        },
      });
    }
    
    throw error;
    
  } finally {
    const duration = Date.now() - startTime;
    
    // Log the audit event
    if (eventType && shouldLogEvent(eventType, success)) {
      await logComplianceEvent(eventType, {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        ip,
        userAgent,
        sessionId,
        success,
        errorMessage,
        metadata: {
          method,
          path: pathname,
          query: Object.fromEntries(url.searchParams),
          duration_ms: duration,
          status_code: responseStatus,
          response_size: responseData ? JSON.stringify(responseData).length : 0,
        },
      });
    }
    
    // Log slow requests
    if (duration > 5000) {
      await logComplianceEvent(AUDIT_EVENTS.SECURITY.SUSPICIOUS_ACTIVITY, {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        ip,
        metadata: {
          type: 'slow_request',
          duration_ms: duration,
          path: pathname,
        },
      });
    }
  }
}

// Check for security threats
async function checkSecurityThreats(request, ip, session) {
  const url = new URL(request.url);
  const body = await getRequestBody(request);
  
  // Check for SQL injection
  const checkString = `${url.search} ${JSON.stringify(body)}`;
  for (const [threatType, pattern] of Object.entries(SECURITY_PATTERNS)) {
    if (pattern.test(checkString)) {
      await logComplianceEvent(AUDIT_EVENTS.SECURITY[`${threatType}_ATTEMPT`], {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        ip,
        metadata: {
          threat_type: threatType,
          payload: checkString.substring(0, 500),
          blocked: true,
        },
      });
      
      throw {
        type: 'security',
        threatType,
        message: `Security threat detected: ${threatType}`,
        status: 403,
      };
    }
  }
  
  // Check rate limiting
  const rateLimitKey = `${ip}:${session?.user?.id || 'anonymous'}`;
  const now = Date.now();
  const requests = rateLimitTracker.get(rateLimitKey) || [];
  
  // Clean old entries (older than 1 minute)
  const recentRequests = requests.filter(time => now - time < 60000);
  
  // Check if rate limit exceeded (100 requests per minute)
  if (recentRequests.length >= 100) {
    await logComplianceEvent(AUDIT_EVENTS.SECURITY.RATE_LIMIT_EXCEEDED, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      ip,
      metadata: {
        requests_count: recentRequests.length,
        window: '1_minute',
      },
    });
    
    throw {
      type: 'security',
      threatType: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
      status: 429,
    };
  }
  
  // Update tracker
  recentRequests.push(now);
  rateLimitTracker.set(rateLimitKey, recentRequests);
}

// Get request body safely
async function getRequestBody(request) {
  try {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await request.json();
    }
    return {};
  } catch {
    return {};
  }
}

// Determine event type from route
function determineEventType(method, pathname) {
  // Generic patterns
  if (method === 'POST' && pathname.includes('/create')) {
    return AUDIT_EVENTS.DATA.IMPORT_START;
  }
  if (method === 'DELETE') {
    return AUDIT_EVENTS.DATA.BULK_DELETE;
  }
  if (method === 'PUT' || method === 'PATCH') {
    return AUDIT_EVENTS.DATA.BULK_UPDATE;
  }
  
  // Don't log GET requests by default (too noisy)
  if (method === 'GET') {
    // Only log sensitive GETs
    if (pathname.includes('superuser') || 
        pathname.includes('audit') || 
        pathname.includes('compliance')) {
      return AUDIT_EVENTS.COMPLIANCE.AUDIT_LOG_ACCESS;
    }
    return null;
  }
  
  return null;
}

// Determine if event should be logged based on compliance level
function shouldLogEvent(eventType, success) {
  const complianceLevel = process.env.COMPLIANCE_LEVEL || 'basic';
  
  // Always log failures and security events
  if (!success || eventType.startsWith('security.')) {
    return true;
  }
  
  // Compliance level filtering
  switch (complianceLevel) {
    case 'none':
      return false;
      
    case 'basic':
      // Only critical events
      const criticalPrefixes = ['auth.', 'security.', 'payment.', 'superuser.'];
      return criticalPrefixes.some(prefix => eventType.startsWith(prefix));
      
    case 'standard':
      // Most events except data reads
      return !eventType.includes('.view') && !eventType.includes('.read');
      
    case 'full':
      // Log everything
      return true;
      
    default:
      return true;
  }
}

// Helper to wrap API route handlers
export function withAudit(handler, options = {}) {
  return async (request, context) => {
    return auditMiddleware(request, () => handler(request, context), options);
  };
}

// Helper for Next.js API routes
export function auditApiRoute(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    const session = await getServerSession(req, res, authOptions);
    
    try {
      const result = await handler(req, res);
      
      // Log successful operation
      const eventType = determineEventTypeFromReq(req);
      if (eventType) {
        await logComplianceEvent(eventType, {
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          request: req,
          success: true,
          metadata: {
            duration_ms: Date.now() - startTime,
          },
        });
      }
      
      return result;
    } catch (error) {
      // Log failed operation
      const eventType = determineEventTypeFromReq(req);
      if (eventType) {
        await logComplianceEvent(eventType, {
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          request: req,
          success: false,
          errorMessage: error.message,
          metadata: {
            duration_ms: Date.now() - startTime,
          },
        });
      }
      
      throw error;
    }
  };
}

function determineEventTypeFromReq(req) {
  const key = `${req.method} ${req.url.replace(/\/[a-f0-9-]+/g, '/[id]')}`;
  return ROUTE_AUDIT_MAP[key];
}

// Export rate limiter for use in other modules
export { rateLimitTracker };