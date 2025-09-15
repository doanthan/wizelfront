# Wizel - E-commerce Marketing Analytics Platform

## Project Overview
Wizel is a comprehensive SaaS platform for e-commerce businesses that provides marketing campaign analytics, email automation, and multi-channel campaign management. The platform integrates with Klaviyo for marketing automation and Shopify for e-commerce data, offering businesses a unified dashboard to track and optimize their marketing performance.

## Tech Stack
- **Frontend**: Next.js 15.5.2 (App Router), React 19.1.0, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with JWT strategy
- **Integrations**: 
  - Klaviyo (OAuth 2.0 + API Key support)
  - Shopify (via API)
  - Stripe (for billing)
- **Cloud Storage**: AWS S3 (for assets)
- **UI Components**: Radix UI primitives, custom component library
- **Charts/Analytics**: Recharts for data visualization

## Core Features

### 1. Multi-Store Management
- Support for multiple e-commerce stores per account
- Store hierarchy (parent/child stores for franchises)
- Team collaboration with role-based permissions
- Contract-based seat management for enterprise clients

### 2. Klaviyo Integration
- OAuth 2.0 authentication with PKCE flow
- Automatic token refresh mechanism
- Support for both standard and custom metrics
- Campaign and flow performance tracking
- Audience segmentation
- Real-time sync of marketing data
- Separate conversion and reporting metrics configuration

### 3. Analytics Dashboard
- Campaign performance metrics (open rates, click rates, conversions)
- Flow analytics and automation tracking
- Revenue attribution across channels (Email, SMS, Push)
- Time-series data visualization
- Account comparison tools
- Custom date range selection with period comparisons

### 4. Campaign Calendar
- Visual calendar view of scheduled campaigns
- Campaign scheduling and management
- Performance preview for each campaign
- Multi-channel campaign support

### 5. Web Feeds Management
- Create and manage product feeds for marketing campaigns
- Dynamic content generation
- Image optimization and caching
- Integration with Klaviyo's web feed API

### 6. Field Mapping Interface
- Visual JSON field mapping tool
- Drag-and-drop style connections
- Support for nested data structures
- Real-time preview of mapped fields

### 7. AI-Powered Features
- Chat assistant for dashboard analytics
- Support ticket system
- Content generation capabilities (planned)

## Data Models

### Core Entities
- **User**: Authentication, profiles, super admin support
- **Store**: E-commerce store configuration, integrations
- **Contract**: Enterprise licensing and seat management
- **ContractSeat**: User access to stores within contracts
- **KlaviyoSync**: Tracks sync status for Klaviyo accounts
- **CampaignStat**: Campaign performance metrics
- **WebFeed**: Product feed configurations

### Integration Models
- OAuth token management with refresh capabilities
- API key storage (encrypted in production)
- Webhook handling for real-time updates

## Design System
- **Color Palette**: Sky blue (#60A5FA) to vivid violet (#8B5CF6) gradients
- **Typography**: Roboto font family
- **Components**: Consistent design language across all UI elements
- **Dark Mode**: Full dark mode support
- **Responsive**: Mobile-first responsive design

## Security & Permissions
- Role-based access control (RBAC)
- Contract-based seat licensing
- Store-level permissions
- Secure OAuth token storage
- API key encryption

## Key API Endpoints
- `/api/auth/*` - Authentication flows
- `/api/store/*` - Store management
- `/api/klaviyo/*` - Klaviyo integration
- `/api/calendar/*` - Campaign calendar
- `/api/webfeeds/*` - Web feed management
- `/api/chat/*` - AI chat and support

## Development Features
- Hot module replacement
- TypeScript support (partial)
- ESLint configuration
- Centralized error handling
- Logging and monitoring setup
- Environment-based configuration

## Business Model
- SaaS subscription (via Stripe)
- Multi-tier pricing (Free, Pro, Enterprise)
- Contract-based enterprise licensing
- Usage-based billing for certain features

## Current Status
The platform is in active development with core features implemented:
- ✅ Multi-store management
- ✅ Klaviyo OAuth integration
- ✅ Basic analytics dashboard
- ✅ Campaign calendar
- ✅ Web feeds
- ✅ Field mapping interface
- ✅ AI chat widget
- 🚧 Advanced reporting (in progress)
- 🚧 Email template builder (planned)

## Target Users
- E-commerce businesses using Shopify
- Marketing teams managing multiple brands
- Agencies handling multiple client accounts
- Enterprise retailers with franchise operations

## Unique Value Proposition
Wizel provides a unified platform that bridges the gap between e-commerce data and marketing automation, offering deeper insights than native Klaviyo analytics while maintaining ease of use for non-technical marketers.