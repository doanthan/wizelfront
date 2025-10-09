"use client";

import { formatNumber, formatCurrency } from '@/lib/utils';
import {
  Users, TrendingUp, AlertCircle, Info, Target, Clock, Activity, DollarSign,
  Gift, Sparkles, Mail, MessageSquare, Award, Package, PartyPopper, Star,
  Bell, BookOpen, Heart, Megaphone, Share2, Facebook, Zap, BarChart3,
  AlertTriangle, RefreshCw, Send, PhoneCall, ThumbsUp, Eye, XCircle,
  Lightbulb, Rocket, UserPlus, TrendingDown, BellRing, CheckCircle
} from 'lucide-react';
import MorphingLoader from '@/app/components/ui/loading';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";

// Chart Info Component
const ChartInfo = ({ title, description }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="inline-flex items-center justify-center ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <Info className="h-4 w-4 text-gray-900 dark:text-gray-400" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-900 dark:text-gray-300">{description}</p>
      </div>
    </PopoverContent>
  </Popover>
);

function getSegmentColor(segment) {
  const colors = {
    'Champions': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Loyal Customers': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Potential Loyalists': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'Recent Customers': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Promising': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'Need Attention': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'About to Sleep': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'At Risk': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Cannot Lose Them': 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200',
    'Hibernating': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'Lost': 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-200',
  };
  return colors[segment] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

const SEGMENT_COLORS = {
  'Champions': '#10B981',
  'Loyal Customers': '#60A5FA',
  'Potential Loyalists': '#06B6D4',
  'Recent Customers': '#8B5CF6',
  'Promising': '#6366F1',
  'Need Attention': '#F59E0B',
  'About to Sleep': '#F97316',
  'At Risk': '#EF4444',
  'Cannot Lose': '#DC2626',
  'Cannot Lose Them': '#DC2626',
  'Hibernating': '#6B7280',
  'Lost': '#4B5563',
};

// Segment communication strategies with icons and multi-channel approach
const SEGMENT_STRATEGIES = {
  'Champions': {
    description: 'Your best customers - frequent buyers with high spend',
    icon: Award,
    strategies: [
      { icon: Gift, text: 'Email: VIP early access to new products' },
      { icon: Sparkles, text: 'Klaviyo: Exclusive loyalty rewards program' },
      { icon: Megaphone, text: 'Email: Ask for reviews and referrals' },
      { icon: Rocket, text: 'Meta/Google: Lookalike audiences for acquisition' },
      { icon: Heart, text: 'Email: Personal thank you messages' }
    ]
  },
  'Loyal Customers': {
    description: 'Regular buyers with consistent engagement',
    icon: Star,
    strategies: [
      { icon: Award, text: 'Email: Loyalty program enrollment' },
      { icon: Package, text: 'Email: Bundle recommendations' },
      { icon: PartyPopper, text: 'Email: Anniversary/milestone rewards' },
      { icon: MessageSquare, text: 'Email: Request testimonials' },
      { icon: Share2, text: 'Meta/Google: Create lookalike audiences' }
    ]
  },
  'Potential Loyalists': {
    description: 'Recent repeat buyers showing promise',
    icon: TrendingUp,
    strategies: [
      { icon: Zap, text: 'Email: Cross-sell complementary products' },
      { icon: BookOpen, text: 'Email: Educational content about products' },
      { icon: Star, text: 'Klaviyo: Loyalty program benefits' },
      { icon: Gift, text: 'Email: Surprise & delight campaigns' },
      { icon: Share2, text: 'TikTok/Meta: Sync for engagement campaigns' }
    ]
  },
  'Recent Customers': {
    description: 'New customers who made their first purchase recently',
    icon: UserPlus,
    strategies: [
      { icon: Mail, text: 'Email: Welcome series automation' },
      { icon: BookOpen, text: 'Email: Product usage guides' },
      { icon: Gift, text: 'Email: Second purchase discount' },
      { icon: MessageSquare, text: 'Email: Ask for feedback' },
      { icon: Eye, text: 'Meta/Google: Exclude from acquisition ads' }
    ]
  },
  'New Customers': {
    description: 'Brand new customers who just made their first purchase',
    icon: UserPlus,
    strategies: [
      { icon: Mail, text: 'Email: Welcome series automation' },
      { icon: BookOpen, text: 'Email: Product usage guides' },
      { icon: Gift, text: 'Email: Second purchase discount' },
      { icon: MessageSquare, text: 'Email: Ask for feedback' },
      { icon: Eye, text: 'Meta/Google: Exclude from acquisition ads' }
    ]
  },
  'Promising': {
    description: 'Recent buyers with potential for growth',
    icon: Lightbulb,
    strategies: [
      { icon: Target, text: 'Email: Targeted product recommendations' },
      { icon: Send, text: 'Email: Engagement campaigns' },
      { icon: Gift, text: 'Email: Incentive to buy again soon' },
      { icon: ThumbsUp, text: 'Email: Social proof (reviews)' },
      { icon: Share2, text: 'Meta/TikTok: Engagement retargeting' }
    ]
  },
  'Need Attention': {
    description: 'Good customers whose engagement is slipping',
    icon: AlertTriangle,
    strategies: [
      { icon: BellRing, text: 'Email: "We miss you" campaigns' },
      { icon: Gift, text: 'Email: Special reactivation offer' },
      { icon: Sparkles, text: 'Email: Share what\'s new' },
      { icon: MessageSquare, text: 'Email: Request feedback survey' },
      { icon: Facebook, text: 'Meta/Google: Win-back retargeting ads' }
    ]
  },
  'About to Sleep': {
    description: 'Customers at risk of churning',
    icon: Clock,
    strategies: [
      { icon: AlertCircle, text: 'Email: Urgent win-back campaigns' },
      { icon: Zap, text: 'Email: Time-limited discounts' },
      { icon: Mail, text: 'Email: Re-engagement series' },
      { icon: Sparkles, text: 'Email: Show new arrivals' },
      { icon: Share2, text: 'Meta/Google: Aggressive retargeting' }
    ]
  },
  'At Risk': {
    description: 'High-value customers who haven\'t purchased recently',
    icon: AlertTriangle,
    strategies: [
      { icon: Mail, text: 'Email: High-touch win-back campaigns' },
      { icon: Gift, text: 'Email: Aggressive discount offers' },
      { icon: PhoneCall, text: 'Outreach: Personal contact attempt' },
      { icon: Award, text: 'Email: Exclusive comeback offer' },
      { icon: Facebook, text: 'Meta/TikTok: Maximum retargeting budget' }
    ]
  },
  'Cannot Lose': {
    description: 'Previously best customers now inactive',
    icon: AlertCircle,
    strategies: [
      { icon: Megaphone, text: 'Email: Maximum effort win-back' },
      { icon: Award, text: 'Email: VIP "we want you back" offer' },
      { icon: PhoneCall, text: 'Outreach: Direct personal contact' },
      { icon: Gift, text: 'Email: Gift with next purchase' },
      { icon: Share2, text: 'Meta/Google: Premium retargeting campaigns' }
    ]
  },
  'Cannot Lose Them': {
    description: 'Previously best customers now inactive',
    icon: AlertCircle,
    strategies: [
      { icon: Megaphone, text: 'Email: Maximum effort win-back' },
      { icon: Award, text: 'Email: VIP "we want you back" offer' },
      { icon: PhoneCall, text: 'Outreach: Direct personal contact' },
      { icon: Gift, text: 'Email: Gift with next purchase' },
      { icon: Share2, text: 'Meta/Google: Premium retargeting campaigns' }
    ]
  },
  'Hibernating': {
    description: 'Inactive for a very long time',
    icon: TrendingDown,
    strategies: [
      { icon: RefreshCw, text: 'Email: Low-effort reactivation' },
      { icon: Mail, text: 'Email: "Long time no see" campaign' },
      { icon: Gift, text: 'Email: One last incentive offer' },
      { icon: XCircle, text: 'Klaviyo: Consider list cleanup' },
      { icon: BarChart3, text: 'Meta/Google: Test different messaging' }
    ]
  },
  'Lost': {
    description: 'Customers who are likely gone for good',
    icon: XCircle,
    strategies: [
      { icon: Mail, text: 'Email: Final win-back attempt' },
      { icon: MessageSquare, text: 'Email: Goodbye survey' },
      { icon: Gift, text: 'Email: Last chance offer' },
      { icon: XCircle, text: 'Klaviyo: Clean up email list' },
      { icon: Eye, text: 'Meta/Google: Suppress from all campaigns' }
    ]
  }
};

// Component to show segment strategy
const SegmentStrategy = ({ segment }) => {
  const strategy = SEGMENT_STRATEGIES[segment];

  if (!strategy) return null;

  const SegmentIcon = strategy.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center ml-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Info className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4 bg-white dark:bg-gray-900 border-2 border-sky-blue dark:border-sky-600 shadow-xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SegmentIcon className="h-5 w-5 text-sky-blue dark:text-sky-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">{segment}</h4>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300">{strategy.description}</p>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-semibold text-gray-900 dark:text-white">Marketing Strategies:</p>
            </div>
            <ul className="space-y-2">
              {strategy.strategies.map((strat, idx) => {
                const StratIcon = strat.icon;
                return (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-900 dark:text-gray-300 leading-relaxed">
                    <StratIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <span>{strat.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function MergedRFMSegments({ segmentData, adaptiveData, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader size="large" showText={true} text="Loading RFM segments..." />
      </div>
    );
  }

  // Ensure data is an array
  const segments = Array.isArray(segmentData) ? segmentData : (segmentData?.data || []);

  if (!segments || segments.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-gray-900 dark:text-yellow-200">No customer segment data available. Make sure the customer_profiles table is populated in ClickHouse.</p>
      </div>
    );
  }

  // Calculate summary stats
  const highValueCustomers = segments
    .filter(s => ['Champions', 'Loyal Customers', 'Potential Loyalists'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  const atRiskCustomers = segments
    .filter(s => ['Need Attention', 'About to Sleep', 'At Risk', 'Cannot Lose Them', 'Cannot Lose'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  const lostCustomers = segments
    .filter(s => ['Lost', 'Hibernating'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  const totalRevenue = segments.reduce((sum, s) => sum + parseFloat(s.total_revenue || 0), 0);

  // Prepare segment data for pie chart
  const segmentChartData = segments.map(seg => ({
    name: seg.rfm_segment,
    value: parseInt(seg.customer_count || 0),
    revenue: parseFloat(seg.total_revenue || 0)
  }));

  // Extract adaptive RFM data if available
  const {
    characteristics,
    calculated_criteria,
    thresholds,
    template_used,
    data_quality
  } = adaptiveData || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards - Minimalist Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Business Model (if adaptive data available) */}
        {template_used && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Business Model</p>
              <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                template_used === 'low_repeat'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : template_used === 'high_repeat'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {template_used === 'low_repeat' ? 'Low Repeat' : template_used === 'high_repeat' ? 'High Repeat' : 'Medium Repeat'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {characteristics?.one_time_buyer_percentage?.toFixed(1)}% one-time buyers
            </p>
          </div>
        )}

        {/* High Value Customers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">High Value</p>
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(highValueCustomers)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Champions, Loyal, Potential</p>
        </div>

        {/* At Risk Customers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">At Risk</p>
            <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(atRiskCustomers)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Need win-back campaigns</p>
        </div>

        {/* Total Revenue or Lost Customers */}
        {!template_used ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Lost/Hibernating</p>
              <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(lostCustomers)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Re-engagement needed</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Purchase Cycle</p>
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {characteristics?.median_inter_purchase_days || 'N/A'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">days (median)</p>
          </div>
        )}
      </div>

      {/* RFM Segment Distribution + Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Customer Segment Distribution</h4>
            <ChartInfo
              title="RFM Segments"
              description="Your customers are automatically classified into segments based on Recency, Frequency, and Monetary value. Focus on Champions and Loyal customers for retention, and At Risk segments for win-back campaigns."
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {segmentChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.name] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatNumber(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Dual-Axis Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Revenue & Customer Overview</h4>
            <ChartInfo
              title="Segment Performance"
              description="Revenue shown as bars (left axis), customer count as line (right axis). This helps visualize which segments drive the most value."
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={segments}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis
                dataKey="rfm_segment"
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fill: '#111827', fontSize: 11 }}
                className="dark:[&>g>text]:fill-gray-100"
                stroke="#6B7280"
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#111827', fontSize: 12 }}
                className="dark:[&>g>text]:fill-gray-100"
                tickFormatter={(value) => formatCurrency(value).replace('$', '$')}
                stroke="#6B7280"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#111827', fontSize: 12 }}
                className="dark:[&>g>text]:fill-gray-100"
                tickFormatter={(value) => formatNumber(value)}
                stroke="#6B7280"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                formatter={(value, name) => {
                  if (name === 'Total Revenue') return formatCurrency(value);
                  if (name === 'Customers') return formatNumber(parseInt(value));
                  return value;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
              <Bar yAxisId="left" dataKey="total_revenue" fill="url(#revenueGradient)" name="Total Revenue" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="customer_count" stroke="#60A5FA" strokeWidth={3} dot={{ r: 5, fill: '#60A5FA', strokeWidth: 2, stroke: '#fff' }} name="Customers" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Adaptive Thresholds (if available) */}
      {thresholds && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Adaptive Recency Thresholds
            </h4>
            <ChartInfo
              title="Business-Specific Thresholds"
              description={`These thresholds are optimized for ${template_used?.replace('_', ' ')} businesses. Customers move from "Hot" to "Lost" based on days since last order. Your median purchase cycle is ${characteristics?.median_inter_purchase_days} days.`}
            />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-green-300 mb-1">
                <Zap className="h-3.5 w-3.5" />
                <span>Hot</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">0-{thresholds.hot}</div>
              <div className="text-xs text-gray-900 dark:text-green-400 mt-1">days</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-blue-300 mb-1">
                <Heart className="h-3.5 w-3.5" />
                <span>Warm</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds.hot + 1}-{thresholds.warm}</div>
              <div className="text-xs text-gray-900 dark:text-blue-400 mt-1">days</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-yellow-300 mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Cool</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds.warm + 1}-{thresholds.cool}</div>
              <div className="text-xs text-gray-900 dark:text-yellow-400 mt-1">days</div>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-orange-300 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>At Risk</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds.cool + 1}-{thresholds.at_risk}</div>
              <div className="text-xs text-gray-900 dark:text-orange-400 mt-1">days</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-red-300 mb-1">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Lost</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds.at_risk + 1}+</div>
              <div className="text-xs text-gray-900 dark:text-red-400 mt-1">days</div>
            </div>
          </div>
        </div>
      )}

      {/* Frequency Criteria (if available) */}
      {calculated_criteria && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Frequency & Monetary Criteria
            </h4>
            <ChartInfo
              title="Auto-Adjusted Thresholds"
              description="These criteria define what makes a customer a Champion or Loyal customer. They're automatically adjusted based on your business model and actual customer distribution."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Champion Criteria */}
            <div className="p-5 rounded-lg border-2 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <h5 className="font-semibold text-gray-900 dark:text-white">Champion Customers</h5>
                </div>
                {calculated_criteria?.frequency?.champion?.adjusted && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Auto-Adjusted
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-300">
                    <strong>{calculated_criteria?.frequency?.champion?.min_orders || 0}+</strong> orders
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-300">
                    <strong>${calculated_criteria?.monetary?.champion?.min_revenue?.toFixed(2) || 0}+</strong> lifetime revenue
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-900 dark:text-gray-400">Customers meeting criteria:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {calculated_criteria?.frequency?.champion?.pct_customers_meeting?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loyal Criteria */}
            <div className="p-5 rounded-lg border-2 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h5 className="font-semibold text-gray-900 dark:text-white">Loyal Customers</h5>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-300">
                    <strong>{calculated_criteria?.frequency?.loyal?.min_orders || 0}+</strong> orders
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-300">
                    <strong>${calculated_criteria?.monetary?.loyal?.min_revenue?.toFixed(2) || 0}+</strong> lifetime revenue
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-900 dark:text-gray-400">Customers meeting criteria:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {calculated_criteria?.frequency?.loyal?.pct_customers_meeting?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Segment Breakdown</h4>
          <ChartInfo
            title="Segment Metrics"
            description="Detailed metrics for each customer segment. Using median (50th percentile) instead of average to avoid distortion from outliers. Median revenue and days inactive are more representative of typical customer behavior."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Segment</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Customers</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Total Revenue</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Avg Revenue/Customer</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">AOV</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Total Orders</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Median Days Inactive</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(segment.rfm_segment)}`}>
                        {segment.rfm_segment}
                      </span>
                      <SegmentStrategy segment={segment.rfm_segment} />
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatNumber(parseInt(segment.customer_count || 0))}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                    ${Number(segment.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                    {(() => {
                      const totalRevenue = Number(segment.total_revenue || 0);
                      const customerCount = parseInt(segment.customer_count || 0);
                      const avgRevenuePerCustomer = customerCount > 0 ? totalRevenue / customerCount : 0;
                      return `$${avgRevenuePerCustomer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                    {(() => {
                      const totalRevenue = Number(segment.total_revenue || 0);
                      const totalOrders = parseInt(segment.total_orders || 0);
                      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                      return `$${aov.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatNumber(parseInt(segment.total_orders || 0))}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{Math.round(Number(segment.median_days_since_last_order || segment.avg_days_since_last_order || 0))} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
