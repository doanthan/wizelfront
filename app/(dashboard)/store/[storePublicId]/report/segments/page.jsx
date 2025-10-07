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
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, DollarSign,
  ArrowUp, ArrowDown, Layers
} from 'lucide-react';

// Design system colors
const COLORS = [
  '#60A5FA', // Sky blue
  '#8B5CF6', // Vivid violet
  '#10B981', // Success green
  '#F59E0B', // Warning amber
  '#EF4444', // Danger red
  '#2563EB', // Royal blue
  '#7C3AED', // Deep purple
  '#34D399', // Emerald
  '#EC4899'  // Pink
];

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
  const [sortColumn, setSortColumn] = useState('current_members');
  const [sortDirection, setSortDirection] = useState('desc');

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
      router.push(`/store/${newStoreId}/report/segments`);
    }
  };

  // Fetch segments data from API
  useEffect(() => {
    if (!storePublicId) return;

    const fetchSegmentsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRangeSelection.ranges.main.start.toISOString();
        const endDate = dateRangeSelection.ranges.main.end.toISOString();

        const response = await fetch(
          `/api/store/${storePublicId}/report/segments?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch segments data');
        }

        const data = await response.json();
        setSegmentsData(data);
      } catch (err) {
        console.error('Error fetching segments data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSegmentsData();
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

  // Sort segments
  const sortedSegments = useMemo(() => {
    if (!segmentsData?.segments) return [];

    return [...segmentsData.segments].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle segment_name (string)
      if (sortColumn === 'segment_name') {
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
  }, [segmentsData, sortColumn, sortDirection]);

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

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

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-sky-blue" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {subtitle && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs mt-2 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend > 0 ? <ArrowUp className="h-3 w-3" /> : trend < 0 ? <ArrowDown className="h-3 w-3" /> : null}
            {Math.abs(trend).toFixed(1)}% vs last period
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Segment Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and analyze your Klaviyo segment performance</p>
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
            onDateRangeChange={handleDateRangeChange}
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
          <MorphingLoader size="large" showText={true} text="Loading segments data..." />
        </div>
      )}

      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center text-red-600 dark:text-red-400">{error}</div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && segmentsData && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total Segments"
              value={segmentsData.summary.total_segments}
              icon={Layers}
              trend={getPercentageChange(
                segmentsData.summary.total_segments,
                segmentsData.previousPeriod?.total_segments
              )}
            />
            <MetricCard
              title="Total Members"
              value={formatNumber(segmentsData.summary.total_members)}
              icon={Users}
              trend={getPercentageChange(
                segmentsData.summary.total_members,
                segmentsData.previousPeriod?.total_members
              )}
            />
            <MetricCard
              title="Growing Segments"
              value={segmentsData.summary.growing_segments}
              icon={TrendingUp}
              subtitle={`${segmentsData.summary.declining_segments} declining`}
            />
          </div>

          {/* Segment Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Details</CardTitle>
              <CardDescription>Click column headers to sort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <SortableHeader column="segment_name" label="Segment Name" />
                      <SortableHeader column="current_members" label="Current Members" align="right" />
                      <SortableHeader column="growth" label="Growth" align="right" />
                      <SortableHeader column="new_members" label="New Members" align="right" />
                      <SortableHeader column="removed_members" label="Removed" align="right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSegments.map((segment, idx) => (
                      <TableRow key={idx} className="text-sm">
                        <TableCell className="font-medium text-gray-900 dark:text-white py-2">
                          {segment.segment_name}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatNumber(segment.current_members)}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className={`flex items-center justify-end ${segment.growth > 0 ? 'text-green-600 dark:text-green-500' : segment.growth < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600'}`}>
                            {segment.growth > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : segment.growth < 0 ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
                            {formatPercentage(Math.abs(segment.growth))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatNumber(segment.new_members)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatNumber(segment.removed_members)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Segment Growth Over Time */}
          {segmentsData.performanceOverTime && segmentsData.performanceOverTime.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Segment Growth Over Time</CardTitle>
                <CardDescription>Daily member counts for all segments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={segmentsData.performanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'currentColor' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fill: 'currentColor' }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip
                      formatter={(value, name) => [formatNumber(value), name]}
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg, #ffffff)',
                        border: '1px solid var(--tooltip-border, #e5e7eb)',
                        borderRadius: '8px',
                        color: 'var(--tooltip-text, #111827)'
                      }}
                      wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {segmentsData.segments.slice(0, 10).map((segment, idx) => (
                      <Line
                        key={segment.segment_id}
                        type="monotone"
                        dataKey={segment.segment_name}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={segment.segment_name}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Segments Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Segments by Size</CardTitle>
              <CardDescription>Current member count comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sortedSegments.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="segment_name"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip
                    formatter={(value) => formatNumber(value)}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                  />
                  <Bar
                    dataKey="current_members"
                    fill="#60A5FA"
                    name="Current Members"
                    radius={[8, 8, 0, 0]}
                  >
                    {sortedSegments.slice(0, 15).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
