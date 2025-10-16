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
import { Edit2, X, Check, Plus, Star, Quote, Trophy, TrendingUp, Users, Target, Heart, Shield, Lightbulb, Zap, AlertCircle, Mail } from "lucide-react";
import MorphingLoader from "@/app/components/ui/loading";

export default function BrandMarketingPage() {
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
    setTempValue,
    setBrand,
    setHasChanges
  } = useBrand();

  const [showAddDialog, setShowAddDialog] = useState(null);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    review: '',
    from: '',
    rating: 5
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950 z-50" style={{ marginLeft: 0, marginRight: 0, left: 0, right: 0 }}>
        <MorphingLoader
          size="large"
          showText={true}
          customThemeTexts={[
            "Loading marketing strategy...",
            "Fetching customer insights...",
            "Analyzing social proof...",
            "Compiling email strategies...",
            "Gathering competitive advantages...",
            "Almost ready..."
          ]}
        />
      </div>
    );
  }

  const handleTestimonialAdd = () => {
    if (newTestimonial.review && newTestimonial.from) {
      const testimonialText = `"${newTestimonial.review}" - ${newTestimonial.from}${newTestimonial.rating ? ` (${newTestimonial.rating}/5 stars)` : ''}`;
      setBrand(prev => ({
        ...prev,
        socialProof: {
          ...prev.socialProof,
          testimonials: [...(prev.socialProof?.testimonials || []), testimonialText]
        }
      }));
      setHasChanges(true);
      setShowTestimonialDialog(false);
      setNewTestimonial({ review: '', from: '', rating: 5 });
    }
  };

  const handleTestimonialRemove = (index) => {
    setBrand(prev => ({
      ...prev,
      socialProof: {
        ...prev.socialProof,
        testimonials: prev.socialProof?.testimonials?.filter((_, i) => i !== index) || []
      }
    }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Social Media Links</CardTitle>
          <CardDescription className="dark:text-gray-400">Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.socialLinks?.map((link, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                <div className="w-8 h-8 bg-sky-blue/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-sky-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-gray dark:text-white">{link.platform}</p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-blue hover:underline">
                    {link.url}
                  </a>
                </div>
                <button
                  onClick={() => {
                    setBrand(prev => ({
                      ...prev,
                      socialLinks: prev.socialLinks?.filter((_, i) => i !== idx) || []
                    }));
                    setHasChanges(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const platform = prompt("Enter social platform (e.g., Instagram, Facebook, Twitter):");
                if (platform) {
                  const url = prompt(`Enter ${platform} profile URL:`);
                  if (url) {
                    setBrand(prev => ({
                      ...prev,
                      socialLinks: [...(prev.socialLinks || []), { platform, url }]
                    }));
                    setHasChanges(true);
                  }
                }
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Social Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Social Proof</CardTitle>
          <CardDescription className="dark:text-gray-400">Customer reviews and testimonials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Review Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.floor(brand?.socialProof?.averageRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-2xl font-bold text-blue-600">{brand?.socialProof?.averageRating || '0.0'}</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Quote className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {brand?.socialProof?.reviewCount?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {brand?.socialProof?.testimonials?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Testimonials</p>
            </div>
          </div>

          {/* Testimonials */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-gray dark:text-white">Customer Testimonials</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTestimonialDialog(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Testimonial
              </Button>
            </div>
            <div className="space-y-3">
              {brand?.socialProof?.testimonials?.map((testimonial, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                  <Quote className="h-4 w-4 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{testimonial}</p>
                  <button
                    onClick={() => handleTestimonialRemove(idx)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Celebrity Endorsements & Media Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-gray dark:text-white mb-3">Celebrity Endorsements</h3>
              <div className="space-y-2">
                {brand?.socialProof?.celebrityEndorsements?.map((endorsement, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">{endorsement}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-gray dark:text-white mb-3">Media Features</h3>
              <div className="space-y-2">
                {brand?.socialProof?.mediaFeatures?.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Marketing Details */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Marketing Details</CardTitle>
          <CardDescription className="dark:text-gray-400">Campaigns, promotions, and seasonal focus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Current Promotion</label>
              {editingField === 'currentPromotion' ? (
                <div className="space-y-2">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="e.g., Summer Sale - 20% off"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFieldSave('currentPromotion')} className="bg-green-500 hover:bg-green-600">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                     onClick={() => handleFieldEdit('currentPromotion', brand?.currentPromotion || '')}>
                  <p className="text-slate-gray dark:text-white font-medium">{brand?.currentPromotion || 'Add current promotion'}</p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Upcoming Product Launch</label>
              {editingField === 'upcomingProductLaunch' ? (
                <div className="space-y-2">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="e.g., Spring Collection 2024"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFieldSave('upcomingProductLaunch')} className="bg-green-500 hover:bg-green-600">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                     onClick={() => handleFieldEdit('upcomingProductLaunch', brand?.upcomingProductLaunch || '')}>
                  <p className="text-slate-gray dark:text-white font-medium">{brand?.upcomingProductLaunch || 'Add upcoming launch'}</p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Seasonal Focus</label>
              {editingField === 'seasonalFocus' ? (
                <div className="flex gap-2">
                  <Select value={tempValue} onValueChange={(value) => setTempValue(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="year-round">Year Round</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => handleFieldSave('seasonalFocus')} className="bg-green-500 hover:bg-green-600">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                     onClick={() => handleFieldEdit('seasonalFocus', brand?.seasonalFocus || 'year-round')}>
                  <p className="text-slate-gray dark:text-white font-medium capitalize">{brand?.seasonalFocus || 'Year Round'}</p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Discount Strategy</label>
              {editingField === 'discountStrategy' ? (
                <div className="flex gap-2">
                  <Select value={tempValue} onValueChange={(value) => setTempValue(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="dollar-amount">Dollar Amount Off</SelectItem>
                      <SelectItem value="free-shipping">Free Shipping</SelectItem>
                      <SelectItem value="bundle-deals">Bundle Deals</SelectItem>
                      <SelectItem value="loyalty-points">Loyalty Points</SelectItem>
                      <SelectItem value="bogo">Buy One Get One</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => handleFieldSave('discountStrategy')} className="bg-green-500 hover:bg-green-600">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                     onClick={() => handleFieldEdit('discountStrategy', brand?.discountStrategy || 'percentage')}>
                  <p className="text-slate-gray font-medium">
                    {brand?.discountStrategy?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Percentage Off'}
                  </p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Loyalty Program Details</label>
            {editingField === 'loyaltyProgramDetails' ? (
              <div className="space-y-2">
                <Textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Describe your loyalty program benefits and structure..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleFieldSave('loyaltyProgramDetails')} className="bg-green-500 hover:bg-green-600">
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                   onClick={() => handleFieldEdit('loyaltyProgramDetails', brand?.loyaltyProgramDetails || '')}>
                <p className="text-slate-gray dark:text-white">{brand?.loyaltyProgramDetails || 'Add loyalty program details'}</p>
                <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Campaign Goals</CardTitle>
          <CardDescription className="dark:text-gray-400">Primary and secondary marketing objectives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Primary Campaign Objective</label>
            {editingField === 'primaryCampaignObjective' ? (
              <div className="flex gap-2">
                <Select value={tempValue} onValueChange={(value) => setTempValue(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase-sales">Increase Sales</SelectItem>
                    <SelectItem value="brand-awareness">Brand Awareness</SelectItem>
                    <SelectItem value="new-product">New Product Launch</SelectItem>
                    <SelectItem value="re-engage">Re-engage Customers</SelectItem>
                    <SelectItem value="lead-generation">Lead Generation</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => handleFieldSave('primaryCampaignObjective')} className="bg-green-500 hover:bg-green-600">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-gradient-to-r from-sky-blue/10 to-vivid-violet/10 rounded-lg group hover:from-sky-blue/20 hover:to-vivid-violet/20 cursor-pointer" 
                   onClick={() => handleFieldEdit('primaryCampaignObjective', brand?.primaryCampaignObjective || 'increase-sales')}>
                <p className="text-slate-gray font-medium">
                  {brand?.primaryCampaignObjective?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Increase Sales'}
                </p>
                <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Secondary Objectives</label>
            <div className="flex flex-wrap gap-2">
              {brand?.secondaryObjectives?.map((objective, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200">
                  {objective.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  <button 
                    onClick={() => handleArrayItemRemove('secondaryObjectives', idx)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Select value="" onValueChange={(value) => {
                if (value) handleArrayItemAdd('secondaryObjectives', value);
              }}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="+ Add Objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase-average-order-value">Increase AOV</SelectItem>
                  <SelectItem value="promote-specific-category">Promote Category</SelectItem>
                  <SelectItem value="reduce-cart-abandonment">Reduce Cart Abandonment</SelectItem>
                  <SelectItem value="grow-email-list">Grow Email List</SelectItem>
                  <SelectItem value="drive-social-engagement">Drive Social Engagement</SelectItem>
                  <SelectItem value="increase-repeat-purchases">Increase Repeat Purchases</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Content Strategy</CardTitle>
          <CardDescription className="dark:text-gray-400">Master content planning and editorial calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Pillars */}
          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Content Pillars</label>
            <div className="space-y-3">
              {brand?.contentStrategy?.contentPillars?.map((pillar, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-gray dark:text-white">{pillar.pillar}</h4>
                      {pillar.purpose && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{pillar.purpose}</p>
                      )}
                      {pillar.percentage && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-sky-blue to-vivid-violet h-2 rounded-full transition-all"
                                style={{ width: `${pillar.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{pillar.percentage}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setBrand(prev => ({
                          ...prev,
                          contentStrategy: {
                            ...prev.contentStrategy,
                            contentPillars: prev.contentStrategy?.contentPillars?.filter((_, i) => i !== idx) || []
                          }
                        }));
                        setHasChanges(true);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const pillar = prompt("Enter content pillar name (e.g., Educational, Product Showcase):");
                  if (pillar) {
                    const purpose = prompt("What's the purpose of this pillar?:");
                    const percentage = prompt("What percentage of content? (e.g., 30):");
                    
                    setBrand(prev => ({
                      ...prev,
                      contentStrategy: {
                        ...prev.contentStrategy,
                        contentPillars: [...(prev.contentStrategy?.contentPillars || []), {
                          pillar,
                          purpose: purpose || undefined,
                          percentage: percentage ? Number(percentage) : undefined,
                          contentTypes: [],
                          kpis: []
                        }]
                      }
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Content Pillar
              </Button>
            </div>
          </div>

          {/* Editorial Calendar */}
          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Weekly Content Themes</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div key={day} className="text-center">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">{day.slice(0, 3)}</p>
                  <div 
                    className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer min-h-[60px] flex items-center justify-center"
                    onClick={() => {
                      const theme = prompt(`Enter theme for ${day}:`);
                      if (theme) {
                        setBrand(prev => ({
                          ...prev,
                          contentStrategy: {
                            ...prev.contentStrategy,
                            editorialCalendar: {
                              ...prev.contentStrategy?.editorialCalendar,
                              weeklyThemes: {
                                ...prev.contentStrategy?.editorialCalendar?.weeklyThemes,
                                [day]: theme
                              }
                            }
                          }
                        }));
                        setHasChanges(true);
                      }
                    }}
                  >
                    {brand?.contentStrategy?.editorialCalendar?.weeklyThemes?.[day] || '+ Add'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Tone & Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Do Words</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {brand?.contentStrategy?.contentTone?.doWords?.map((word, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="h-3 w-3 mr-1" />
                    {word}
                    <button 
                      onClick={() => {
                        setBrand(prev => ({
                          ...prev,
                          contentStrategy: {
                            ...prev.contentStrategy,
                            contentTone: {
                              ...prev.contentStrategy?.contentTone,
                              doWords: prev.contentStrategy?.contentTone?.doWords?.filter((_, i) => i !== idx) || []
                            }
                          }
                        }));
                        setHasChanges(true);
                      }}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => {
                  const word = prompt("Enter a word/phrase to use:");
                  if (word) {
                    setBrand(prev => ({
                      ...prev,
                      contentStrategy: {
                        ...prev.contentStrategy,
                        contentTone: {
                          ...prev.contentStrategy?.contentTone,
                          doWords: [...(prev.contentStrategy?.contentTone?.doWords || []), word]
                        }
                      }
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Do Word
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Don't Words</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {brand?.contentStrategy?.contentTone?.dontWords?.map((word, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                    <X className="h-3 w-3 mr-1" />
                    {word}
                    <button 
                      onClick={() => {
                        setBrand(prev => ({
                          ...prev,
                          contentStrategy: {
                            ...prev.contentStrategy,
                            contentTone: {
                              ...prev.contentStrategy?.contentTone,
                              dontWords: prev.contentStrategy?.contentTone?.dontWords?.filter((_, i) => i !== idx) || []
                            }
                          }
                        }));
                        setHasChanges(true);
                      }}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => {
                  const word = prompt("Enter a word/phrase to avoid:");
                  if (word) {
                    setBrand(prev => ({
                      ...prev,
                      contentStrategy: {
                        ...prev.contentStrategy,
                        contentTone: {
                          ...prev.contentStrategy?.contentTone,
                          dontWords: [...(prev.contentStrategy?.contentTone?.dontWords || []), word]
                        }
                      }
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Don't Word
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Journey Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-sky-blue" />
            Customer Journey Insights
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Understand your customer decision-making process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Decision Factors */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Decision Factors
            </label>
            <div className="space-y-3">
              {brand?.customerJourneyInsights?.decisionFactors?.map((factor, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{factor.factor}</h4>
                        <Badge variant={factor.importance === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {factor.importance}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{factor.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        setBrand(prev => ({
                          ...prev,
                          customerJourneyInsights: {
                            ...prev.customerJourneyInsights,
                            decisionFactors: prev.customerJourneyInsights?.decisionFactors?.filter((_, i) => i !== idx) || []
                          }
                        }));
                        setHasChanges(true);
                      }}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const factor = prompt("Enter decision factor (e.g., Price, Quality, Brand Reputation):");
                  if (factor) {
                    const importance = prompt("Importance level (high/medium/low):");
                    const description = prompt("Description:");

                    setBrand(prev => ({
                      ...prev,
                      customerJourneyInsights: {
                        ...prev.customerJourneyInsights,
                        decisionFactors: [...(prev.customerJourneyInsights?.decisionFactors || []), {
                          factor,
                          importance: importance || 'medium',
                          description: description || ''
                        }]
                      }
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Decision Factor
              </Button>
            </div>
          </div>

          {/* Trust Builders */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Trust Builders
            </label>
            <div className="space-y-2">
              {brand?.customerJourneyInsights?.trustBuilders?.map((builder, idx) => (
                <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3 group">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{builder.builder}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{builder.implementation}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Impact: {builder.impact}
                    </Badge>
                  </div>
                  <button
                    onClick={() => {
                      setBrand(prev => ({
                        ...prev,
                        customerJourneyInsights: {
                          ...prev.customerJourneyInsights,
                          trustBuilders: prev.customerJourneyInsights?.trustBuilders?.filter((_, i) => i !== idx) || []
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const builder = prompt("Enter trust builder (e.g., Money-back guarantee, Free shipping):");
                  if (builder) {
                    const impact = prompt("Impact level (high/medium/low):");
                    const implementation = prompt("How is it implemented?:");

                    setBrand(prev => ({
                      ...prev,
                      customerJourneyInsights: {
                        ...prev.customerJourneyInsights,
                        trustBuilders: [...(prev.customerJourneyInsights?.trustBuilders || []), {
                          builder,
                          impact: impact || 'medium',
                          implementation: implementation || ''
                        }]
                      }
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Trust Builder
              </Button>
            </div>
          </div>

          {/* Purchase Triggers */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              Purchase Triggers
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.customerJourneyInsights?.purchaseTriggers?.map((trigger, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border-yellow-200">
                  {trigger}
                  <button
                    onClick={() => {
                      setBrand(prev => ({
                        ...prev,
                        customerJourneyInsights: {
                          ...prev.customerJourneyInsights,
                          purchaseTriggers: prev.customerJourneyInsights?.purchaseTriggers?.filter((_, i) => i !== idx) || []
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const trigger = prompt("Enter purchase trigger (e.g., Flash sale, Limited stock):");
                  if (trigger) {
                    setBrand(prev => ({
                      ...prev,
                      customerJourneyInsights: {
                        ...prev.customerJourneyInsights,
                        purchaseTriggers: [...(prev.customerJourneyInsights?.purchaseTriggers || []), trigger]
                      }
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Trigger
              </Button>
            </div>
          </div>

          {/* Purchase Barriers */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Purchase Barriers
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.purchaseBarriers?.map((barrier, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-red-50 text-red-700 border-red-200">
                  {barrier}
                  <button
                    onClick={() => handleArrayItemRemove('purchaseBarriers', idx)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const barrier = prompt("Enter purchase barrier (e.g., High price, Shipping costs):");
                  if (barrier) handleArrayItemAdd('purchaseBarriers', barrier);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Barrier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Marketing Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-vivid-violet" />
            Email Marketing Strategy
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Configure your email marketing approach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Frequency */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Email Frequency</label>
              {editingField === 'emailFrequency' ? (
                <div className="space-y-2">
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="e.g., 3-4 per week"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFieldSave('emailFrequency')} className="bg-green-500 hover:bg-green-600">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                     onClick={() => handleFieldEdit('emailFrequency', brand?.emailFrequency || '')}>
                  <p className="text-gray-900 dark:text-white font-medium">{brand?.emailFrequency || 'Set email frequency'}</p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
                </div>
              )}
            </div>

            {/* Content Priority */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Content Priority</label>
              <div className="flex flex-wrap gap-2">
                {brand?.contentPriority?.map((priority, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200">
                    {priority}
                    <button
                      onClick={() => handleArrayItemRemove('contentPriority', idx)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const priority = prompt("Enter content priority (e.g., educational, promotional):");
                    if (priority) handleArrayItemAdd('contentPriority', priority);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Email Strategy Details */}
          {brand?.emailStrategy && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{brand.emailStrategy.contentMix?.educational || 0}%</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Educational</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{brand.emailStrategy.contentMix?.promotional || 0}%</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Promotional</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{brand.emailStrategy.contentMix?.community || 0}%</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Community</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{brand.emailStrategy.contentMix?.product || 0}%</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Product</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unique Features & Competitive Advantages */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Unique Features & Advantages
          </CardTitle>
          <CardDescription className="dark:text-gray-400">What sets your brand apart</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unique Features */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">Unique Features</label>
            <div className="space-y-2">
              {brand?.uniqueFeatures?.map((feature, idx) => (
                <div key={idx} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg flex items-start gap-3 group border border-yellow-200 dark:border-yellow-800/30">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-white flex-1">{feature}</p>
                  <button
                    onClick={() => handleArrayItemRemove('uniqueFeatures', idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const feature = prompt("Enter unique feature:");
                  if (feature) handleArrayItemAdd('uniqueFeatures', feature);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Unique Feature
              </Button>
            </div>
          </div>

          {/* Competitive Advantages */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">Competitive Advantages</label>
            <div className="space-y-2">
              {brand?.competitiveAdvantages?.map((advantage, idx) => (
                <div key={idx} className="p-3 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg flex items-start gap-3 group border border-green-200 dark:border-green-800/30">
                  <Trophy className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-white flex-1">{advantage}</p>
                  <button
                    onClick={() => handleArrayItemRemove('competitiveAdvantages', idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const advantage = prompt("Enter competitive advantage:");
                  if (advantage) handleArrayItemAdd('competitiveAdvantages', advantage);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Competitive Advantage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Testimonial Dialog */}
      <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add Customer Testimonial</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">Share what your customers are saying about your brand</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Review</label>
              <Textarea
                placeholder="Enter the customer's review or testimonial..."
                value={newTestimonial.review}
                onChange={(e) => setNewTestimonial(prev => ({ ...prev, review: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">From</label>
                <Input
                  placeholder="e.g., John D., New York"
                  value={newTestimonial.from}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, from: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewTestimonial(prev => ({ ...prev, rating: star }))}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= newTestimonial.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preview:</p>
              <div className="border-l-4 border-sky-blue pl-4">
                <p className="text-sm italic text-gray-700 dark:text-gray-300">
                  "{newTestimonial.review || 'Your testimonial will appear here...'}"
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  - {newTestimonial.from || 'Customer Name'}
                  {newTestimonial.rating && (
                    <span className="ml-2">
                      {'★'.repeat(newTestimonial.rating)}{'☆'.repeat(5 - newTestimonial.rating)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowTestimonialDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTestimonialAdd}
              disabled={!newTestimonial.review || !newTestimonial.from}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              Add Testimonial
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}