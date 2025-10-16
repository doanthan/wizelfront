"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { BrandSidebar } from "@/app/components/brand/brand-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Edit2, X, Check, Plus, Globe, HelpCircle, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Camera, Heart, ExternalLink } from "lucide-react";

export default function BrandIdentityPage() {
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
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [activeSection, setActiveSection] = useState("brand-overview");

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Observe sections for active highlighting
  React.useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-150px 0px -50% 0px" }
    );

    const sectionIds = ["brand-overview", "visual-identity", "voice-tone", "target-audience", "core-values", "unique-features", "social-media"];
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-gray dark:text-gray-400">Loading brand details...</p>
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

  const handleAddSocialMedia = () => {
    if (socialPlatform && socialUrl.trim()) {
      const socialData = { platform: socialPlatform, url: socialUrl.trim() };
      handleArrayItemAdd('socialMediaLinks', socialData);
      setShowSocialModal(false);
      setSocialPlatform("");
      setSocialUrl("");
    }
  };

  const socialPlatforms = [
    { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { value: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-blue-500' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { value: 'tiktok', label: 'TikTok', icon: MessageCircle, color: 'text-black' },
    { value: 'pinterest', label: 'Pinterest', icon: Camera, color: 'text-red-500' },
    { value: 'snapchat', label: 'Snapchat', icon: Heart, color: 'text-yellow-500' },
  ];

  return (
    <div className="flex gap-4">
      <BrandSidebar
        onSectionClick={scrollToSection}
        activeSection={activeSection}
      />

      <div className="flex-1 space-y-8 min-w-0">
        {/* Brand Overview Section */}
        <Card id="brand-overview" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="dark:text-white">Brand Basics</CardTitle>
          <CardDescription className="dark:text-gray-400">Core information about your brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Brand Name</label>
              {editingField === 'brandName' ? (
                <div className="flex gap-2">
                  <Input
                    key="brandName-edit"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleFieldSave('brandName')} className="bg-green-500 hover:bg-green-600 text-white">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-sky-blue dark:hover:border-sky-blue cursor-pointer transition-all"
                     onClick={() => handleFieldEdit('brandName', brand?.brandName || '')}>
                  <span className="flex-1 text-gray-900 dark:text-white font-medium">{brand?.brandName}</span>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue transition-colors" />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">URL Slug</label>
              <div className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-gray-900 dark:text-white font-medium">{brand?.slug}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Brand Tagline</label>
            {editingField === 'brandTagline' ? (
              <div className="space-y-2">
                <Textarea
                  key="brandTagline-edit"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="min-h-[80px] bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleFieldSave('brandTagline')} className="bg-green-500 hover:bg-green-600 text-white">
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-sky-blue dark:hover:border-sky-blue cursor-pointer transition-all"
                   onClick={() => handleFieldEdit('brandTagline', brand?.brandTagline || '')}>
                <span className="flex-1 text-gray-900 dark:text-white">{brand?.brandTagline}</span>
                <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue transition-colors flex-shrink-0 mt-0.5" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Brand Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Brand Overview</CardTitle>
          <CardDescription className="dark:text-gray-400">Industry positioning and core information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Website URL</label>
              {editingField === 'websiteUrl' ? (
                <div className="flex gap-2">
                  <Input
                    key="websiteUrl-edit"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleFieldSave('websiteUrl')} className="bg-green-500 hover:bg-green-600 text-white">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-sky-blue dark:hover:border-sky-blue cursor-pointer transition-all"
                     onClick={() => handleFieldEdit('websiteUrl', brand?.websiteUrl || '')}>
                  <Globe className="h-4 w-4 text-sky-blue flex-shrink-0" />
                  <span className="flex-1 text-gray-900 dark:text-white">{brand?.websiteUrl || 'Add website URL'}</span>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue transition-colors flex-shrink-0" />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Geographic Focus</label>
              <div className="flex flex-wrap gap-2">
                {brand?.geographicFocus?.map((region, idx) => (
                  <Badge key={idx} variant="outline" className="flex items-center gap-1">
                    {region}
                    <button 
                      onClick={() => handleArrayItemRemove('geographicFocus', idx)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7"
                  onClick={() => setShowAddDialog('geographicFocus')}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Industry Categories</label>
            <div className="flex flex-wrap gap-2">
              {brand?.industryCategories?.map((category, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                  {category}
                  <button 
                    onClick={() => handleArrayItemRemove('industryCategories', idx)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => setShowAddDialog('industryCategories')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Unique Selling Points</label>
            {editingField === 'uniqueSellingPoints' ? (
              <div className="space-y-2">
                <Textarea
                  key="uniqueSellingPoints-edit"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="min-h-[80px] bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleFieldSave('uniqueSellingPoints')} className="bg-green-500 hover:bg-green-600 text-white">
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-sky-blue dark:hover:border-sky-blue cursor-pointer transition-all"
                   onClick={() => handleFieldEdit('uniqueSellingPoints', brand?.uniqueSellingPoints || '')}>
                <p className="flex-1 text-gray-900 dark:text-white">{brand?.uniqueSellingPoints || 'Add unique selling points'}</p>
                <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue transition-colors flex-shrink-0 mt-0.5" />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Social Media Links</label>
            <div className="flex flex-wrap gap-2">
              {brand?.socialMediaLinks?.map((social, idx) => {
                const platform = socialPlatforms.find(p => p.value === social.platform);
                const IconComponent = platform?.icon || ExternalLink;
                return (
                  <div key={idx} className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg shadow-sm`}>
                    <IconComponent className={`h-4 w-4 ${platform?.color || 'text-gray-600'}`} />
                    <span className="text-sm font-medium text-slate-gray dark:text-white">{platform?.label || social.platform}</span>
                    <button
                      onClick={() => window.open(social.url, '_blank')}
                      className="text-sky-blue hover:text-sky-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleArrayItemRemove('socialMediaLinks', idx)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10"
                onClick={() => setShowSocialModal(true)}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Social Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Identity Section */}
      <Card id="visual-identity" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Visual Identity</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Colors, logos, and design assets</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Visual identity settings can be managed in the <span className="text-sky-600 font-medium">Visual Identity</span> tab.
          </p>
        </CardContent>
      </Card>

      {/* Voice & Tone Section */}
      <Card id="voice-tone" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Brand Voice & Personality</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">How your brand communicates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">Brand Voice</label>
            <div className="flex flex-wrap gap-2">
              {brand?.brandVoice?.map((voice, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                  {voice}
                  <button 
                    onClick={() => handleArrayItemRemove('brandVoice', idx)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => setShowAddDialog('brandVoice')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Voice
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">Brand Personality</label>
            <div className="flex flex-wrap gap-2">
              {brand?.brandPersonality?.map((personality, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                  {personality}
                  <button 
                    onClick={() => handleArrayItemRemove('brandPersonality', idx)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => setShowAddDialog('brandPersonality')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Trait
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">Core Values</label>
            <div className="flex flex-wrap gap-2">
              {brand?.coreValues?.map((value, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                  {value}
                  <button 
                    onClick={() => handleArrayItemRemove('coreValues', idx)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => setShowAddDialog('coreValues')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Value
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Audience Section */}
      <Card id="target-audience" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Target Audience</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Customer demographics and personas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Target audience settings can be managed in the <span className="text-sky-600 font-medium">Audience</span> tab.
          </p>
        </CardContent>
      </Card>

      {/* Core Values Section */}
      <Card id="core-values" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Brand Story & Core Values</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">The narrative that defines your brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['missionStatement', 'originStory', 'uniqueValueProposition', 'brandJourney', 'customerPromise'].map((field) => (
            <div key={field}>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                {field === 'missionStatement' && 'Mission Statement'}
                {field === 'originStory' && 'Origin Story'}
                {field === 'uniqueValueProposition' && 'Unique Value Proposition'}
                {field === 'brandJourney' && 'Brand Journey'}
                {field === 'customerPromise' && 'Customer Promise'}
              </label>
              {editingField === field ? (
                <div className="space-y-2">
                  <Textarea
                    key={`${field}-edit`}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="min-h-[100px] bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleFieldSave(field)} className="bg-green-500 hover:bg-green-600 text-white">
                      <Check className="h-4 w-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-sky-blue dark:hover:border-sky-blue cursor-pointer transition-all"
                     onClick={() => handleFieldEdit(field, brand?.[field] || '')}>
                  <p className="flex-1 text-gray-900 dark:text-white">{brand?.[field] || `Add ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}</p>
                  <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue transition-colors flex-shrink-0 mt-0.5" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Unique Features Section */}
      <Card id="unique-features" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Unique Features</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Key differentiators and selling points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.uniqueSellingPoints && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-gray-100">{brand.uniqueSellingPoints}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Media Section */}
      <Card id="social-media" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Social Media Presence</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">Social media links and profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {brand?.socialMediaLinks?.map((social, idx) => {
              const platform = socialPlatforms.find(p => p.value === social.platform);
              const IconComponent = platform?.icon || ExternalLink;
              return (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <IconComponent className={`h-5 w-5 ${platform?.color || 'text-gray-600'}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{platform?.label || social.platform}</span>
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Add Item Dialog */}
      <Dialog open={showAddDialog !== null} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 bg-sky-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-sky-blue" />
              </div>
              Add {showAddDialog === 'brandVoice' ? 'Brand Voice' : 
                   showAddDialog === 'brandPersonality' ? 'Brand Personality Trait' :
                   showAddDialog === 'coreValues' ? 'Core Value' :
                   showAddDialog === 'geographicFocus' ? 'Geographic Region' :
                   showAddDialog === 'industryCategories' ? 'Industry Category' : 'Item'}
            </DialogTitle>
            <DialogDescription>
              {showAddDialog === 'brandVoice' && 'Choose how your brand communicates with customers.'}
              {showAddDialog === 'brandPersonality' && 'Define your brand\'s character and personality traits.'}
              {showAddDialog === 'coreValues' && 'Add a core value that drives your brand\'s mission.'}
              {showAddDialog === 'geographicFocus' && 'Select the regions where your brand operates.'}
              {showAddDialog === 'industryCategories' && 'Choose the industry that best describes your brand.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showAddDialog === 'geographicFocus' ? (
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Select Region</label>
                <Select value={newItemValue} onValueChange={setNewItemValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select geographic region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Global">🌍 Global</SelectItem>
                    <SelectItem value="North America">🇺🇸 North America</SelectItem>
                    <SelectItem value="Europe">🇪🇺 Europe</SelectItem>
                    <SelectItem value="Asia">🌏 Asia</SelectItem>
                    <SelectItem value="Australia & Oceania">🇦🇺 Australia & Oceania</SelectItem>
                    <SelectItem value="Africa">🌍 Africa</SelectItem>
                    <SelectItem value="South America">🇧🇷 South America</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : showAddDialog === 'industryCategories' ? (
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Select Industry</label>
                <Select value={newItemValue} onValueChange={setNewItemValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-commerce">🛒 E-commerce</SelectItem>
                    <SelectItem value="Fashion & Apparel">👗 Fashion & Apparel</SelectItem>
                    <SelectItem value="Technology">💻 Technology</SelectItem>
                    <SelectItem value="Health & Wellness">🏥 Health & Wellness</SelectItem>
                    <SelectItem value="Beauty & Cosmetics">💄 Beauty & Cosmetics</SelectItem>
                    <SelectItem value="Home & Garden">🏡 Home & Garden</SelectItem>
                    <SelectItem value="Food & Beverage">🍽️ Food & Beverage</SelectItem>
                    <SelectItem value="Sports & Recreation">⚽ Sports & Recreation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : showAddDialog === 'brandVoice' ? (
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Choose Voice Style</label>
                <Select value={newItemValue} onValueChange={setNewItemValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice style or add custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Authoritative">Authoritative</SelectItem>
                    <SelectItem value="Playful">Playful</SelectItem>
                    <SelectItem value="Sophisticated">Sophisticated</SelectItem>
                    <SelectItem value="Conversational">Conversational</SelectItem>
                    <SelectItem value="Inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-3">
                  <Input
                    key="brandVoice-custom-input"
                    placeholder="Or enter custom voice style..."
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem();
                      }
                    }}
                  />
                </div>
              </div>
            ) : showAddDialog === 'brandPersonality' ? (
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Choose Personality Trait</label>
                <Select value={newItemValue} onValueChange={setNewItemValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a personality trait or add custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Innovative">Innovative</SelectItem>
                    <SelectItem value="Trustworthy">Trustworthy</SelectItem>
                    <SelectItem value="Bold">Bold</SelectItem>
                    <SelectItem value="Caring">Caring</SelectItem>
                    <SelectItem value="Adventurous">Adventurous</SelectItem>
                    <SelectItem value="Reliable">Reliable</SelectItem>
                    <SelectItem value="Creative">Creative</SelectItem>
                    <SelectItem value="Passionate">Passionate</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-3">
                  <Input
                    key="brandPersonality-custom-input"
                    placeholder="Or enter custom personality trait..."
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem();
                      }
                    }}
                  />
                </div>
              </div>
            ) : showAddDialog === 'coreValues' ? (
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Choose Core Value</label>
                <Select value={newItemValue} onValueChange={setNewItemValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a core value or add custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sustainability">Sustainability</SelectItem>
                    <SelectItem value="Quality">Quality</SelectItem>
                    <SelectItem value="Innovation">Innovation</SelectItem>
                    <SelectItem value="Customer Focus">Customer Focus</SelectItem>
                    <SelectItem value="Integrity">Integrity</SelectItem>
                    <SelectItem value="Excellence">Excellence</SelectItem>
                    <SelectItem value="Community">Community</SelectItem>
                    <SelectItem value="Transparency">Transparency</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-3">
                  <Input
                    key="coreValues-custom-input"
                    placeholder="Or enter custom core value..."
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem();
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <Input
                key={`${showAddDialog}-input`}
                placeholder={`Enter ${showAddDialog}...`}
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
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Social Media Modal */}
      <Dialog open={showSocialModal} onOpenChange={setShowSocialModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-sky-blue" />
              Add Social Media Link
            </DialogTitle>
            <DialogDescription>
              Add a social media profile or website link to your brand.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Platform</label>
              <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select social platform" />
                </SelectTrigger>
                <SelectContent>
                  {socialPlatforms.map((platform) => {
                    const IconComponent = platform.icon;
                    return (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${platform.color}`} />
                          {platform.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">URL</label>
              <Input
                key="social-url-input"
                placeholder="https://instagram.com/yourbrand"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSocialMedia();
                  }
                }}
              />
            </div>
            {socialPlatform && socialUrl && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const platform = socialPlatforms.find(p => p.value === socialPlatform);
                    const IconComponent = platform?.icon || ExternalLink;
                    return (
                      <>
                        <IconComponent className={`h-4 w-4 ${platform?.color || 'text-gray-600'}`} />
                        <span className="text-sm font-medium">{platform?.label}</span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSocialModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSocialMedia} disabled={!socialPlatform || !socialUrl.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
