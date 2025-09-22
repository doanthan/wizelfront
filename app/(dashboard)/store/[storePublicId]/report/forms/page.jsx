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
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  FileText, TrendingUp, TrendingDown, Users,
  Eye, MousePointer, CheckCircle, XCircle,
  ArrowUp, ArrowDown, Calendar, Smartphone,
  Monitor, Tablet, Globe, Clock, UserPlus
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreFormsReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formsData, setFormsData] = useState(null);
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
    localStorage.setItem('formsReportDateRange', JSON.stringify(newDateRangeSelection));
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/forms`);
    }
  };

  // Mock data for forms
  const mockFormsData = {
    summary: {
      active_forms: 8,
      total_views: 125000,
      total_submissions: 8750,
      conversion_rate: 7.0,
      new_subscribers: 7500,
      bounce_rate: 45.2,
      avg_time_on_form: 32,
      total_unique_visitors: 95000
    },
    previousPeriod: {
      active_forms: 7,
      total_views: 105000,
      total_submissions: 6825,
      conversion_rate: 6.5,
      new_subscribers: 5800
    },
    formPerformance: [
      {
        name: "Newsletter Popup",
        type: "popup",
        status: "active",
        views: 45000,
        submissions: 4050,
        conversion_rate: 9.0,
        bounce_rate: 35,
        new_subscribers: 3645,
        avg_time: "18s",
        placement: "homepage"
      },
      {
        name: "Exit Intent Offer",
        type: "popup",
        status: "active",
        views: 28000,
        submissions: 2240,
        conversion_rate: 8.0,
        bounce_rate: 40,
        new_subscribers: 2016,
        avg_time: "12s",
        placement: "all pages"
      },
      {
        name: "Footer Subscribe",
        type: "embedded",
        status: "active",
        views: 22000,
        submissions: 1100,
        conversion_rate: 5.0,
        bounce_rate: 60,
        new_subscribers: 990,
        avg_time: "45s",
        placement: "footer"
      },
      {
        name: "Welcome Bar",
        type: "bar",
        status: "active",
        views: 15000,
        submissions: 750,
        conversion_rate: 5.0,
        bounce_rate: 50,
        new_subscribers: 675,
        avg_time: "8s",
        placement: "header"
      },
      {
        name: "Contest Entry",
        type: "landing",
        status: "active",
        views: 8000,
        submissions: 400,
        conversion_rate: 5.0,
        bounce_rate: 42,
        new_subscribers: 360,
        avg_time: "120s",
        placement: "landing page"
      }
    ],
    deviceBreakdown: [
      { device: 'Mobile', views: 68750, submissions: 4812, rate: 7.0 },
      { device: 'Desktop', views: 43750, submissions: 3500, rate: 8.0 },
      { device: 'Tablet', views: 12500, submissions: 438, rate: 3.5 }
    ],
    formTypes: [
      { type: 'Popup', count: 3, submissions: 7040 },
      { type: 'Embedded', count: 2, submissions: 1100 },
      { type: 'Bar', count: 1, submissions: 750 },
      { type: 'Landing', count: 2, submissions: 860 }
    ],
    submissionTrends: [
      { date: '2024-01-01', views: 4200, submissions: 294 },
      { date: '2024-01-08', views: 4500, submissions: 338 },
      { date: '2024-01-15', views: 4800, submissions: 384 },
      { date: '2024-01-22', views: 4100, submissions: 287 },
      { date: '2024-01-29', views: 4600, submissions: 368 }
    ],
    sourceBreakdown: [
      { source: 'Direct', percentage: 35 },
      { source: 'Organic Search', percentage: 28 },
      { source: 'Social Media', percentage: 22 },
      { source: 'Referral', percentage: 10 },
      { source: 'Email', percentage: 5 }
    ]
  };

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading && !formsData && mounted) {
    setTimeout(() => setLoading(false), 1000);
  }

  const data = formsData || mockFormsData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Forms Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Signup form performance for {currentStore?.name || 'store'}
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
            storageKey="formsReportDateRange"
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
            <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
            <FileText className="h-4 w-4 text-sky-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.active_forms}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{data.summary.active_forms - data.previousPeriod.active_forms} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-vivid-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(data.summary.conversion_rate)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {(data.summary.conversion_rate - data.previousPeriod.conversion_rate).toFixed(1)}pp from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Subscribers</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.summary.new_subscribers)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.new_subscribers, data.previousPeriod.new_subscribers))} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-deep-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.summary.total_views)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_views, data.previousPeriod.total_views))} from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{data.summary.bounce_rate}%</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Visitors who left immediately</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Time on Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{data.summary.avg_time_on_form}s</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Average engagement time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(data.summary.total_unique_visitors)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Individual form viewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(data.summary.total_submissions)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Form completions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Performance</CardTitle>
            <CardDescription>Form conversions by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceBreakdown.map((device) => (
                <div key={device.device} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device.device === 'Mobile' && <Smartphone className="h-4 w-4" />}
                      {device.device === 'Desktop' && <Monitor className="h-4 w-4" />}
                      {device.device === 'Tablet' && <Tablet className="h-4 w-4" />}
                      <span className="font-medium">{device.device}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(device.submissions)} submissions</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatPercentage(device.rate)} conversion</div>
                    </div>
                  </div>
                  <Progress value={(device.views / data.summary.total_views) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where form visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.sourceBreakdown}
                  dataKey="percentage"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.source}: ${entry.percentage}%`}
                >
                  {data.sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Form Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Form Performance Details</CardTitle>
          <CardDescription>Individual form metrics and conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead className="text-right">New Subscribers</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>Placement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.formPerformance.map((form) => (
                <TableRow key={form.name}>
                  <TableCell className="font-medium">{form.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {form.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">
                      {form.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(form.views)}</TableCell>
                  <TableCell className="text-right">{formatNumber(form.submissions)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={form.conversion_rate * 10} className="w-[60px]" />
                      <span className="text-sm">{form.conversion_rate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(form.new_subscribers)}</TableCell>
                  <TableCell>{form.avg_time}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{form.placement}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Submission Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Form Activity Trends</CardTitle>
          <CardDescription>Views and submissions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.submissionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="views" stackId="1" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.6} name="Views" />
              <Area type="monotone" dataKey="submissions" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Submissions" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Form Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Form Type</CardTitle>
          <CardDescription>Submissions breakdown by form type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.formTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="submissions" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}