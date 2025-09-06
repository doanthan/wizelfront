# Agency Permissions & Roles Guide

## Table of Contents
1. [Overview](#overview)
2. [Agency Business Models](#agency-business-models)
3. [Role Configurations](#role-configurations)
4. [Client Management](#client-management)
5. [Contractor & Freelancer Management](#contractor--freelancer-management)
6. [Implementation Examples](#implementation-examples)
7. [Billing & Credit Management](#billing--credit-management)
8. [Best Practices](#best-practices)
9. [Security & Client Isolation](#security--client-isolation)

## Overview

This guide details how digital agencies, marketing firms, and creative studios can leverage our multi-contract permission system to efficiently manage multiple clients, contractors, and internal teams while maintaining strict client data isolation and billing accuracy.

### Key Agency Requirements
- **Multi-Client Management**: Handle dozens of clients simultaneously
- **Contractor Flexibility**: Work with freelancers across multiple projects
- **Client Data Isolation**: Ensure complete separation of client data
- **Billing Attribution**: Accurate tracking of resource usage per client
- **Scalable Team Structure**: Grow from boutique to full-service agency
- **White-Label Options**: Present platform as agency's own tool

## Agency Business Models

### 1. Full-Service Digital Agency
```
Agency Owner (Master Contract)
├── Account Management Team
│   ├── Senior Account Managers
│   └── Account Coordinators
├── Creative Department
│   ├── Creative Directors
│   ├── Designers
│   └── Copywriters
├── Strategy Team
│   ├── Strategic Planners
│   └── Data Analysts
└── Client Contracts
    ├── Enterprise Clients (Managed Service)
    ├── Mid-Market Clients (Hybrid Service)
    └── Small Business Clients (Self-Service with Support)
```

### 2. Boutique Creative Studio
```
Studio Partners (Shared Ownership)
├── In-House Creatives
├── Preferred Contractors
└── Client Projects (Project-Based Contracts)
```

### 3. Marketing Consultancy
```
Principal Consultant
├── Associate Consultants
├── Implementation Specialists
├── Client Contractors (Embedded Teams)
└── Client Accounts (Advisory + Execution)
```

## Role Configurations

### Agency Leadership Roles

#### Agency Owner/CEO
```javascript
{
  role: "owner",
  level: 100,
  contract_id: "agency_master_contract",
  permissions: {
    stores: { create: true, edit: true, delete: true, manage_integrations: true },
    campaigns: { create: true, edit_all: true, approve: true, send: true, delete_all: true },
    ai: { generate_content: true, use_premium_models: true, unlimited_regenerations: true },
    brands: { create: true, edit: true, delete: true },
    team: { invite_users: true, remove_users: true, manage_roles: true, manage_store_access: true },
    analytics: { view_own: true, view_all: true, export: true, view_financial: true },
    billing: { view: true, manage: true, purchase_credits: true }
  },
  capabilities: {
    canManageAllClientContracts: true,
    canViewAllClientData: true,
    canManageAgencyBilling: true,
    canCreateClientContracts: true,
    canAssignTeamToClients: true
  },
  dashboard_access: ['agency_overview', 'client_performance', 'team_utilization', 'financial_summary']
}
```

#### Account Director
```javascript
{
  role: "admin",
  level: 80,
  contract_id: "agency_master_contract",
  permissions: {
    stores: { create: true, edit: true, delete: false, manage_integrations: true },
    campaigns: { create: true, edit_all: true, approve: true, send: true, delete_all: false },
    ai: { generate_content: true, use_premium_models: true, unlimited_regenerations: false },
    brands: { create: true, edit: true, delete: false },
    team: { invite_users: true, remove_users: false, manage_roles: true, manage_store_access: true },
    analytics: { view_own: true, view_all: true, export: true, view_financial: false },
    billing: { view: true, manage: false, purchase_credits: true }
  },
  client_management: {
    canCreateClientStores: true,
    canAssignTeamMembers: true,
    canApproveClientWork: true,
    canViewClientBilling: true,
    maxClientsManaged: 20
  }
}
```

### Client Service Roles

#### Account Manager
```javascript
{
  role: "manager",
  level: 60,
  // Has seats across multiple client contracts
  seats: [
    {
      contract_id: "client_a_contract",
      role: "manager",
      permissions: {
        stores: { edit: true },
        campaigns: { create: true, edit_all: true, approve: true, send: true },
        ai: { generate_content: true, use_premium_models: false },
        analytics: { view_all: true, export: true },
        team: { invite_users: false, manage_store_access: true }
      },
      credit_limits: {
        monthly_limit: 1000,
        isolated_credits: false, // Can use agency pool
        billing_attribution: {
          contract_pays: false, // Agency pays
          client_code: "CLIENT_A"
        }
      }
    },
    {
      contract_id: "client_b_contract",
      // Similar structure for Client B
    }
  ],
  client_restrictions: {
    cannotShareDataBetweenClients: true,
    requiresTimeTracking: true,
    maxConcurrentClients: 5
  }
}
```

#### Creative Lead
```javascript
{
  role: "creator",
  level: 40,
  permissions: {
    campaigns: { create: true, edit_own: true, edit_assigned: true },
    ai: { generate_content: true, use_premium_models: false },
    brands: { create: false, edit: false },
    analytics: { view_own: true }
  },
  creative_permissions: {
    canCreateTemplates: true,
    canModifyApprovedDesigns: false,
    requiresApprovalFrom: "creative_director",
    canAccessAssetLibrary: true
  },
  project_assignment: {
    assigned_clients: ["client_a", "client_b", "client_c"],
    assigned_campaigns: "by_project_manager",
    time_tracking_required: true
  }
}
```

### Contractor & Freelancer Roles

#### Freelance Designer (Multi-Agency Contractor)
```javascript
{
  user: "freelancer@design.com",
  contractor_seats: [
    {
      // Working for Agency A
      contract_id: "agency_a_master",
      role: "creator",
      seat_type: "contractor",
      credit_limits: {
        monthly_limit: 500,
        isolated_credits: true, // CRITICAL: Cannot share between agencies
        billing_attribution: {
          contract_pays: true,
          hourly_rate: 75,
          overage_rate: 0.15
        }
      },
      store_access: [
        { store_id: "agency_a_client_1", role: "creator" },
        { store_id: "agency_a_client_2", role: "creator" }
      ]
    },
    {
      // Working for Agency B (competitor)
      contract_id: "agency_b_master",
      role: "creator",
      seat_type: "contractor",
      credit_limits: {
        monthly_limit: 300,
        isolated_credits: true, // Separate credit pool
        billing_attribution: {
          contract_pays: true,
          hourly_rate: 80
        }
      },
      store_access: [
        { store_id: "agency_b_client_x", role: "creator" }
      ]
    }
  ],
  compliance: {
    data_isolation_enforced: true,
    cannot_transfer_assets_between_agencies: true,
    audit_trail_enabled: true
  }
}
```

## Client Management

### Setting Up New Client Accounts

```javascript
class AgencyClientManager {
  async onboardNewClient(clientData, agencyContractId) {
    // 1. Create client contract under agency
    const clientContract = await Contract.create({
      contract_name: `${clientData.companyName} - ${clientData.projectType}`,
      parent_contract_id: agencyContractId, // Links to agency
      owner_id: agencyOwnerId, // Agency owns the contract
      billing: {
        model: clientData.billingModel, // 'retainer', 'project', 'hourly'
        monthly_retainer: clientData.retainerAmount || 0,
        payment_terms: clientData.paymentTerms || 'net30'
      },
      features: {
        white_label: clientData.whiteLabel || false,
        client_portal_access: true,
        reporting_dashboard: true
      }
    });

    // 2. Create client store(s)
    const clientStore = await Store.create({
      name: clientData.companyName,
      contract_id: clientContract._id,
      settings: {
        brand_assets: clientData.brandAssets,
        industry: clientData.industry,
        target_audience: clientData.targetAudience
      }
    });

    // 3. Assign agency team to client
    const teamAssignments = await this.assignTeamToClient(
      clientContract._id,
      clientStore._id,
      clientData.assignedTeam
    );

    // 4. Set up client user access (if needed)
    if (clientData.clientUsers) {
      await this.setupClientPortalAccess(
        clientContract._id,
        clientStore._id,
        clientData.clientUsers
      );
    }

    // 5. Configure billing and credit allocation
    await this.setupClientBilling(clientContract._id, {
      creditAllocation: clientData.monthlyCredits,
      overageHandling: clientData.overagePolicy,
      invoicing: clientData.invoicingPreferences
    });

    return { contract: clientContract, store: clientStore, team: teamAssignments };
  }

  async assignTeamToClient(clientContractId, clientStoreId, teamMembers) {
    const assignments = [];

    for (const member of teamMembers) {
      // Check if team member already has seat in agency contract
      const agencySeat = await ContractSeat.findOne({
        user_id: member.userId,
        contract_id: agencyContractId
      });

      // Create or update seat for client contract
      let clientSeat = await ContractSeat.findOne({
        user_id: member.userId,
        contract_id: clientContractId
      });

      if (!clientSeat) {
        clientSeat = await ContractSeat.create({
          contract_id: clientContractId,
          user_id: member.userId,
          default_role_id: member.roleId,
          seat_type: 'agency_assigned',
          invited_by: agencyOwnerId,
          status: 'active'
        });
      }

      // Add store access
      clientSeat.store_access.push({
        store_id: clientStoreId,
        role_id: member.roleId,
        granted_by: agencyOwnerId,
        granted_at: new Date()
      });

      // Set credit limits based on role
      clientSeat.credit_limits = this.getCreditLimitsByRole(member.role);
      
      // Configure billing attribution
      clientSeat.credit_limits.billing_attribution = {
        contract_pays: false, // Agency pays
        client_code: clientContractId,
        track_usage: true
      };

      await clientSeat.save();
      assignments.push(clientSeat);
    }

    return assignments;
  }
}
```

### Multi-Client Campaign Management

```javascript
class MultiClientCampaignManager {
  async launchCampaignAcrossClients(campaignData, targetClients) {
    const campaigns = [];
    
    // Verify user has access to all target clients
    const userSeats = await ContractSeat.find({
      user_id: campaignData.createdBy,
      contract_id: { $in: targetClients.map(c => c.contractId) }
    });

    if (userSeats.length !== targetClients.length) {
      throw new Error('Insufficient access to all target clients');
    }

    for (const client of targetClients) {
      // Check user's role for this client
      const seat = userSeats.find(s => 
        s.contract_id.toString() === client.contractId
      );

      const hasPermission = await this.checkCampaignPermission(
        seat,
        'campaigns:create'
      );

      if (!hasPermission) {
        console.warn(`Skipping client ${client.name} - insufficient permissions`);
        continue;
      }

      // Create client-specific campaign
      const campaign = await Campaign.create({
        store_id: client.storeId,
        template_id: campaignData.templateId,
        name: `${campaignData.baseName} - ${client.name}`,
        content: this.customizeContent(campaignData.content, client),
        status: 'draft',
        created_by: campaignData.createdBy,
        requires_approval: client.requiresApproval || false,
        metadata: {
          campaign_group: campaignData.groupId,
          client_contract: client.contractId,
          billable_hours: campaignData.estimatedHours
        }
      });

      // Track credit usage per client
      await this.trackCreditUsage(
        seat,
        client.contractId,
        campaignData.creditsUsed
      );

      campaigns.push(campaign);
    }

    // Create unified dashboard for monitoring
    await this.createCampaignGroupDashboard({
      group_id: campaignData.groupId,
      campaigns: campaigns.map(c => c._id),
      created_by: campaignData.createdBy
    });

    return campaigns;
  }

  customizeContent(baseContent, client) {
    // Replace placeholders with client-specific content
    return baseContent
      .replace(/{{company_name}}/g, client.name)
      .replace(/{{industry}}/g, client.industry)
      .replace(/{{target_audience}}/g, client.targetAudience)
      .replace(/{{call_to_action}}/g, client.primaryCTA);
  }
}
```

## Contractor & Freelancer Management

### Contractor Isolation System

```javascript
class ContractorIsolationManager {
  async validateContractorAccess(contractorId, requestedAccess) {
    const contractor = await User.findById(contractorId);
    
    // Get all contractor's seats across different agencies
    const allSeats = await ContractSeat.find({
      user_id: contractorId,
      seat_type: 'contractor'
    });

    // Critical validations for contractors working with multiple agencies
    const validations = {
      creditIsolation: this.validateCreditIsolation(allSeats),
      dataIsolation: this.validateDataIsolation(allSeats),
      competitorCheck: await this.checkCompetitorConflicts(allSeats),
      complianceCheck: this.validateCompliance(allSeats)
    };

    // Ensure contractor cannot access data across agencies
    for (const seat of allSeats) {
      if (!seat.credit_limits.isolated_credits) {
        throw new Error('Contractor seats must have isolated credits');
      }

      // Verify store access is properly scoped
      for (const storeAccess of seat.store_access) {
        const store = await Store.findById(storeAccess.store_id);
        if (store.contract_id.toString() !== seat.contract_id.toString()) {
          throw new Error('Security violation: Store access outside contract scope');
        }
      }
    }

    return validations;
  }

  async trackContractorUsage(contractorId, action) {
    const seat = await ContractSeat.findOne({
      user_id: contractorId,
      contract_id: action.contractId,
      seat_type: 'contractor'
    });

    if (!seat) {
      throw new Error('No contractor seat found for this contract');
    }

    // Record usage for billing
    const usage = await ContractorUsage.create({
      contractor_id: contractorId,
      contract_id: action.contractId,
      action_type: action.type,
      credits_used: action.creditsUsed,
      time_spent: action.timeSpent,
      billable: true,
      hourly_rate: seat.credit_limits.billing_attribution.hourly_rate,
      timestamp: new Date()
    });

    // Update seat usage metrics
    seat.credit_limits.used_today += action.creditsUsed;
    seat.credit_limits.used_this_month += action.creditsUsed;

    // Check if over limit
    if (seat.credit_limits.used_this_month > seat.credit_limits.monthly_limit) {
      await this.handleOverage(seat, usage);
    }

    await seat.save();
    return usage;
  }

  async handleOverage(seat, usage) {
    const overage = seat.credit_limits.used_this_month - seat.credit_limits.monthly_limit;
    const overageCost = overage * seat.credit_limits.billing_attribution.overage_rate;

    // Create overage invoice item
    await BillingItem.create({
      contract_id: seat.contract_id,
      type: 'contractor_overage',
      description: `Contractor overage - ${usage.contractor_id}`,
      amount: overageCost,
      credits: overage,
      contractor_id: usage.contractor_id,
      period: new Date()
    });

    // Notify agency
    await this.notifyAgencyOfOverage(seat.contract_id, {
      contractor: usage.contractor_id,
      overage,
      cost: overageCost
    });
  }
}
```

### Freelancer Onboarding Workflow

```javascript
class FreelancerOnboarding {
  async onboardFreelancer(freelancerData, agencyContractId, clientAssignments) {
    // 1. Create or find freelancer user
    let freelancer = await User.findOne({ email: freelancerData.email });
    
    if (!freelancer) {
      freelancer = await User.create({
        email: freelancerData.email,
        name: freelancerData.name,
        role: 'contractor',
        status: 'pending_verification'
      });

      // Send onboarding email
      await this.sendOnboardingEmail(freelancer);
    }

    // 2. Create contractor seat in agency contract
    const agencySeat = await ContractSeat.create({
      contract_id: agencyContractId,
      user_id: freelancer._id,
      default_role_id: creatorRoleId,
      seat_type: 'contractor',
      credit_limits: {
        monthly_limit: freelancerData.monthlyCredits || 500,
        isolated_credits: true, // CRITICAL for contractors
        billing_attribution: {
          contract_pays: true,
          hourly_rate: freelancerData.hourlyRate,
          invoice_schedule: freelancerData.invoiceSchedule || 'biweekly',
          payment_method: freelancerData.paymentMethod
        }
      },
      metadata: new Map([
        ['contractor_type', freelancerData.type], // 'designer', 'copywriter', etc.
        ['skill_level', freelancerData.skillLevel],
        ['availability', freelancerData.availability],
        ['timezone', freelancerData.timezone]
      ])
    });

    // 3. Assign to specific client projects
    const assignments = [];
    for (const clientAssignment of clientAssignments) {
      // Add store access for each assigned client
      agencySeat.store_access.push({
        store_id: clientAssignment.storeId,
        role_id: clientAssignment.roleId || creatorRoleId,
        permission_overrides: clientAssignment.permissions || {},
        assigned_brands: clientAssignment.brands || [],
        granted_by: agencyOwnerId,
        granted_at: new Date()
      });

      // Track assignment for reporting
      assignments.push({
        client: clientAssignment.clientName,
        store: clientAssignment.storeId,
        role: clientAssignment.role,
        startDate: new Date(),
        estimatedHours: clientAssignment.estimatedHours
      });
    }

    await agencySeat.save();

    // 4. Setup time tracking and reporting
    await this.setupContractorTracking(freelancer._id, {
      trackingRequired: true,
      reportingFrequency: 'weekly',
      approvalRequired: true,
      approver: freelancerData.managerId
    });

    return { freelancer, seat: agencySeat, assignments };
  }

  async manageForeelancerPool(agencyContractId) {
    // Get all contractor seats for agency
    const contractors = await ContractSeat.find({
      contract_id: agencyContractId,
      seat_type: 'contractor',
      status: 'active'
    }).populate('user_id');

    // Analyze contractor utilization
    const utilization = await Promise.all(
      contractors.map(async (contractor) => {
        const usage = await this.calculateUtilization(contractor);
        return {
          contractor: contractor.user_id,
          utilization: usage.percentage,
          creditsUsed: usage.creditsUsed,
          hoursLogged: usage.hoursLogged,
          activeProjects: usage.activeProjects,
          availability: contractor.metadata.get('availability')
        };
      })
    );

    // Identify optimization opportunities
    const recommendations = {
      underutilized: utilization.filter(u => u.utilization < 30),
      overutilized: utilization.filter(u => u.utilization > 90),
      readyForMore: utilization.filter(u => 
        u.utilization < 70 && u.availability === 'full_time'
      )
    };

    return { contractors, utilization, recommendations };
  }
}
```

## Implementation Examples

### Complete Agency Setup

```javascript
class AgencySetup {
  async setupNewAgency(agencyData) {
    // 1. Create agency master contract
    const masterContract = await Contract.create({
      contract_name: agencyData.name,
      owner_id: agencyData.ownerId,
      type: 'agency_master',
      subscription: {
        tier: 'agency_pro',
        price_per_month: 999,
        features: {
          white_label: true,
          unlimited_clients: true,
          contractor_management: true,
          advanced_analytics: true,
          api_access: true,
          custom_integrations: true
        }
      },
      ai_credits: {
        monthly_included: 10000,
        rollover_enabled: true,
        purchase_rate: 0.02
      },
      billing: {
        seats: {
          included: 10,
          price_per_additional: 25
        }
      }
    });

    // 2. Create agency team structure
    const team = await this.createAgencyTeam(masterContract._id, agencyData.team);

    // 3. Setup initial client contracts
    const clients = await this.setupInitialClients(
      masterContract._id, 
      agencyData.existingClients
    );

    // 4. Configure integrations
    await this.setupIntegrations(masterContract._id, agencyData.integrations);

    // 5. Setup reporting dashboards
    await this.createAgencyDashboards(masterContract._id);

    return { contract: masterContract, team, clients };
  }

  async createAgencyTeam(contractId, teamStructure) {
    const createdTeam = {};

    // Create leadership seats
    for (const leader of teamStructure.leadership) {
      const seat = await ContractSeat.create({
        contract_id: contractId,
        user_id: leader.userId,
        default_role_id: leader.roleId,
        seat_type: 'included',
        credit_limits: {
          monthly_limit: 'unlimited',
          isolated_credits: false
        }
      });
      createdTeam[leader.title] = seat;
    }

    // Create department seats
    for (const dept of teamStructure.departments) {
      const deptSeats = [];
      for (const member of dept.members) {
        const seat = await ContractSeat.create({
          contract_id: contractId,
          user_id: member.userId,
          default_role_id: member.roleId,
          seat_type: member.seatType || 'included',
          credit_limits: this.getCreditLimitsByDepartment(dept.name),
          metadata: new Map([
            ['department', dept.name],
            ['reports_to', dept.leaderId]
          ])
        });
        deptSeats.push(seat);
      }
      createdTeam[dept.name] = deptSeats;
    }

    return createdTeam;
  }
}
```

### Client Billing & Resource Tracking

```javascript
class AgencyBillingManager {
  async calculateClientBilling(clientContractId, billingPeriod) {
    // Get all activity for client in period
    const clientActivity = await this.getClientActivity(
      clientContractId, 
      billingPeriod
    );

    // Calculate resource usage
    const resourceUsage = {
      campaigns_created: clientActivity.campaigns.length,
      ai_credits_used: clientActivity.totalCredits,
      team_hours: await this.calculateTeamHours(clientActivity),
      contractor_hours: await this.calculateContractorHours(clientActivity),
      storage_used: clientActivity.storageGB,
      api_calls: clientActivity.apiCalls
    };

    // Calculate costs
    const costs = {
      base_retainer: clientActivity.contract.monthly_retainer,
      additional_hours: this.calculateAdditionalHours(resourceUsage),
      ai_credits_overage: this.calculateCreditOverage(resourceUsage),
      contractor_fees: await this.calculateContractorFees(clientActivity),
      third_party_costs: await this.getThirdPartyCosts(clientContractId)
    };

    // Generate invoice
    const invoice = await Invoice.create({
      contract_id: clientContractId,
      period: billingPeriod,
      line_items: [
        { description: 'Monthly Retainer', amount: costs.base_retainer },
        { description: 'Additional Hours', amount: costs.additional_hours },
        { description: 'AI Credits Overage', amount: costs.ai_credits_overage },
        { description: 'Contractor Fees', amount: costs.contractor_fees },
        { description: 'Third Party Costs', amount: costs.third_party_costs }
      ],
      total: Object.values(costs).reduce((a, b) => a + b, 0),
      due_date: this.calculateDueDate(clientActivity.contract.payment_terms),
      status: 'pending'
    });

    // Generate detailed report
    const report = await this.generateClientReport({
      client: clientActivity.contract.name,
      period: billingPeriod,
      campaigns: clientActivity.campaigns,
      performance: await this.getPerformanceMetrics(clientActivity),
      resource_usage: resourceUsage,
      recommendations: await this.generateRecommendations(clientActivity)
    });

    return { invoice, report, resourceUsage };
  }

  async trackAgencyProfitability(agencyContractId, period) {
    const allClients = await Contract.find({ 
      parent_contract_id: agencyContractId 
    });

    const profitability = await Promise.all(
      allClients.map(async (client) => {
        const revenue = await this.getClientRevenue(client._id, period);
        const costs = await this.getClientCosts(client._id, period);
        
        return {
          client: client.name,
          revenue,
          costs,
          profit: revenue - costs.total,
          margin: ((revenue - costs.total) / revenue) * 100,
          breakdown: {
            team_costs: costs.team,
            contractor_costs: costs.contractors,
            platform_costs: costs.platform,
            overhead_allocation: costs.overhead
          }
        };
      })
    );

    // Calculate agency totals
    const totals = profitability.reduce((acc, client) => ({
      revenue: acc.revenue + client.revenue,
      costs: acc.costs + client.costs.total,
      profit: acc.profit + client.profit
    }), { revenue: 0, costs: 0, profit: 0 });

    return {
      period,
      clients: profitability,
      totals,
      average_margin: (totals.profit / totals.revenue) * 100,
      top_performers: profitability.sort((a, b) => b.profit - a.profit).slice(0, 5),
      needs_attention: profitability.filter(c => c.margin < 20)
    };
  }
}
```

## Billing & Credit Management

### Credit Pool Management

```javascript
class AgencyCreditManager {
  async manageAgencyCredits(agencyContractId) {
    const contract = await Contract.findById(agencyContractId);
    
    // Get all seats using agency credits
    const seats = await ContractSeat.find({
      contract_id: agencyContractId,
      'credit_limits.isolated_credits': false // Using shared pool
    });

    // Calculate total usage
    const totalUsage = seats.reduce((sum, seat) => 
      sum + seat.credit_limits.used_this_month, 0
    );

    // Check if approaching limit
    const usagePercentage = (totalUsage / contract.ai_credits.monthly_included) * 100;

    if (usagePercentage > 80) {
      // Alert and potentially throttle
      await this.alertHighUsage(agencyContractId, usagePercentage);
      
      // Implement smart throttling
      await this.implementSmartThrottling(seats, {
        priority_clients: await this.getPriorityClients(agencyContractId),
        throttle_percentage: Math.min((usagePercentage - 80) * 2, 50)
      });
    }

    // Optimize credit distribution
    const optimization = await this.optimizeCreditDistribution(seats, {
      total_available: contract.ai_credits.monthly_included,
      used_so_far: totalUsage,
      days_remaining: this.daysLeftInMonth(),
      historical_usage: await this.getHistoricalUsage(agencyContractId)
    });

    return {
      current_usage: totalUsage,
      available: contract.ai_credits.monthly_included - totalUsage,
      usage_percentage: usagePercentage,
      optimization_applied: optimization,
      projected_month_end: this.projectMonthEndUsage(seats)
    };
  }

  async allocateClientCredits(clientContractId, allocation) {
    // Set aside credits for specific client
    const clientSeats = await ContractSeat.find({
      contract_id: clientContractId
    });

    const totalClientAllocation = allocation.base + (allocation.buffer || 0);

    // Update each seat's limits
    for (const seat of clientSeats) {
      const roleWeight = this.getRoleWeight(seat.default_role_id);
      seat.credit_limits.monthly_limit = Math.floor(
        (totalClientAllocation * roleWeight) / clientSeats.length
      );
      
      // Set daily limits to prevent bursts
      seat.credit_limits.daily_limit = Math.ceil(
        seat.credit_limits.monthly_limit / 30
      );
      
      await seat.save();
    }

    // Track allocation for billing
    await CreditAllocation.create({
      contract_id: clientContractId,
      period: new Date(),
      allocated: totalClientAllocation,
      distribution: clientSeats.map(s => ({
        user: s.user_id,
        amount: s.credit_limits.monthly_limit
      }))
    });

    return { allocated: totalClientAllocation, seats: clientSeats.length };
  }
}
```

## Best Practices

### 1. Client Data Isolation

```javascript
const clientIsolationRules = {
  data_access: {
    rule: 'strict_isolation',
    enforcement: 'automatic',
    cross_client_sharing: 'prohibited',
    audit_logging: 'required'
  },
  
  asset_management: {
    client_assets: 'isolated_per_contract',
    shared_assets: 'agency_library_only',
    asset_transfer: 'requires_authorization',
    deletion_policy: 'retain_after_contract_end'
  },
  
  team_access: {
    default: 'no_access',
    granted_explicitly: true,
    time_limited: 'optional',
    revocation: 'immediate_on_removal'
  }
};
```

### 2. Contractor Management

```javascript
const contractorBestPractices = {
  onboarding: {
    verify_no_conflicts: true,
    require_nda: true,
    limit_initial_access: true,
    probation_period: '30_days'
  },
  
  access_control: {
    isolated_credits: 'always',
    project_based_access: true,
    time_boxed_permissions: 'recommended',
    cannot_invite_others: true
  },
  
  monitoring: {
    track_all_actions: true,
    usage_alerts: 'daily',
    unusual_activity_detection: true,
    regular_access_review: 'monthly'
  },
  
  offboarding: {
    immediate_access_revocation: true,
    asset_audit: 'required',
    knowledge_transfer: 'documented',
    final_invoice: 'within_7_days'
  }
};
```

### 3. Billing Accuracy

```javascript
const billingAccuracy = {
  time_tracking: {
    method: 'automatic_with_manual_override',
    granularity: '15_minute_increments',
    categorization: 'by_client_and_project',
    approval_required: true
  },
  
  credit_attribution: {
    track_per_action: true,
    client_code_required: true,
    real_time_updates: true,
    monthly_reconciliation: true
  },
  
  contractor_billing: {
    separate_tracking: true,
    markup_allowed: true,
    direct_costs_passed_through: true,
    detailed_invoices: true
  },
  
  reporting: {
    client_facing: 'monthly_summary',
    internal: 'real_time_dashboard',
    profitability: 'quarterly_analysis',
    forecasting: 'rolling_3_month'
  }
};
```

### 4. Team Efficiency

```javascript
const teamEfficiencyPractices = {
  resource_allocation: {
    skill_based_assignment: true,
    workload_balancing: 'automatic',
    availability_tracking: true,
    vacation_planning: 'integrated'
  },
  
  collaboration: {
    project_channels: 'per_client',
    knowledge_sharing: 'encouraged',
    template_library: 'shared',
    best_practices_wiki: true
  },
  
  automation: {
    repetitive_tasks: 'automated',
    approval_workflows: 'configurable',
    reporting: 'scheduled',
    client_onboarding: 'templated'
  },
  
  performance_tracking: {
    kpis: ['utilization', 'quality', 'client_satisfaction'],
    review_frequency: 'monthly',
    growth_planning: 'quarterly',
    training_budget: 'allocated'
  }
};
```

## Security & Client Isolation

### Data Security Architecture

```javascript
class AgencySecurityManager {
  async enforceClientIsolation() {
    // Implement row-level security
    const securityPolicies = {
      campaigns: {
        read: 'own_client_only',
        write: 'assigned_campaigns_only',
        delete: 'with_approval_only'
      },
      
      assets: {
        read: 'client_specific_and_agency_library',
        write: 'own_uploads_only',
        share: 'within_client_only'
      },
      
      analytics: {
        read: 'filtered_by_client_access',
        export: 'requires_permission',
        aggregate: 'anonymized_only'
      },
      
      user_data: {
        pii: 'encrypted_at_rest',
        access_logs: 'immutable',
        retention: 'per_client_contract',
        deletion: 'certified_process'
      }
    };

    return securityPolicies;
  }

  async auditClientAccess(userId, clientContractId) {
    // Comprehensive access audit
    const audit = {
      user: userId,
      client: clientContractId,
      timestamp: new Date(),
      
      access_check: await this.verifyLegitimateAccess(userId, clientContractId),
      
      data_accessed: await this.getAccessedData(userId, clientContractId, {
        period: 'last_30_days',
        include: ['campaigns', 'assets', 'analytics']
      }),
      
      actions_performed: await this.getUserActions(userId, clientContractId),
      
      anomalies: await this.detectAnomalies(userId, clientContractId),
      
      compliance_status: await this.checkCompliance(userId, clientContractId)
    };

    // Store audit trail
    await AuditLog.create(audit);

    // Alert if issues found
    if (audit.anomalies.length > 0 || !audit.compliance_status.passed) {
      await this.alertSecurityTeam(audit);
    }

    return audit;
  }
}
```

### Compliance & Auditing

```javascript
const complianceFramework = {
  gdpr: {
    data_minimization: true,
    purpose_limitation: true,
    consent_tracking: true,
    right_to_deletion: true,
    data_portability: true
  },
  
  ccpa: {
    opt_out_mechanism: true,
    data_sale_prohibition: true,
    disclosure_requirements: true
  },
  
  sox: {
    access_controls: 'documented',
    change_management: 'tracked',
    separation_of_duties: true
  },
  
  industry_specific: {
    healthcare: 'hipaa_compliance',
    financial: 'pci_dss',
    government: 'fedramp'
  }
};
```

## Reporting & Analytics

### Agency Performance Dashboards

```javascript
class AgencyDashboard {
  async generateExecutiveDashboard(agencyContractId) {
    return {
      overview: {
        active_clients: await this.getActiveClients(agencyContractId),
        monthly_revenue: await this.getMonthlyRevenue(agencyContractId),
        team_utilization: await this.getTeamUtilization(agencyContractId),
        project_pipeline: await this.getProjectPipeline(agencyContractId)
      },
      
      client_health: {
        satisfaction_scores: await this.getClientSatisfaction(agencyContractId),
        retention_rate: await this.getRetentionRate(agencyContractId),
        growth_opportunities: await this.identifyGrowthOpportunities(agencyContractId),
        at_risk_accounts: await this.identifyAtRiskAccounts(agencyContractId)
      },
      
      operational_efficiency: {
        average_project_duration: await this.getAverageProjectDuration(agencyContractId),
        resource_allocation: await this.getResourceAllocation(agencyContractId),
        bottlenecks: await this.identifyBottlenecks(agencyContractId),
        automation_opportunities: await this.findAutomationOpportunities(agencyContractId)
      },
      
      financial_metrics: {
        gross_margin: await this.getGrossMargin(agencyContractId),
        client_profitability: await this.getClientProfitability(agencyContractId),
        contractor_costs: await this.getContractorCosts(agencyContractId),
        forecast: await this.generateFinancialForecast(agencyContractId)
      }
    };
  }
}
```

## Migration & Integration

### Migrating from Other Systems

```javascript
class AgencyMigration {
  async migrateFromLegacySystem(legacyData) {
    const migration = {
      clients_migrated: 0,
      users_migrated: 0,
      campaigns_migrated: 0,
      errors: []
    };

    try {
      // 1. Create agency master contract
      const masterContract = await this.createMasterContract(legacyData.agency);
      
      // 2. Migrate team members
      const team = await this.migrateTeamMembers(
        legacyData.users, 
        masterContract._id
      );
      migration.users_migrated = team.length;
      
      // 3. Migrate clients
      for (const legacyClient of legacyData.clients) {
        const client = await this.migrateClient(
          legacyClient, 
          masterContract._id
        );
        migration.clients_migrated++;
        
        // 4. Migrate client campaigns
        const campaigns = await this.migrateCampaigns(
          legacyClient.campaigns,
          client.contractId
        );
        migration.campaigns_migrated += campaigns.length;
      }
      
      // 5. Setup billing and credits
      await this.setupBillingFromLegacy(masterContract._id, legacyData.billing);
      
    } catch (error) {
      migration.errors.push(error.message);
    }
    
    return migration;
  }
}
```

## Common Challenges & Solutions

### Challenge: Contractor Working for Competitors
**Solution**: Implement strict data isolation and monitor for conflicts
```javascript
const competitorProtection = {
  detection: 'automatic_conflict_checking',
  prevention: 'separate_workspaces',
  monitoring: 'activity_pattern_analysis',
  enforcement: 'immediate_access_revocation'
};
```

### Challenge: Client Wants Direct Platform Access
**Solution**: Create limited client portal with approval workflows
```javascript
const clientPortal = {
  access_level: 'viewer_with_approval_rights',
  visible_data: 'own_campaigns_only',
  actions_allowed: ['view', 'comment', 'approve'],
  billing_visibility: 'summary_only'
};
```

### Challenge: Scaling Beyond 50 Clients
**Solution**: Implement hierarchical team structure and automation
```javascript
const scalingStrategy = {
  team_structure: 'pods_per_industry',
  automation_level: 'high',
  client_segmentation: 'by_value_and_complexity',
  resource_pooling: 'shared_specialists'
};
```

---

*This guide is part of the comprehensive permissions documentation system. For related information, see the Franchise and Enterprise guides.*