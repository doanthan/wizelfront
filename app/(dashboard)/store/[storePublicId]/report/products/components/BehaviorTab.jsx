"use client";

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { RefreshCw, Users, ShoppingCart, TrendingUp, Info, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/app/components/ui/command";
import { Button } from "@/app/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ComposedChart, Line
} from "recharts";

// Chart Info Component
const ChartInfo = ({ title, description }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="inline-flex items-center justify-center ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-900 dark:text-gray-300">{description}</p>
      </div>
    </PopoverContent>
  </Popover>
);

// Product Search Component
const ProductSearch = ({ allProducts, selectedProducts, onProductToggle }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allProducts;
    const query = searchQuery.toLowerCase();
    return allProducts.filter(p =>
      p.product_name?.toLowerCase().includes(query)
    );
  }, [allProducts, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Search className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg" align="end">
        <Command>
          <CommandInput
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
          <CommandEmpty>No products found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.some(p => p.product_id === product.product_id);
              return (
                <CommandItem
                  key={product.product_id}
                  onSelect={() => {
                    onProductToggle(product);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">{product.product_name}</span>
                    {isSelected && <span className="text-xs text-green-600 dark:text-green-400">✓ Added</span>}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function BehaviorTab({ data }) {
  // State for custom product selections per chart
  const [selectedRepurchaseProducts, setSelectedRepurchaseProducts] = useState([]);
  const [selectedLTVProducts, setSelectedLTVProducts] = useState([]);

  if (!data?.repurchaseRates?.length && !data?.topPairs?.length) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-gray-900 dark:text-yellow-200">No customer behavior data available. Products need at least 10 customers to appear here.</p>
      </div>
    );
  }

  // Get display data for repurchase chart
  const displayedRepurchaseProducts = useMemo(() => {
    const defaultProducts = data?.daysBetweenPurchases?.slice(0, 15) || [];
    if (selectedRepurchaseProducts.length === 0) return defaultProducts;

    // Merge selected products with defaults, remove duplicates
    const selectedIds = new Set(selectedRepurchaseProducts.map(p => p.product_id));
    const uniqueDefaults = defaultProducts.filter(p => !selectedIds.has(p.product_id));
    return [...selectedRepurchaseProducts, ...uniqueDefaults].slice(0, 20);
  }, [data?.daysBetweenPurchases, selectedRepurchaseProducts]);

  // Toggle product selection for repurchase chart
  const toggleRepurchaseProduct = (product) => {
    setSelectedRepurchaseProducts(prev => {
      const exists = prev.some(p => p.product_id === product.product_id);
      if (exists) {
        return prev.filter(p => p.product_id !== product.product_id);
      } else {
        return [...prev, product];
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Repurchase Rate Chart */}
      {data?.repurchaseRates && data.repurchaseRates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Repurchase Rate by Product</h4>
            <ChartInfo
              title="Customer Repurchase Behavior"
              description="Percentage of customers who bought each product 2+ times. High repurchase rates indicate product satisfaction, good quality, and consumable/recurring value."
            />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.repurchaseRates.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={120} tick={{ fill: '#111827', fontSize: 11 }}  className="dark:[>&>g>text]:fill-gray-100" />
              <YAxis tick={{ fill: '#111827' }} className="dark:[>&>g>text]:fill-gray-100" tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="repurchase_rate" fill="#10B981" name="Repurchase Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Customer LTV by Product */}
      {data?.ltvByProduct && data.ltvByProduct.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Customer LTV by Entry Product (Top 10)</h4>
            <ChartInfo
              title="Acquisition Product Value"
              description="Average 90-day customer lifetime value based on their first product purchased. Shows which products bring in the most valuable customers long-term."
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ltvByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fill: '#111827' }} tickFormatter={(value) => formatCurrency(value).replace('$', '')}  className="dark:[>&>g>text]:fill-gray-100" />
              <YAxis dataKey="product_name" type="category" width={150} tick={{ fill: '#111827', fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="avg_ltv" fill="#8B5CF6" name="Avg 90-Day LTV" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Days Between Repurchases */}
      {data?.daysBetweenPurchases && data.daysBetweenPurchases.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Typical Repurchase Cycle (P75)</h4>
              <ChartInfo
                title="Repurchase Timing (75th Percentile)"
                description="Shows when 75% of repeat customers have reordered each product. Use this to time replenishment campaigns - send reminders a few days before this window to maximize conversions. For example, if a product shows 90 days, send a replenishment campaign at day 85 to catch most customers before they run out."
              />
            </div>
            <ProductSearch
              allProducts={data.daysBetweenPurchases || []}
              selectedProducts={selectedRepurchaseProducts}
              onProductToggle={toggleRepurchaseProduct}
            />
          </div>
          {selectedRepurchaseProducts.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedRepurchaseProducts.map(product => (
                <div key={product.product_id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs">
                  <span>{product.product_name}</span>
                  <button
                    onClick={() => toggleRepurchaseProduct(product)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={displayedRepurchaseProducts}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={120} tick={{ fill: '#111827', fontSize: 11 }}  className="dark:[&>g>text]:fill-gray-100" />
              <YAxis tick={{ fill: '#111827' }} className="dark:[&>g>text]:fill-gray-100" tickFormatter={(value) => `${value}d`} />
              <Tooltip
                formatter={(value, name, props) => {
                  const item = props.payload;
                  if (name === 'Typical Repurchase (P75)') {
                    return [
                      <div key="tooltip" className="space-y-1">
                        <div><strong>P75:</strong> {Math.round(value)} days</div>
                        {item.median_days && <div className="text-xs opacity-75">Median (P50): {Math.round(item.median_days)} days</div>}
                        {item.sample_size && <div className="text-xs opacity-75">Sample: {item.sample_size} repurchases</div>}
                      </div>
                    ];
                  }
                  return [`${Math.round(value)} days`, name];
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="avg_days_between_purchases" fill="#60A5FA" name="Typical Repurchase (P75)" />
              <Line
                type="monotone"
                dataKey="median_days"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                name="Median (P50)"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Frequently Bought Together */}
      {data?.topPairs && data.topPairs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Frequently Bought Together</h4>
            <ChartInfo
              title="Product Affinity Pairs"
              description="Product pairs purchased together with high lift scores (>1.5). Lift score shows how much more likely products are bought together vs independently. Use for bundling and cross-sell campaigns."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Product 1</th>
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Product 2</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Customers</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Lift Score</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.topPairs.slice(0, 10).map((pair, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{pair.product_1}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{pair.product_2}</td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{pair.co_purchases}</td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                        {pair.lift_score}x
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{pair.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Affinity Matrix Scatter Plot */}
      {data?.affinityMatrix && data.affinityMatrix.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Product Affinity Matrix</h4>
            <ChartInfo
              title="Confidence vs Lift Analysis"
              description="Scatter plot showing confidence (how often pair occurs) vs lift (how much more likely together). Top-right quadrant = strong bundling opportunities."
            />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                type="number"
                dataKey="confidence"
                name="Confidence"
                tick={{ fill: '#111827' }}
                tickFormatter={(value) => `${value}%`}
                className="dark:[&>g>text]:fill-gray-100"
                domain={[0, 100]}
              />
              <YAxis
                type="number"
                dataKey="lift"
                name="Lift Score"
                tick={{ fill: '#111827' }}
                className="dark:[&>g>text]:fill-gray-100"
                domain={[0, 'auto']}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                          {point.product_1} + {point.product_2}
                        </p>
                        <p className="text-xs text-gray-900 dark:text-gray-300">
                          Confidence: {point.confidence}%
                        </p>
                        <p className="text-xs text-gray-900 dark:text-gray-300">
                          Lift Score: {point.lift}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Product Pairs"
                data={data.affinityMatrix.slice(0, 30)}
                fill="#8B5CF6"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* New vs Returning Customer Preferences */}
      {data?.preferences && data.preferences.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New vs Returning Customer Preferences</h4>
            <ChartInfo
              title="Customer Type Product Preferences"
              description="Compares product revenue from new vs returning customers. Products popular with new customers are good acquisition products, while returning customer favorites drive retention."
            />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.preferences.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={120} tick={{ fill: '#111827', fontSize: 11 }}  className="dark:[>&>g>text]:fill-gray-100" />
              <YAxis tick={{ fill: '#111827' }} className="dark:[>&>g>text]:fill-gray-100" tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="new_customer_revenue" fill="#60A5FA" name="New Customer Revenue" />
              <Bar dataKey="returning_customer_revenue" fill="#10B981" name="Returning Customer Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
