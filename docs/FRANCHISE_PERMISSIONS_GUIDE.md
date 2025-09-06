# Franchise Permissions & Roles Guide

## Table of Contents
1. [Overview](#overview)
2. [Franchise Structure](#franchise-structure)
3. [Role Assignments](#role-assignments)
4. [Common Scenarios](#common-scenarios)
5. [Implementation Examples](#implementation-examples)
6. [Best Practices](#best-practices)
7. [Security & Compliance](#security--compliance)

## Overview

This guide details how to configure roles and permissions for franchise organizations using our multi-contract system. Franchises have unique requirements including brand consistency, multi-location management, and hierarchical oversight.

### Key Franchise Requirements
- **Brand Consistency**: Corporate control over templates and brand elements
- **Location Autonomy**: Individual locations manage their own campaigns
- **Regional Management**: Multi-tier hierarchy for large franchise networks
- **Agency Support**: External agencies can assist without compromising control
- **Compliance Tracking**: Ensure all locations follow brand guidelines

## Franchise Structure

### Typical Franchise Hierarchy

```
Master Franchisor (Corporate HQ)
├── Regional Managers (Multi-State/Province)
│   ├── Area Managers (City/County)
│   │   └── Individual Franchise Locations
│   └── Agency Partners (Optional)
└── Corporate Service Providers
    ├── Marketing Agency
    ├── Design Studio
    └── Compliance Team
```

### Contract Structure

#### 1. Master Contract (Franchisor)
- **Owner**: Franchise Corporate HQ
- **Billing**: Enterprise subscription
- **Features**: White-label, SSO, API access
- **Stores**: Master template store + regional stores

#### 2. Location Contracts (Franchisees)
- **Owner**: Individual franchisee
- **Parent Contract**: Links to Master Contract
- **Billing**: Individual or bundled through master
- **Stores**: One per physical location

## Role Assignments

### Corporate Level (Master Contract)

#### Franchise CEO/President
```javascript
{
  role: "owner",
  level: 100,
  contract_id: "master_contract_id",
  permissions: {
    stores: { create: true, edit: true, delete: true, manage_integrations: true },
    campaigns: { create: true, edit_all: true, approve: true, send: true, delete_all: true },
    brands: { create: true, edit: true, delete: true },
    team: { invite_users: true, remove_users: true, manage_roles: true },
    billing: { view: true, manage: true, purchase_credits: true },
    templates: { lock: true, unlock: true, enforce_brand: true }
  },
  capabilities: {
    canManageBilling: true,
    canDeleteContract: true,
    canCreateLocationContracts: true,
    canEnforceBrandCompliance: true
  }
}
```

#### Brand Manager
```javascript
{
  role: "admin",
  level: 80,
  contract_id: "master_contract_id",
  permissions: {
    stores: { create: false, edit: true, delete: false, manage_integrations: false },
    campaigns: { create: true, edit_all: true, approve: true, send: false, delete_all: false },
    brands: { create: true, edit: true, delete: false },
    team: { invite_users: true, remove_users: false, manage_roles: false },
    templates: { lock: true, enforce_brand: true, override_local: true }
  },
  store_access: "all_franchise_locations",
  template_control: {
    can_lock_sections: true,
    can_set_mandatory_elements: true,
    can_review_all_content: true
  }
}
```

#### Regional Manager
```javascript
{
  role: "manager",
  level: 60,
  contract_id: "master_contract_id",
  permissions: {
    stores: { create: false, edit: true, delete: false },
    campaigns: { create: true, edit_all: true, approve: true, send: true },
    analytics: { view_all: true, export: true, compare_locations: true }
  },
  store_access: [
    { region: "northeast", states: ["NY", "NJ", "CT", "MA"] },
    { store_ids: ["store_123", "store_456", "store_789"] }
  ],
  capabilities: {
    canApproveLocalCampaigns: true,
    canOverrideLocalDecisions: true,
    canGenerateRegionalReports: true
  }
}
```

### Franchise Location Level

#### Franchise Owner/Operator
```javascript
{
  role: "manager", 
  level: 60,
  contract_id: "location_contract_id",
  parent_contract_id: "master_contract_id",
  permissions: {
    stores: { edit: true, manage_integrations: false },
    campaigns: { create: true, edit_own: true, approve: false, send: true },
    brands: { edit: false }, // Cannot modify brand elements
    team: { invite_users: true, manage_store_access: true }
  },
  store_access: ["own_location_store_id"],
  template_restrictions: {
    must_use_approved_templates: true,
    can_modify_unlocked_sections: true,
    cannot_change_brand_elements: true
  }
}
```

#### Location Marketing Manager
```javascript
{
  role: "creator",
  level: 40,
  contract_id: "location_contract_id",
  permissions: {
    campaigns: { create: true, edit_own: true, requires_approval: true },
    ai: { generate_content: true, use_premium_models: false },
    analytics: { view_own: true }
  },
  content_restrictions: {
    must_follow_brand_guidelines: true,
    available_templates: ["promotional", "seasonal", "events"],
    locked_elements: ["logo", "tagline", "legal_footer"]
  }
}
```

### Agency Partner Support

#### Agency Account Manager (Supporting Multiple Franchises)
```javascript
{
  // Agency has seats in multiple franchise location contracts
  seats: [
    {
      contract_id: "location_001_contract",
      role: "creator",
      permissions: {
        campaigns: { create: true, edit_assigned: true },
        requires_approval: true
      },
      credit_limits: {
        isolated_credits: true, // Cannot share between locations
        monthly_limit: 500,
        billing_attribution: { contract_pays: true }
      }
    },
    {
      contract_id: "location_002_contract",
      role: "creator",
      // Same structure, different location
    }
  ]
}
```

## Common Scenarios

### Scenario 1: New Franchise Location Onboarding

**Situation**: Opening a new franchise location in Dallas, TX

**Steps**:
1. Corporate creates location contract linked to master
2. Assigns franchisee as location manager
3. Provides access to approved template library
4. Sets up regional manager oversight
5. Configures brand-locked elements

**Implementation**:
```javascript
async function onboardNewFranchiseLocation(locationData) {
  // 1. Create location contract
  const locationContract = await Contract.create({
    contract_name: `${locationData.city} - ${locationData.franchiseeName}`,
    parent_contract_id: masterContractId,
    owner_id: locationData.franchiseeUserId,
    features: {
      inherit_templates: true,
      inherit_brand_settings: true,
      location_identifier: locationData.storeNumber
    }
  });

  // 2. Create store for location
  const locationStore = await Store.create({
    name: locationData.storeName,
    contract_id: locationContract._id,
    parent_store_id: masterTemplateStoreId,
    hierarchy_settings: {
      inherit_templates: true,
      inherit_brand_settings: true,
      can_override: ["local_content", "promotions", "events"]
    }
  });

  // 3. Setup franchisee seat
  const franchiseeSeat = await ContractSeat.create({
    contract_id: locationContract._id,
    user_id: locationData.franchiseeUserId,
    default_role_id: managerRoleId,
    store_access: [{
      store_id: locationStore._id,
      role_id: managerRoleId
    }]
  });

  // 4. Grant regional manager oversight
  const regionalSeat = await ContractSeat.findOne({
    user_id: regionalManagerUserId,
    contract_id: masterContractId
  });
  
  regionalSeat.store_access.push({
    store_id: locationStore._id,
    role_id: reviewerRoleId,
    permission_overrides: {
      'campaigns:approve': true,
      'analytics:view_all': true
    }
  });
  
  await regionalSeat.save();

  // 5. Copy brand-locked templates
  await copyMasterTemplates(masterTemplateStoreId, locationStore._id, {
    lockLevel: 'brand_locked',
    allowedModifications: ['local_content', 'images', 'promotions']
  });

  return { contract: locationContract, store: locationStore };
}
```

### Scenario 2: Multi-Location Campaign Launch

**Situation**: Corporate wants to launch a nationwide promotion across all 500 locations

**Steps**:
1. Corporate creates master campaign template
2. Locks brand-critical elements
3. Pushes to all locations with customizable sections
4. Regional managers review and approve
5. Locations customize and launch

**Implementation**:
```javascript
async function launchNationwideCampaign(campaignData) {
  // 1. Create master template with locked sections
  const masterTemplate = await Template.create({
    name: campaignData.name,
    store_id: masterStoreId,
    lock_level: 'partial',
    locked_sections: ['header', 'brand_message', 'legal_footer'],
    editable_sections: ['local_offer', 'store_hours', 'local_images']
  });

  // 2. Distribute to all franchise locations
  const allLocationStores = await Store.find({
    parent_store_id: masterStoreId
  });

  const distribution = await Promise.all(
    allLocationStores.map(async (store) => {
      // Create location-specific campaign
      const localCampaign = await Campaign.create({
        template_id: masterTemplate._id,
        store_id: store._id,
        status: 'draft',
        requires_approval: true,
        approval_chain: [
          { role: 'regional_manager', status: 'pending' },
          { role: 'brand_manager', status: 'pending' }
        ]
      });

      // Notify location team
      await notifyStoreTeam(store._id, {
        type: 'new_campaign',
        campaign_id: localCampaign._id,
        deadline: campaignData.launchDate
      });

      return localCampaign;
    })
  );

  // 3. Setup monitoring dashboard for corporate
  await createCampaignDashboard({
    campaign_id: masterTemplate._id,
    tracked_locations: allLocationStores.map(s => s._id),
    metrics: ['customization_status', 'approval_status', 'launch_status']
  });

  return { template: masterTemplate, distributions: distribution };
}
```

### Scenario 3: Agency Partner Management

**Situation**: Franchise hires agency to manage social media for 50 underperforming locations

**Steps**:
1. Corporate approves agency partnership
2. Creates limited seats for agency team
3. Assigns specific locations with creator permissions
4. Sets up approval workflows
5. Implements credit limits and tracking

**Implementation**:
```javascript
async function setupAgencyPartnership(agencyData, targetLocations) {
  const agencySeats = [];

  // For each agency team member
  for (const agencyUser of agencyData.teamMembers) {
    // Create seats in each target location's contract
    for (const locationId of targetLocations) {
      const location = await Store.findById(locationId);
      
      const seat = await ContractSeat.create({
        contract_id: location.contract_id,
        user_id: agencyUser.userId,
        default_role_id: creatorRoleId,
        seat_type: 'contractor',
        
        // Limit access to specific areas
        store_access: [{
          store_id: locationId,
          role_id: creatorRoleId,
          permission_overrides: {
            'campaigns:delete': false,
            'brands:edit': false,
            'settings:manage': false
          },
          assigned_brands: ['social_media'] // Only social campaigns
        }],
        
        // Isolated credits per location
        credit_limits: {
          monthly_limit: 100,
          isolated_credits: true, // Critical for contractors
          billing_attribution: {
            contract_pays: true,
            agency_rate: agencyData.ratePerLocation,
            overage_rate: 0.10
          }
        },
        
        // Require approval for all content
        metadata: {
          requires_approval: 'true',
          approval_role: 'location_manager',
          agency_name: agencyData.name
        }
      });
      
      agencySeats.push(seat);
    }
  }

  // Setup monitoring for corporate
  await createAgencyDashboard({
    agency_id: agencyData.agencyId,
    monitored_seats: agencySeats.map(s => s._id),
    tracked_metrics: ['content_created', 'approvals_pending', 'credits_used']
  });

  return agencySeats;
}
```

### Scenario 4: Regional Performance Management

**Situation**: Regional manager needs to compare performance and ensure compliance across 25 locations

**Implementation**:
```javascript
async function regionalManagerDashboard(regionalManagerId, region) {
  // Get all stores in region
  const regionalStores = await Store.find({
    'hierarchy_settings.region': region,
    parent_store_id: masterStoreId
  });

  // Check manager's access
  const managerSeat = await ContractSeat.findOne({
    user_id: regionalManagerId,
    contract_id: masterContractId,
    'store_access.store_id': { $in: regionalStores.map(s => s._id) }
  });

  if (!managerSeat) {
    throw new Error('No access to regional stores');
  }

  // Aggregate performance metrics
  const performance = await Campaign.aggregate([
    { $match: { 
      store_id: { $in: regionalStores.map(s => s._id) },
      created_at: { $gte: thirtyDaysAgo }
    }},
    { $group: {
      _id: '$store_id',
      total_campaigns: { $sum: 1 },
      approved_campaigns: {
        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
      },
      compliance_score: { $avg: '$brand_compliance_score' }
    }}
  ]);

  // Check template compliance
  const compliance = await checkBrandCompliance(regionalStores);

  return {
    region,
    stores: regionalStores.length,
    performance,
    compliance,
    alerts: compliance.filter(c => c.score < 80)
  };
}
```

## Implementation Examples

### Setting Up Franchise Hierarchy

```javascript
class FranchiseHierarchy {
  async setupMasterFranchise(franchiseData) {
    // 1. Create master contract
    const masterContract = await Contract.create({
      contract_name: `${franchiseData.brandName} Master Franchise`,
      owner_id: franchiseData.corporateOwnerId,
      subscription: {
        tier: 'enterprise',
        features: {
          white_label: true,
          custom_domain: franchiseData.domain,
          sso_enabled: true,
          api_access: true,
          hierarchy_enabled: true
        }
      },
      stores: {
        max_allowed: franchiseData.estimatedLocations,
        price_per_additional: 50
      },
      ai_credits: {
        monthly_included: franchiseData.estimatedLocations * 100,
        rollover_enabled: true
      }
    });

    // 2. Create master template store
    const masterStore = await Store.create({
      name: `${franchiseData.brandName} Templates`,
      contract_id: masterContract._id,
      is_template_store: true,
      settings: {
        brand_guidelines: franchiseData.brandGuidelines,
        approved_assets: franchiseData.assetLibrary,
        compliance_rules: franchiseData.complianceRules
      }
    });

    // 3. Setup corporate team
    await this.setupCorporateTeam(masterContract._id, franchiseData.corporateTeam);

    // 4. Create regional structure
    await this.createRegionalStructure(masterContract._id, franchiseData.regions);

    return { contract: masterContract, templateStore: masterStore };
  }

  async addFranchiseLocation(locationData, masterContractId) {
    // Validate franchisee
    const franchisee = await User.findById(locationData.franchiseeId);
    if (!franchisee) {
      throw new Error('Franchisee user not found');
    }

    // Create location contract
    const locationContract = await Contract.create({
      contract_name: `${locationData.locationName} - ${locationData.city}`,
      owner_id: franchisee._id,
      parent_contract_id: masterContractId,
      subscription: {
        tier: 'franchise_location',
        bundled_with_parent: locationData.billingThroughMaster
      }
    });

    // Create location store with inheritance
    const locationStore = await Store.create({
      name: locationData.locationName,
      contract_id: locationContract._id,
      parent_store_id: masterTemplateStoreId,
      hierarchy_settings: {
        inherit_templates: true,
        inherit_brand_settings: true,
        location_identifier: locationData.storeNumber,
        region: locationData.region,
        can_override: ['local_promotions', 'store_hours', 'contact_info']
      }
    });

    // Grant appropriate access
    await this.setupLocationAccess(locationContract._id, locationStore._id, franchisee._id);

    return { contract: locationContract, store: locationStore };
  }
}
```

### Brand Compliance Enforcement

```javascript
class FranchiseBrandCompliance {
  async enforceTemplateCompliance(templateId, lockConfiguration) {
    const template = await Template.findById(templateId);
    
    // Apply brand locks
    template.locked_elements = {
      logo: {
        locked: true,
        value: lockConfiguration.brand.logo,
        enforcement: 'strict'
      },
      colors: {
        locked: true,
        primary: lockConfiguration.brand.primaryColor,
        secondary: lockConfiguration.brand.secondaryColor,
        enforcement: 'strict'
      },
      fonts: {
        locked: true,
        heading: lockConfiguration.brand.headingFont,
        body: lockConfiguration.brand.bodyFont,
        enforcement: 'strict'
      },
      tagline: {
        locked: true,
        value: lockConfiguration.brand.tagline,
        variations: lockConfiguration.brand.approvedTaglines,
        enforcement: 'strict'
      },
      legal_footer: {
        locked: true,
        value: lockConfiguration.brand.legalFooter,
        enforcement: 'strict'
      }
    };

    // Set editable sections
    template.editable_sections = [
      {
        id: 'local_promotion',
        constraints: {
          max_characters: 200,
          approved_keywords: lockConfiguration.approvedPromotionalTerms
        }
      },
      {
        id: 'store_information',
        required_fields: ['address', 'phone', 'hours']
      },
      {
        id: 'local_images',
        constraints: {
          max_images: 3,
          required_approval: true,
          must_include_store_exterior: true
        }
      }
    ];

    await template.save();
    
    // Propagate to all locations
    await this.propagateToLocations(template);
    
    return template;
  }

  async auditLocationCompliance(storeId) {
    const campaigns = await Campaign.find({ 
      store_id: storeId,
      created_at: { $gte: thirtyDaysAgo }
    });

    const violations = [];
    
    for (const campaign of campaigns) {
      // Check brand element usage
      const brandCheck = await this.checkBrandElements(campaign);
      if (!brandCheck.compliant) {
        violations.push({
          campaign_id: campaign._id,
          violations: brandCheck.violations,
          severity: brandCheck.severity
        });
      }

      // Check content guidelines
      const contentCheck = await this.checkContentGuidelines(campaign);
      if (!contentCheck.compliant) {
        violations.push({
          campaign_id: campaign._id,
          violations: contentCheck.violations,
          severity: contentCheck.severity
        });
      }
    }

    // Calculate compliance score
    const complianceScore = ((campaigns.length - violations.length) / campaigns.length) * 100;

    // Generate report
    const report = {
      store_id: storeId,
      period: { start: thirtyDaysAgo, end: new Date() },
      campaigns_reviewed: campaigns.length,
      violations: violations.length,
      compliance_score: complianceScore,
      critical_violations: violations.filter(v => v.severity === 'critical'),
      recommendations: this.generateRecommendations(violations)
    };

    // Notify if below threshold
    if (complianceScore < 80) {
      await this.notifyRegionalManager(storeId, report);
    }

    return report;
  }
}
```

## Best Practices

### 1. Hierarchical Permission Structure
- **Always** link location contracts to master contract
- **Use** parent_store_id for template inheritance
- **Implement** regional oversight through shared ContractSeats
- **Maintain** clear escalation paths for approvals

### 2. Brand Control
```javascript
const brandControlSettings = {
  mandatory_elements: {
    logo: { position: 'header', size: 'standard' },
    tagline: { position: 'header_below_logo' },
    legal: { position: 'footer', font_size: '10px' }
  },
  restricted_modifications: [
    'brand_colors',
    'official_fonts',
    'logo_alterations',
    'tagline_variations'
  ],
  approval_required_for: [
    'new_imagery',
    'promotional_claims',
    'pricing_changes',
    'legal_disclaimers'
  ]
};
```

### 3. Location Autonomy Balance
- **Allow** local promotions and events
- **Restrict** brand element modifications
- **Require** approval for compliance-sensitive content
- **Enable** quick local updates (hours, contact info)

### 4. Performance Monitoring
```javascript
const monitoringMetrics = {
  compliance: [
    'brand_guideline_adherence',
    'template_usage_rate',
    'approval_rejection_rate'
  ],
  performance: [
    'campaign_launch_frequency',
    'content_creation_speed',
    'regional_comparison'
  ],
  efficiency: [
    'time_to_approval',
    'revision_cycles',
    'support_tickets'
  ]
};
```

### 5. Scalability Considerations
- **Batch** operations for multi-location updates
- **Cache** template and brand assets at edge locations
- **Implement** progressive permission loading
- **Use** role-based dashboards to reduce queries

## Security & Compliance

### Data Isolation
```javascript
const franchiseDataIsolation = {
  // Each location's data is isolated
  store_data_access: 'own_store_only',
  
  // Regional managers see aggregated data
  regional_data_access: 'aggregated_only',
  
  // Customer data never shared between locations
  customer_data: 'strictly_isolated',
  
  // Financial data visible only to owners
  financial_data: 'owner_only'
};
```

### Audit Trail Requirements
```javascript
const auditConfiguration = {
  tracked_actions: [
    'template_modifications',
    'brand_element_overrides',
    'approval_decisions',
    'permission_changes',
    'location_onboarding'
  ],
  retention_period: '7_years',
  compliance_reports: 'quarterly',
  regulatory_requirements: ['FTC', 'local_advertising_laws']
};
```

### PII Protection
- Location customer data isolated per store
- No cross-location customer sharing
- Regional/Corporate see only aggregated metrics
- Implement data residency requirements per region

### Compliance Monitoring
```javascript
async function continuousComplianceMonitoring() {
  // Real-time monitoring
  const monitor = new ComplianceMonitor({
    check_frequency: 'hourly',
    alert_threshold: {
      critical: 'immediate',
      major: 'within_1_hour',
      minor: 'daily_digest'
    },
    monitored_elements: [
      'brand_guidelines',
      'legal_requirements',
      'promotional_accuracy',
      'pricing_consistency'
    ]
  });

  monitor.on('violation', async (violation) => {
    // Auto-remediate if possible
    if (violation.auto_fixable) {
      await monitor.autoRemediate(violation);
    } else {
      // Escalate to appropriate level
      await monitor.escalate(violation);
    }
  });

  return monitor;
}
```

## Franchise-Specific Features

### Template Library Management
- Master templates with version control
- Seasonal template releases
- Location-specific template variations
- Performance tracking per template

### Multi-Location Campaigns
- Simultaneous launch across locations
- Staggered rollouts by region
- A/B testing at location level
- Centralized performance dashboard

### Franchisee Support System
- Onboarding workflow automation
- Training content management
- Best practice sharing between locations
- Peer performance comparisons

### Revenue & Royalty Tracking
- Automatic royalty calculations
- Marketing fund contributions
- Location performance metrics
- Financial compliance monitoring

## Troubleshooting Common Issues

### Issue: Location Can't Access Templates
```javascript
// Check template inheritance
const diagnostic = await Store.findById(locationStoreId);
console.log('Parent store:', diagnostic.parent_store_id);
console.log('Inheritance settings:', diagnostic.hierarchy_settings);

// Verify permissions
const seat = await ContractSeat.findUserSeatForStore(userId, locationStoreId);
console.log('User role:', seat.default_role_id);
console.log('Template permissions:', seat.permissions.templates);
```

### Issue: Brand Elements Being Modified
```javascript
// Audit template locks
const template = await Template.findById(templateId);
console.log('Lock level:', template.lock_level);
console.log('Locked elements:', template.locked_elements);

// Check override permissions
const userRole = await Role.findById(user.role_id);
console.log('Can override locks:', userRole.permissions.templates.override_locks);
```

### Issue: Regional Manager Can't See All Locations
```javascript
// Verify store access configuration
const regionalSeat = await ContractSeat.findOne({
  user_id: regionalManagerId,
  contract_id: masterContractId
});
console.log('Store access:', regionalSeat.store_access);
console.log('Regional assignment:', regionalSeat.metadata.get('assigned_regions'));
```

## Migration from Legacy Systems

### From Single-Store to Franchise Model
```javascript
async function migrateToFranchiseModel(existingStoreId, franchiseConfig) {
  // 1. Create master contract
  const masterContract = await createMasterContract(franchiseConfig);
  
  // 2. Convert existing store to template store
  await convertToTemplateStore(existingStoreId, masterContract._id);
  
  // 3. Migrate existing users to new role structure
  await migrateUserRoles(existingStoreId, franchiseConfig.roleMapping);
  
  // 4. Setup location contracts for existing franchisees
  await setupLocationContracts(franchiseConfig.locations);
  
  // 5. Implement brand compliance rules
  await implementBrandCompliance(masterContract._id, franchiseConfig.brand);
  
  return masterContract;
}
```

## ROI Metrics & Reporting

### Franchise System KPIs
- **Brand Compliance Score**: 95%+ target
- **Template Adoption Rate**: 80%+ for approved templates
- **Time to Market**: 50% reduction in campaign launch time
- **Cost per Location**: 30% reduction through shared resources
- **Cross-Location Learning**: 25% improvement in best practice adoption

### Reporting Dashboards
- **Corporate Overview**: All locations, compliance, performance
- **Regional Comparison**: Region vs region metrics
- **Location Scorecard**: Individual location performance
- **Franchisee Portal**: Own location metrics and comparisons
- **Brand Health Monitor**: Real-time compliance tracking

---

*This guide is part of the comprehensive permissions documentation system. For related information, see the Agency and Enterprise guides.*