# PostHog Audit Trails Implementation

## Overview
This application uses PostHog for comprehensive audit trail logging to meet SOC2 Type II and ISO 27001 compliance requirements.

## Setup

### 1. Environment Variables
Add these to your `.env.local`:

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # or https://eu.i.posthog.com for EU

# Compliance Level (optional)
COMPLIANCE_LEVEL=basic  # none, basic, standard, full
```

### 2. Installation
```bash
npm install posthog-node posthog-js
```

## Usage

### Server-Side Audit Logging

```javascript
import { logAuditEvent } from '@/lib/posthog-audit';

// Log a critical action
await logAuditEvent({
  action: 'STORE_DELETE',
  userId: user.id,
  userEmail: user.email,
  storeId: store.public_id,
  ip: request.headers.get('x-forwarded-for'),
  metadata: {
    reason: 'User requested deletion',
    backup_created: true
  },
  severity: 'critical',
  success: true
});
```

### Authentication Events

```javascript
import { logAuthEvent } from '@/lib/auth-audit';

// Log successful login
await logAuthEvent('login', user, request, true, {
  method: 'email',
  two_factor: false
});

// Log failed login attempt
await logAuthEvent('failed_login', null, request, false, {
  attemptedEmail: email,
  reason: 'Invalid password'
});
```

### Store Actions

```javascript
import { logStoreAction } from '@/lib/auth-audit';

// Log store modification
await logStoreAction('STORE_UPDATE', user, store, request, {
  changes: ['name', 'timezone'],
  previous_values: { name: oldName, timezone: oldTimezone }
});
```

### Payment Actions

```javascript
import { logPaymentAction } from '@/lib/auth-audit';

// Log payment attempt
await logPaymentAction('ATTEMPT', user, request, {
  amount: 9900,
  currency: 'USD',
  payment_method: 'card',
  stripe_session_id: session.id,
  success: true
});
```

## Critical Actions Tracked

These actions are automatically logged for compliance:

- **Authentication**
  - USER_LOGIN
  - USER_LOGOUT
  - FAILED_LOGIN
  - USER_IMPERSONATION
  - PASSWORD_RESET

- **Authorization**
  - PERMISSION_CHANGE
  - ROLE_ASSIGNMENT
  - ACCESS_GRANT
  - ACCESS_REVOKE

- **Data Operations**
  - DATA_EXPORT
  - DATA_IMPORT
  - STORE_DELETE
  - BULK_DELETE

- **Integrations**
  - KLAVIYO_CONNECT
  - KLAVIYO_DISCONNECT
  - API_KEY_CREATE
  - API_KEY_REVOKE
  - OAUTH_AUTHORIZE

- **Financial**
  - PAYMENT_ATTEMPT
  - PAYMENT_SUCCESS
  - PAYMENT_FAILURE
  - SUBSCRIPTION_CHANGE

- **Security Events**
  - UNAUTHORIZED_ACCESS
  - SUSPICIOUS_ACTIVITY
  - RATE_LIMIT_EXCEEDED
  - SECURITY_ALERT

## PostHog Dashboard Setup

### Custom Events Dashboard
1. Go to PostHog Dashboard
2. Create a new dashboard called "Audit Trail"
3. Add these insights:

#### Critical Actions Chart
- Event: `audit_*`
- Group by: `action`
- Chart type: Bar chart
- Time range: Last 7 days

#### Failed Authentication Attempts
- Event: `audit_failed_login`
- Chart type: Line graph
- Time range: Last 30 days
- Alert threshold: > 10 per hour

#### Data Export Tracking
- Event: `audit_data_export`
- Group by: `user_email`
- Show table with metadata

### Retention Policy
Configure data retention in PostHog:
1. Settings → Data Management → Data Retention
2. Set retention to 7 years (2555 days) for audit events
3. Enable compression for older events

### Alerts Setup
Create alerts for critical events:
1. Multiple failed login attempts (potential breach)
2. Unauthorized access attempts
3. Bulk data exports
4. Permission escalations

## Compliance Reports

### Generate SOC2 Report
Use PostHog's SQL interface:

```sql
SELECT 
  timestamp,
  properties.action as action,
  properties.user_email as user,
  properties.success as success,
  properties.ip as ip_address,
  properties.metadata as details
FROM events
WHERE 
  event LIKE 'audit_%'
  AND timestamp >= now() - interval 30 day
ORDER BY timestamp DESC
```

### Export for Auditors
1. Go to PostHog → Data Management → Exports
2. Create new export with filters:
   - Events: `audit_*`
   - Date range: As required
   - Format: CSV or JSON
3. Include all properties for complete audit trail

## Performance Considerations

### Optimization Tips
1. **Batch non-critical events**: Use `flushAt: 20` to batch events
2. **Async logging**: Never await audit logs in critical paths
3. **Selective logging**: Only log defined critical actions in basic mode
4. **Use sampling**: For high-volume events, consider sampling

### Performance Impact
- Basic mode: ~1-2% overhead
- Standard mode: ~3-5% overhead  
- Full mode: ~5-10% overhead

## Security Best Practices

1. **Never log sensitive data**:
   - Passwords
   - Full credit card numbers
   - API secrets
   - Personal health information

2. **Mask PII when necessary**:
   - Use PostHog's built-in masking
   - Hash sensitive identifiers
   - Truncate where appropriate

3. **Secure transmission**:
   - Always use HTTPS
   - Verify PostHog SSL certificates
   - Use private cloud if required

## Troubleshooting

### Events not appearing
1. Check environment variables are set
2. Verify PostHog project API key
3. Check browser console for errors
4. Ensure PostHog client is initialized

### High latency
1. Increase `flushInterval` to batch more events
2. Use `fire-and-forget` pattern for non-critical events
3. Consider using PostHog proxy for better performance

### Missing metadata
1. Ensure all required fields are included
2. Check for undefined values
3. Verify object serialization

## Migration from Existing System

If migrating from another audit system:

1. Export historical data
2. Transform to PostHog event format
3. Use PostHog's batch import API
4. Verify data integrity
5. Update compliance documentation