"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { AccountSelector } from "@/app/components/ui/account-selector"
import { DateRangeSelector } from "@/app/components/ui/date-range-selector"
import { Loading } from "@/app/components/ui/loading"
import { useStores } from "@/app/contexts/store-context"
import { useCampaignData } from "@/app/contexts/campaign-data-context"
import { useAI } from "@/app/contexts/ai-context"

// Import tab components
import RevenueTab from "./components/RevenueTab"
import CampaignsTab from "./components/CampaignsTab"
import FlowsTab from "./components/FlowsTab"
import DeliverabilityTab from "./components/DeliverabilityTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

export default function AnalyticsPage() {
    const searchParams = useSearchParams()
    const { stores } = useStores()
    const { updateAIState } = useAI()
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'revenue')
    
    // Use shared campaign data context
    const { getCampaignData, loading: contextLoading, errors: contextErrors } = useCampaignData()
    const [campaignsData, setCampaignsData] = useState(null)
    const [campaignsLoading, setCampaignsLoading] = useState(false)
    const [campaignsError, setCampaignsError] = useState(null)
    
    const [dateRangeSelection, setDateRangeSelection] = useState({
        period: "last90",
        comparisonType: "previous-period",
        ranges: {
            main: {
                start: new Date('2025-06-11T00:00:00.000Z'),
                end: new Date('2025-09-09T00:00:00.000Z'),
                label: "Past 90 days"
            },
            comparison: {
                start: new Date('2025-03-14T00:00:00.000Z'),
                end: new Date('2025-06-11T00:00:00.000Z'),
                label: "Previous Period"
            }
        }
    })
    
    // Load from localStorage after mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('analyticsDateRange')
            if (saved) {
                const parsed = JSON.parse(saved)
                // Convert date strings back to Date objects
                if (parsed.ranges?.main) {
                    parsed.ranges.main.start = new Date(parsed.ranges.main.start)
                    parsed.ranges.main.end = new Date(parsed.ranges.main.end)
                }
                if (parsed.ranges?.comparison) {
                    parsed.ranges.comparison.start = new Date(parsed.ranges.comparison.start)
                    parsed.ranges.comparison.end = new Date(parsed.ranges.comparison.end)
                }
                setDateRangeSelection(parsed)
            } else {
                // Set dynamic dates after mount
                const now = new Date()
                const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                const last180Days = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
                
                setDateRangeSelection({
                    period: "last90",
                    comparisonType: "previous-period",
                    ranges: {
                        main: {
                            start: last90Days,
                            end: now,
                            label: "Past 90 days"
                        },
                        comparison: {
                            start: last180Days,
                            end: last90Days,
                            label: "Previous Period"
                        }
                    }
                })
            }
        } catch (e) {
            console.warn('Failed to load analytics date range from localStorage:', e)
        }
    }, [])
    
    // Account selection state - smart selector that preserves removed accounts
    const [selectedAccounts, setSelectedAccounts] = useState([{ value: 'all', label: 'View All' }])
    
    // Load selected accounts from localStorage after mount
    useEffect(() => {
        const savedAccounts = localStorage.getItem('analyticsSelectedAccounts')
        console.log('Loading analytics accounts from localStorage:', savedAccounts)
        if (savedAccounts) {
            try {
                const parsed = JSON.parse(savedAccounts)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Remove duplicates based on value property
                    const uniqueAccounts = parsed.filter((account, index, self) =>
                        index === self.findIndex(a => a.value === account.value)
                    )
                    console.log('Parsed accounts:', parsed.length, 'Unique accounts:', uniqueAccounts.length)
                    setSelectedAccounts(uniqueAccounts)
                }
            } catch (e) {
                console.error('Error parsing saved accounts:', e)
            }
        }
    }, [])
    
    // Keep track of all accounts ever seen (for smart persistence)
    const [allKnownAccounts, setAllKnownAccounts] = useState({})
    
    // Load known accounts from localStorage after mount
    useEffect(() => {
        const savedKnown = localStorage.getItem('analyticsKnownAccounts')
        if (savedKnown) {
            try {
                setAllKnownAccounts(JSON.parse(savedKnown))
            } catch (e) {
                console.error('Error parsing known accounts:', e)
            }
        }
    }, [])
    
    const [isAccountsInitialized, setIsAccountsInitialized] = useState(false)
    
    // Compute available accounts reactively from stores - aligned with dashboard
    const availableAccounts = useMemo(() => {
        if (!stores || stores.length === 0) {
            return []
        }

        // Build accounts from stores - each store is an account (matching dashboard)
        const accounts = []
        const tagsSet = new Set()

        stores.forEach(store => {
            // Add store as an account using store's public_id (same as dashboard)
            const hasKlaviyo = store.klaviyo_integration?.public_id
            accounts.push({
                value: store.public_id || store._id,
                label: `${store.name}${hasKlaviyo ? '' : ' (No Klaviyo)'}`,
                klaviyo: store.klaviyo_integration?.public_id,
                storeTags: store.storeTags || [],
                hasKlaviyo: !!hasKlaviyo
            })

            // Collect all unique tags
            if (store.storeTags && Array.isArray(store.storeTags)) {
                store.storeTags.forEach(tag => tagsSet.add(tag))
            }
        })

        // Add tag groupings at the beginning
        const tagAccounts = Array.from(tagsSet).map(tag => ({
            value: `tag:${tag}`,
            label: `${tag} (Tag)`,
            isTag: true
        }))

        const currentAccounts = [...tagAccounts, ...accounts]
        
        // Update known accounts with any new ones
        const newKnownAccounts = { ...allKnownAccounts }
        let hasNewAccounts = false
        currentAccounts.forEach(account => {
            if (!newKnownAccounts[account.value]) {
                newKnownAccounts[account.value] = account
                hasNewAccounts = true
            }
        })
        
        if (hasNewAccounts) {
            setAllKnownAccounts(newKnownAccounts)
            if (typeof window !== 'undefined') {
                localStorage.setItem('analyticsKnownAccounts', JSON.stringify(newKnownAccounts))
            }
        }
        
        return currentAccounts
    }, [stores, allKnownAccounts])
    
    
    // Mark as initialized once stores are loaded
    useEffect(() => {
        if (stores.length > 0 && !isAccountsInitialized) {
            console.log('Initializing accounts, current selectedAccounts:', selectedAccounts)
            console.log('Available accounts from stores:', availableAccounts)
            
            // Don't override selected accounts if they're already valid
            // Only validate on initialization
            setIsAccountsInitialized(true)
        }
    }, [stores, isAccountsInitialized, availableAccounts])
    
    // Function to fetch campaign data using shared context
    const fetchCampaignData = useCallback(async (forceRefresh = false) => {
        setCampaignsLoading(true)
        setCampaignsError(null)

        try {
            // Get account IDs - IMPORTANT: Use store public_ids, not klaviyo_ids
            // The API will convert store public_ids to klaviyo_public_ids
            let accountIds = []
            if (selectedAccounts && selectedAccounts.length > 0) {
                if (selectedAccounts[0].value === 'all') {
                    // Get all store public IDs (not Klaviyo IDs)
                    accountIds = stores
                        .filter(store => store.public_id)
                        .map(store => store.public_id)
                } else {
                    // Use selected account IDs (these are already store public_ids)
                    accountIds = selectedAccounts.map(acc => acc.value).filter(Boolean)
                }
            }

            console.log('🔑 Fetching campaign data for store IDs:', accountIds)

            if (accountIds.length === 0) {
                setCampaignsData({ campaigns: [], aggregateStats: null })
                setCampaignsLoading(false)
                return
            }

            // Use date range from dateRangeSelection
            const endDate = dateRangeSelection.ranges?.main?.end || new Date()
            const startDate = dateRangeSelection.ranges?.main?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

            // Use shared context to get campaign data with intelligent caching
            const data = await getCampaignData(
                startDate.toISOString(),
                endDate.toISOString(),
                accountIds,
                { forceRefresh }
            )

            console.log('📊 Using cached/fetched campaign data:', data)
            setCampaignsData(data)
        } catch (error) {
            console.error('Error fetching campaign data:', error)
            setCampaignsError(error.message)
        } finally {
            setCampaignsLoading(false)
        }
    }, [selectedAccounts, stores, dateRangeSelection, getCampaignData])
    
    // Fetch campaign data when dependencies change
    useEffect(() => {
        // Only fetch if we're on a tab that needs campaign data and have stores
        if ((activeTab === 'campaigns' || activeTab === 'deliverability') && stores.length > 0) {
            fetchCampaignData(true)
        }
    }, [activeTab, stores, selectedAccounts, dateRangeSelection, fetchCampaignData])
    
    // Handle URL tab parameter changes
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab && tab !== activeTab) {
            setActiveTab(tab)
        }
    }, [searchParams])
    
    // Update AI state when tab changes or data is updated
    useEffect(() => {
        const pageTitle = `Multi-Account Reporting - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
        
        // Calculate basic metrics
        const selectedAccountsList = selectedAccounts.map(acc => acc.label).join(', ')
        const dateRange = dateRangeSelection.ranges?.main ? 
            `${dateRangeSelection.ranges.main.start?.toLocaleDateString()} - ${dateRangeSelection.ranges.main.end?.toLocaleDateString()}` : 
            'Last 90 days'
        
        // Base AI state
        const aiState = {
            currentPage: `multi-account-reporting-${activeTab}`,
            pageTitle,
            filters: {
                accounts: selectedAccountsList,
                dateRange,
                comparisonType: dateRangeSelection.comparisonType,
                activeTab
            },
            metrics: {},
            data: {},
            insights: []
        }
        
        // Add tab-specific data and insights
        if (activeTab === 'campaigns' && campaignsData) {
            const totalCampaigns = campaignsData.campaigns?.length || 0
            const avgOpenRate = campaignsData.aggregateStats?.avgOpenRate || 0
            const avgClickRate = campaignsData.aggregateStats?.avgClickRate || 0
            const avgRevenue = campaignsData.aggregateStats?.avgRevenue || 0
            
            aiState.metrics = {
                totalCampaigns,
                avgOpenRate: `${avgOpenRate.toFixed(1)}%`,
                avgClickRate: `${avgClickRate.toFixed(1)}%`,
                avgRevenue: `$${avgRevenue.toFixed(2)}`,
                ...campaignsData.aggregateStats
            }
            
            aiState.data = {
                totalRecords: totalCampaigns,
                dateRange,
                topPerformers: campaignsData.campaigns?.slice(0, 5).map(c => ({
                    name: c.subject,
                    openRate: c.openRate,
                    revenue: c.totalRevenue
                }))
            }
            
            // Generate insights
            const insights = []
            if (avgOpenRate > 25) {
                insights.push(`Strong open rate performance at ${avgOpenRate.toFixed(1)}% (industry average: 20-25%)`)
            } else if (avgOpenRate < 15) {
                insights.push(`Open rates need improvement at ${avgOpenRate.toFixed(1)}% (industry average: 20-25%)`)
            }
            
            if (avgClickRate > 3) {
                insights.push(`Excellent click rate at ${avgClickRate.toFixed(1)}% (industry average: 2-3%)`)
            } else if (avgClickRate < 1.5) {
                insights.push(`Click rates could be improved at ${avgClickRate.toFixed(1)}% (industry average: 2-3%)`)
            }
            
            if (totalCampaigns > 0) {
                const topCampaign = campaignsData.campaigns?.reduce((max, c) => 
                    c.totalRevenue > (max?.totalRevenue || 0) ? c : max, null)
                if (topCampaign) {
                    insights.push(`Top performing campaign "${topCampaign.subject}" generated $${topCampaign.totalRevenue.toFixed(2)}`)
                }
            }
            
            aiState.insights = insights
        } else if (activeTab === 'deliverability' && campaignsData) {
            // Add deliverability-specific metrics
            const bounceRate = campaignsData.aggregateStats?.bounceRate || 0
            const unsubscribeRate = campaignsData.aggregateStats?.unsubscribeRate || 0
            const spamRate = campaignsData.aggregateStats?.spamRate || 0
            
            aiState.metrics = {
                bounceRate: `${bounceRate.toFixed(2)}%`,
                unsubscribeRate: `${unsubscribeRate.toFixed(2)}%`,
                spamRate: `${spamRate.toFixed(2)}%`,
                deliverabilityScore: calculateDeliverabilityScore(bounceRate, spamRate)
            }
            
            // Generate deliverability insights
            const insights = []
            if (bounceRate > 2) {
                insights.push(`High bounce rate at ${bounceRate.toFixed(2)}% - consider list cleaning`)
            }
            if (unsubscribeRate > 0.5) {
                insights.push(`Unsubscribe rate of ${unsubscribeRate.toFixed(2)}% is above average - review content relevance`)
            }
            if (spamRate > 0.1) {
                insights.push(`Spam complaints at ${spamRate.toFixed(2)}% - review sending practices`)
            }
            
            aiState.insights = insights
        } else if (activeTab === 'flows') {
            // Flows tab data will be added when flows data is available
            aiState.metrics = {
                status: 'Flows data loading...'
            }
            aiState.insights = ['Flows analytics will be available once data is loaded']
        } else if (activeTab === 'revenue') {
            // Revenue tab data will be handled by the RevenueTab component itself
            aiState.metrics = {
                status: 'Revenue data managed by RevenueTab component'
            }
        }
        
        // Update AI context
        updateAIState(aiState)
    }, [activeTab, selectedAccounts, dateRangeSelection, campaignsData, updateAIState])
    
    // Helper function to calculate deliverability score
    const calculateDeliverabilityScore = (bounceRate, spamRate) => {
        const score = 100 - (bounceRate * 10) - (spamRate * 100)
        return Math.max(0, Math.min(100, score)).toFixed(0)
    }
    
    // Handle date range changes from the date selector
    const handleDateRangeChange = (newDateRangeSelection) => {
        console.log('Analytics page: Date range changed', newDateRangeSelection);
        setDateRangeSelection(newDateRangeSelection);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
            try {
                const dateRangeToSave = {
                    ...newDateRangeSelection,
                    ranges: {
                        main: {
                            start: newDateRangeSelection.ranges?.main?.start?.toISOString(),
                            end: newDateRangeSelection.ranges?.main?.end?.toISOString(),
                            label: newDateRangeSelection.ranges?.main?.label
                        },
                        comparison: newDateRangeSelection.ranges?.comparison ? {
                            start: newDateRangeSelection.ranges.comparison.start?.toISOString(),
                            end: newDateRangeSelection.ranges.comparison.end?.toISOString(),
                            label: newDateRangeSelection.ranges.comparison.label
                        } : null
                    }
                };
                localStorage.setItem('analyticsDateRange', JSON.stringify(dateRangeToSave));
            } catch (e) {
                console.warn('Failed to save analytics date range to localStorage:', e);
            }
        }
    }
    
    
    return (
        <div className="flex-1 space-y-4 p-4 pt-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-gray dark:text-white">Multi-Account Reporting</h2>
                    <p className="text-sm text-neutral-gray dark:text-gray-400">Cross-account analytics and performance insights</p>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Account Selector */}
                    <div className="w-40">
                        <AccountSelector
                            accounts={availableAccounts}
                            value={selectedAccounts}
                            onChange={(newValue) => {
                                console.log('Analytics account selection changed:', newValue)
                                // Remove duplicates before saving
                                const uniqueValue = newValue.filter((account, index, self) =>
                                    index === self.findIndex(a => a.value === account.value)
                                )
                                // Update state
                                setSelectedAccounts(uniqueValue)
                                // Save to localStorage with analytics-specific key
                                localStorage.setItem('analyticsSelectedAccounts', JSON.stringify(uniqueValue))
                            }}
                        />
                    </div>

                    {/* Date Range Selector */}
                    <DateRangeSelector
                        onDateRangeChange={handleDateRangeChange}
                        storageKey="analyticsDateRange"
                        showComparison={true}
                        initialDateRange={dateRangeSelection}
                    />
                </div>
            </div>
            
            {/* Main Charts */}
            <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value)
                // Update URL with new tab
                const url = new URL(window.location)
                url.searchParams.set('tab', value)
                window.history.pushState({}, '', url)
            }} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="flows">Flows</TabsTrigger>
                    <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
                </TabsList>
                
                <TabsContent value="revenue" className="space-y-4">
                    <RevenueTab 
                        selectedAccounts={selectedAccounts}
                        dateRangeSelection={dateRangeSelection}
                        stores={stores}
                    />
                </TabsContent>
                
                <TabsContent value="campaigns" className="space-y-4">
                    <CampaignsTab 
                        selectedAccounts={selectedAccounts}
                        campaignsData={campaignsData}
                        campaignsLoading={campaignsLoading}
                        campaignsError={campaignsError}
                        onAccountsChange={(newValue) => {
                            console.log('Campaign tab account selection changed:', newValue)
                            let updatedSelection = []
                            
                            if (!newValue || newValue.length === 0) {
                                // If nothing selected, default to View All
                                updatedSelection = [{ value: 'all', label: 'View All' }]
                            } else if (Array.isArray(newValue)) {
                                const hasViewAll = newValue.some(item => item.value === 'all')
                                const hasOtherAccounts = newValue.some(item => item.value !== 'all')
                                
                                if (hasViewAll && hasOtherAccounts) {
                                    // Both View All and specific accounts are selected
                                    // Determine which was just added
                                    const previouslyHadViewAll = selectedAccounts.some(item => item.value === 'all')
                                    
                                    if (previouslyHadViewAll) {
                                        // View All was already selected, user selected a specific account
                                        // Remove View All and keep only specific accounts
                                        updatedSelection = newValue.filter(item => item.value !== 'all')
                                    } else {
                                        // View All was just added, keep only View All
                                        updatedSelection = [{ value: 'all', label: 'View All' }]
                                    }
                                } else if (hasViewAll) {
                                    // Only View All is selected
                                    updatedSelection = [{ value: 'all', label: 'View All' }]
                                } else {
                                    // Only specific accounts are selected
                                    updatedSelection = newValue
                                }
                            } else {
                                // Single selection (shouldn't happen with isMulti but handle it)
                                updatedSelection = [newValue]
                            }
                            
                            console.log('Campaign tab updated selection:', updatedSelection)
                            
                            // Update state
                            setSelectedAccounts(updatedSelection)
                            
                            // Save to localStorage
                            if (typeof window !== 'undefined') {
                                try {
                                    localStorage.setItem('analyticsSelectedAccounts', JSON.stringify(updatedSelection))
                                    console.log('Saved campaign tab accounts to localStorage:', updatedSelection)
                                } catch (error) {
                                    console.warn('Failed to save accounts to localStorage:', error)
                                }
                            }
                        }}
                        dateRangeSelection={dateRangeSelection}
                        onDateRangeChange={handleDateRangeChange}
                        stores={stores}
                        availableAccounts={availableAccounts}
                    />
                </TabsContent>
                
                <TabsContent value="flows" className="space-y-4">
                    <FlowsTab 
                        selectedAccounts={selectedAccounts}
                        dateRangeSelection={dateRangeSelection}
                        stores={stores}
                    />
                </TabsContent>
                
                <TabsContent value="deliverability" className="space-y-4">
                    <DeliverabilityTab 
                        selectedAccounts={selectedAccounts}
                        dateRangeSelection={dateRangeSelection}
                        stores={stores}
                        campaignsData={campaignsData}
                        campaignsLoading={campaignsLoading}
                        campaignsError={campaignsError}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}