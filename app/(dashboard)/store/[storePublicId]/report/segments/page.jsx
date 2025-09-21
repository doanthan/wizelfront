"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Treemap
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, DollarSign,
  UserCheck, UserX, Star, Activity,
  ArrowUp, ArrowDown, Calendar, Filter,
  Target, ShoppingBag, Clock, Layers
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreSegmentsReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [segmentsData, setSegmentsData] = useState(null);
  const [error, setError] = useState(null);
  const [storePublicId, setStorePublicId] = useState(null);

  // Get storePublicId from params
  useEffect(() => {
    async function getStoreId() {
      const resolvedParams = await params;
      setStorePublicId(resolvedParams.storePublicId);
    }
    getStoreId();
  }, [params]);

  // Calculate default dates
  const getDefaultDateRange = () => {
    const now = new Date();
    const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const past60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    return {
      period: "last30",
      comparisonType: "previous-period",
      ranges: {
        main: {
          start: past30Days,
          end: now,
          label: "Past 30 days"
        },
        comparison: {
          start: past60Days,
          end: past30Days,
          label: "Previous 30 days"
        }
      }
    };
  };

  const [dateRangeSelection, setDateRangeSelection] = useState(getDefaultDateRange());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current store
  const currentStore = useMemo(() => {
    if (!stores || !storePublicId) return null;
    return stores.find(s => s.public_id === storePublicId);
  }, [stores, storePublicId]);

  // Handle date range changes
  const handleDateRangeChange = (newDateRangeSelection) => {
    setDateRangeSelection(newDateRangeSelection);
    localStorage.setItem('segmentsReportDateRange', JSON.stringify(newDateRangeSelection));
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/segments`);
    }
  };

  // Mock data for segments
  const mockSegmentsData = {
    summary: {
      total_segments: 24,
      total_profiles: 125000,
      avg_segment_size: 5208,
      engaged_segments: 18,
      growing_segments: 15,
      avg_engagement_rate: 42.5,
      total_revenue_attributed: 450000,
      most_valuable_segment: "VIP Customers"
    },
    previousPeriod: {
      total_segments: 21,
      total_profiles: 108000,
      avg_segment_size: 5143,
      engaged_segments: 16,
      growing_segments: 12
    },
    segmentDetails: [
      {
        name: "VIP Customers",
        size: 2500,
        growth: 15.2,
        engagement_rate: 78.5,
        open_rate: 45.2,
        click_rate: 12.8,
        conversion_rate: 8.5,
        avg_order_value: 285,
        lifetime_value: 2150,
        revenue: 125000,
        tags: ["High Value", "Engaged"]
      },
      {
        name: "New Subscribers",
        size: 18500,
        growth: 25.8,
        engagement_rate: 35.2,
        open_rate: 28.5,
        click_rate: 4.2,
        conversion_rate: 2.1,
        avg_order_value: 65,
        lifetime_value: 120,
        revenue: 45000,
        tags: ["Growing", "Potential"]
      },
      {
        name: "Repeat Purchasers",
        size: 8200,
        growth: 8.5,
        engagement_rate: 62.3,
        open_rate: 38.9,
        click_rate: 8.7,
        conversion_rate: 5.2,
        avg_order_value: 145,
        lifetime_value: 890,
        revenue: 85000,
        tags: ["Loyal", "Engaged"]
      },
      {
        name: "Cart Abandoners",
        size: 12400,
        growth: -5.2,
        engagement_rate: 28.5,
        open_rate: 22.1,
        click_rate: 3.5,
        conversion_rate: 1.8,
        avg_order_value: 95,
        lifetime_value: 180,
        revenue: 28000,
        tags: ["Re-engage", "At Risk"]
      },
      {
        name: "Win-Back Targets",
        size: 6800,
        growth: -12.3,
        engagement_rate: 15.2,
        open_rate: 18.5,
        click_rate: 2.1,
        conversion_rate: 0.8,
        avg_order_value: 75,
        lifetime_value: 150,
        revenue: 12000,
        tags: ["Churning", "Re-engage"]
      }
    ],
    segmentGrowth: [
      { date: '2024-01-01', vip: 2180, new: 14700, repeat: 7560, abandoners: 13080 },
      { date: '2024-01-08', vip: 2250, new: 15500, repeat: 7750, abandoners: 12850 },
      { date: '2024-01-15', vip: 2350, new: 16800, repeat: 7920, abandoners: 12650 },
      { date: '2024-01-22', vip: 2420, new: 17500, repeat: 8050, abandoners: 12500 },
      { date: '2024-01-29', vip: 2500, new: 18500, repeat: 8200, abandoners: 12400 }
    ],
    segmentEngagement: [
      { metric: 'Open Rate', VIP: 45.2, Repeat: 38.9, New: 28.5, Abandoners: 22.1, WinBack: 18.5 },
      { metric: 'Click Rate', VIP: 12.8, Repeat: 8.7, New: 4.2, Abandoners: 3.5, WinBack: 2.1 },
      { metric: 'Conversion', VIP: 8.5, Repeat: 5.2, New: 2.1, Abandoners: 1.8, WinBack: 0.8 }
    ],
    segmentDistribution: [
      { name: 'New Subscribers', value: 18500, percentage: 37 },
      { name: 'Cart Abandoners', value: 12400, percentage: 24.8 },
      { name: 'Repeat Purchasers', value: 8200, percentage: 16.4 },
      { name: 'Win-Back Targets', value: 6800, percentage: 13.6 },
      { name: 'VIP Customers', value: 2500, percentage: 5 },
      { name: 'Others', value: 1600, percentage: 3.2 }
    ],
    behaviorMetrics: [
      { subject: 'Purchase Frequency', VIP: 85, Repeat: 70, Average: 50, fullMark: 100 },
      { subject: 'Engagement', VIP: 90, Repeat: 75, Average: 45, fullMark: 100 },
      { subject: 'AOV', VIP: 95, Repeat: 60, Average: 40, fullMark: 100 },
      { subject: 'Retention', VIP: 88, Repeat: 65, Average: 35, fullMark: 100 },
      { subject: 'Lifetime Value', VIP: 92, Repeat: 55, Average: 30, fullMark: 100 }
    ]
  };

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading && !segmentsData && mounted) {
    setTimeout(() => setLoading(false), 1000);
  }

  const data = segmentsData || mockSegmentsData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-gray dark:text-white">
            Segments Report
          </h2>
          <p className="text-sm text-slate-gray dark:text-gray-400">
            Customer segmentation insights for {currentStore?.name || 'store'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={storePublicId || ''} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-[200px]">
              <Store className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select a store">
                {currentStore?.name || 'Select store'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stores && stores.map(store => (
                <SelectItem key={store.public_id} value={store.public_id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      store.klaviyo_integration?.public_id ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {store.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateRangeSelector
            onDateRangeChange={handleDateRangeChange}
            storageKey="segmentsReportDateRange"
            showComparison={true}
            initialDateRange={dateRangeSelection}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hover:bg-sky-tint/50 transition-all"
          >
            {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <div className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
            <Layers className="h-4 w-4 text-sky-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_segments}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{data.summary.total_segments - data.previousPeriod.total_segments} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-vivid-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.summary.total_profiles)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_profiles, data.previousPeriod.total_profiles))} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.summary.avg_engagement_rate)}</div>
            <p className="text-xs text-muted-foreground">
              Across all segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segment Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-deep-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.total_revenue_attributed)}</div>
            <p className="text-xs text-muted-foreground">
              Total attributed revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Segment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Segment Distribution</CardTitle>
            <CardDescription>Profile distribution across segments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.segmentDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                >
                  {data.segmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Behavior Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Segment Behavior Analysis</CardTitle>
            <CardDescription>Behavioral metrics comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={data.behaviorMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="VIP" dataKey="VIP" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.6} />
                <Radar name="Repeat" dataKey="Repeat" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                <Radar name="Average" dataKey="Average" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Segment Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Performance Details</CardTitle>
          <CardDescription>Key metrics for each customer segment</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment Name</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Growth</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead className="text-right">Click Rate</TableHead>
                <TableHead className="text-right">AOV</TableHead>
                <TableHead className="text-right">LTV</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.segmentDetails.map((segment) => (
                <TableRow key={segment.name}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      <div className="flex gap-1 mt-1">
                        {segment.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(segment.size)}</TableCell>
                  <TableCell>
                    <div className={`flex items-center ${segment.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {segment.growth > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      {Math.abs(segment.growth)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{segment.engagement_rate}%</TableCell>
                  <TableCell className="text-right">{segment.open_rate}%</TableCell>
                  <TableCell className="text-right">{segment.click_rate}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(segment.avg_order_value)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(segment.lifetime_value)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(segment.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Segment Growth Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Growth Trends</CardTitle>
          <CardDescription>Segment size changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.segmentGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="vip" stroke="#60A5FA" strokeWidth={2} name="VIP" />
              <Line type="monotone" dataKey="new" stroke="#8B5CF6" strokeWidth={2} name="New Subscribers" />
              <Line type="monotone" dataKey="repeat" stroke="#10B981" strokeWidth={2} name="Repeat Purchasers" />
              <Line type="monotone" dataKey="abandoners" stroke="#F59E0B" strokeWidth={2} name="Cart Abandoners" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics by Segment</CardTitle>
          <CardDescription>Comparative engagement performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.segmentEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="VIP" fill="#60A5FA" />
              <Bar dataKey="Repeat" fill="#8B5CF6" />
              <Bar dataKey="New" fill="#10B981" />
              <Bar dataKey="Abandoners" fill="#F59E0B" />
              <Bar dataKey="WinBack" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Most Valuable Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.summary.most_valuable_segment}</div>
            <p className="text-sm text-muted-foreground">{formatCurrency(125000)} revenue</p>
            <p className="text-sm text-green-600">78.5% engagement rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fastest Growing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">New Subscribers</div>
            <p className="text-sm text-green-600">+25.8% growth</p>
            <p className="text-sm text-muted-foreground">18,500 profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Win-Back Targets</div>
            <p className="text-sm text-red-600">-12.3% decline</p>
            <p className="text-sm text-muted-foreground">15.2% engagement</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}