"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Edit2, X, Check, Plus, Sparkles, Target, Globe } from "lucide-react";

export default function BrandIdentitySection() {
  const {
    brand,
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

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      handleArrayItemAdd(showAddDialog, newItemValue.trim());
      setShowAddDialog(null);
      setNewItemValue("");
    }
  };

  const EditableField = ({ fieldName, label, value, placeholder, multiline = false, icon: Icon }) => {
    const isEditing = editingField === fieldName;

    return (
      <div>
        <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-sky-blue" />}
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
      {/* Brand Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Brand Basics</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Essential brand information and identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField
              fieldName="brandName"
              label="Brand Name"
              value={brand?.brandName}
              placeholder="Enter your brand name"
              icon={Sparkles}
            />
            <EditableField
              fieldName="brandTagline"
              label="Brand Tagline"
              value={brand?.brandTagline}
              placeholder="Your brand's memorable tagline"
            />
          </div>

          <EditableField
            fieldName="websiteUrl"
            label="Website URL"
            value={brand?.websiteUrl}
            placeholder="https://yourbrand.com"
            icon={Globe}
          />

          <EditableField
            fieldName="missionStatement"
            label="Mission Statement"
            value={brand?.missionStatement}
            placeholder="What is your brand's purpose and mission?"
            multiline
            icon={Target}
          />

          <EditableField
            fieldName="uniqueValueProposition"
            label="Unique Value Proposition"
            value={brand?.uniqueValueProposition}
            placeholder="What makes your brand uniquely valuable?"
            multiline
          />
        </CardContent>
      </Card>

      {/* Core Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Core Values</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            The principles that guide your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {brand?.coreValues?.map((value, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-sky-50 to-purple-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-sky-900/20 dark:text-purple-300 dark:border-purple-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {value}
                  <button
                    onClick={() => handleArrayItemRemove('coreValues', idx)}
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
                onClick={() => setShowAddDialog('coreValues')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Value
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Story */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Brand Story</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your brand's narrative and journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            fieldName="originStory"
            label="Origin Story"
            value={brand?.originStory}
            placeholder="How did your brand begin? What inspired its creation?"
            multiline
          />

          <EditableField
            fieldName="brandJourney"
            label="Brand Journey"
            value={brand?.brandJourney}
            placeholder="Key milestones and evolution of your brand"
            multiline
          />

          <EditableField
            fieldName="customerPromise"
            label="Customer Promise"
            value={brand?.customerPromise}
            placeholder="What do you promise to deliver to your customers?"
            multiline
          />
        </CardContent>
      </Card>

      {/* Industry & Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Industry Categories</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Industries and sectors your brand operates in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {brand?.industryCategories?.map((category, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  {category}
                  <button
                    onClick={() => handleArrayItemRemove('industryCategories', idx)}
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
                onClick={() => setShowAddDialog('industryCategories')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Category
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Focus */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Geographic Focus</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Regions and markets where your brand operates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {brand?.geographicFocus?.map((location, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                  <Globe className="h-3 w-3 mr-1" />
                  {location}
                  <button
                    onClick={() => handleArrayItemRemove('geographicFocus', idx)}
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
                onClick={() => setShowAddDialog('geographicFocus')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Location
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog !== null} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Add {showAddDialog === 'coreValues' ? 'Core Value' :
                   showAddDialog === 'industryCategories' ? 'Industry Category' :
                   showAddDialog === 'geographicFocus' ? 'Geographic Location' : 'Item'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {showAddDialog === 'coreValues' ? 'Add a core value that defines your brand' :
               showAddDialog === 'industryCategories' ? 'Add an industry or sector your brand operates in' :
               showAddDialog === 'geographicFocus' ? 'Add a region or market where your brand operates' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              key={`${showAddDialog}-input`}
              placeholder={`Enter ${showAddDialog?.split(/(?=[A-Z])/).join(' ').toLowerCase()}...`}
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
