"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Download,
  Filter,
  Moon,
  Sun
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { useTheme } from "@/app/contexts/theme-context";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { FilterDropdown } from "@/app/components/ui/filter-dropdown";
import { format } from "date-fns";

// Mock data for the chart
const revenueData = [
  { month: "Mar 2024", value: 8500 },
  { month: "Apr 2024", value: 10200 },
  { month: "May 2024", value: 11800 },
  { month: "Jun 2024", value: 10500 },
  { month: "Jul 2024", value: 9800 },
  { month: "Aug 2024", value: 10200 },
  { month: "Sep 2024", value: 11000 },
  { month: "Oct 2024", value: 8200 },
  { month: "Nov 2024", value: 9500 },
  { month: "Dec 2024", value: 10800 },
  { month: "Jan 2025", value: 12500 },
  { month: "Feb 2025", value: 14200 },
  { month: "Mar 2025", value: 10500 },
];


const MetricCard = ({ title, value, change, changeType, icon: Icon, prefix = "" }) => {
  const isPositive = changeType === "increase";
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {prefix}{value}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? "+" : ""}{change}%
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">vs. last period</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-sky-blue/20 rounded-lg">
            <Icon className="h-5 w-5 text-sky-blue" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [dateRangeText, setDateRangeText] = useState("Past 30 days");
  const [comparisonText, setComparisonText] = useState("vs previous period");
  const [activeFilters, setActiveFilters] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { getUserAccessibleStores } = useStores();

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDateChange = (dateInfo) => {
    setSelectedDateRange(dateInfo);
    
    // Update display text to show the period name
    if (dateInfo.period) {
      switch(dateInfo.period) {
        case "last-30-days":
          setDateRangeText("Past 30 days");
          break;
        case "last-7-days":
          setDateRangeText("Past 7 days");
          break;
        case "today":
          setDateRangeText("Today");
          break;
        case "week-to-date":
          setDateRangeText("Week-to-date");
          break;
        case "month-to-date":
          setDateRangeText("Month-to-date");
          break;
        case "custom":
          // For custom, show the date range
          if (dateInfo.primary) {
            const { from, to } = dateInfo.primary;
            if (from && to) {
              setDateRangeText(`${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`);
            }
          }
          break;
        default:
          setDateRangeText("Past 30 days");
      }
    }
    
    // Update comparison text
    if (dateInfo.comparisonType === "previous-period") {
      setComparisonText("vs previous period");
    } else if (dateInfo.comparisonType === "previous-year") {
      setComparisonText("vs previous year");
    } else {
      setComparisonText("");
    }
  };

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    console.log('Active filters:', filters);
    // Here you would typically filter your data based on the selected filters
  };

  // Get only stores the current user can access
  const accessibleStores = getUserAccessibleStores();
  const topStores = accessibleStores
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(store => ({
      name: store.name,
      revenue: `$${store.revenue.toLocaleString()}`,
      change: store.metrics.change,
      orders: store.orders
    }));

  // Calculate max value for chart scaling
  const maxValue = Math.max(...revenueData.map(d => d.value));
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Performance Summary
          </h1>
          <div className="mt-1 space-y-0.5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {dateRangeText}
            </p>
            {comparisonText && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {comparisonText}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <FilterDropdown 
            onFilterChange={handleFilterChange}
          />
          <DateRangeSelector 
            onDateChange={handleDateChange}
            showComparison={true}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2 border-neutral-gray/30 hover:border-sky-blue hover:bg-sky-tint/50 transition-all"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {mounted && theme === "dark" ? "Light" : "Dark"} Mode
            </span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Store Revenue"
          value="24,938"
          prefix="$"
          change={21.3}
          changeType="increase"
          icon={DollarSign}
        />
        <MetricCard
          title="Attributed Revenue"
          value="9,604"
          prefix="$"
          change={11.5}
          changeType="increase"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Orders"
          value="423"
          change={15.9}
          changeType="increase"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Total Customers"
          value="1.3K"
          change={5.6}
          changeType="increase"
          icon={Users}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Attributed Revenue Trend
            </CardTitle>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative h-64">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400 pr-2">
                <span>${(maxValue / 1000).toFixed(0)}k</span>
                <span>${(maxValue * 0.75 / 1000).toFixed(0)}k</span>
                <span>${(maxValue * 0.5 / 1000).toFixed(0)}k</span>
                <span>${(maxValue * 0.25 / 1000).toFixed(0)}k</span>
                <span>$0</span>
              </div>
              
              {/* Chart bars */}
              <div className="ml-10 h-full flex items-end justify-between gap-2">
                {revenueData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-sky-blue to-vivid-violet rounded-t-sm hover:from-royal-blue hover:to-deep-purple transition-all cursor-pointer"
                      style={{
                        height: `${(data.value / maxValue) * 100}%`,
                      }}
                      title={`${data.month}: $${data.value.toLocaleString()}`}
                    />
                  </div>
                ))}
              </div>
              
              {/* X-axis labels */}
              <div className="ml-10 mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Mar 2024</span>
                <span>Jul 2024</span>
                <span>Nov 2024</span>
                <span>Mar 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Stores Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Stores by Revenue
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStores.map((store, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-sky-blue/20 to-vivid-violet/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-sky-blue">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{store.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {store.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{store.revenue}</p>
                    <div className="flex items-center justify-end space-x-1">
                      {store.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        store.change > 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {store.change > 0 ? "+" : ""}{store.change}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">$58.92</p>
                <Badge variant="success" className="mt-2">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  12.3%
                </Badge>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-vivid-violet/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-vivid-violet" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">3.24%</p>
                <Badge variant="success" className="mt-2">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  8.7%
                </Badge>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-sky-blue/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-sky-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Repeat Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">32.5%</p>
                <Badge variant="gradient" className="mt-2">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  5.2%
                </Badge>
              </div>
              <div className="p-3 bg-gradient-to-br from-sky-blue/20 to-vivid-violet/20 rounded-lg">
                <Users className="h-5 w-5 text-deep-purple" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}