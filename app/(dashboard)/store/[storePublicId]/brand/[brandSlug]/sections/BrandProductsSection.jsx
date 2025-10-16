"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Package, Star, Zap, TrendingUp, X, Plus } from "lucide-react";

export default function BrandProductsSection() {
  const {
    brand,
    handleArrayItemAdd,
    handleArrayItemRemove
  } = useBrand();

  const [showAddDialog, setShowAddDialog] = useState(null);
  const [newItemValue, setNewItemValue] = useState("");

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      handleArrayItemAdd(showAddDialog, newItemValue.trim());
      setShowAddDialog(null);
      setNewItemValue("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Product Categories
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Main product lines and categories you offer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {brand?.mainProductCategories?.map((category, idx) => (
              <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                <Package className="h-3 w-3 mr-1" />
                {category}
                <button
                  onClick={() => handleArrayItemRemove('mainProductCategories', idx)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowAddDialog('mainProductCategories')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bestselling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Bestselling Products
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your top-performing and most popular products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {brand?.bestsellingProducts?.map((product, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg group hover:border-yellow-300 dark:hover:border-yellow-700 transition-colors">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-bold">
                  {idx + 1}
                </div>
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{product}</p>
                <button
                  onClick={() => handleArrayItemRemove('bestsellingProducts', idx)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('bestsellingProducts')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Bestselling Product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unique Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Unique Features
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Special features and qualities that make your brand unique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.uniqueFeatures?.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg group hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                <Zap className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-900 dark:text-white">{feature}</p>
                <button
                  onClick={() => handleArrayItemRemove('uniqueFeatures', idx)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('uniqueFeatures')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Unique Feature
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Advantages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Competitive Advantages
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Key advantages that set you apart from competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.competitiveAdvantages?.map((advantage, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg group hover:border-green-300 dark:hover:border-green-700 transition-colors">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-900 dark:text-white">{advantage}</p>
                <button
                  onClick={() => handleArrayItemRemove('competitiveAdvantages', idx)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('competitiveAdvantages')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Competitive Advantage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog !== null} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Add {showAddDialog?.split(/(?=[A-Z])/).join(' ')}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Add a new item to this list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter value..."
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItemValue.trim()}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
