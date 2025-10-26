"use client"

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import MorphingLoader from "@/app/components/ui/loading"
import { formatNumber, formatCurrency } from '@/lib/utils'
import { Mail, MessageSquare, Bell, Calendar, Clock, Users, Store, Filter } from "lucide-react"
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
const ScheduledCampaignModal = dynamic(
  () => import('@/app/(dashboard)/calendar/components/ScheduledCampaignModal'),
  { ssr: false }
)

export default function UpcomingCampaigns({ stores, onCampaignsLoad }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStore, setSelectedStore] = useState({ value: 'all', label: 'All Stores' })
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { theme } = useTheme()

  // Ensure component is mounted before rendering Select
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchUpcomingCampaigns = async () => {
      try {
        setLoading(true)
        setError(null)

        // Build query parameters - fetch all scheduled campaigns
        const params = new URLSearchParams({
          status: 'scheduled'  // Request only scheduled/sending campaigns
        })

        const response = await fetch(`/api/campaigns/upcoming?${params}`)

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns')
        }

        const data = await response.json()

        // Store all campaigns - filtering will be done by selectedStore dropdown
        let allCampaigns = data.campaigns || []

        // Filter to ensure campaigns are in the future and have scheduled status
        allCampaigns = allCampaigns.filter(campaign => {
          // Use send_time first, then date, then scheduled_at
          const campaignDate = new Date(campaign.send_time || campaign.date || campaign.scheduled_at)
          const isFuture = campaignDate > new Date()

          // Check if campaign has scheduled, sending, or queued without recipients status
          const isScheduledStatus = campaign.isScheduled ||
                                   campaign.status === 'scheduled' ||
                                   campaign.status === 'Scheduled' ||
                                   campaign.status === 'Sending' ||
                                   campaign.status === 'sending'

          // Must be in future and have appropriate status
          return isFuture && isScheduledStatus
        })

        console.log('Upcoming campaigns found:', allCampaigns.length, 'from', data.campaigns?.length, 'total campaigns')

        setCampaigns(allCampaigns)
        // NEW: Pass campaigns data to parent for AI context
        if (onCampaignsLoad) {
          onCampaignsLoad(allCampaigns)
        }
      } catch (err) {
        console.error('Error fetching upcoming campaigns:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch once when component mounts or when stores change
    if (stores) {
      fetchUpcomingCampaigns()
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

    // Sort by date (soonest upcoming first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.send_time || a.date || a.scheduled_at)
      const dateB = new Date(b.send_time || b.date || b.scheduled_at)
      return dateA - dateB // Ascending order (soonest first)
    })
  }, [campaigns, selectedStore, stores])

  // Paginated campaigns
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCampaigns.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCampaigns, currentPage])

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)

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

  const getDaysUntil = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))

    if (diffDays < 0) return 'Past due'
    if (diffDays === 0) {
      if (diffHours <= 0) return 'Sending now'
      if (diffHours === 1) return 'In 1 hour'
      if (diffHours < 24) return `In ${diffHours} hours`
      return 'Today'
    }
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return weeks === 1 ? 'In 1 week' : `In ${weeks} weeks`
    }
    const months = Math.floor(diffDays / 30)
    return months === 1 ? 'In 1 month' : `In ${months} months`
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Upcoming Campaigns
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              All scheduled campaigns
            </CardDescription>
          </div>
          {/* Store Filter Dropdown */}
          <div className="w-48">
            {mounted && (
              <Select
                value={selectedStore}
                instanceId="upcoming-campaigns-store-filter"
                onChange={(newStore) => {
                  setSelectedStore(newStore)
                  setCurrentPage(1) // Reset to first page when filter changes
                }}
                options={storeOptions}
                styles={theme === 'dark' ? selectStylesDark : selectStyles}
                className="text-sm"
                placeholder="Filter by store..."
                isSearchable={false}
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
          ) : paginatedCampaigns.map((campaign, index) => {
            // Mark upcoming campaigns as scheduled
            const campaignWithScheduled = { ...campaign, isScheduled: true }

            return (
              <div
                key={campaign.id || `upcoming-${index}`}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCampaign(campaignWithScheduled)
                  setShowCampaignModal(true)
                }}
              >
                <div className="flex items-start justify-between">
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
                          {campaign.storeName || campaign.storeInfo?.name || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {campaign.date ? (
                          <>
                            {new Date(campaign.date).toLocaleDateString()} at {new Date(campaign.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </>
                        ) : 'Date unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-4 text-right">
                    <div className="text-xs text-gray-500 mt-1">
                      {getDaysUntil(campaign.date)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && filteredCampaigns.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No upcoming campaigns scheduled
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredCampaigns.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Campaign Details Modal */}
      {selectedCampaign && showCampaignModal && (
        <ScheduledCampaignModal
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