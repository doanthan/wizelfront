"use client"

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card"
import MorphingLoader from "@/app/components/ui/loading"
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'
import { Mail, MessageSquare, Bell, Users, MousePointer, Filter, DollarSign, Eye, Image as ImageIcon } from "lucide-react"
import { selectStyles, selectStylesDark } from "@/app/components/selectStyles"
import { useTheme } from "@/app/contexts/theme-context"

// Dynamically import Select to prevent SSR issues
const Select = dynamic(
  () => import('react-select'),
  {
    ssr: false,
    loading: () => <div className="w-48 h-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
  }
)

// Dynamically import the modal
const CampaignDetailsModal = dynamic(
  () => import('@/app/components/campaigns/CampaignDetailsModal'),
  { ssr: false }
)

export default function RecentCampaigns({ stores, onCampaignsLoad }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStore, setSelectedStore] = useState({ value: 'all', label: 'All Stores' })
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [smsContent, setSmsContent] = useState({}) // Cache for SMS content
  const itemsPerPage = 10
  const { theme } = useTheme()

  // Ensure component is mounted before rendering Select
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch SMS content directly from CDN (CORS configured on R2)
  const fetchSmsContent = async (campaign) => {
    // Check if already cached
    if (smsContent[campaign.id]) {
      return smsContent[campaign.id]
    }

    // Check if SMS preview URL exists
    if (!campaign.preview_sms_url) {
      return null
    }

    try {
      console.log('🔍 Fetching SMS from URL:', campaign.preview_sms_url)

      // Fetch directly from R2 CDN (CORS enabled)
      const response = await fetch(campaign.preview_sms_url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'text/plain, */*'
        }
      })

      console.log('📥 SMS fetch response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        console.error('❌ Failed to fetch SMS content:', response.status, response.statusText)
        return null
      }

      const text = await response.text()
      console.log('✅ SMS content fetched:', text.substring(0, 100) + '...')

      // Cache the content
      setSmsContent(prev => ({
        ...prev,
        [campaign.id]: text
      }))

      return text
    } catch (error) {
      console.error('❌ Error fetching SMS content:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        url: campaign.preview_sms_url
      })
      return null
    }
  }

  useEffect(() => {
    const fetchRecentCampaigns = async () => {
      try {
        setLoading(true)
        setError(null)

        // Calculate date range (past 14 days)
        const now = new Date()
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        // Build query parameters - fetch ALL stores
        const params = new URLSearchParams({
          startDate: fourteenDaysAgo.toISOString(),
          endDate: now.toISOString()
          // Always fetch all stores - filtering happens in the component
        })

        const response = await fetch(`/api/campaigns/recent?${params}`)

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns')
        }

        const data = await response.json()

        // Store all campaigns - filtering will be done by selectedStore dropdown
        const allCampaigns = data.campaigns || []

        // Sort by date (most recent first)
        allCampaigns.sort((a, b) => new Date(b.date) - new Date(a.date))

        setCampaigns(allCampaigns)
        // NEW: Pass campaigns data to parent for AI context
        if (onCampaignsLoad) {
          onCampaignsLoad(allCampaigns)
        }
      } catch (err) {
        console.error('Error fetching recent campaigns:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch once when component mounts or when stores change
    if (stores) {
      fetchRecentCampaigns()
    }
  }, [stores])  // Only depend on stores, not selectedAccounts

  // Store filter options
  const storeOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Stores' }]

    if (stores && stores.length > 0) {
      stores.forEach(store => {
        if (store.klaviyo_integration?.public_id) {
          options.push({
            value: store.public_id,
            label: store.name
          })
        }
      })
    }

    return options
  }, [stores])

  // Filter and sort campaigns by selected store
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns

    // Filter by selected store
    if (selectedStore && selectedStore.value !== 'all') {
      filtered = campaigns.filter(campaign => {
        // Check if campaign belongs to selected store
        const store = stores?.find(s => s.public_id === selectedStore.value)
        if (!store) return false

        return campaign.store_public_ids?.includes(store.public_id) ||
               campaign.klaviyo_public_id === store.klaviyo_integration?.public_id
      })
    }

    // Sort by date (most recently sent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.send_time || a.scheduled_at)
      const dateB = new Date(b.date || b.send_time || b.scheduled_at)
      return dateB - dateA // Descending order (newest first)
    })
  }, [campaigns, selectedStore, stores])

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCampaigns.slice(startIndex, endIndex)
  }, [filteredCampaigns, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedStore])

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'push-notification':
      case 'mobile_push':
        return <Bell className="h-4 w-4 text-purple-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Campaigns
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              Past 14 days campaigns
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            {mounted && (
              <Select
                value={selectedStore}
                onChange={setSelectedStore}
                options={storeOptions}
                styles={theme === 'dark' ? selectStylesDark : selectStyles}
                className="text-sm w-48"
                placeholder="Filter by store..."
                instanceId="recent-campaigns-store-filter"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <MorphingLoader size="medium" showText={true} text="Loading campaigns..." />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">Error loading campaigns: {error}</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No campaigns found in the past 14 days
            </div>
          ) : (
            paginatedCampaigns.map((campaign, index) => {
              // Check if campaign has a preview (email or SMS)
              const hasEmailPreview = campaign.preview_image_url || campaign.preview_image_html
              const hasSMSPreview = campaign.channel === 'sms' && campaign.preview_sms_url
              const hasPreview = hasEmailPreview || hasSMSPreview

              return (
                <HoverCard
                  key={campaign.id || `recent-${index}`}
                  openDelay={200}
                  closeDelay={100}
                  onOpenChange={(open) => {
                    // Prefetch SMS content when hover opens
                    if (open && hasSMSPreview && !smsContent[campaign.id]) {
                      fetchSmsContent(campaign)
                    }
                  }}
                >
                  <HoverCardTrigger asChild>
                    <div
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setShowCampaignModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        {/* Left side: Icon, Name, Store, Date */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            {getChannelIcon(campaign.channel)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate flex-1">
                                {campaign.name || 'Unnamed Campaign'}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {campaign.storeName || 'Unknown'}
                              </Badge>
                              {hasPreview && (
                                <ImageIcon className="h-3 w-3 text-gray-400" title="Preview available" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(campaign.date)}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Performance Metrics */}
                        <div className="flex items-center gap-3 ml-4">
                          {/* Recipients */}
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Users className="h-3 w-3" />
                              <span>Recipients</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatNumber(campaign.performance?.recipients || campaign.statistics?.recipients || 0)}
                            </div>
                          </div>

                          {/* Opens (email only) */}
                          {campaign.channel === 'email' && (
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Eye className="h-3 w-3" />
                                <span>Opens</span>
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {campaign.performance?.openRate !== undefined
                                  ? formatPercentage(campaign.performance.openRate * 100)
                                  : campaign.statistics?.open_rate
                                  ? formatPercentage(campaign.statistics.open_rate * 100)
                                  : '0%'}
                              </div>
                            </div>
                          )}

                          {/* Clicks */}
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MousePointer className="h-3 w-3" />
                              <span>Clicks</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {campaign.performance?.clickRate !== undefined
                                ? formatPercentage(campaign.performance.clickRate * 100)
                                : campaign.statistics?.click_rate
                                ? formatPercentage(campaign.statistics.click_rate * 100)
                                : '0%'}
                            </div>
                          </div>

                          {/* Total Revenue */}
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span>Revenue</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {campaign.performance?.revenue > 0
                                ? formatCurrency(campaign.performance.revenue)
                                : campaign.statistics?.conversion_value > 0
                                ? formatCurrency(campaign.statistics.conversion_value)
                                : '$0'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </HoverCardTrigger>

                  {/* Preview Popover (Email or SMS) */}
                  {hasPreview && (
                    <HoverCardContent
                      className="w-[320px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl"
                      side="top"
                      align="center"
                    >
                      <div className="space-y-0">
                        {/* Campaign Info Header */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                            {campaign.name || 'Unnamed Campaign'}
                          </div>
                          {campaign.subject && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                              {campaign.subject}
                            </div>
                          )}
                          {/* Quick Stats */}
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {formatNumber(campaign.performance?.recipients || campaign.statistics?.recipients || 0)}
                              </span>
                            </div>
                            {campaign.channel === 'email' && (
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {campaign.performance?.openRate !== undefined
                                    ? formatPercentage(campaign.performance.openRate * 100)
                                    : campaign.statistics?.open_rate
                                    ? formatPercentage(campaign.statistics.open_rate * 100)
                                    : '0%'}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {campaign.performance?.clickRate !== undefined
                                  ? formatPercentage(campaign.performance.clickRate * 100)
                                  : campaign.statistics?.click_rate
                                  ? formatPercentage(campaign.statistics.click_rate * 100)
                                  : '0%'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {campaign.performance?.revenue > 0
                                  ? formatCurrency(campaign.performance.revenue)
                                  : campaign.statistics?.conversion_value > 0
                                  ? formatCurrency(campaign.statistics.conversion_value)
                                  : '$0'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* SMS Preview */}
                        {hasSMSPreview ? (
                          <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                            <div className="p-4">
                              {/* SMS Message Bubble */}
                              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm shadow-md p-4 max-w-[280px]">
                                {smsContent[campaign.id] ? (
                                  <>
                                    <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                                      {smsContent[campaign.id]}
                                    </div>
                                    {/* Character count */}
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                      {smsContent[campaign.id].length} characters
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                                    Loading SMS content...
                                  </div>
                                )}
                              </div>
                              {/* SMS indicator */}
                              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MessageSquare className="h-3 w-3" />
                                <span>SMS Message</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Email Preview - Above the fold only */
                          campaign.preview_image_url ? (
                            <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800">
                              <div className="relative h-[280px] overflow-hidden">
                                <img
                                  src={campaign.preview_image_url}
                                  alt={`Preview of ${campaign.name || 'campaign'}`}
                                  className="w-full h-auto object-cover object-top"
                                  style={{
                                    maxHeight: 'none',
                                    minHeight: '280px'
                                  }}
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                                <div
                                  className="hidden items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm"
                                  style={{ display: 'none' }}
                                >
                                  <div className="text-center">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Preview not available</p>
                                  </div>
                                </div>
                              </div>
                              {/* Fade overlay at bottom */}
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent pointer-events-none" />
                            </div>
                          ) : campaign.preview_image_html ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400 p-4 text-center">
                              <a
                                href={campaign.preview_image_html}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                              >
                                View HTML Preview
                              </a>
                            </div>
                          ) : null
                        )}
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              )
            })
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
      </CardContent>

      {/* Campaign Details Modal */}
      {selectedCampaign && showCampaignModal && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          isOpen={showCampaignModal}
          onClose={() => {
            setShowCampaignModal(false)
            setSelectedCampaign(null)
          }}
          stores={stores}
        />
      )}
    </Card>
  )
}