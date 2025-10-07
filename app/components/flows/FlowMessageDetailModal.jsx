"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import {
  Mail,
  MessageSquare,
  Bell,
  Phone,
  Users,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Activity,
  Monitor,
  Smartphone
} from "lucide-react"
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'
import MorphingLoader from '@/app/components/ui/loading'

// Dynamically import EmailPreviewPanel
const EmailPreviewPanel = dynamic(
  () => import('@/app/components/campaigns/EmailPreviewPanel').then(mod => mod.EmailPreviewPanel),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <MorphingLoader size="medium" showText={true} text="Loading preview..." />
      </div>
    ),
    ssr: false
  }
)

export default function FlowMessageDetailModal({ message, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [previewMode, setPreviewMode] = useState('desktop')

  if (!message) return null

  // Determine icon based on channel
  const ChannelIcon = {
    email: Mail,
    sms: MessageSquare,
    push: Bell,
    whatsapp: Phone
  }[message.send_channel] || Mail

  // Channel color
  const channelColor = {
    email: "text-blue-600",
    sms: "text-green-600",
    push: "text-purple-600",
    whatsapp: "text-green-500"
  }[message.send_channel] || "text-blue-600"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-3 border-b bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-lg bg-white dark:bg-gray-900 shadow-sm",
              channelColor
            )}>
              <ChannelIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {message.flow_message_name}
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {message.flow_name} • {message.store_name}
              </p>

              {/* Message Information in Header */}
              <div className="grid grid-cols-4 gap-4 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">First Send:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {new Date(message.first_send_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Last Send:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {new Date(message.last_send_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Active Days:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {message.active_days} days
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Channel:</span>
                  <span className={cn("ml-2 font-medium capitalize", channelColor)}>
                    {message.send_channel}
                  </span>
                </div>
              </div>

              {message.tag_names && message.tag_names.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.tag_names.map((tag, idx) => (
                    <Badge key={idx} className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content - Two Column Layout */}
        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
            {/* Left Column - Preview */}
            <div className="h-full border-r border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-gray-950">
              <EmailPreviewPanel
                messageId={message.flow_message_id}
                storeId={message.store_public_id}
                messageType="flow"
                compact={false}
              />
            </div>

            {/* Right Column - Performance Metrics */}
            <div className="h-full overflow-y-auto p-3 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-vivid-violet" />
                  Performance Metrics
                </h3>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Recipients */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2">
                      <CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-100">Recipients</CardTitle>
                      <Users className="h-3 w-3 text-blue-600" />
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatNumber(message.recipients)}
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">total sent</p>
                    </CardContent>
                  </Card>

                  {/* Open Rate */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2">
                      <CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-100">Open Rate</CardTitle>
                      <Eye className="h-3 w-3 text-green-600" />
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatPercentage(message.open_rate)}
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        {formatNumber(message.opens_unique)} opens
                      </p>
                    </CardContent>
                  </Card>

                  {/* Click Rate */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2">
                      <CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-100">Click Rate</CardTitle>
                      <MousePointer className="h-3 w-3 text-yellow-600" />
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatPercentage(message.click_rate)}
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        {formatNumber(message.clicks_unique)} clicks
                      </p>
                    </CardContent>
                  </Card>

                  {/* Conversion Rate */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2">
                      <CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-100">Conv. Rate</CardTitle>
                      <ShoppingCart className="h-3 w-3 text-purple-600" />
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatPercentage(message.conversion_rate)}
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        {formatNumber(message.conversion_uniques)} orders
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Cards */}
                <div className="grid grid-cols-1 gap-1.5">
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2">
                      <CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-100">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(message.conversion_value)}
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        {formatCurrency(message.revenue_per_recipient)} per recipient
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-2">
                      <CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-100">Avg Order Value</CardTitle>
                      <ShoppingCart className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(message.average_order_value)}
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">per order</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Metrics */}
                <Card>
                  <CardHeader className="pb-1 p-2">
                    <CardTitle className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Additional Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs p-2 pt-0">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Delivered</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatNumber(message.delivered)} ({formatPercentage((message.delivered / message.recipients) * 100)})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Bounced</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatNumber(message.bounced)} ({formatPercentage(message.bounce_rate)})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Unsubscribes</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatNumber(message.unsubscribe_uniques)} ({formatPercentage(message.unsubscribe_rate)})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  )
}