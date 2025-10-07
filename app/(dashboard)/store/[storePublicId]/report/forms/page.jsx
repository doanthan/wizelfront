"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, ArrowUpDown } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
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
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FileText, Eye, MousePointer, XCircle, DollarSign,
  ArrowUp, ArrowDown, TrendingUp
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#2563EB', '#7C3AED', '#34D399'];

export default function StoreFormsReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formsData, setFormsData] = useState(null);
  const [error, setError] = useState(null);
  const [storePublicId, setStorePublicId] = useState(null);
  const [sortColumn, setSortColumn] = useState('viewed_form');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedFormForTrends, setSelectedFormForTrends] = useState('all');

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
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/forms`);
    }
  };

  // Fetch forms data from API
  useEffect(() => {
    if (!storePublicId) return;

    const fetchFormsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRangeSelection.ranges.main.start.toISOString();
        const endDate = dateRangeSelection.ranges.main.end.toISOString();

        const response = await fetch(
          `/api/store/${storePublicId}/report/forms?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch forms data');
        }

        const data = await response.json();
        setFormsData(data);
      } catch (err) {
        console.error('Error fetching forms data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFormsData();
  }, [storePublicId, dateRangeSelection]);

  // Handle sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Sort forms data
  const sortedForms = useMemo(() => {
    if (!formsData?.forms) return [];

    return [...formsData.forms].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle form_name (string)
      if (sortColumn === 'form_name') {
        aVal = aVal || '';
        bVal = bVal || '';
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Handle numeric values
      aVal = aVal || 0;
      bVal = bVal || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [formsData?.forms, sortColumn, sortDirection]);

  // Filter trend data by selected form
  const filteredTrendData = useMemo(() => {
    if (!formsData?.forms || !formsData?.performanceOverTime) return [];

    if (selectedFormForTrends === 'all') {
      return formsData.performanceOverTime;
    }

    // Find the selected form's daily data
    const selectedForm = formsData.forms.find(f => f.form_id === selectedFormForTrends);
    if (!selectedForm?.days) return [];

    return selectedForm.days.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [formsData, selectedFormForTrends]);

  // Show loading state
  if (loading && !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" showText={true} text="Loading forms data..." />
      </div>
    );
  }

  const SortableHeader = ({ column, label, align = "left" }) => (
    <TableHead
      className={`text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${align === "right" ? "text-right" : ""}`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortColumn === column ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </TableHead>
  );

  const MetricCard = ({ title, value, subtitle, icon: Icon, change }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">{title}</CardTitle>
        <Icon className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {subtitle && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
        {change !== undefined && change !== null && (
          <div className={`flex items-center gap-1 text-xs mt-2 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {change > 0 ? <ArrowUp className="h-3 w-3" /> : change < 0 ? <ArrowDown className="h-3 w-3" /> : null}
            {Math.abs(change).toFixed(1)}% vs last period
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-6 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Form Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and analyze your Klaviyo form performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={storePublicId || ""} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-[240px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Store className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {stores?.map((store) => (
                <SelectItem key={store.public_id} value={store.public_id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeSelector
            value={dateRangeSelection}
            onChange={handleDateRangeChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <MorphingLoader size="large" showText={true} text="Loading forms data..." />
        </div>
      )}

      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center text-red-600 dark:text-red-400">{error}</div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && formsData && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Forms"
              value={formsData.summary.total_forms}
              icon={FileText}
              subtitle="Active signup forms"
            />
            <MetricCard
              title="Form Views"
              value={formatNumber(formsData.summary.total_views)}
              icon={Eye}
              subtitle={`${formatNumber(formsData.summary.total_unique_views)} unique views`}
            />
            <MetricCard
              title="Submissions"
              value={formatNumber(formsData.summary.total_submits)}
              icon={MousePointer}
              subtitle={`${formatNumber(formsData.summary.total_unique_submits)} unique submits`}
            />
            <MetricCard
              title="Avg Submit Rate"
              value={formatPercentage(formsData.summary.avg_submit_rate)}
              icon={TrendingUp}
              subtitle="Overall conversion rate"
            />
          </div>

          {/* Form Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Form Performance Details</CardTitle>
              <CardDescription>Click column headers to sort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <SortableHeader column="form_name" label="Form Name" />
                      <SortableHeader column="viewed_form" label="Views" align="right" />
                      <SortableHeader column="viewed_form_uniques" label="Unique Views" align="right" />
                      <SortableHeader column="submits" label="Submits" align="right" />
                      <SortableHeader column="submits_unique" label="Unique Submits" align="right" />
                      <SortableHeader column="submit_rate" label="Submit Rate" align="right" />
                      <SortableHeader column="closed_form" label="Closes" align="right" />
                      <SortableHeader column="close_rate" label="Close Rate" align="right" />
                      <SortableHeader column="conversion_value" label="Revenue" align="right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedForms.map((form, idx) => (
                      <TableRow key={form.form_id} className="text-sm">
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {form.form_name}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          {formatNumber(form.viewed_form)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          {formatNumber(form.viewed_form_uniques)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          {formatNumber(form.submits)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          {formatNumber(form.submits_unique)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          <span className={form.submit_rate > 10 ? 'text-green-600 font-semibold' : ''}>
                            {formatPercentage(form.submit_rate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          {formatNumber(form.closed_form)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          {formatPercentage(form.close_rate)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(form.conversion_value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Performance Over Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Form Performance Trends</CardTitle>
                <CardDescription>Daily views, submissions, and conversion rates</CardDescription>
              </div>
              <Select value={selectedFormForTrends} onValueChange={setSelectedFormForTrends}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms (Aggregate)</SelectItem>
                  {formsData.forms.map((form) => (
                    <SelectItem key={form.form_id} value={form.form_id}>
                      {form.form_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filteredTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'currentColor' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                    formatter={(value, name) => {
                      if (name === 'Submit Rate') return `${value.toFixed(2)}%`;
                      return formatNumber(value);
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="viewed_form"
                    stackId="1"
                    stroke="#60A5FA"
                    fill="#60A5FA"
                    fillOpacity={0.6}
                    name="Views"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="submits"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Submissions"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="submit_rate"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    name="Submit Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Form Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Form Comparison - Submit Rates</CardTitle>
              <CardDescription>Compare submission performance across all forms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedForms}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="form_name"
                    angle={-15}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                    formatter={(value) => `${value.toFixed(2)}%`}
                  />
                  <Bar dataKey="submit_rate" fill="#60A5FA" name="Submit Rate %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
