"use client";

import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import {
  TrendingUp, Users, Mail, MousePointer, DollarSign, ShoppingCart,
  Zap, Target, Award, Sparkles, ArrowUp, ArrowDown, Calendar,
  Clock, Filter, Download, RefreshCw, ChevronRight, MoreVertical,
  BarChart3, PieChart as PieChartIcon, Activity, Layers
} from 'lucide-react';
import MorphingLoader from '@/app/components/ui/loading';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

// Generate demo data
const generateRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => ({
    month,
    revenue: Math.floor(45000 + Math.random() * 35000 + (i * 3000)),
    orders: Math.floor(200 + Math.random() * 150 + (i * 15)),
    aov: Math.floor(180 + Math.random() * 60),
    lastYear: Math.floor(38000 + Math.random() * 25000 + (i * 2500))
  }));
};

const generateCampaignData = () => {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  });

  return days.map(day => ({
    day,
    sent: Math.floor(1000 + Math.random() * 2000),
    opened: Math.floor(300 + Math.random() * 700),
    clicked: Math.floor(50 + Math.random() * 250),
    converted: Math.floor(10 + Math.random() * 80)
  }));
};

const generateChannelData = () => [
  { channel: 'Email', value: 45000, percentage: 45, fill: '#60A5FA' },
  { channel: 'SMS', value: 25000, percentage: 25, fill: '#8B5CF6' },
  { channel: 'Push', value: 15000, percentage: 15, fill: '#F472B6' },
  { channel: 'Social', value: 10000, percentage: 10, fill: '#FCD34D' },
  { channel: 'Other', value: 5000, percentage: 5, fill: '#A78BFA' }
];

const generatePerformanceData = () => [
  { metric: 'Open Rate', current: 28.5, benchmark: 22.3, max: 40 },
  { metric: 'Click Rate', current: 4.2, benchmark: 3.1, max: 10 },
  { metric: 'Conversion', current: 2.8, benchmark: 2.1, max: 5 },
  { metric: 'Bounce Rate', current: 1.2, benchmark: 2.5, max: 5 },
  { metric: 'Unsubscribe', current: 0.3, benchmark: 0.5, max: 2 },
  { metric: 'Growth Rate', current: 5.6, benchmark: 3.2, max: 10 }
];

const generateHeatmapData = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const data = [];

  days.forEach((day, dayIndex) => {
    hours.forEach(hour => {
      // Simulate higher engagement during business hours and weekdays
      const baseValue = dayIndex === 0 || dayIndex === 6 ? 20 : 40; // Lower on weekends
      const hourMultiplier = hour >= 9 && hour <= 17 ? 2 : 1; // Higher during business hours
      const value = Math.floor(baseValue * hourMultiplier + Math.random() * 30);

      data.push({ day, hour, value });
    });
  });

  return data;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {entry.name.includes('Revenue') || entry.name.includes('$')
                ? formatCurrency(entry.value)
                : entry.name.includes('%') || entry.name.includes('Rate')
                ? formatPercentage(entry.value)
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Stat card component
const StatCard = ({ icon: Icon, title, value, change, trend, color = 'blue', mini = false }) => {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? ArrowUp : ArrowDown;

  const colorClasses = {
    blue: 'from-sky-blue to-royal-blue',
    purple: 'from-vivid-violet to-deep-purple',
    pink: 'from-pink-400 to-pink-600',
    yellow: 'from-yellow-400 to-yellow-600',
    green: 'from-green-400 to-green-600'
  };

  if (mini) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
          <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{value}</p>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              <TrendIcon className="h-3 w-3" />
              <span>{change}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chart card wrapper
const ChartCard = ({ title, subtitle, icon: Icon, children, actions }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

// Engagement heatmap component
const EngagementHeatmap = ({ data }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getColor = (value) => {
    if (!value) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = Math.min(value / 100, 1);
    const colors = [
      'bg-blue-100 dark:bg-blue-900/20',
      'bg-blue-200 dark:bg-blue-800/30',
      'bg-blue-300 dark:bg-blue-700/40',
      'bg-blue-400 dark:bg-blue-600/50',
      'bg-blue-500 dark:bg-blue-500/60',
      'bg-blue-600 dark:bg-blue-400/70'
    ];
    return colors[Math.floor(intensity * (colors.length - 1))];
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-1 mb-2">
          <div className="w-12"></div>
          {hours.map(hour => (
            <div key={hour} className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400">
              {hour === 0 ? '12a' : hour === 12 ? '12p' : hour < 12 ? `${hour}a` : `${hour - 12}p`}
            </div>
          ))}
        </div>
        {days.map(day => (
          <div key={day} className="flex gap-1 mb-1">
            <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              {day}
            </div>
            {hours.map(hour => {
              const cellData = data.find(d => d.day === day && d.hour === hour);
              const value = cellData?.value || 0;
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`flex-1 h-8 rounded ${getColor(value)} hover:ring-2 hover:ring-sky-blue transition-all cursor-pointer group relative`}
                  title={`${day} ${hour}:00 - ${value}% engagement`}
                >
                  {value > 70 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-white opacity-70" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">Low engagement</span>
        <div className="flex gap-1">
          {[20, 40, 60, 80, 100].map(v => (
            <div key={v} className={`w-8 h-4 rounded ${getColor(v)}`} />
          ))}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">High engagement</span>
      </div>
    </div>
  );
};

export default function Dashboard2Page() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Generate data
  const revenueData = useMemo(() => generateRevenueData(), []);
  const campaignData = useMemo(() => generateCampaignData(), []);
  const channelData = useMemo(() => generateChannelData(), []);
  const performanceData = useMemo(() => generatePerformanceData(), []);
  const heatmapData = useMemo(() => generateHeatmapData(), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader
          size="xlarge"
          showText={true}
          text="Loading dashboard..."
          customThemeTexts={[
            "Analyzing your metrics...",
            "Calculating engagement rates...",
            "Processing campaign data...",
            "Generating insights..."
          ]}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your campaigns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Last 30 days</span>
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Filter className="h-4 w-4" />
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-sky-blue to-vivid-violet text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={formatCurrency(584320)}
            change="+12.5%"
            trend="up"
            color="green"
          />
          <StatCard
            icon={Users}
            title="Active Subscribers"
            value={formatNumber(45234)}
            change="+8.2%"
            trend="up"
            color="blue"
          />
          <StatCard
            icon={Mail}
            title="Emails Sent"
            value={formatNumber(128450)}
            change="+15.3%"
            trend="up"
            color="purple"
          />
          <StatCard
            icon={MousePointer}
            title="Avg. Click Rate"
            value="4.2%"
            change="-0.3%"
            trend="down"
            color="yellow"
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* Revenue trend */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue & Orders"
            subtitle="Monthly performance"
            icon={TrendingUp}
            actions={
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </button>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="lastYearGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#60A5FA"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="lastYear"
                  stroke="#8B5CF6"
                  fill="url(#lastYearGradient)"
                  strokeWidth={2}
                  name="Last Year"
                />
                <Bar
                  yAxisId="right"
                  dataKey="orders"
                  fill="#F472B6"
                  radius={[4, 4, 0, 0]}
                  name="Orders"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Channel distribution */}
        <ChartCard
          title="Channel Performance"
          subtitle="Revenue by channel"
          icon={PieChartIcon}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Campaign funnel */}
        <ChartCard
          title="Campaign Funnel"
          subtitle="Last 30 days performance"
          icon={Activity}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={campaignData}>
              <defs>
                <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="openedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="clickedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F472B6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F472B6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sent" stackId="1" stroke="#60A5FA" fill="url(#sentGradient)" name="Sent" />
              <Area type="monotone" dataKey="opened" stackId="2" stroke="#8B5CF6" fill="url(#openedGradient)" name="Opened" />
              <Area type="monotone" dataKey="clicked" stackId="3" stroke="#F472B6" fill="url(#clickedGradient)" name="Clicked" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Performance radar */}
        <ChartCard
          title="Performance Metrics"
          subtitle="Compared to industry benchmark"
          icon={Target}
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceData}>
              <PolarGrid className="opacity-30" />
              <PolarAngleAxis dataKey="metric" className="text-xs" />
              <PolarRadiusAxis angle={90} domain={[0, 40]} className="text-xs" />
              <Radar name="Current" dataKey="current" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.6} />
              <Radar name="Benchmark" dataKey="benchmark" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
              <Legend />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Engagement heatmap */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Engagement Heatmap"
            subtitle="Best times to send campaigns"
            icon={Clock}
          >
            <EngagementHeatmap data={heatmapData} />
          </ChartCard>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          mini
          icon={Award}
          title="Best Campaign"
          value="28.5%"
          color="purple"
        />
        <StatCard
          mini
          icon={Users}
          title="New Subscribers"
          value="+1,234"
          color="blue"
        />
        <StatCard
          mini
          icon={ShoppingCart}
          title="Avg. Order Value"
          value="$156"
          color="green"
        />
        <StatCard
          mini
          icon={Zap}
          title="Automation Rate"
          value="67%"
          color="yellow"
        />
        <StatCard
          mini
          icon={Target}
          title="Conversion Rate"
          value="3.2%"
          color="pink"
        />
        <StatCard
          mini
          icon={TrendingUp}
          title="Growth Rate"
          value="+5.6%"
          color="blue"
        />
      </div>

      {/* Recent activity */}
      <ChartCard
        title="Recent Campaign Performance"
        subtitle="Your last 5 campaigns"
        icon={BarChart3}
      >
        <div className="space-y-4">
          {['Black Friday Sale', 'Welcome Series', 'Product Launch', 'Newsletter #45', 'Flash Sale'].map((campaign, index) => {
            const stats = {
              sent: Math.floor(5000 + Math.random() * 10000),
              opened: Math.floor(20 + Math.random() * 15),
              clicked: Math.floor(2 + Math.random() * 5),
              revenue: Math.floor(1000 + Math.random() * 9000)
            };

            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full bg-gradient-to-b ${
                    index === 0 ? 'from-green-400 to-green-600' :
                    index === 1 ? 'from-blue-400 to-blue-600' :
                    index === 2 ? 'from-purple-400 to-purple-600' :
                    index === 3 ? 'from-yellow-400 to-yellow-600' :
                    'from-pink-400 to-pink-600'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{campaign}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sent {formatNumber(stats.sent)} • {new Date(Date.now() - index * 86400000 * 3).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open Rate</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.opened}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click Rate</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.clicked}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(stats.revenue)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}