# Klaviyo Email & SMS Preview System

## Overview

Some modals view displays Klaviyo campaign previews for both email and SMS campaigns in a modal interface. When users click on a campaign card, they see a two-column layout with the campaign preview on the left and analytics data on the right.

## Architecture Flow

```
CampaignDetailsModal → EmailPreviewPanel → API Route → Klaviyo API
```

## Components

### 1. Calendar Page (`/app/(dashboard)/calendar/page.jsx`)

**Functionality:**
- Displays campaign cards on calendar view
- Handles campaign card click events
- Opens CampaignDetailsModal with campaign data

**Key Data Flow:**
```javascript
const handleCampaignClick = useCallback((campaign, source = 'calendar') => {
    setSelectedCampaign({ ...campaign, navigationSource: source });
    setShowCampaignDetails(true);
}, []);
```

**Campaign Data Structure Passed:**
```json
{
  "id": "01K414ZN4ZA2CWT1JWHHKYF054",
  "messageId": "01K414ZN4ZA2CWT1JWHHKYF054",
  "campaignId": "01K414ZN4Q621VZEJ4H5T7J7A3",
  "name": "Email Campaign - Sep 1, 2025, 12:00 AM",
  "type": "email",
  "channel": "email",
  "status": "sent",
  "klaviyo_public_id": "XqkVGb",
  "recipients": 41,
  "opensUnique": 22,
  "clicksUnique": 8,
  "revenue": 576.45
}
```

### 2. Campaign Details Modal (`/app/(dashboard)/calendar/components/CampaignDetailsModal.jsx`)

**Functionality:**
- Two-column layout: preview (left) + analytics (right)
- Handles multiple campaign data formats
- Maps campaign data to preview component

**Message ID Extraction Logic:**
```javascript
// Handles multiple field name patterns
const messageId = data.message_id || data.messageId || data.groupings?.campaign_message_id;
```

**Store Lookup Logic:**
```javascript
const campaignStore = stores?.find(s => 
    s.public_id === campaign?.store_public_id || 
    s.klaviyo_integration?.public_id === campaign?.klaviyo_public_id ||
    campaign?.store_public_ids?.includes(s.public_id) ||
    s.public_id === data?.store_public_id ||
    s.klaviyo_integration?.public_id === data?.klaviyo_public_id
)
```

**Props Passed to EmailPreviewPanel:**
```javascript
<EmailPreviewPanel
    messageId={messageId}  // "01K414ZN4ZA2CWT1JWHHKYF054"
    storeId={storeId}      // "Pu200rg" (store.public_id) - NOT klaviyo_public_id!
/>
```

**IMPORTANT**: The `storeId` should be the **store's `public_id`**, NOT the `klaviyo_integration.public_id`. The API will look up the store by `public_id` first to find the correct store with authentication.

### 3. Email Preview Panel (`/app/(dashboard)/calendar/components/EmailPreviewPanel.jsx`)

**Functionality:**
- Fetches campaign content from API
- Renders email HTML or SMS content
- Handles loading and error states

**API Call:**
```javascript
const url = `/api/klaviyo/campaign-message/${messageId}?storeId=${storeId}`;
const response = await fetch(url);
```

**Rendering Logic:**
- **Email**: Renders HTML content using `dangerouslySetInnerHTML`
- **SMS**: Displays as phone-style message bubbles with character count

## API Endpoint

### Route: `/api/klaviyo/campaign-message/[messageId]/route.js`

**HTTP Method:** GET

**URL Pattern:**
```
/api/klaviyo/campaign-message/01K414ZN4ZA2CWT1JWHHKYF054?storeId=Pu200rg
```

**Note**: The `storeId` parameter should be the store's `public_id`, not the `klaviyo_integration.public_id`.

**Authentication:**
- NextAuth session validation
- Store access validation via `Store.hasAccess()`
- Supports super admin bypass

**Store Lookup Process:**
1. Look up by `klaviyo_integration.public_id` (primary)
2. Fallback to `public_id` (secondary)

**Access Control:**
```javascript
// 1. Check direct store access
const hasAccess = await Store.hasAccess(store._id, session.user.id);

// 2. Check admin privileges if no direct access
if (!hasAccess && (user?.super_admin || user?.is_super_user)) {
    // Grant access via admin privileges
}
```

**Klaviyo API Integration:**
```javascript
// OAuth-first authentication approach
const klaviyoAuthOptions = buildKlaviyoAuthOptions(store);

// Fetch with template inclusion
const campaignMessage = await fetchKlaviyoCampaignMessage(
    messageId,
    klaviyoAuthOptions
);
```

## Klaviyo API Call

### Function: `fetchKlaviyoCampaignMessage()` in `/lib/klaviyo.js`

**Klaviyo Endpoint:**
```
GET https://a.klaviyo.com/api/campaign-messages/{messageId}?include=template
```

**Headers:**
- OAuth: `Authorization: Bearer {oauth_token}`
- API Key: `Authorization: Klaviyo-API-Key {api_key}`
- `revision: 2025-07-15`

**Response Structure:**
```json
{
  "data": {
    "type": "campaign-message",
    "id": "01K414ZN4ZA2CWT1JWHHKYF054",
    "attributes": {
      "channel": "email",
      "definition": {
        "content": {
          "subject": "Welcome to our store!",
          "preview_text": "Thanks for signing up",
          "from_email": "hello@store.com",
          "from_label": "Store Name"
        }
      }
    }
  },
  "included": [
    {
      "type": "template",
      "id": "template_id",
      "attributes": {
        "html": "<html>...</html>",
        "text": "Plain text version"
      }
    }
  ]
}
```

## Response Processing

### Email Campaigns

**API Response:**
```json
{
  "success": true,
  "data": {
    "channel": "email",
    "html": "<html><body>...</body></html>",
    "text": "Plain text version",
    "subject": "Welcome to our store!",
    "previewText": "Thanks for signing up",
    "fromEmail": "hello@store.com",
    "fromLabel": "Store Name",
    "messageId": "01K414ZN4ZA2CWT1JWHHKYF054",
    "campaignName": "Welcome Email"
  }
}
```

**Frontend Rendering:**
```javascript
<div 
  className="email-content"
  dangerouslySetInnerHTML={{ __html: content.html }}
  style={{
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}
/>
```

### SMS Campaigns

**API Response:**
```json
{
  "success": true,
  "data": {
    "type": "sms",
    "channel": "sms",
    "body": "Hi {{first_name}}, check out our new products!",
    "mediaUrl": "https://example.com/image.jpg",
    "fromPhone": "+1234567890",
    "messageId": "01K414ZN4ZA2CWT1JWHHKYF054"
  }
}
```

**Frontend Rendering:**
- Phone mockup with message bubble
- Template variable highlighting: `{{first_name}}` → `[first_name]`
- Character count with SMS segment calculation
- Media attachment display

**SMS Processing Logic:**
```javascript
// Extract SMS content from multiple possible locations
const body = messageData?.attributes?.definition?.content?.body ||
             messageData?.attributes?.content?.body ||
             messageData?.attributes?.body || 
             campaign?.content?.body ||
             '';

// Template variable processing
const processedBody = displayBody.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
  return `[${variable.trim()}]`;
});
```

## Error Handling

### Common Error Scenarios

1. **403 Access Denied**
   - User lacks store access
   - Not a super admin/super user
   - Store not found in user's permissions

2. **404 Store Not Found**
   - Invalid `storeId` parameter
   - Store not in database
   - Klaviyo integration missing

3. **404 Message Not Found**
   - Invalid `messageId`
   - Campaign deleted from Klaviyo
   - Message not accessible with current auth

4. **401 Klaviyo Auth Failed**
   - Expired OAuth token
   - Invalid API key
   - Missing Klaviyo credentials

### Error Response Format

```json
{
  "error": "Access denied",
  "details": "User does not have access to this store"
}
```

## Security Considerations

### Authentication Flow
1. **NextAuth Session**: Validates user is logged in
2. **Store Access**: Checks user has permission for specific store
3. **Klaviyo Auth**: Uses OAuth-first with API key fallback
4. **Admin Bypass**: Super admin/super user can access any store

### Data Protection
- No sensitive Klaviyo credentials exposed to frontend
- Store access validated on every request
- OAuth tokens automatically refreshed
- Audit logging for access attempts

## Performance Optimizations

### Caching Strategy
- No client-side caching (content may change)
- Server-side Klaviyo rate limiting respected
- OAuth token refresh handled automatically

### Loading States
- Skeleton loading in preview panel
- Error boundaries for failed requests
- Graceful degradation for missing content

## Template Variable Handling

### Email Templates
- Klaviyo variables preserved in HTML: `{{ first_name }}`
- Rendered as-is in preview (not replaced)
- Admin can see template structure

### SMS Templates
- Variables highlighted for readability: `[first_name]`
- Character count includes variable placeholders
- SMS segment calculation shows real cost

## Integration Dependencies

### Required Models
- `Store`: Store and Klaviyo integration data
- `User`: User permissions and store access
- `CampaignStat`: Optional campaign metadata

### Required Libraries
- `@/lib/klaviyo-api`: Centralized Klaviyo API calls
- `@/lib/klaviyo-auth-helper`: OAuth-first authentication
- `@/lib/mongoose`: Database connection

### Environment Variables
```bash
KLAVIYO_CLIENT_ID=your_oauth_client_id
KLAVIYO_CLIENT_SECRET=your_oauth_client_secret
KLAVIYO_REVISION=2025-07-15
```

## Debugging

### Console Logs Available
- `🚀 Campaign message API called`: Request received
- `📧 Message ID from params`: Extracted message ID
- `🏪 Store ID from query`: Store lookup parameter
- `🔍 Looking for store`: Database store search
- `✅ Store found`: Successful store match
- `🔐 Checking store access`: Permission validation
- `👤 User details`: User permission details

### Common Debug Steps
1. Check messageId extraction in modal
2. Verify storeId matches store in database
3. Confirm user has store access or admin rights
4. Validate Klaviyo authentication credentials
5. Test API endpoint directly with valid parameters