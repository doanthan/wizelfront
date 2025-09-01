# Product Requirements Document (PRD)
# Stripe Billing Integration

## 1. Executive Summary

### 1.1 Overview
Implement a comprehensive billing system using Stripe to monetize the email marketing platform through subscription-based store reporting, AI credit consumption, and future add-on services.

### 1.2 Business Objectives
- **Primary Revenue Stream**: $29/month per store for reporting and analytics
- **Secondary Revenue Stream**: AI credits for email generation and recommendations
- **Future Revenue**: Add-on apps (Loyalty programs, Mobile wallet cards)
- **Target**: Seamless payment experience with automated billing and usage tracking

### 1.3 Success Metrics
- Conversion rate from free to paid accounts
- Average revenue per user (ARPU)
- AI credit consumption rate
- Churn rate < 5% monthly
- Payment success rate > 95%

## 2. Product Architecture

### 2.1 Billing Components

```
┌─────────────────────────────────────────────────────────────┐
│                     STRIPE BILLING SYSTEM                    │
├───────────────────┬────────────────────┬───────────────────┤
│   SUBSCRIPTIONS   │    USAGE-BASED     │   ADD-ON APPS    │
├───────────────────┼────────────────────┼───────────────────┤
│ Store Reporting   │   AI Credits       │  Loyalty (P3)     │
│ $29/store/month   │   Pay-as-you-go    │  Mobile Wallet(P3)│
└───────────────────┴────────────────────┴───────────────────┘
```

### 2.2 Database Schema

```javascript
// Billing Models
Store {
  stripe_subscription_id: String,
  stripe_customer_id: String,
  subscription_status: Enum['active','cancelled','past_due','trialing'],
  subscription_tier: Enum['free','pro','enterprise'],
  billing_email: String,
  trial_ends_at: Date,
}

User {
  stripe_customer_id: String,
  ai_credits_balance: Number,
  ai_credits_purchased: Number,
  ai_credits_used: Number,
  payment_methods: [PaymentMethod],
}

BillingHistory {
  user_id: ObjectId,
  store_id: ObjectId,
  stripe_invoice_id: String,
  amount: Number,
  currency: String,
  status: String,
  items: [{
    type: Enum['subscription','credits','addon'],
    description: String,
    quantity: Number,
    amount: Number
  }],
  created_at: Date,
}

AIUsageLog {
  user_id: ObjectId,
  store_id: ObjectId,
  action: Enum['generate_email','ai_recommendation','content_optimization'],
  credits_consumed: Number,
  metadata: Object,
  timestamp: Date,
}
```

## 3. Core Features

### 3.1 Subscription Management

#### 3.1.1 Store Subscriptions
**Feature**: Simple per-store billing at $29/month
**Requirements**:
- Each store requires individual subscription
- Pro-rated billing for mid-month upgrades
- Multiple stores per account supported
- Flat rate pricing: $29 per store (no complexity)
- Clear, predictable billing

**User Flow**:
1. User adds new store → Prompt for subscription
2. 14-day free trial offered
3. Card required upfront (or trial without card - TBD)
4. Auto-convert to paid after trial
5. Cancel anytime with access until period end

#### 3.1.2 Subscription States
- **Trial**: Full features, 14 days
- **Active**: Paid, full access
- **Past Due**: Grace period (3 days), limited features
- **Cancelled**: Read-only access to historical data
- **Paused**: Temporary suspension (vacation mode)

### 3.2 AI Credits System

#### 3.2.1 Credit Pricing
**Tiered Pricing Structure**:
```
$10 = 100 credits (10¢ per credit)
$25 = 275 credits (9¢ per credit) - 10% bonus
$50 = 600 credits (8.3¢ per credit) - 20% bonus
$100 = 1,300 credits (7.7¢ per credit) - 30% bonus
$250 = 3,500 credits (7.1¢ per credit) - 40% bonus
```

#### 3.2.2 Credit Consumption
**Email Generation**:
- Simple email: 1 credit
- Complex email with personalization: 2 credits
- Multi-variant campaign: 3 credits
- Full campaign series (5 emails): 10 credits

**AI Recommendations**:
- Content suggestions: 1 credit
- Audience segmentation: 2 credits
- Performance predictions: 1 credit

**Content Optimization**:
- Grammar/tone check: 0.5 credits
- Image suggestions: 1 credit
- A/B test variations: 2 credits

#### 3.2.3 Credit Management
- Credits never expire
- Sharable across all stores in account
- Real-time balance tracking
- Low balance alerts (< 10 credits)
- Auto-refill option available

### 3.3 Payment Processing

#### 3.3.1 Supported Payment Methods
- Credit/Debit Cards (Visa, Mastercard, Amex, Discover)
- ACH/Bank transfers (for Enterprise)
- Stripe Link
- Apple Pay / Google Pay
- Invoice billing (Enterprise only)

#### 3.3.2 Billing Cycles
- Monthly billing (default)
- Annual billing (2 months free - 17% discount)
- Custom billing for Enterprise

#### 3.3.3 Tax Handling
- Automatic tax calculation via Stripe Tax
- VAT/GST compliance
- Tax exemption certificates support
- Invoices with proper tax documentation

### 3.4 Billing Portal

#### 3.4.1 Customer Portal Features
- View/download invoices
- Update payment methods
- Change subscription plans
- Manage store subscriptions
- Purchase AI credits
- View usage history
- Cancel/pause subscriptions

#### 3.4.2 Admin Dashboard
- Revenue analytics
- Subscription metrics
- Credit usage patterns
- Failed payment tracking
- Churn analysis
- Customer lifetime value

## 4. Technical Implementation

### 4.1 Stripe Integration Points

#### 4.1.1 Core Webhooks
```javascript
// Critical webhooks to implement
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- customer.subscription.trial_will_end
- invoice.payment_succeeded
- invoice.payment_failed
- payment_method.attached
- payment_method.detached
- checkout.session.completed
- charge.succeeded
- charge.failed
```

#### 4.1.2 API Endpoints
```javascript
// Subscription Management
POST   /api/billing/subscribe
POST   /api/billing/cancel
POST   /api/billing/pause
POST   /api/billing/resume
PUT    /api/billing/update-plan
GET    /api/billing/subscription/:storeId

// Credit Management
POST   /api/billing/credits/purchase
GET    /api/billing/credits/balance
GET    /api/billing/credits/history
POST   /api/billing/credits/refill

// Payment Methods
POST   /api/billing/payment-method/add
DELETE /api/billing/payment-method/:id
PUT    /api/billing/payment-method/default

// Billing Portal
POST   /api/billing/create-portal-session
GET    /api/billing/invoices
GET    /api/billing/usage

// Webhooks
POST   /api/stripe/webhook
```

### 4.2 Security Requirements

#### 4.2.1 PCI Compliance
- Never store card details directly
- Use Stripe Elements or Checkout
- Implement 3D Secure for high-risk transactions
- Token-based payment method storage

#### 4.2.2 Webhook Security
- Verify webhook signatures
- Idempotent event processing
- Retry logic for failures
- Event log auditing

#### 4.2.3 Permission Controls
- Only account owners can manage billing
- Admins can view billing information
- Credit usage visible to all team members
- Invoice access restricted by role

### 4.3 Error Handling

#### 4.3.1 Payment Failures
- Automatic retry schedule (1, 3, 5, 7 days)
- Email notifications at each retry
- In-app notifications
- Grace period before service suspension
- Dunning email sequence

#### 4.3.2 Subscription Issues
- Clear error messaging
- Fallback payment methods
- Manual intervention options
- Support ticket auto-creation for critical issues

## 5. User Experience

### 5.1 Onboarding Flow

```
New User → Free Trial (14 days) → Payment Method → Active Subscription
    ↓                                    ↓
No Card Required            OR     Card Required Upfront
    ↓                                    ↓
Limited Features                   Full Features
```

### 5.2 Upgrade Prompts

**Trigger Points**:
- Reaching usage limits
- Attempting premium features
- Trial expiration approaching
- AI credit balance low
- Multi-store management needed

### 5.3 Pricing Page

**Required Elements**:
- Clear pricing tiers
- Feature comparison table
- Credit packages
- FAQ section
- Currency selector
- Annual vs Monthly toggle
- Enterprise contact form

### 5.4 Notifications

**Email Notifications**:
- Subscription confirmation
- Payment receipt
- Failed payment alert
- Trial ending reminder (3 days, 1 day)
- Credit balance low
- Subscription renewal
- Plan changes

**In-App Notifications**:
- Real-time credit balance
- Subscription status changes
- Payment method issues
- Usage limit warnings

## 6. Analytics & Reporting

### 6.1 Key Metrics

**Revenue Metrics**:
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (CLV)
- Revenue by product line

**Usage Metrics**:
- AI credits consumption rate
- Feature usage by plan
- Store activation rate
- Credit purchase patterns

**Subscription Metrics**:
- Conversion rate (trial to paid)
- Churn rate
- Upgrade/downgrade rate
- Payment failure rate
- Recovery rate

### 6.2 Dashboards

**Customer Dashboard**:
- Current subscription status
- Credit balance and usage
- Billing history
- Next payment date
- Usage statistics

**Admin Dashboard**:
- Revenue trends
- Subscription analytics
- Credit sales analytics
- Failed payment tracking
- Customer segments

## 7. Future Enhancements (Phase 2-3)

### 7.1 Phase 2 - Advanced Features
- Team billing (seats-based pricing)
- Usage-based tiers for API calls
- Referral program with credit rewards
- Partner/Agency pricing models
- White-label billing options

### 7.2 Phase 3 - Add-on Apps

**Loyalty Program App** ($19/month):
- Points management
- Reward campaigns
- Customer tiers
- Analytics dashboard

**Mobile Wallet Cards** ($15/month):
- Apple Wallet passes
- Google Pay passes
- Push notifications
- Dynamic updates
- QR code generation

**Other Potential Add-ons**:
- SMS credits
- Advanced analytics ($10/month)
- Priority support ($25/month)
- Custom integrations
- Additional storage

## 8. Migration & Rollout

### 8.1 Phases

**Phase 1 - Foundation** (Week 1-2):
- Stripe account setup
- Basic subscription integration
- Payment processing
- Webhook handling

**Phase 2 - Core Features** (Week 3-4):
- Customer portal
- Credit system
- Billing management
- Trial handling

**Phase 3 - Polish** (Week 5-6):
- Analytics integration
- Email notifications
- Error handling
- Testing & QA

### 8.2 Testing Requirements

**Unit Tests**:
- Payment processing logic
- Credit calculation
- Subscription state management
- Webhook processing

**Integration Tests**:
- Stripe API interactions
- Database updates
- Email notifications
- Permission checks

**End-to-End Tests**:
- Complete purchase flow
- Subscription lifecycle
- Credit purchase and usage
- Billing portal access

### 8.3 Launch Checklist

**Pre-Launch**:
- [ ] Stripe account verified
- [ ] Tax settings configured
- [ ] Webhook endpoints secured
- [ ] Test mode fully tested
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Legal terms updated
- [ ] Refund policy defined

**Launch Day**:
- [ ] Switch to production keys
- [ ] Monitor webhook events
- [ ] Track first transactions
- [ ] Support team on standby
- [ ] Analytics tracking confirmed

**Post-Launch**:
- [ ] Daily revenue monitoring
- [ ] Failed payment tracking
- [ ] Customer feedback collection
- [ ] Performance optimization
- [ ] Feature usage analysis

## 9. Legal & Compliance

### 9.1 Requirements
- Terms of Service update
- Privacy Policy update
- Refund policy (30-day money back)
- Auto-renewal disclosures
- Tax compliance
- GDPR compliance for EU customers
- PCI DSS compliance

### 9.2 Dispute Handling
- Chargeback process
- Refund authorization levels
- Dispute documentation
- Fraud detection rules

## 10. Support Documentation

### 10.1 Customer Documentation
- Billing FAQ
- How to update payment method
- How to cancel subscription
- Understanding credits
- Downloading invoices
- Troubleshooting payment issues

### 10.2 Internal Documentation
- Stripe dashboard guide
- Webhook troubleshooting
- Refund procedures
- Subscription management
- Revenue reporting

## 11. Success Criteria

### 11.1 Launch Success (Month 1)
- 100+ successful transactions
- < 2% payment failure rate
- < 5% support tickets about billing
- 50%+ trial to paid conversion

### 11.2 Growth Success (Month 3)
- $10K+ MRR
- 200+ active subscriptions
- 30%+ users purchasing credits
- < 3% monthly churn

### 11.3 Scale Success (Month 6)
- $50K+ MRR
- 1000+ active subscriptions
- Add-on apps launched
- < 2% monthly churn

## Appendix A: Technical Specifications

### API Rate Limits
- 100 requests per minute per user
- 1000 webhook events per hour
- Exponential backoff for retries

### Data Retention
- Transaction history: 7 years
- Usage logs: 2 years
- Audit logs: 1 year
- Temporary data: 90 days

### Performance Requirements
- Payment processing: < 3 seconds
- Portal loading: < 2 seconds
- Credit balance update: Real-time
- Webhook processing: < 500ms

## Appendix B: Pricing Comparison

| Feature | Free | Pro ($29/store) | Enterprise |
|---------|------|-----------------|------------|
| Stores | 1 (limited) | Unlimited | Unlimited |
| AI Credits | 10/month | Pay-as-you-go | Volume pricing |
| Analytics | Basic | Advanced | Custom |
| Support | Community | Email | Priority |
| API Access | No | Yes | Yes |
| Custom Integration | No | No | Yes |
| Invoice Billing | No | No | Yes |
| SLA | No | No | 99.9% |

## Appendix C: Error Codes

```javascript
BILLING_ERRORS = {
  'insufficient_funds': 'Payment method has insufficient funds',
  'card_declined': 'Card was declined',
  'expired_card': 'Card has expired',
  'invalid_payment_method': 'Payment method is invalid',
  'subscription_not_found': 'Subscription does not exist',
  'credits_insufficient': 'Insufficient AI credits',
  'trial_already_used': 'Trial already used for this account',
  'webhook_signature_invalid': 'Invalid webhook signature',
  'customer_not_found': 'Stripe customer not found',
  'invoice_not_found': 'Invoice not found'
}
```