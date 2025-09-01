# Klaviyo API Endpoints Reference

## Base URL
```
https://a.klaviyo.com/api/
```

## Authentication
- **API Key**: `Authorization: Klaviyo-API-Key {your-private-api-key}`
- **OAuth Bearer Token**: `Authorization: Bearer {access-token}`
- **API Revision Header**: `revision: 2025-07-15`

## Core Endpoints

### Profiles API

#### Profile Management
- `GET /api/profiles/` - Get all profiles
- `GET /api/profiles/{profile_id}/` - Get a specific profile
- `POST /api/profiles/` - Create a new profile
- `PATCH /api/profiles/{profile_id}/` - Update a profile
- `POST /api/profiles/merge/` - Merge profiles

#### Profile Relationships
- `GET /api/profiles/{profile_id}/lists/` - Get lists for a profile
- `GET /api/profiles/{profile_id}/list-ids/` - Get list IDs for a profile
- `GET /api/profiles/{profile_id}/segments/` - Get segments for a profile
- `GET /api/profiles/{profile_id}/segment-ids/` - Get segment IDs for a profile
- `GET /api/profiles/{profile_id}/push-tokens/` - Get push tokens for a profile
- `GET /api/profiles/{profile_id}/push-token-ids/` - Get push token IDs for a profile

### Events API

#### Event Management
- `GET /api/events/` - Get all events
- `GET /api/events/{event_id}/` - Get a specific event
- `POST /api/events/` - Create a new event
- `POST /api/bulk-events/` - Bulk create events

#### Event Relationships
- `GET /api/events/{event_id}/profile/` - Get profile for an event
- `GET /api/events/{event_id}/profile-id/` - Get profile ID for an event
- `GET /api/events/{event_id}/metric/` - Get metric for an event
- `GET /api/events/{event_id}/metric-id/` - Get metric ID for an event

### Lists API

#### List Management
- `GET /api/lists/` - Get all lists
- `GET /api/lists/{list_id}/` - Get a specific list
- `POST /api/lists/` - Create a new list
- `PATCH /api/lists/{list_id}/` - Update a list
- `DELETE /api/lists/{list_id}/` - Delete a list

#### List Relationships
- `GET /api/lists/{list_id}/profiles/` - Get profiles in a list
- `GET /api/lists/{list_id}/profile-ids/` - Get profile IDs in a list
- `GET /api/lists/{list_id}/tags/` - Get tags for a list
- `GET /api/lists/{list_id}/tag-ids/` - Get tag IDs for a list
- `POST /api/lists/{list_id}/relationships/profiles/` - Add profiles to a list

#### List Profile Management
- `GET /api/lists/{list_id}/relationships/profiles/` - Get profile relationships
- `POST /api/list-relationships/` - Create list relationships

### Segments API

#### Segment Management
- `GET /api/segments/` - Get all segments
- `GET /api/segments/{segment_id}/` - Get a specific segment
- `POST /api/segments/` - Create a new segment
- `PATCH /api/segments/{segment_id}/` - Update a segment
- `DELETE /api/segments/{segment_id}/` - Delete a segment

#### Segment Relationships
- `GET /api/segments/{segment_id}/profiles/` - Get profiles in a segment
- `GET /api/segments/{segment_id}/profile-ids/` - Get profile IDs in a segment
- `GET /api/segments/{segment_id}/tags/` - Get tags for a segment
- `GET /api/segments/{segment_id}/tag-ids/` - Get tag IDs for a segment
- `GET /api/segments/{segment_id}/flows-triggered/` - Get flows triggered by segment
- `GET /api/segments/{segment_id}/flow-ids-triggered/` - Get flow IDs triggered

### Metrics API

#### Metric Management
- `GET /api/metrics/` - Get all metrics
- `GET /api/metrics/{metric_id}/` - Get a specific metric
- `POST /api/metric-aggregates/` - Query metric aggregates

#### Metric Properties
- `GET /api/metric-properties/{metric_property_id}/` - Get metric property
- `GET /api/metrics/{metric_id}/metric-properties/` - Get properties for metric
- `GET /api/metrics/{metric_id}/relationships/metric-properties/` - Get property IDs

#### Metric Relationships
- `GET /api/metrics/{metric_id}/flows/` - Get flows triggered by metric
- `GET /api/metrics/{metric_id}/relationships/flows/` - Get flow IDs triggered

#### Custom Metrics
- `GET /api/custom-metrics/` - Get all custom metrics
- `GET /api/custom-metrics/{custom_metric_id}/` - Get a custom metric
- `POST /api/custom-metrics/` - Create a custom metric
- `PATCH /api/custom-metrics/{custom_metric_id}/` - Update a custom metric
- `DELETE /api/custom-metrics/{custom_metric_id}/` - Delete a custom metric

#### Mapped Metrics
- `GET /api/mapped-metrics/` - Get all mapped metrics
- `GET /api/mapped-metrics/{mapped_metric_id}/` - Get a mapped metric
- `PATCH /api/mapped-metrics/{mapped_metric_id}/` - Update a mapped metric

### Campaigns API

#### Campaign Management
- `GET /api/campaigns/` - Get all campaigns
- `GET /api/campaigns/{campaign_id}/` - Get a specific campaign
- `POST /api/campaigns/` - Create a campaign
- `PATCH /api/campaigns/{campaign_id}/` - Update a campaign
- `DELETE /api/campaigns/{campaign_id}/` - Delete a campaign

#### Campaign Relationships
- `GET /api/campaigns/{campaign_id}/tags/` - Get tags for campaign
- `GET /api/campaigns/{campaign_id}/messages/` - Get messages for campaign

### Flows API

#### Flow Management
- `GET /api/flows/` - Get all flows
- `GET /api/flows/{flow_id}/` - Get a specific flow
- `PATCH /api/flows/{flow_id}/` - Update a flow

#### Flow Relationships
- `GET /api/flows/{flow_id}/flow-actions/` - Get actions for flow
- `GET /api/flows/{flow_id}/tags/` - Get tags for flow

### Templates API

#### Template Management
- `GET /api/templates/` - Get all templates
- `GET /api/templates/{template_id}/` - Get a specific template
- `POST /api/templates/` - Create a template
- `PATCH /api/templates/{template_id}/` - Update a template
- `DELETE /api/templates/{template_id}/` - Delete a template

### Tags API

#### Tag Management
- `GET /api/tags/` - Get all tags
- `GET /api/tags/{tag_id}/` - Get a specific tag
- `POST /api/tags/` - Create a tag
- `PATCH /api/tags/{tag_id}/` - Update a tag
- `DELETE /api/tags/{tag_id}/` - Delete a tag

#### Tag Relationships
- `GET /api/tags/{tag_id}/campaigns/` - Get campaigns with tag
- `GET /api/tags/{tag_id}/flows/` - Get flows with tag
- `GET /api/tags/{tag_id}/lists/` - Get lists with tag
- `GET /api/tags/{tag_id}/segments/` - Get segments with tag

### Reporting API

#### Campaign Reporting
- `POST /api/campaign-values/` - Query campaign values
- `POST /api/campaign-series/` - Query campaign time series

#### Flow Reporting
- `POST /api/flow-values/` - Query flow values
- `POST /api/flow-series/` - Query flow time series

#### Form Reporting
- `POST /api/form-values/` - Query form values
- `POST /api/form-series/` - Query form time series

#### Segment Reporting
- `POST /api/segment-values/` - Query segment values
- `POST /api/segment-series/` - Query segment time series

### Client API (Frontend/Mobile)

#### Client Events
- `POST /api/client-events/` - Create client event
- `POST /api/client-events-bulk/` - Bulk create client events

#### Client Profiles
- `POST /api/client-profile-update/` - Create or update client profile

#### Client Subscriptions
- `POST /api/client-subscriptions/` - Create client subscription
- `POST /api/client-back-in-stock-subscriptions/` - Create back-in-stock subscription

#### Push Tokens
- `POST /api/client-push-token-update/` - Create or update push token
- `POST /api/client-push-token-delete/` - Unregister push token

#### Reviews
- `GET /api/client-reviews/` - Get client reviews
- `POST /api/client-reviews/` - Create client review
- `GET /api/client-review-values-reports/` - Get review value reports

### Coupons API

#### Coupon Management
- `GET /api/coupons/` - Get all coupons
- `GET /api/coupons/{coupon_id}/` - Get a specific coupon
- `POST /api/coupons/` - Create a coupon
- `PATCH /api/coupons/{coupon_id}/` - Update a coupon
- `DELETE /api/coupons/{coupon_id}/` - Delete a coupon

#### Coupon Codes
- `GET /api/coupon-codes/` - Get all coupon codes
- `GET /api/coupon-codes/{coupon_code_id}/` - Get a specific coupon code
- `POST /api/coupon-codes/` - Create coupon codes
- `PATCH /api/coupon-codes/{coupon_code_id}/` - Update a coupon code
- `DELETE /api/coupon-codes/{coupon_code_id}/` - Delete a coupon code

### Catalogs API

#### Catalog Items
- `GET /api/catalog-items/` - Get all catalog items
- `GET /api/catalog-items/{catalog_item_id}/` - Get a catalog item
- `POST /api/catalog-items/` - Create catalog items
- `PATCH /api/catalog-items/{catalog_item_id}/` - Update a catalog item
- `DELETE /api/catalog-items/{catalog_item_id}/` - Delete a catalog item

#### Catalog Categories
- `GET /api/catalog-categories/` - Get all catalog categories
- `GET /api/catalog-categories/{catalog_category_id}/` - Get a category
- `POST /api/catalog-categories/` - Create catalog categories
- `PATCH /api/catalog-categories/{catalog_category_id}/` - Update a category
- `DELETE /api/catalog-categories/{catalog_category_id}/` - Delete a category

#### Catalog Variants
- `GET /api/catalog-variants/` - Get all catalog variants
- `GET /api/catalog-variants/{catalog_variant_id}/` - Get a variant
- `POST /api/catalog-variants/` - Create catalog variants
- `PATCH /api/catalog-variants/{catalog_variant_id}/` - Update a variant
- `DELETE /api/catalog-variants/{catalog_variant_id}/` - Delete a variant

### Webhooks API

#### Webhook Management
- `GET /api/webhooks/` - Get all webhooks
- `GET /api/webhooks/{webhook_id}/` - Get a specific webhook
- `POST /api/webhooks/` - Create a webhook
- `PATCH /api/webhooks/{webhook_id}/` - Update a webhook
- `DELETE /api/webhooks/{webhook_id}/` - Delete a webhook

### Images API

#### Image Management
- `GET /api/images/` - Get all images
- `GET /api/images/{image_id}/` - Get a specific image
- `POST /api/images/` - Upload an image
- `PATCH /api/images/{image_id}/` - Update an image
- `DELETE /api/images/{image_id}/` - Delete an image

## OAuth Endpoints

### OAuth Token Management
- `POST https://a.klaviyo.com/oauth/token` - Exchange code for tokens / Refresh token
- `GET https://a.klaviyo.com/oauth/authorize` - Get authorization URL

### OAuth Parameters
```javascript
// Authorization Code Exchange
{
  grant_type: 'authorization_code',
  code: 'auth_code',
  redirect_uri: 'redirect_uri'
}

// Refresh Token
{
  grant_type: 'refresh_token',
  refresh_token: 'refresh_token'
}
```

## Common Query Parameters

### Pagination
- `page[size]` - Number of results per page (max: 100)
- `page[cursor]` - Cursor for pagination

### Filtering
- `filter` - Filter string using Klaviyo's filter syntax
  - `equals(field, "value")`
  - `contains(field, "value")`
  - `greater-than(field, value)`
  - `less-than(field, value)`
  - `any(field, ["value1", "value2"])`

### Sorting
- `sort` - Field to sort by (prefix with `-` for descending)
  - Example: `sort=-created_at`

### Including Related Resources
- `include` - Comma-separated list of related resources
  - Example: `include=lists,segments`

### Sparse Fieldsets
- `fields[resource]` - Comma-separated list of fields to return
  - Example: `fields[profile]=email,first_name,last_name`

### Additional Fields
- `additional-fields[resource]` - Request additional computed fields
  - Example: `additional-fields[list]=profile_count`

## Rate Limits

### Default Limits
- **Burst**: 75 requests / 3 seconds
- **Steady**: 700 requests / 60 seconds

### Endpoint-Specific Limits

#### High Volume
- **Events**: 350 burst / 3500 steady
- **Client Events**: 350 burst / 3500 steady

#### Low Volume
- **Flows**: 3 burst / 60 steady
- **Metric Aggregates**: 3 burst / 60 steady

#### Medium Volume
- **Lists/Segments**: 10 burst / 150 steady
- **Campaigns**: 10 burst / 150 steady
- **Metrics**: 10 burst / 150 steady

## Response Headers
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Limit` - Total requests allowed in window
- `X-RateLimit-Retry-After` - Seconds until rate limit resets
- `Retry-After` - Seconds to wait before retrying (429 responses)

## Error Codes
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key or token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Special Endpoints

### Metric Aggregates Query
```javascript
POST /api/metric-aggregates/
{
  "data": {
    "type": "metric-aggregate",
    "attributes": {
      "metric_id": "METRIC_ID",
      "measurements": ["count", "unique", "sum_value"],
      "interval": "day", // hour, day, week, month
      "filter": "greater-or-equal(datetime,2024-01-01)",
      "group_by": ["campaign_id"],
      "timezone": "America/New_York"
    }
  }
}
```

### JavaScript SDK (Frontend)
```javascript
// Identify a user
_learnq.push(['identify', {
  '$email': 'user@example.com',
  '$first_name': 'John',
  '$last_name': 'Doe'
}]);

// Track an event
_learnq.push(['track', 'Viewed Product', {
  'ProductName': 'Example Product',
  'ProductID': '12345',
  'Price': 29.99
}]);
```

## Notes

1. **API Revision**: Always include the `revision` header with the latest API version
2. **Authentication**: Use API keys for server-side, OAuth for user-facing apps
3. **Relationships**: Use `include` parameter to fetch related resources in one call
4. **Filtering**: Use Klaviyo's filter syntax for complex queries
5. **Pagination**: Use cursor-based pagination for large datasets
6. **Rate Limiting**: Implement exponential backoff for 429 responses
7. **Bulk Operations**: Use bulk endpoints when creating multiple resources
8. **Metric Aggregates**: Use for analytics and reporting needs
9. **Client API**: Use for frontend/mobile implementations
10. **Webhooks**: Subscribe to real-time events from Klaviyo