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
  ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  Zap, TrendingUp, TrendingDown, DollarSign,
  Users, ShoppingCart, Mail, Clock,
  ArrowUp, ArrowDown, Calendar, Activity,
  CheckCircle, XCircle, AlertCircle, Repeat
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreFlowsReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flowsData, setFlowsData] = useState(null);
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
    localStorage.setItem('flowsReportDateRange', JSON.stringify(newDateRangeSelection));
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/flows`);
    }
  };

  // Mock data for flows
  const mockFlowsData = {
    summary: {
      active_flows: 12,
      total_triggered: 45230,
      total_completed: 28450,
      completion_rate: 62.9,
      total_revenue: 285000,
      avg_revenue_per_flow: 10.01,
      total_emails_sent: 125000,
      total_conversions: 3250
    },
    previousPeriod: {
      active_flows: 10,
      total_triggered: 38500,
      total_completed: 22150,
      completion_rate: 57.5,
      total_revenue: 215000
    },
    flowPerformance: [
      {
        name: "Welcome Series",
        status: "active",
        triggered: 12500,
        completed: 9375,
        completion_rate: 75,
        emails_sent: 37500,
        conversions: 1125,
        conversion_rate: 9,
        revenue: 67500,
        avg_time_to_complete: "3 days"
      },
      {
        name: "Abandoned Cart",
        status: "active",
        triggered: 8900,
        completed: 5340,
        completion_rate: 60,
        emails_sent: 17800,
        conversions: 890,
        conversion_rate: 10,
        revenue: 89000,
        avg_time_to_complete: "24 hours"
      },
      {
        name: "Post-Purchase",
        status: "active",
        triggered: 6700,
        completed: 5025,
        completion_rate: 75,
        emails_sent: 13400,
        conversions: 335,
        conversion_rate: 5,
        revenue: 33500,
        avg_time_to_complete: "7 days"
      },
      {
        name: "Win-Back",
        status: "active",
        triggered: 4200,
        completed: 2100,
        completion_rate: 50,
        emails_sent: 8400,
        conversions: 210,
        conversion_rate: 5,
        revenue: 42000,
        avg_time_to_complete: "14 days"
      },
      {
        name: "Browse Abandonment",
        status: "active",
        triggered: 5800,
        completed: 3480,
        completion_rate: 60,
        emails_sent: 11600,
        conversions: 290,
        conversion_rate: 5,
        revenue: 23200,
        avg_time_to_complete: "2 days"
      }
    ],
    flowFunnel: [
      { name: 'Triggered', value: 45230, fill: '#60A5FA' },
      { name: 'First Email Opened', value: 36184, fill: '#8B5CF6' },
      { name: 'Clicked', value: 18092, fill: '#10B981' },
      { name: 'Converted', value: 3250, fill: '#F59E0B' }
    ],
    revenueByFlow: [
      { name: 'Abandoned Cart', revenue: 89000 },
      { name: 'Welcome Series', revenue: 67500 },
      { name: 'Win-Back', revenue: 42000 },
      { name: 'Post-Purchase', revenue: 33500 },
      { name: 'Browse Abandonment', revenue: 23200 },
      { name: 'Others', revenue: 29800 }
    ],
    flowTrends: [
      { date: '2024-01-01', triggered: 1500, completed: 945 },
      { date: '2024-01-08', triggered: 1650, completed: 1040 },
      { date: '2024-01-15', triggered: 1800, completed: 1134 },
      { date: '2024-01-22', triggered: 1400, completed: 882 },
      { date: '2024-01-29', triggered: 1700, completed: 1071 }
    ]
  };

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading && !flowsData && mounted) {
    setTimeout(() => setLoading(false), 1000);
  }

  const data = flowsData || mockFlowsData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Flows Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automated flow performance for {currentStore?.name || 'store'}
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
            storageKey="flowsReportDateRange"
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
            <CardTitle className="text-sm font-medium">Active Flows</CardTitle>
            <Zap className="h-4 w-4 text-sky-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.active_flows}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{data.summary.active_flows - data.previousPeriod.active_flows} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flow Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary.total_revenue)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_revenue, data.previousPeriod.total_revenue))} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-vivid-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(data.summary.completion_rate)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {(data.summary.completion_rate - data.previousPeriod.completion_rate).toFixed(1)}pp from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggered</CardTitle>
            <Activity className="h-4 w-4 text-deep-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.summary.total_triggered)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_triggered, data.previousPeriod.total_triggered))} from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Flow Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Flow Journey Funnel</CardTitle>
            <CardDescription>User progression through flows</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={data.flowFunnel}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Flow</CardTitle>
            <CardDescription>Top revenue generating flows</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByFlow} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Flow Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Performance Details</CardTitle>
          <CardDescription>Individual flow metrics and conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Triggered</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Avg Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.flowPerformance.map((flow) => (
                <TableRow key={flow.name}>
                  <TableCell className="font-medium">{flow.name}</TableCell>
                  <TableCell>
                    <Badge variant="success">
                      {flow.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(flow.triggered)}</TableCell>
                  <TableCell className="text-right">{formatNumber(flow.completed)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={flow.completion_rate} className="w-[60px]" />
                      <span className="text-sm">{flow.completion_rate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(flow.conversions)}</TableCell>
                  <TableCell className="text-right">{flow.conversion_rate}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(flow.revenue)}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{flow.avg_time_to_complete}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Flow Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Activity Trends</CardTitle>
          <CardDescription>Triggered vs completed flows over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.flowTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="triggered" stroke="#60A5FA" strokeWidth={2} name="Triggered" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Flow Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Best Performing Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Welcome Series</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">75% completion rate</p>
            <p className="text-sm text-green-600">{formatCurrency(67500)} revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Highest Revenue Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Abandoned Cart</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">10% conversion rate</p>
            <p className="text-sm text-green-600">{formatCurrency(89000)} revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Flow Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary.avg_revenue_per_flow)}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average revenue per flow recipient</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}