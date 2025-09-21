"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, Search, Filter } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
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
  TrendingUp, TrendingDown, Mail, MousePointer,
  Eye, Target, Send, Users, DollarSign,
  ArrowUp, ArrowDown, Calendar, MessageSquare,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreCampaignsReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaignsData, setCampaignsData] = useState(null);
  const [error, setError] = useState(null);
  const [storePublicId, setStorePublicId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    localStorage.setItem('campaignsReportDateRange', JSON.stringify(newDateRangeSelection));
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/campaigns`);
    }
  };

  // Mock data - replace with actual API calls
  const mockCampaignsData = {
    summary: {
      total_campaigns: 45,
      total_sent: 285000,
      avg_open_rate: 24.5,
      avg_click_rate: 3.2,
      avg_conversion_rate: 2.1,
      total_revenue: 125000,
      total_opens: 69825,
      total_clicks: 9120,
      total_conversions: 5985
    },
    previousPeriod: {
      total_campaigns: 38,
      total_sent: 245000,
      avg_open_rate: 22.1,
      avg_click_rate: 2.8,
      avg_conversion_rate: 1.8,
      total_revenue: 98000
    },
    performanceOverTime: [
      { date: '2024-01-01', opens: 2500, clicks: 320, conversions: 85 },
      { date: '2024-01-08', opens: 2800, clicks: 380, conversions: 95 },
      { date: '2024-01-15', opens: 3200, clicks: 420, conversions: 110 },
      { date: '2024-01-22', opens: 2900, clicks: 390, conversions: 100 },
      { date: '2024-01-29', opens: 3100, clicks: 410, conversions: 105 }
    ],
    campaigns: [
      {
        id: 1,
        name: "New Year Sale Campaign",
        status: "sent",
        send_date: "2024-01-01",
        recipients: 25000,
        opens: 7500,
        open_rate: 30,
        clicks: 1250,
        click_rate: 5,
        conversions: 375,
        conversion_rate: 1.5,
        revenue: 18750,
        type: "email"
      },
      {
        id: 2,
        name: "Product Launch Announcement",
        status: "sent",
        send_date: "2024-01-15",
        recipients: 30000,
        opens: 8100,
        open_rate: 27,
        clicks: 1080,
        click_rate: 3.6,
        conversions: 324,
        conversion_rate: 1.08,
        revenue: 21600,
        type: "email"
      },
      {
        id: 3,
        name: "Valentine's Day Special",
        status: "scheduled",
        send_date: "2024-02-14",
        recipients: 35000,
        type: "email"
      },
      {
        id: 4,
        name: "SMS Flash Sale",
        status: "sent",
        send_date: "2024-01-20",
        recipients: 15000,
        opens: 4500,
        open_rate: 30,
        clicks: 900,
        click_rate: 6,
        conversions: 450,
        conversion_rate: 3,
        revenue: 13500,
        type: "sms"
      }
    ],
    campaignTypes: [
      { type: "Promotional", count: 25, percentage: 55.6 },
      { type: "Informational", count: 12, percentage: 26.7 },
      { type: "Seasonal", count: 8, percentage: 17.7 }
    ]
  };

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = mockCampaignsData.campaigns;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    return filtered;
  }, [searchQuery, statusFilter]);

  if (loading && !campaignsData && mounted) {
    setTimeout(() => setLoading(false), 1000);
  }

  const data = campaignsData || mockCampaignsData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-gray dark:text-white">
            Campaigns Report
          </h2>
          <p className="text-sm text-slate-gray dark:text-gray-400">
            Email & SMS campaign performance for {currentStore?.name || 'store'}
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
            storageKey="campaignsReportDateRange"
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
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-sky-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_campaigns}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_campaigns, data.previousPeriod.total_campaigns))} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-vivid-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.summary.avg_open_rate)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {(data.summary.avg_open_rate - data.previousPeriod.avg_open_rate).toFixed(1)}pp from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-deep-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.summary.avg_click_rate)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {(data.summary.avg_click_rate - data.previousPeriod.avg_click_rate).toFixed(1)}pp from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.total_revenue)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_revenue, data.previousPeriod.total_revenue))} from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(data.summary.total_sent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Opens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(data.summary.total_opens)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(data.summary.total_clicks)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatNumber(data.summary.total_conversions)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Over Time</CardTitle>
          <CardDescription>Opens, clicks, and conversions trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.performanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="opens" stackId="1" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.6} />
              <Area type="monotone" dataKey="clicks" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="conversions" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Campaign Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Types</CardTitle>
            <CardDescription>Distribution by campaign type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.campaignTypes}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.type}: ${entry.percentage}%`}
                >
                  {data.campaignTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Status Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campaign Status</CardTitle>
            <CardDescription>Current campaign states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Sent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">32</span>
                  <Badge variant="secondary">71%</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">8</span>
                  <Badge variant="secondary">18%</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Draft</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">5</span>
                  <Badge variant="secondary">11%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Detailed campaign performance metrics</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead className="text-right">Click Rate</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">{campaign.send_date}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={campaign.status === 'sent' ? 'success' : campaign.status === 'scheduled' ? 'warning' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.type === 'email' ? <Mail className="h-4 w-4 text-blue-500" /> : <MessageSquare className="h-4 w-4 text-green-500" />}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(campaign.recipients)}</TableCell>
                  <TableCell className="text-right">
                    {campaign.open_rate ? `${campaign.open_rate}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.click_rate ? `${campaign.click_rate}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.conversion_rate ? `${campaign.conversion_rate}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.revenue ? formatCurrency(campaign.revenue) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}