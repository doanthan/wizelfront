# Permissions Overview Matrix

## Quick Reference Guide

This document provides a comprehensive comparison of permission models across Franchises, Agencies, and Enterprise Teams, helping you quickly identify the right configuration for your organization.

## Business Model Comparison

| Aspect | Franchise | Agency | Enterprise |
|--------|-----------|---------|------------|
| **Structure** | Hierarchical (Corp → Regional → Location) | Flat/Project-based | Department-based |
| **Brand Control** | Strict enforcement | Per client | Department autonomy |
| **Billing Model** | Location-based or bundled | Client-based | Department budgets |
| **User Scale** | 50-500 per location | 10-100 total | 1000+ across departments |
| **External Access** | Limited agency support | Many contractors | Vendor integration |
| **Compliance** | Brand standards + local laws | Client requirements | Corporate governance |
| **Data Isolation** | By location | By client | By department |

## Universal Role Matrix

### Core Roles Across All Business Types

| Role | Level | Franchise Usage | Agency Usage | Enterprise Usage |
|------|-------|-----------------|--------------|------------------|
| **Owner** | 100 | Franchisor/Franchisee | Agency Owner | Department Head |
| **Admin** | 80 | Brand Manager | Account Director | Division Director |
| **Manager** | 60 | Regional Manager | Account Manager | Team Manager |
| **Creator** | 40 | Location Staff | Creative Team | Specialist |
| **Reviewer** | 30 | Compliance Team | QA Lead | Approval Chain |
| **Viewer** | 10 | Stakeholder | Client Access | Read-only User |

## Permission Comparison by Feature

### Campaign Management

| Permission | Franchise | Agency | Enterprise |
|------------|-----------|---------|------------|
| **Create** | Location: ✓ (with templates)<br/>Corporate: ✓ (master templates) | All creative roles: ✓<br/>Clients: ✗ | Department-based: ✓<br/>Contractors: Limited |
| **Edit** | Own location only<br/>Regional can edit multiple | Project-assigned only<br/>Isolated by client | Department scope<br/>Cross-dept with approval |
| **Approve** | Regional → Corporate chain | Account Manager → Client | Manager → Director chain |
| **Delete** | Corporate only | Account Director only | Department Head only |
| **Template Lock** | Brand elements locked | Client-specific locks | Department standards |

### Brand Management

| Permission | Franchise | Agency | Enterprise |
|------------|-----------|---------|------------|
| **Create Brand** | Corporate only | Per client contract | Department level |
| **Edit Brand** | Corporate only | With client approval | Brand team only |
| **Use Brand Assets** | All locations (enforced) | Project-specific | Department access |
| **Brand Compliance** | Automated + Regional review | Client guidelines | Corporate standards |

### Team Management

| Permission | Franchise | Agency | Enterprise |
|------------|-----------|---------|------------|
| **Invite Users** | Franchisee for location<br/>Corporate for regional | Project-based invites | Department managers |
| **Assign Roles** | Limited to location roles | Project-specific roles | Department hierarchy |
| **Remove Users** | Location owner<br/>Corporate override | Account Director | Department Head/HR |
| **Manage Access** | Store-specific | Client-isolated | Department-scoped |

### Analytics & Reporting

| Permission | Franchise | Agency | Enterprise |
|------------|-----------|---------|------------|
| **View Own** | All roles | All roles | All roles |
| **View Team** | Managers and above | Account team only | Department managers |
| **View All** | Regional/Corporate | Agency leadership | Department heads |
| **Export** | Regional and above | Account Manager+ | Manager+ with approval |
| **Financial** | Franchisee (own)<br/>Corporate (all) | Agency Owner | Department budget only |

### Billing & Credits

| Permission | Franchise | Agency | Enterprise |
|------------|-----------|---------|------------|
| **View Billing** | Franchisee (own)<br/>Corporate (all) | Owner only | Department heads |
| **Manage Billing** | Franchisee or Corporate | Owner only | Finance team |
| **Allocate Credits** | Corporate distributes | Per client project | Department allocation |
| **Purchase Credits** | Corporate bulk buy | Agency level | Centralized purchase |

## Contractor Management Comparison

### Franchise Contractors
```javascript
{
  access: "Limited to assigned locations",
  credits: "Isolated per location",
  duration: "Project-based",
  approval: "Required from Regional",
  billing: "To master contract",
  restrictions: "Cannot modify brand elements"
}
```

### Agency Contractors
```javascript
{
  access: "Client-specific isolation",
  credits: "Strictly isolated per client",
  duration: "Project or retainer",
  approval: "Not required if pre-approved",
  billing: "Per client/project",
  restrictions: "No cross-client access"
}
```

### Enterprise Contractors
```javascript
{
  access: "Department-specific",
  credits: "Department pool",
  duration: "Time-boxed (3-6 months)",
  approval: "Department head required",
  billing: "To cost center",
  restrictions: "No sensitive data access"
}
```

## Approval Workflows

### Franchise Approval Chain
```
Location Creator → Location Manager → Regional Manager → Corporate Brand
```

### Agency Approval Chain
```
Creative → Creative Director → Account Manager → Client
```

### Enterprise Approval Chain
```
Specialist → Team Manager → Department Director → VP (if >$50k)
```

## Data Access Patterns

### Franchise Data Access
| Role | Own Location | Regional | All Locations |
|------|--------------|----------|---------------|
| Location Staff | ✓ Full | ✗ | ✗ |
| Location Owner | ✓ Full | ✗ View | ✗ |
| Regional Manager | ✓ Full | ✓ Full | ✗ |
| Corporate | ✓ Full | ✓ Full | ✓ Full |

### Agency Data Access
| Role | Own Work | Team Projects | All Clients |
|------|----------|---------------|-------------|
| Creative | ✓ Full | ✓ Assigned | ✗ |
| Account Manager | ✗ | ✓ Full | ✗ |
| Account Director | ✗ | ✓ Multiple | ✗ |
| Agency Owner | ✓ Full | ✓ Full | ✓ Full |

### Enterprise Data Access
| Role | Own Work | Department | Cross-Department |
|------|----------|------------|------------------|
| Specialist | ✓ Full | ✓ View | ✗ |
| Manager | ✓ Full | ✓ Full | ✗ |
| Director | ✓ Full | ✓ Full | ✓ View |
| VP/C-Suite | ✓ Full | ✓ Full | ✓ Full |

## Credit & Budget Models

### Franchise Credit Model
```
Master Pool (Corporate)
    ├── Regional Allocation (30%)
    ├── Location Base Allocation (50%)
    └── Performance Bonus Pool (20%)
```

### Agency Credit Model
```
Agency Pool
    ├── Client A Allocation (Isolated)
    ├── Client B Allocation (Isolated)
    ├── Client C Allocation (Isolated)
    └── Internal/Pitch (5% reserve)
```

### Enterprise Credit Model
```
Enterprise Pool
    ├── Marketing (40%)
    ├── Sales (30%)
    ├── Product (20%)
    └── Innovation (10%)
```

## Security & Compliance Requirements

| Requirement | Franchise | Agency | Enterprise |
|-------------|-----------|---------|------------|
| **SSO** | Optional | Recommended | Required |
| **MFA** | Recommended | Required | Required |
| **Data Isolation** | By location | By client (strict) | By department |
| **Audit Logs** | 1 year | 3 years | 7 years |
| **GDPR** | If in EU | Per client need | Required |
| **SOC 2** | Optional | Recommended | Required |
| **IP Restrictions** | Optional | Per client | Required |

## Scalability Considerations

### Franchise Scalability
- **Seats**: 5-20 per location × number of locations
- **Storage**: 10GB per location
- **API Calls**: 10k/month per location
- **Customization**: Template-based

### Agency Scalability
- **Seats**: 10-100 team + unlimited contractors
- **Storage**: 50GB per client
- **API Calls**: 100k/month total
- **Customization**: Per client requirements

### Enterprise Scalability
- **Seats**: 1000-10,000+
- **Storage**: 1TB+ total
- **API Calls**: Unlimited with rate limiting
- **Customization**: Department-specific

## Implementation Timeframes

### Franchise Implementation
| Phase | Duration | Activities |
|-------|----------|------------|
| Setup | 1 week | Corporate structure, templates |
| Pilot | 2 weeks | 5-10 locations |
| Regional | 2 weeks | Regional managers, training |
| Full Rollout | 4 weeks | All locations |
| **Total** | **9 weeks** | Plus ongoing onboarding |

### Agency Implementation
| Phase | Duration | Activities |
|-------|----------|------------|
| Setup | 3 days | Agency structure |
| Team | 1 week | Internal team setup |
| First Client | 1 week | Pilot client |
| Full Migration | 2-4 weeks | All clients |
| **Total** | **4-6 weeks** | Faster for smaller agencies |

### Enterprise Implementation
| Phase | Duration | Activities |
|-------|----------|------------|
| Planning | 2 weeks | Requirements, governance |
| IT Setup | 2 weeks | SSO, security |
| Pilot Dept | 4 weeks | Single department |
| Phased Rollout | 12 weeks | All departments |
| **Total** | **20 weeks** | Varies by size |

## Cost Models

### Franchise Pricing Structure
```
Base Platform: $5,000/month (Corporate)
+ $99/month per location
+ $0.02 per AI credit
+ $25/month per additional seat
= Total: Scales with locations
```

### Agency Pricing Structure
```
Base Platform: $999/month
+ $199/month per client contract
+ $0.02 per AI credit
+ $25/month per seat (after 10)
= Total: Scales with clients
```

### Enterprise Pricing Structure
```
Base Platform: $10,000/month
+ $15/seat/month (volume pricing)
+ $0.01 per AI credit (bulk rate)
+ Custom integrations: Project-based
= Total: Predictable departmental
```

## Quick Decision Matrix

### Choose Franchise Model If:
- ✓ Multiple locations with same brand
- ✓ Need strict brand compliance
- ✓ Want template-based consistency
- ✓ Have regional management structure
- ✓ Require location P&L tracking

### Choose Agency Model If:
- ✓ Manage multiple client brands
- ✓ Need strict client data isolation
- ✓ Use many contractors/freelancers
- ✓ Bill by project/client
- ✓ Require white-label options

### Choose Enterprise Model If:
- ✓ Large internal teams (500+)
- ✓ Multiple departments/divisions
- ✓ Need enterprise integrations
- ✓ Require compliance (SOC 2, etc.)
- ✓ Want department budget control

## Migration Paths

### From Franchise to Enterprise
When franchise grows beyond 100 locations:
1. Maintain location hierarchy
2. Add departmental structure
3. Implement SSO and governance
4. Enhanced reporting and analytics

### From Agency to Enterprise
When agency becomes in-house:
1. Convert client contracts to departments
2. Migrate contractors to employees
3. Implement corporate governance
4. Integrate with enterprise systems

### From Enterprise to Multi-Model
Large enterprises with agencies/franchises:
1. Create hybrid contracts
2. Mixed permission models
3. Unified billing with sub-allocation
4. Consolidated reporting

## Support & Training Requirements

| Business Type | Onboarding | Training | Support Level | Documentation |
|---------------|------------|----------|---------------|----------------|
| **Franchise** | 2 days corporate<br/>4 hours location | Video library<br/>Regional workshops | Business hours<br/>Regional escalation | Operations manual<br/>Brand guidelines |
| **Agency** | 1 day setup<br/>2 hours per client | Online courses<br/>Best practices | 24/7 for emergencies<br/>Account manager | Client playbooks<br/>Process docs |
| **Enterprise** | 2 weeks IT<br/>1 week departments | Classroom training<br/>E-learning platform | 24/7 dedicated<br/>On-site available | Comprehensive wiki<br/>IT documentation |

## Recommended Integrations

### Franchise Integrations
- **POS Systems**: Square, Toast, Clover
- **Franchise Management**: FranConnect, Naranga
- **Local Marketing**: Google My Business, Facebook Local
- **Analytics**: Tableau, Power BI

### Agency Integrations
- **Project Management**: Monday, Asana, Basecamp
- **Time Tracking**: Harvest, Toggl
- **Creative Tools**: Adobe Creative Cloud, Figma
- **Client Portals**: Custom branded

### Enterprise Integrations
- **ERP**: SAP, Oracle, Microsoft Dynamics
- **CRM**: Salesforce, HubSpot
- **HR Systems**: Workday, ADP
- **BI Tools**: Tableau, Looker, Qlik

## Success Metrics by Business Type

### Franchise Success Metrics
- Brand compliance score: >95%
- Location adoption rate: >90%
- Time to market reduction: 50%
- Cross-location best practices: 25% improvement
- Cost per location: 30% reduction

### Agency Success Metrics
- Client satisfaction: >4.5/5
- Project profitability: >30% margin
- Resource utilization: >85%
- Client retention: >90%
- Time to delivery: 40% faster

### Enterprise Success Metrics
- User adoption: >80%
- Process efficiency: 60% improvement
- Compliance rate: 100%
- ROI: >3.5x
- Department satisfaction: >4/5

---

*This matrix is part of the comprehensive permissions documentation system. For detailed information, see the individual guides for [Franchises](./FRANCHISE_PERMISSIONS_GUIDE.md), [Agencies](./AGENCY_PERMISSIONS_GUIDE.md), and [Enterprise Teams](./ENTERPRISE_TEAMS_PERMISSIONS_GUIDE.md).*