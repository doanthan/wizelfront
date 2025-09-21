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
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, DollarSign,
  UserPlus, UserCheck, UserX, Repeat,
  ArrowUp, ArrowDown, Calendar, Heart,
  ShoppingBag, Clock, Star, TrendingUp as Trend,
  Award, Activity, Globe, Mail
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreCustomersReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customersData, setCustomersData] = useState(null);
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
    localStorage.setItem('customersReportDateRange', JSON.stringify(newDateRangeSelection));
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/customers`);
    }
  };

  // Mock data for customers
  const mockCustomersData = {
    summary: {
      total_customers: 45320,
      new_customers: 3250,
      returning_customers: 12500,
      avg_lifetime_value: 385,
      avg_order_value: 125,
      retention_rate: 68.5,
      churn_rate: 31.5,
      avg_purchase_frequency: 3.2
    },
    previousPeriod: {
      total_customers: 41800,
      new_customers: 2850,
      returning_customers: 11200,
      avg_lifetime_value: 352,
      retention_rate: 65.2
    },
    customerGrowth: [
      { date: '2024-01-01', total: 41800, new: 120, returning: 450 },
      { date: '2024-01-08', total: 42350, new: 145, returning: 480 },
      { date: '2024-01-15', total: 43100, new: 165, returning: 520 },
      { date: '2024-01-22', total: 44200, new: 135, returning: 490 },
      { date: '2024-01-29', total: 45320, new: 155, returning: 510 }
    ],
    cohortRetention: [
      { cohort: 'Jan 2024', month0: 100, month1: 75, month2: 62, month3: 55, month4: 48, month5: 45 },
      { cohort: 'Dec 2023', month0: 100, month1: 72, month2: 58, month3: 52, month4: 46, month5: 42 },
      { cohort: 'Nov 2023', month0: 100, month1: 78, month2: 65, month3: 58, month4: 51, month5: 47 },
      { cohort: 'Oct 2023', month0: 100, month1: 70, month2: 56, month3: 48, month4: 43, month5: 40 }
    ],
    customerSegments: [
      { segment: 'Champions', count: 2250, percentage: 5, ltv: 2850, aov: 285 },
      { segment: 'Loyal', count: 6800, percentage: 15, ltv: 1250, aov: 185 },
      { segment: 'Potential', count: 9050, percentage: 20, ltv: 450, aov: 125 },
      { segment: 'New', count: 13600, percentage: 30, ltv: 125, aov: 85 },
      { segment: 'At Risk', count: 9050, percentage: 20, ltv: 350, aov: 95 },
      { segment: 'Lost', count: 4570, percentage: 10, ltv: 180, aov: 65 }
    ],
    topCustomers: [
      {
        name: "John Smith",
        email: "j***@example.com",
        total_orders: 28,
        total_spent: 8540,
        avg_order_value: 305,
        last_order: "2024-01-28",
        customer_since: "2022-03-15",
        segment: "Champion",
        predicted_ltv: 12500
      },
      {
        name: "Sarah Johnson",
        email: "s***@example.com",
        total_orders: 24,
        total_spent: 6720,
        avg_order_value: 280,
        last_order: "2024-01-25",
        customer_since: "2022-06-20",
        segment: "Champion",
        predicted_ltv: 9800
      },
      {
        name: "Mike Davis",
        email: "m***@example.com",
        total_orders: 18,
        total_spent: 4950,
        avg_order_value: 275,
        last_order: "2024-01-22",
        customer_since: "2022-09-10",
        segment: "Loyal",
        predicted_ltv: 7200
      },
      {
        name: "Emily Wilson",
        email: "e***@example.com",
        total_orders: 15,
        total_spent: 3825,
        avg_order_value: 255,
        last_order: "2024-01-20",
        customer_since: "2023-01-05",
        segment: "Loyal",
        predicted_ltv: 5500
      }
    ],
    purchaseFrequency: [
      { frequency: '1 purchase', customers: 18500, percentage: 40.8 },
      { frequency: '2 purchases', customers: 11250, percentage: 24.8 },
      { frequency: '3-5 purchases', customers: 9500, percentage: 21.0 },
      { frequency: '6-10 purchases', customers: 4300, percentage: 9.5 },
      { frequency: '11+ purchases', customers: 1770, percentage: 3.9 }
    ],
    geographicDistribution: [
      { region: 'North America', customers: 22660, percentage: 50 },
      { region: 'Europe', customers: 11330, percentage: 25 },
      { region: 'Asia', customers: 6798, percentage: 15 },
      { region: 'Other', customers: 4532, percentage: 10 }
    ],
    acquisitionChannels: [
      { channel: 'Organic Search', customers: 15862, percentage: 35 },
      { channel: 'Paid Ads', customers: 11330, percentage: 25 },
      { channel: 'Social Media', customers: 9064, percentage: 20 },
      { channel: 'Email', customers: 4532, percentage: 10 },
      { channel: 'Direct', customers: 4532, percentage: 10 }
    ]
  };

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading && !customersData && mounted) {
    setTimeout(() => setLoading(false), 1000);
  }

  const data = customersData || mockCustomersData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-gray dark:text-white">
            Customers Report
          </h2>
          <p className="text-sm text-slate-gray dark:text-gray-400">
            Customer analytics and insights for {currentStore?.name || 'store'}
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
            storageKey="customersReportDateRange"
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
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-sky-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.summary.total_customers)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_customers, data.previousPeriod.total_customers))} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lifetime Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.avg_lifetime_value)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.avg_lifetime_value, data.previousPeriod.avg_lifetime_value))} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-vivid-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.summary.retention_rate)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {(data.summary.retention_rate - data.previousPeriod.retention_rate).toFixed(1)}pp from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-deep-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.summary.new_customers)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.new_customers, data.previousPeriod.new_customers))} from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Returning Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(data.summary.returning_customers)}</div>
            <p className="text-xs text-slate-gray dark:text-gray-400">Active repeat buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(data.summary.avg_order_value)}</div>
            <p className="text-xs text-slate-gray dark:text-gray-400">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Purchase Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.summary.avg_purchase_frequency}x</div>
            <p className="text-xs text-slate-gray dark:text-gray-400">Average orders per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{formatPercentage(data.summary.churn_rate)}</div>
            <p className="text-xs text-slate-gray dark:text-gray-400">Customer loss rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>RFM-based customer segmentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.customerSegments.map((segment) => (
                <div key={segment.segment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {segment.segment === 'Champions' && <Award className="h-4 w-4 text-yellow-500" />}
                      {segment.segment === 'Loyal' && <Heart className="h-4 w-4 text-red-500" />}
                      {segment.segment === 'Potential' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                      {segment.segment === 'New' && <UserPlus className="h-4 w-4 text-green-500" />}
                      {segment.segment === 'At Risk' && <UserX className="h-4 w-4 text-orange-500" />}
                      {segment.segment === 'Lost' && <UserX className="h-4 w-4 text-gray-500" />}
                      <span className="font-medium">{segment.segment}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span>{formatNumber(segment.count)} ({segment.percentage}%)</span>
                      <Badge variant="outline">LTV: {formatCurrency(segment.ltv)}</Badge>
                    </div>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acquisition Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Acquisition Channels</CardTitle>
            <CardDescription>Customer source distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.acquisitionChannels}
                  dataKey="customers"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.channel}: ${entry.percentage}%`}
                >
                  {data.acquisitionChannels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Customer Growth Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Growth Trend</CardTitle>
          <CardDescription>Total, new, and returning customer trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="total" fill="#60A5FA" fillOpacity={0.3} stroke="#60A5FA" name="Total Customers" />
              <Bar yAxisId="right" dataKey="new" fill="#10B981" name="New Customers" />
              <Bar yAxisId="right" dataKey="returning" fill="#8B5CF6" name="Returning Customers" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cohort Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention Analysis</CardTitle>
          <CardDescription>Customer retention by acquisition cohort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Cohort</th>
                  <th className="text-center p-2">Month 0</th>
                  <th className="text-center p-2">Month 1</th>
                  <th className="text-center p-2">Month 2</th>
                  <th className="text-center p-2">Month 3</th>
                  <th className="text-center p-2">Month 4</th>
                  <th className="text-center p-2">Month 5</th>
                </tr>
              </thead>
              <tbody>
                {data.cohortRetention.map((cohort) => (
                  <tr key={cohort.cohort}>
                    <td className="p-2 font-medium">{cohort.cohort}</td>
                    <td className="text-center p-2">
                      <div className="inline-flex items-center justify-center w-16 h-8 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {cohort.month0}%
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className={`inline-flex items-center justify-center w-16 h-8 rounded ${
                        cohort.month1 > 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        cohort.month1 > 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {cohort.month1}%
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className={`inline-flex items-center justify-center w-16 h-8 rounded ${
                        cohort.month2 > 60 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        cohort.month2 > 40 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {cohort.month2}%
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className={`inline-flex items-center justify-center w-16 h-8 rounded ${
                        cohort.month3 > 50 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        cohort.month3 > 35 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {cohort.month3}%
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className={`inline-flex items-center justify-center w-16 h-8 rounded ${
                        cohort.month4 > 45 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        cohort.month4 > 30 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {cohort.month4}%
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className={`inline-flex items-center justify-center w-16 h-8 rounded ${
                        cohort.month5 > 40 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        cohort.month5 > 25 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {cohort.month5}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Highest value customers by lifetime spend</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">AOV</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Customer Since</TableHead>
                <TableHead className="text-right">Predicted LTV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCustomers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.segment === 'Champion' ? 'default' : 'secondary'}>
                      {customer.segment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{customer.total_orders}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.total_spent)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.avg_order_value)}</TableCell>
                  <TableCell>{customer.last_order}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.customer_since}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(customer.predicted_ltv)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchase Frequency Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Frequency Distribution</CardTitle>
          <CardDescription>Customer distribution by number of purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.purchaseFrequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frequency" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Bar dataKey="customers" fill="#8B5CF6">
                {data.purchaseFrequency.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}