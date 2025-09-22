"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, Search } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
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
  ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area
} from 'recharts';
import {
  Package, TrendingUp, TrendingDown, DollarSign,
  ShoppingBag, ShoppingCart, Star, BarChart3,
  ArrowUp, ArrowDown, Calendar, Tag,
  Repeat, Eye, TrendingDown as TrendDown, Award
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreProductsReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState(null);
  const [error, setError] = useState(null);
  const [storePublicId, setStorePublicId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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
    localStorage.setItem('productsReportDateRange', JSON.stringify(newDateRangeSelection));
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/products`);
    }
  };

  // Mock data for products
  const mockProductsData = {
    summary: {
      total_products: 156,
      products_sold: 89,
      total_revenue: 385000,
      total_units_sold: 12500,
      avg_product_revenue: 4326,
      best_seller: "Premium Widget Pro",
      conversion_rate: 3.8,
      repeat_purchase_rate: 28.5
    },
    previousPeriod: {
      total_products: 148,
      products_sold: 82,
      total_revenue: 325000,
      total_units_sold: 10800,
      avg_product_revenue: 3963
    },
    topProducts: [
      {
        name: "Premium Widget Pro",
        sku: "PWP-001",
        category: "Electronics",
        units_sold: 1250,
        revenue: 62500,
        avg_price: 50,
        margin: 35,
        views: 8500,
        conversion_rate: 14.7,
        rating: 4.8,
        reviews: 234,
        growth: 25.5
      },
      {
        name: "Essential Kit Bundle",
        sku: "EKB-002",
        category: "Bundles",
        units_sold: 980,
        revenue: 48020,
        avg_price: 49,
        margin: 42,
        views: 6200,
        conversion_rate: 15.8,
        rating: 4.7,
        reviews: 189,
        growth: 18.2
      },
      {
        name: "Smart Gadget X",
        sku: "SGX-003",
        category: "Electronics",
        units_sold: 875,
        revenue: 43750,
        avg_price: 50,
        margin: 38,
        views: 7100,
        conversion_rate: 12.3,
        rating: 4.6,
        reviews: 156,
        growth: 15.8
      },
      {
        name: "Eco-Friendly Solution",
        sku: "EFS-004",
        category: "Home",
        units_sold: 650,
        revenue: 29250,
        avg_price: 45,
        margin: 40,
        views: 5400,
        conversion_rate: 12.0,
        rating: 4.9,
        reviews: 98,
        growth: -5.2
      },
      {
        name: "Professional Toolkit",
        sku: "PTK-005",
        category: "Tools",
        units_sold: 520,
        revenue: 31200,
        avg_price: 60,
        margin: 45,
        views: 4800,
        conversion_rate: 10.8,
        rating: 4.5,
        reviews: 67,
        growth: 8.5
      }
    ],
    categorySales: [
      { category: 'Electronics', revenue: 125000, units: 4200, products: 45 },
      { category: 'Bundles', revenue: 98000, units: 2100, products: 12 },
      { category: 'Home', revenue: 67000, units: 2850, products: 38 },
      { category: 'Tools', revenue: 52000, units: 1650, products: 28 },
      { category: 'Accessories', revenue: 43000, units: 1700, products: 33 }
    ],
    salesTrend: [
      { date: '2024-01-01', revenue: 12500, units: 420 },
      { date: '2024-01-08', revenue: 13800, units: 465 },
      { date: '2024-01-15', revenue: 15200, units: 510 },
      { date: '2024-01-22', revenue: 11900, units: 395 },
      { date: '2024-01-29', revenue: 14600, units: 485 }
    ],
    pricePerformance: [
      { price_range: '$0-25', units: 3500, revenue: 52500, conversion: 8.2 },
      { price_range: '$26-50', units: 5200, revenue: 208000, conversion: 12.5 },
      { price_range: '$51-75', units: 2800, revenue: 182000, conversion: 10.8 },
      { price_range: '$76-100', units: 800, revenue: 72000, conversion: 7.2 },
      { price_range: '$100+', units: 200, revenue: 35000, conversion: 4.5 }
    ],
    crossSellData: [
      { primary: "Premium Widget Pro", secondary: "Essential Kit Bundle", frequency: 245, lift: 32 },
      { primary: "Smart Gadget X", secondary: "Professional Toolkit", frequency: 189, lift: 28 },
      { primary: "Essential Kit Bundle", secondary: "Eco-Friendly Solution", frequency: 156, lift: 25 },
      { primary: "Professional Toolkit", secondary: "Premium Widget Pro", frequency: 134, lift: 22 }
    ]
  };

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = mockProductsData.topProducts;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    return filtered;
  }, [searchQuery, categoryFilter]);

  if (loading && !productsData && mounted) {
    setTimeout(() => setLoading(false), 1000);
  }

  const data = productsData || mockProductsData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Products Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Product performance analytics for {currentStore?.name || 'store'}
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
            storageKey="productsReportDateRange"
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
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
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-sky-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.summary.total_units_sold)}</div>
            <p className="text-xs flex items-center text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {formatPercentage(getPercentageChange(data.summary.total_units_sold, data.previousPeriod.total_units_sold))} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <Package className="h-4 w-4 text-vivid-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.products_sold}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              of {data.summary.total_products} total products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Purchase</CardTitle>
            <Repeat className="h-4 w-4 text-deep-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(data.summary.repeat_purchase_rate)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Customer retention rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Category Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.categorySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return formatCurrency(value);
                  return formatNumber(value);
                }} />
                <Legend />
                <Bar dataKey="revenue" fill="#60A5FA" />
                <Bar dataKey="units" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Price Range Performance</CardTitle>
            <CardDescription>Sales and conversion by price point</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pricePerformance.map((range) => (
                <div key={range.price_range} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{range.price_range}</span>
                    <div className="flex gap-4">
                      <span>{formatNumber(range.units)} units</span>
                      <span className="text-green-600">{formatCurrency(range.revenue)}</span>
                      <Badge variant="secondary">{range.conversion}% conv</Badge>
                    </div>
                  </div>
                  <Progress value={(range.revenue / data.summary.total_revenue) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Products Performance</CardTitle>
              <CardDescription>Best selling products with detailed metrics</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Bundles">Bundles</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.sku}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.name === data.summary.best_seller && (
                      <Badge variant="secondary" className="mt-1">
                        <Award className="h-3 w-3 mr-1" />
                        Best Seller
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">{formatNumber(product.units_sold)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                  <TableCell className="text-right">${product.avg_price}</TableCell>
                  <TableCell className="text-right">{product.conversion_rate}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-sm">{product.rating}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">({product.reviews})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      {Math.abs(product.growth)}%
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>Daily revenue and units sold</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => {
                if (name === 'revenue') return formatCurrency(value);
                return formatNumber(value);
              }} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.6} name="Revenue" />
              <Area yAxisId="right" type="monotone" dataKey="units" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Units" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cross-Sell Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Sell Opportunities</CardTitle>
          <CardDescription>Frequently bought together products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.crossSellData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-medium">{item.primary}</span>
                    <span className="mx-2 text-gray-600 dark:text-gray-400">→</span>
                    <span className="font-medium">{item.secondary}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{item.frequency} orders</Badge>
                  <Badge variant="secondary">+{item.lift}% lift</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}