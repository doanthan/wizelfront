# Complete PostHog Audit Trail Implementation Guide

## 🎯 ISO 27001 & SOC2 Compliance Coverage

This implementation covers all required controls for:
- **ISO 27001**: A.9, A.10, A.12, A.13, A.15, A.16, A.18
- **SOC2 Type II**: CC6.1-CC6.8, CC7.1-CC7.2, CC8.1, CC9.2, A1.1, C1.1

## 📋 Complete Audit Event Coverage

### 1. Authentication & Authorization Events
```javascript
// In /app/api/auth/[...nextauth]/route.js
import { logComplianceEvent, AUDIT_EVENTS } from '@/lib/posthog-audit-complete';

// Add to NextAuth callbacks
callbacks: {
  async signIn({ user, account }) {
    await logComplianceEvent(AUDIT_EVENTS.AUTH.LOGIN_SUCCESS, {
      userId: user.id,
      userEmail: user.email,
      metadata: { provider: account.provider }
    });
    return true;
  },
  async signOut({ token }) {
    await logComplianceEvent(AUDIT_EVENTS.AUTH.LOGOUT, {
      userId: token.id,
      userEmail: token.email
    });
  }
}
```

### 2. Store Management Operations
```javascript
// In /app/api/store/route.js
import { logComplianceEvent, AUDIT_EVENTS } from '@/lib/posthog-audit-complete';

// Store creation
export async function POST(request) {
  // ... existing code ...
  
  // After successful store creation
  await logComplianceEvent(AUDIT_EVENTS.STORE.CREATE, {
    userId: session.user.id,
    userEmail: session.user.email,
    storeId: store.public_id,
    storeName: store.name,
    ip: request.headers.get('x-forwarded-for'),
    metadata: {
      platform: store.platform,
      contract_id: store.contract_id,
      trial_days: 14
    }
  });
}

// Store deletion
export async function DELETE(request, { params }) {
  // ... existing code ...
  
  await logComplianceEvent(AUDIT_EVENTS.STORE.DELETE, {
    userId: session.user.id,
    userEmail: session.user.email,
    storeId: store.public_id,
    storeName: store.name,
    metadata: {
      deletion_type: 'soft_delete',
      archived: true
    }
  });
}
```

### 3. Klaviyo Integration Events
```javascript
// Already implemented in klaviyo-connect/route.js
// Additional events to add:

// OAuth flow
await logComplianceEvent(AUDIT_EVENTS.INTEGRATION.KLAVIYO_OAUTH_AUTHORIZE, {
  userId: session.user.id,
  userEmail: session.user.email,
  storeId: store.public_id,
  metadata: {
    scopes: ['read:campaigns', 'write:webfeeds'],
    expires_in: 3600
  }
});

// Sync operations
await logComplianceEvent(AUDIT_EVENTS.INTEGRATION.KLAVIYO_SYNC_START, {
  userId: 'system',
  storeId: store.public_id,
  metadata: {
    sync_type: 'full',
    entities: ['campaigns', 'flows', 'segments']
  }
});
```

### 4. Permission & Role Changes
```javascript
// In /app/api/stores/[storeId]/permissions/route.js
import { logComplianceEvent, AUDIT_EVENTS } from '@/lib/posthog-audit-complete';

export async function POST(request, { params }) {
  // ... existing code ...
  
  await logComplianceEvent(AUDIT_EVENTS.USER.PERMISSION_GRANT, {
    userId: session.user.id,
    userEmail: session.user.email,
    storeId: params.storeId,
    metadata: {
      target_user_id: userId,
      target_user_email: targetUser.email,
      role: role,
      permissions: rolePermissions
    }
  });
}

export async function DELETE(request, { params }) {
  // ... existing code ...
  
  await logComplianceEvent(AUDIT_EVENTS.USER.PERMISSION_REVOKE, {
    userId: session.user.id,
    userEmail: session.user.email,
    storeId: params.storeId,
    metadata: {
      target_user_id: userId,
      reason: 'User request'
    }
  });
}
```

### 5. Payment & Financial Operations
```javascript
// In /app/api/credits/purchase/route.js
await logComplianceEvent(AUDIT_EVENTS.PAYMENT.CREDITS_PURCHASE, {
  userId: session.user.id,
  userEmail: session.user.email,
  metadata: {
    amount: selectedPackage.price,
    credits: selectedPackage.credits,
    currency: 'USD',
    payment_method: 'stripe',
    stripe_session_id: checkoutSession.id
  }
});

// In /app/api/stripe/webhook/route.js
await logComplianceEvent(AUDIT_EVENTS.PAYMENT.SUCCESS, {
  userId: event.data.object.metadata.user_id,
  metadata: {
    amount: event.data.object.amount_total,
    stripe_event_id: event.id,
    type: event.type
  }
});
```

### 6. AI & Analytics Operations
```javascript
// In /app/api/ai/consume/route.js
await logComplianceEvent(AUDIT_EVENTS.AI.CREDITS_CONSUME, {
  userId: session.user.id,
  userEmail: session.user.email,
  storeId: storeId,
  metadata: {
    credits_used: creditsUsed,
    operation: 'chat_message',
    model: 'gpt-4',
    tokens: tokenCount
  }
});

// In /app/api/chat/ai/route.js
await logComplianceEvent(AUDIT_EVENTS.AI.CHAT_MESSAGE, {
  userId: session.user.id,
  userEmail: session.user.email,
  metadata: {
    message_length: message.length,
    context: 'dashboard_analysis',
    session_id: chatSessionId
  }
});
```

### 7. Web Feeds Operations
```javascript
// In /app/api/webfeeds/route.js
await logComplianceEvent(AUDIT_EVENTS.WEBFEED.CREATE, {
  userId: session.user.id,
  userEmail: session.user.email,
  storeId: webFeed.store_id,
  metadata: {
    feed_name: webFeed.name,
    feed_type: webFeed.type,
    products_count: webFeed.products?.length
  }
});

// Sync to Klaviyo
await logComplianceEvent(AUDIT_EVENTS.WEBFEED.SYNC_START, {
  userId: session.user.id,
  userEmail: session.user.email,
  storeId: store.public_id,
  metadata: {
    feed_id: webFeed._id,
    klaviyo_feed_id: response.data.id
  }
});
```

### 8. Data Operations
```javascript
// In /app/api/playwright/route.js (scraping)
await logComplianceEvent(AUDIT_EVENTS.DATA.SCRAPE_START, {
  userId: session.user.id,
  userEmail: session.user.email,
  storeId: storeId,
  metadata: {
    url: targetUrl,
    scrape_type: 'products',
    job_id: jobId
  }
});

// Data exports
await logComplianceEvent(AUDIT_EVENTS.DATA.EXPORT_REQUEST, {
  userId: session.user.id,
  userEmail: session.user.email,
  metadata: {
    export_type: 'campaign_stats',
    format: 'csv',
    date_range: { start, end },
    row_count: data.length
  }
});
```

### 9. Superuser Operations
```javascript
// In /app/api/superuser/users/route.js
await logComplianceEvent(AUDIT_EVENTS.SUPERUSER.USER_VIEW, {
  userId: session.user.id,
  userEmail: session.user.email,
  metadata: {
    search_query: search,
    results_count: users.length,
    page: page
  }
});

// In /app/api/superuser/impersonate/route.js
await logComplianceEvent(AUDIT_EVENTS.SUPERUSER.ACCESS, {
  userId: session.user.id,
  userEmail: session.user.email,
  metadata: {
    action: 'impersonation_start',
    target_user_id: targetUserId,
    target_user_email: targetUser.email,
    reason: reason || 'Support request'
  }
});
```

### 10. Security Events
```javascript
// Failed login attempts (in auth callbacks)
if (!isValidPassword) {
  await logComplianceEvent(AUDIT_EVENTS.AUTH.LOGIN_FAILED, {
    userEmail: credentials.email,
    ip: request.headers.get('x-forwarded-for'),
    metadata: {
      attempt_count: failedAttempts,
      blocked: failedAttempts > 5
    }
  });
}

// Unauthorized access attempts
await logComplianceEvent(AUDIT_EVENTS.SECURITY.UNAUTHORIZED_ACCESS, {
  userId: session?.user?.id || 'anonymous',
  ip: request.headers.get('x-forwarded-for'),
  metadata: {
    attempted_resource: request.url,
    method: request.method,
    blocked: true
  }
});
```

## 🔧 Implementation Steps

### Step 1: Install Dependencies
```bash
npm install posthog-node posthog-js
```

### Step 2: Environment Variables
```env
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Compliance Settings
COMPLIANCE_LEVEL=standard  # basic, standard, or full
AUDIT_RETENTION_DAYS=2555  # 7 years for SOC2
```

### Step 3: Add to Root Layout
```javascript
// In app/layout.js
import { PHProvider, PostHogPageview } from '@/app/providers/posthog';

export default function RootLayout({ children }) {
  return (
    <html>
      <PHProvider>
        <body>
          <PostHogPageview />
          {children}
        </body>
      </PHProvider>
    </html>
  );
}
```

### Step 4: Apply Middleware to API Routes
```javascript
// Example: Wrap existing API routes
import { withAudit } from '@/lib/audit-middleware';

// Before
export async function POST(request) {
  // your code
}

// After
export const POST = withAudit(async function(request) {
  // your code
});
```

### Step 5: Set Up PostHog Dashboards

#### Critical Events Dashboard
1. Login to PostHog
2. Create new dashboard: "ISO 27001 Compliance"
3. Add insights:
   - Failed login attempts (line chart)
   - Unauthorized access attempts (bar chart)
   - Data exports (table with user details)
   - Permission changes (timeline)
   - Payment failures (alerts)

#### Security Monitoring Dashboard
1. Create dashboard: "Security Monitoring"
2. Add insights:
   - Rate limit violations
   - SQL injection attempts
   - XSS attempts
   - Suspicious activity patterns
   - Geographic anomalies

#### User Activity Dashboard
1. Create dashboard: "User Activity Audit"
2. Add insights:
   - User actions by type
   - Store operations
   - Integration connections
   - Data access patterns

## 📊 Compliance Reports

### Generate SOC2 Audit Report
```sql
-- PostHog SQL Query
SELECT 
  timestamp,
  properties.$audit_action as action,
  properties.$user_email as user,
  properties.$ip as ip_address,
  properties.$success as success,
  properties.$metadata as details
FROM events
WHERE 
  event LIKE 'audit_%'
  AND timestamp >= now() - interval 90 day
  AND properties.$compliance.soc2 IS NOT NULL
ORDER BY timestamp DESC
```

### Generate ISO 27001 Report
```sql
SELECT 
  date_trunc('day', timestamp) as date,
  properties.$compliance.iso27001 as controls,
  count(*) as event_count,
  count(distinct properties.$user_id) as unique_users
FROM events
WHERE 
  event LIKE 'audit_%'
  AND properties.$compliance.iso27001 IS NOT NULL
GROUP BY date, controls
ORDER BY date DESC
```

## 🚨 Alert Configuration

### Critical Alerts (Immediate)
- Multiple failed login attempts (>5 in 10 minutes)
- Data breach suspected
- Superuser emergency access
- Payment failures
- Unauthorized admin access

### High Priority (Within 1 hour)
- Rate limit exceeded
- Security threat detected
- Bulk data export
- Permission escalation
- Store deletion

### Medium Priority (Daily)
- Integration failures
- Sync errors
- Unusual activity patterns
- Failed API calls

## 📈 Performance Optimization

### Batch Events for High Volume
```javascript
import { auditBatcher } from '@/lib/posthog-audit-complete';

// For high-frequency events
auditBatcher.add(AUDIT_EVENTS.AI.CHAT_MESSAGE, {
  userId: session.user.id,
  userEmail: session.user.email,
  metadata: { message: 'chat content' }
});
```

### Async Logging
```javascript
// Don't await for non-critical events
logComplianceEvent(AUDIT_EVENTS.DATA.SCRAPE_START, eventData)
  .catch(error => console.error('Audit log failed:', error));
```

### Sampling for Very High Volume
```javascript
// Sample 10% of read operations
if (Math.random() < 0.1) {
  await logComplianceEvent(AUDIT_EVENTS.DATA.READ, eventData);
}
```

## 🔒 Security Best Practices

1. **Never log sensitive data**:
   - Passwords
   - Full credit card numbers
   - API secrets
   - OAuth tokens

2. **Hash/mask PII when needed**:
```javascript
metadata: {
  email_hash: crypto.createHash('sha256').update(email).digest('hex'),
  card_last_four: cardNumber.slice(-4)
}
```

3. **Use structured logging**:
```javascript
// Good
metadata: { user_id: '123', action: 'delete', resource: 'store' }

// Bad
metadata: { description: 'User 123 deleted store' }
```

## 🎯 Compliance Checklist

- [ ] All authentication events logged
- [ ] All authorization changes logged
- [ ] All data exports tracked
- [ ] All financial operations recorded
- [ ] All integration events captured
- [ ] All security threats logged
- [ ] All superuser actions tracked
- [ ] Rate limiting implemented
- [ ] Security pattern detection active
- [ ] 7-year retention configured
- [ ] Dashboards created
- [ ] Alerts configured
- [ ] Reports automated
- [ ] Documentation complete
- [ ] Team trained

## 📚 Additional Resources

- [ISO 27001 Control Mapping](https://www.iso.org/standard/54534.html)
- [SOC2 Trust Principles](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome)
- [PostHog Documentation](https://posthog.com/docs)
- [GDPR Compliance Guide](https://gdpr.eu/)

## 🆘 Support

For questions or issues:
1. Check PostHog dashboard for event delivery
2. Review browser console for client-side errors
3. Check server logs for backend issues
4. Contact security team for compliance questions