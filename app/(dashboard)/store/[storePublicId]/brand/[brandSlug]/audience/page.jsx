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
import { Edit2, X, Check, Plus, Users, Target, ShoppingBag, Package, Sparkles, User, DollarSign, MapPin, Heart, TrendingUp } from "lucide-react";

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
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [newPersona, setNewPersona] = useState({
    name: "",
    description: "",
    demographics: {
      age: "",
      income: "",
      education: "",
      occupation: "",
      location: ""
    },
    psychographics: {
      interests: [],
      values: [],
      lifestyle: "",
      personality: []
    },
    shoppingBehavior: {
      frequency: "",
      averageOrderValue: "",
      preferredChannels: [],
      decisionFactors: []
    }
  });

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

      {/* Customer Personas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Personas
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Detailed profiles of your ideal customers</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPersonaDialog(true)}
              className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Persona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {brand?.customerPersonas && brand.customerPersonas.length > 0 ? (
            <div className="space-y-6">
              {brand.customerPersonas.map((persona, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800/30 hover:shadow-lg transition-all"
                >
                  {/* Persona Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{persona.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{persona.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArrayItemRemove('customerPersonas', idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Demographics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Demographics</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Age:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{persona.demographics?.age}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Income:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{persona.demographics?.income}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Education:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{persona.demographics?.education}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Location & Work</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Occupation:</span>
                          <p className="font-medium text-gray-900 dark:text-white mt-0.5">{persona.demographics?.occupation}</p>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <p className="font-medium text-gray-900 dark:text-white mt-0.5">{persona.demographics?.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Shopping Behavior</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{persona.shoppingBehavior?.frequency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">AOV:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{persona.shoppingBehavior?.averageOrderValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Psychographics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Values</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {persona.psychographics?.values?.map((value, vIdx) => (
                          <Badge key={vIdx} variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Personality</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {persona.psychographics?.personality?.map((trait, pIdx) => (
                          <Badge key={pIdx} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Interests</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.psychographics?.interests?.map((interest, iIdx) => (
                        <Badge key={iIdx} variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Lifestyle */}
                  {persona.psychographics?.lifestyle && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Lifestyle</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{persona.psychographics.lifestyle}</p>
                    </div>
                  )}

                  {/* Preferred Channels */}
                  {persona.shoppingBehavior?.preferredChannels && persona.shoppingBehavior.preferredChannels.length > 0 && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag className="h-4 w-4 text-cyan-600" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Preferred Channels</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {persona.shoppingBehavior.preferredChannels.map((channel, cIdx) => (
                          <Badge key={cIdx} variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
              <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Customer Personas Yet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create detailed customer personas to better understand and target your ideal audience.
              </p>
              <Button
                onClick={() => setShowPersonaDialog(true)}
                className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Persona
              </Button>
            </div>
          )}
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

      {/* Customer Persona Creation Dialog */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Customer Persona</DialogTitle>
            <DialogDescription>
              Build a detailed profile of your ideal customer to better target your marketing efforts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Persona Name *</label>
                  <Input
                    placeholder="e.g., Conscious Wellness Advocate"
                    value={newPersona.name}
                    onChange={(e) => setNewPersona({...newPersona, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Description *</label>
                  <Textarea
                    placeholder="Brief description of this customer persona..."
                    value={newPersona.description}
                    onChange={(e) => setNewPersona({...newPersona, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                Demographics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Age Range</label>
                  <Input
                    placeholder="e.g., 38-48"
                    value={newPersona.demographics.age}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      demographics: {...newPersona.demographics, age: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Income Level</label>
                  <Input
                    placeholder="e.g., $85k-$140k"
                    value={newPersona.demographics.income}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      demographics: {...newPersona.demographics, income: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Education Level</label>
                  <Input
                    placeholder="e.g., Bachelor's degree or higher"
                    value={newPersona.demographics.education}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      demographics: {...newPersona.demographics, education: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Occupation</label>
                  <Input
                    placeholder="e.g., Marketing Director, Healthcare Professional"
                    value={newPersona.demographics.occupation}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      demographics: {...newPersona.demographics, occupation: e.target.value}
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Location</label>
                  <Input
                    placeholder="e.g., Urban and suburban areas in coastal cities"
                    value={newPersona.demographics.location}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      demographics: {...newPersona.demographics, location: e.target.value}
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Psychographics */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Psychographics
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Interests (comma-separated)</label>
                  <Textarea
                    placeholder="e.g., Organic food, Yoga, Sustainable living"
                    value={newPersona.psychographics.interests.join(', ')}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      psychographics: {
                        ...newPersona.psychographics,
                        interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean)
                      }
                    })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Values (comma-separated)</label>
                  <Textarea
                    placeholder="e.g., Environmental sustainability, Transparency, Holistic health"
                    value={newPersona.psychographics.values.join(', ')}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      psychographics: {
                        ...newPersona.psychographics,
                        values: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                      }
                    })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Lifestyle Description</label>
                  <Textarea
                    placeholder="Describe their daily life, habits, and routines..."
                    value={newPersona.psychographics.lifestyle}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      psychographics: {...newPersona.psychographics, lifestyle: e.target.value}
                    })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Personality Traits (comma-separated)</label>
                  <Textarea
                    placeholder="e.g., Research-driven, Health-conscious, Quality-focused"
                    value={newPersona.psychographics.personality.join(', ')}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      psychographics: {
                        ...newPersona.psychographics,
                        personality: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                      }
                    })}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Shopping Behavior */}
            <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Shopping Behavior
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Purchase Frequency</label>
                  <Input
                    placeholder="e.g., Every 45-60 days"
                    value={newPersona.shoppingBehavior.frequency}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      shoppingBehavior: {...newPersona.shoppingBehavior, frequency: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Average Order Value</label>
                  <Input
                    placeholder="e.g., $120-$180"
                    value={newPersona.shoppingBehavior.averageOrderValue}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      shoppingBehavior: {...newPersona.shoppingBehavior, averageOrderValue: e.target.value}
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Preferred Channels (comma-separated)</label>
                  <Textarea
                    placeholder="e.g., Brand website, Premium department stores, Specialty beauty retailers"
                    value={newPersona.shoppingBehavior.preferredChannels.join(', ')}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      shoppingBehavior: {
                        ...newPersona.shoppingBehavior,
                        preferredChannels: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                      }
                    })}
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Decision Factors (comma-separated)</label>
                  <Textarea
                    placeholder="e.g., Ingredient purity, Brand sustainability, Clinical efficacy"
                    value={newPersona.shoppingBehavior.decisionFactors.join(', ')}
                    onChange={(e) => setNewPersona({
                      ...newPersona,
                      shoppingBehavior: {
                        ...newPersona.shoppingBehavior,
                        decisionFactors: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                      }
                    })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setShowPersonaDialog(false);
              setNewPersona({
                name: "",
                description: "",
                demographics: { age: "", income: "", education: "", occupation: "", location: "" },
                psychographics: { interests: [], values: [], lifestyle: "", personality: [] },
                shoppingBehavior: { frequency: "", averageOrderValue: "", preferredChannels: [], decisionFactors: [] }
              });
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newPersona.name && newPersona.description) {
                  handleArrayItemAdd('customerPersonas', newPersona);
                  setShowPersonaDialog(false);
                  setNewPersona({
                    name: "",
                    description: "",
                    demographics: { age: "", income: "", education: "", occupation: "", location: "" },
                    psychographics: { interests: [], values: [], lifestyle: "", personality: [] },
                    shoppingBehavior: { frequency: "", averageOrderValue: "", preferredChannels: [], decisionFactors: [] }
                  });
                }
              }}
              disabled={!newPersona.name || !newPersona.description}
              className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
            >
              Create Persona
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}