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
import { Edit2, X, Check, Plus, Instagram, Facebook, Twitter, Linkedin, Youtube, Globe } from "lucide-react";

const socialPlatformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  other: Globe
};

export default function BrandSocialMediaSection() {
  const {
    brand,
    setBrand,
    setHasChanges,
    editingField,
    tempValue,
    handleFieldEdit,
    handleFieldSave,
    handleArrayItemAdd,
    handleArrayItemRemove,
    setEditingField,
    setTempValue
  } = useBrand();

  const [showAddSocialDialog, setShowAddSocialDialog] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState("instagram");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(null);
  const [newItemValue, setNewItemValue] = useState("");
  const [newBadgeDescription, setNewBadgeDescription] = useState("");

  const handleAddSocialLink = () => {
    if (newSocialUrl.trim()) {
      const newLink = {
        platform: newSocialPlatform,
        url: newSocialUrl.trim()
      };
      setBrand(prev => ({
        ...prev,
        socialLinks: [...(prev.socialLinks || []), newLink]
      }));
      setHasChanges(true);
      setShowAddSocialDialog(false);
      setNewSocialPlatform("instagram");
      setNewSocialUrl("");
    }
  };

  const handleRemoveSocialLink = (index) => {
    setBrand(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      // For trust badges, create an object with text and description
      if (showAddDialog === 'trustBadges') {
        const newBadge = {
          text: newItemValue.trim(),
          description: newBadgeDescription.trim() || undefined,
          icon: 'Shield' // Default icon
        };
        handleArrayItemAdd(showAddDialog, newBadge);
      } else {
        // For other fields, add as string
        handleArrayItemAdd(showAddDialog, newItemValue.trim());
      }
      setShowAddDialog(null);
      setNewItemValue("");
      setNewBadgeDescription("");
    }
  };

  const EditableField = ({ fieldName, label, value, placeholder, multiline = false }) => {
    const isEditing = editingField === fieldName;

    return (
      <div>
        <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
          {label}
        </label>
        {isEditing ? (
          <div className="space-y-2">
            {multiline ? (
              <Textarea
                key={`${fieldName}-textarea-edit`}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder={placeholder}
                className="min-h-[100px]"
                autoFocus
              />
            ) : (
              <Input
                key={`${fieldName}-input-edit`}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleFieldSave(fieldName)} className="bg-green-500 hover:bg-green-600">
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => handleFieldEdit(fieldName, value || '')}
          >
            <p className="text-gray-900 dark:text-white">
              {value || <span className="text-gray-500 dark:text-gray-400 italic">{placeholder}</span>}
            </p>
            <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Social Media Presence</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your brand's social media channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.socialLinks?.map((link, idx) => {
              const Icon = socialPlatformIcons[link.platform.toLowerCase()] || Globe;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                  <Icon className="h-5 w-5 text-sky-blue" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {link.platform}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{link.url}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveSocialLink(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddSocialDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Social Media Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Content Themes</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Main themes and topics for your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {brand?.contentThemes?.map((theme, idx) => (
              <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-purple-700 border-purple-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                {theme}
                <button
                  onClick={() => handleArrayItemRemove('contentThemes', idx)}
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
              onClick={() => setShowAddDialog('contentThemes')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Marketing Strategy</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your brand's approach to marketing and promotion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            fieldName="marketingStrategy"
            label="Overall Marketing Approach"
            value={brand?.marketingStrategy}
            placeholder="Describe your marketing strategy and key channels"
            multiline
          />

          {/* Content Strategy is managed in the Marketing page */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Content Strategy</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {brand?.contentStrategy ?
                    `${brand.contentStrategy.contentPillars?.length || 0} content pillars, ${brand.contentStrategy.contentThemes?.length || 0} themes configured` :
                    'Not configured'
                  }
                </p>
              </div>
              <a
                href={`/store/${brand?.store_public_id}/brand/${brand?.slug}/marketing`}
                className="text-xs text-sky-blue hover:text-royal-blue font-medium"
              >
                Edit in Marketing →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust & Social Proof */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Trust Badges & Credentials</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Certifications, awards, and trust indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brand?.trustBadges?.map((badge, idx) => (
              <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 group hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {typeof badge === 'string' ? badge : badge.text}
                    </h4>
                    {typeof badge === 'object' && badge.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {badge.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleArrayItemRemove('trustBadges', idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowAddDialog('trustBadges')}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Trust Badge
          </Button>
        </CardContent>
      </Card>

      {/* Add Social Link Dialog */}
      <Dialog open={showAddSocialDialog} onOpenChange={setShowAddSocialDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add Social Media Link</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Add a social media profile for your brand
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                Platform
              </label>
              <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                Profile URL
              </label>
              <Input
                placeholder="https://instagram.com/yourbrand"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddSocialDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSocialLink} disabled={!newSocialUrl.trim()}>
              Add Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog !== null} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Add {showAddDialog === 'contentThemes' ? 'Content Theme' :
                   showAddDialog === 'trustBadges' ? 'Trust Badge' : 'Item'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {showAddDialog === 'contentThemes' ? 'Add a content theme or topic' :
               showAddDialog === 'trustBadges' ? 'Add a certification, award, or trust indicator' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                {showAddDialog === 'trustBadges' ? 'Badge Title' : 'Value'}
              </label>
              <Input
                key={`${showAddDialog}-input`}
                placeholder={showAddDialog === 'trustBadges' ? 'e.g., Free Shipping, Money-Back Guarantee' : `Enter ${showAddDialog?.split(/(?=[A-Z])/).join(' ').toLowerCase()}...`}
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (!showAddDialog === 'trustBadges' || !newBadgeDescription)) {
                    handleAddItem();
                  }
                }}
                autoFocus
              />
            </div>
            {showAddDialog === 'trustBadges' && (
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Describe this trust badge..."
                  value={newBadgeDescription}
                  onChange={(e) => setNewBadgeDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
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
