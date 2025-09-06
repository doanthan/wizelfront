"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Edit2, X, Check, Plus, Users, Target, ShoppingBag, Package, Sparkles } from "lucide-react";

export default function BrandAudiencePage() {
  const {
    brand,
    isLoading,
    editingField,
    tempValue,
    handleFieldEdit,
    handleFieldSave,
    handleArrayItemAdd,
    handleArrayItemRemove,
    setEditingField,
    setTempValue
  } = useBrand();

  const [showAddDialog, setShowAddDialog] = useState(null);
  const [newItemValue, setNewItemValue] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-gray dark:text-gray-400">Loading audience data...</p>
        </div>
      </div>
    );
  }

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      handleArrayItemAdd(showAddDialog, newItemValue.trim());
      setShowAddDialog(null);
      setNewItemValue("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Target Demographics</CardTitle>
          <CardDescription className="dark:text-gray-400">Who are your ideal customers?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Age Groups</label>
              <div className="flex flex-wrap gap-2">
                {brand?.targetAudienceAge?.map((age, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
                    {age}
                    <button 
                      onClick={() => handleArrayItemRemove('targetAudienceAge', idx)}
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
                  onClick={() => setShowAddDialog('targetAudienceAge')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Age
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Gender</label>
              <div className="flex flex-wrap gap-2">
                {brand?.targetAudienceGender?.map((gender, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200">
                    {gender === 'all' ? 'All Genders' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                    <button 
                      onClick={() => handleArrayItemRemove('targetAudienceGender', idx)}
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
                  onClick={() => setShowAddDialog('targetAudienceGender')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Psychology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Customer Pain Points</CardTitle>
            <CardDescription className="dark:text-gray-400">What problems do they face?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brand?.customerPainPoints?.map((painPoint, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/30 group">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{painPoint}</p>
                  <button
                    onClick={() => handleArrayItemRemove('customerPainPoints', idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddDialog('customerPainPoints')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Pain Point
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Customer Aspirations</CardTitle>
            <CardDescription className="dark:text-gray-400">What do they hope to achieve?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brand?.customerAspirations?.map((aspiration, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30 group">
                  <Sparkles className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{aspiration}</p>
                  <button
                    onClick={() => handleArrayItemRemove('customerAspirations', idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddDialog('customerAspirations')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Aspiration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Product Categories</CardTitle>
          <CardDescription className="dark:text-gray-400">Main product offerings and collections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Main Product Categories</label>
            <div className="flex flex-wrap gap-2">
              {brand?.mainProductCategories?.map((category, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-sky-50 text-sky-700 border-sky-200">
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
          </div>

          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Bestselling Products</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brand?.bestsellingProducts?.map((product, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30 group">
                  <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-700">#{idx + 1}</span>
                  </div>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 font-medium">{product}</span>
                  <button
                    onClick={() => handleArrayItemRemove('bestsellingProducts', idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setShowAddDialog('bestsellingProducts')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Bestseller
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Featured Collection</label>
              {editingField === 'featuredCollection' ? (
                <div className="space-y-2">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="e.g., Summer Essentials"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFieldSave('featuredCollection')} className="bg-green-500 hover:bg-green-600">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg group hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 cursor-pointer" 
                     onClick={() => handleFieldEdit('featuredCollection', brand?.featuredCollection || '')}>
                  <p className="text-slate-gray dark:text-white font-medium">{brand?.featuredCollection || 'Add featured collection'}</p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 mt-2" />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Unique Selling Points</label>
              {editingField === 'uniqueSellingPoints' ? (
                <div className="space-y-2">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="e.g., Handmade, sustainable materials"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFieldSave('uniqueSellingPoints')} className="bg-green-500 hover:bg-green-600">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                     onClick={() => handleFieldEdit('uniqueSellingPoints', brand?.uniqueSellingPoints || '')}>
                  <p className="text-slate-gray dark:text-white font-medium">{brand?.uniqueSellingPoints || 'Add unique selling points'}</p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog !== null} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {showAddDialog === 'targetAudienceAge' ? 'Age Group' :
                   showAddDialog === 'targetAudienceGender' ? 'Gender' :
                   showAddDialog === 'customerPainPoints' ? 'Pain Point' :
                   showAddDialog === 'customerAspirations' ? 'Customer Aspiration' :
                   showAddDialog === 'mainProductCategories' ? 'Product Category' :
                   showAddDialog === 'bestsellingProducts' ? 'Bestselling Product' : 'Item'}
            </DialogTitle>
            <DialogDescription>
              {showAddDialog === 'targetAudienceAge' ? 'Add an age group for your target audience (e.g., 25-34, 35-44)' :
               showAddDialog === 'targetAudienceGender' ? 'Add a gender demographic for your target audience' :
               showAddDialog === 'customerPainPoints' ? 'Add a customer pain point or challenge that your brand addresses' :
               showAddDialog === 'customerAspirations' ? 'Add something customers want to achieve or aspire to' :
               showAddDialog === 'mainProductCategories' ? 'Add a main product category' :
               showAddDialog === 'bestsellingProducts' ? 'Add a bestselling product' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showAddDialog === 'targetAudienceGender' ? (
              <Select value={newItemValue} onValueChange={setNewItemValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="all">All Genders</SelectItem>
                </SelectContent>
              </Select>
            ) : showAddDialog === 'targetAudienceAge' ? (
              <Select value={newItemValue} onValueChange={setNewItemValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-24">18-24</SelectItem>
                  <SelectItem value="25-34">25-34</SelectItem>
                  <SelectItem value="35-44">35-44</SelectItem>
                  <SelectItem value="45-54">45-54</SelectItem>
                  <SelectItem value="55-64">55-64</SelectItem>
                  <SelectItem value="65+">65+</SelectItem>
                </SelectContent>
              </Select>
            ) : showAddDialog === 'customerPainPoints' || showAddDialog === 'customerAspirations' ? (
              <Textarea
                placeholder={`Enter ${showAddDialog === 'customerPainPoints' ? 'customer pain point' : 'customer aspiration'}...`}
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                className="min-h-[80px]"
              />
            ) : (
              <Input
                placeholder={`Enter ${showAddDialog?.split(/(?=[A-Z])/).join(' ').toLowerCase()}...`}
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem();
                  }
                }}
              />
            )}
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