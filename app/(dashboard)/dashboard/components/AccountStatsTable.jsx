"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import MorphingLoader from "@/app/components/ui/loading"
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'
import {
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Store
} from "lucide-react"

export default function AccountStatsTable({ stores, dateRangeSelection }) {
    const [loading, setLoading] = useState(true)
    const [accountStats, setAccountStats] = useState([])
    const [error, setError] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' })

    useEffect(() => {
        if (!stores || stores.length === 0) {
            setLoading(false)
            return
        }

        fetchAccountStats()
    }, [stores, dateRangeSelection])

    const fetchAccountStats = async () => {
        setLoading(true)
        setError(null)

        try {
            const storeIds = stores.map(s => s.public_id).filter(Boolean)

            if (storeIds.length === 0) {
                setAccountStats([])
                setLoading(false)
                return
            }

            const params = new URLSearchParams({
                stores: storeIds.join(','),
                startDate: dateRangeSelection?.ranges?.main?.start?.toISOString() || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: dateRangeSelection?.ranges?.main?.end?.toISOString() || new Date().toISOString()
            })

            // Add comparison period if available
            if (dateRangeSelection?.ranges?.comparison) {
                params.append('compareStartDate', dateRangeSelection.ranges.comparison.start.toISOString())
                params.append('compareEndDate', dateRangeSelection.ranges.comparison.end.toISOString())
            }

            const response = await fetch(`/api/dashboard/account-stats?${params}`)

            if (!response.ok) {
                throw new Error('Failed to fetch account statistics')
            }

            const data = await response.json()
            setAccountStats(data.accounts || [])
        } catch (err) {
            console.error('Error fetching account stats:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    const sortedStats = useMemo(() => {
        return [...accountStats].sort((a, b) => {
            const aValue = a[sortConfig.key] || 0
            const bValue = b[sortConfig.key] || 0

            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })
    }, [accountStats, sortConfig])

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown className="h-3 w-3 text-gray-400" />
        }
        return sortConfig.direction === 'desc'
            ? <ArrowDown className="h-3 w-3 text-blue-600" />
            : <ArrowUp className="h-3 w-3 text-blue-600" />
    }

    if (loading) {
        return (
            <Card className="border border-gray-300 dark:border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Performance</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Multi-account comparison with period-over-period trends
                        </p>
                    </div>
                    <Store className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center h-64">
                        <MorphingLoader size="medium" showText={true} text="Loading account statistics..." />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border border-gray-300 dark:border-gray-600">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="text-center py-8 text-red-600 dark:text-red-400">
                        Error loading statistics: {error}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (accountStats.length === 0) {
        return (
            <Card className="border border-gray-300 dark:border-gray-600">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                        No account statistics available
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border border-gray-300 dark:border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Performance</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Multi-account comparison: {dateRangeSelection?.ranges?.main?.label || 'Current Period'} vs {dateRangeSelection?.ranges?.comparison?.label || 'Previous Period'}
                    </p>
                </div>
                <Store className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent className="pt-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th
                                    className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('storeName')}
                                >
                                    <div className="flex items-center gap-2">
                                        Account
                                        <SortIcon columnKey="storeName" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('revenue')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Revenue
                                        <SortIcon columnKey="revenue" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('attributedRevenue')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Attributed Revenue
                                        <SortIcon columnKey="attributedRevenue" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('totalRecipients')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Recipients
                                        <SortIcon columnKey="totalRecipients" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('openRate')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Open Rate
                                        <SortIcon columnKey="openRate" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('clickRate')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Click Rate
                                        <SortIcon columnKey="clickRate" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('ctor')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        CTOR
                                        <SortIcon columnKey="ctor" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('revenuePerRecipient')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Rev/Recipient
                                        <SortIcon columnKey="revenuePerRecipient" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => handleSort('aov')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        AOV
                                        <SortIcon columnKey="aov" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStats.map((account, index) => (
                                    <tr
                                        key={account.storePublicId || index}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        {/* Account Name */}
                                        <td className="py-4 px-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {account.storeName || 'Unknown Store'}
                                                    </span>
                                                </div>
                                                {!account.hasKlaviyo && (
                                                    <div className="ml-6">
                                                        <Badge variant="outline" className="text-xs">
                                                            No Klaviyo
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Revenue with Comparison */}
                                        <td className="py-4 px-4">
                                            <div className="text-right space-y-1">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(account.revenue || 0)}
                                                </div>
                                                {account.previousRevenue !== undefined && account.revenueChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.revenueChange > 0 ? "text-green-600" : account.revenueChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.revenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.revenueChange > 0 ? "+" : ""}{account.revenueChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Attributed Revenue with Comparison */}
                                        <td className="py-4 px-4">
                                            <div className="text-right space-y-1">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(account.attributedRevenue || 0)}
                                                </div>
                                                {account.previousAttributedRevenue !== undefined && account.attributedRevenueChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.attributedRevenueChange > 0 ? "text-green-600" : account.attributedRevenueChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.attributedRevenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.attributedRevenueChange > 0 ? "+" : ""}{account.attributedRevenueChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Total Recipients (Emails + SMS) */}
                                        <td className="py-4 px-4">
                                            <div className="text-right space-y-1">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatNumber(account.totalRecipients || 0)}
                                                </div>
                                                {account.previousTotalRecipients !== undefined && account.totalRecipientsChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.totalRecipientsChange > 0 ? "text-green-600" : account.totalRecipientsChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.totalRecipientsChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.totalRecipientsChange > 0 ? "+" : ""}{account.totalRecipientsChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Open Rate */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="text-right space-y-1">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatPercentage(account.openRate || 0)}
                                                </div>
                                                {account.previousOpenRate !== undefined && account.openRateChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.openRateChange > 0 ? "text-green-600" : account.openRateChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.openRateChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.openRateChange > 0 ? "+" : ""}{account.openRateChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Click Rate */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="text-right space-y-1">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatPercentage(account.clickRate || 0)}
                                                </div>
                                                {account.previousClickRate !== undefined && account.clickRateChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.clickRateChange > 0 ? "text-green-600" : account.clickRateChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.clickRateChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.clickRateChange > 0 ? "+" : ""}{account.clickRateChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* CTOR (Click-to-Open Rate) */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="text-right space-y-1">
                                                <div className={`text-lg font-bold ${
                                                    account.ctor >= 15 ? 'text-green-700 dark:text-green-400' :
                                                    account.ctor >= 8 ? 'text-orange-700 dark:text-orange-400' :
                                                    'text-red-700 dark:text-red-400'
                                                }`}>
                                                    {formatPercentage(account.ctor || 0)}
                                                </div>
                                                {account.previousCtor !== undefined && account.ctorChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.ctorChange > 0 ? "text-green-600" : account.ctorChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.ctorChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.ctorChange > 0 ? "+" : ""}{account.ctorChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Revenue per Recipient */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="text-right space-y-1">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(account.revenuePerRecipient || 0)}
                                                </div>
                                                {account.previousRevenuePerRecipient !== undefined && account.revenuePerRecipientChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.revenuePerRecipientChange > 0 ? "text-green-600" : account.revenuePerRecipientChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.revenuePerRecipientChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.revenuePerRecipientChange > 0 ? "+" : ""}{account.revenuePerRecipientChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* AOV */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="text-right space-y-1">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(account.aov || 0)}
                                                </div>
                                                {account.previousAov !== undefined && account.aovChange !== 0 && (
                                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                                        account.aovChange > 0 ? "text-green-600" : account.aovChange < 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                        {account.aovChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {account.aovChange > 0 ? "+" : ""}{account.aovChange.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
