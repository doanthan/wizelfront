"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Edit2, X, Check, Plus, MessageCircle, Sparkles, Volume2 } from "lucide-react";

export default function BrandVoiceToneSection() {
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
      {/* Brand Voice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Brand Voice</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            How your brand communicates and speaks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-sky-blue" />
              Voice Attributes
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.brandVoice?.map((voice, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-sky-900/20 dark:text-blue-300 dark:border-blue-800">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {voice}
                  <button
                    onClick={() => handleArrayItemRemove('brandVoice', idx)}
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
                onClick={() => setShowAddDialog('brandVoice')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Voice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Personality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Brand Personality</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Key personality traits that define your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-blue" />
              Personality Traits
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.brandPersonality?.map((trait, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-300 dark:border-purple-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {trait}
                  <button
                    onClick={() => handleArrayItemRemove('brandPersonality', idx)}
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
                onClick={() => setShowAddDialog('brandPersonality')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Trait
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Communication Guidelines</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            How your brand should communicate with customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            fieldName="writingStyle"
            label="Writing Style"
            value={brand?.writingStyle}
            placeholder="e.g., Conversational, professional, friendly, authoritative"
            multiline
          />

          <EditableField
            fieldName="toneGuidelines"
            label="Tone Guidelines"
            value={brand?.toneGuidelines}
            placeholder="Describe the overall tone your brand should maintain in communications"
            multiline
          />
        </CardContent>
      </Card>

      {/* Customer Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Customer Language</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Keywords and phrases your customers use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">
              Common Keywords
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.customerLanguage?.keywords?.map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                  {keyword}
                  <button
                    onClick={() => {
                      const newKeywords = brand.customerLanguage.keywords.filter((_, i) => i !== idx);
                      handleFieldSave('customerLanguage');
                      // Note: This would need a custom handler in the hook
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
                className="h-8"
                onClick={() => setShowAddDialog('customerLanguage.keywords')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Keyword
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">
              Common Phrases
            </label>
            <div className="space-y-2">
              {brand?.customerLanguage?.phrases?.map((phrase, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 group">
                  <MessageCircle className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="flex-1 text-sm text-gray-900 dark:text-gray-300">{phrase}</p>
                  <button
                    onClick={() => {
                      // Similar custom handler needed
                    }}
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
                onClick={() => setShowAddDialog('customerLanguage.phrases')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Phrase
              </Button>
            </div>
          </div>

          <EditableField
            fieldName="customerLanguage.tone"
            label="Overall Tone"
            value={brand?.customerLanguage?.tone}
            placeholder="How do your customers typically speak and communicate?"
            multiline
          />
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog !== null} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Add {showAddDialog === 'brandVoice' ? 'Voice Attribute' :
                   showAddDialog === 'brandPersonality' ? 'Personality Trait' :
                   showAddDialog === 'customerLanguage.keywords' ? 'Keyword' :
                   showAddDialog === 'customerLanguage.phrases' ? 'Phrase' : 'Item'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {showAddDialog === 'brandVoice' ? 'Add a voice attribute (e.g., friendly, professional, casual)' :
               showAddDialog === 'brandPersonality' ? 'Add a personality trait that describes your brand' :
               showAddDialog === 'customerLanguage.keywords' ? 'Add a keyword your customers commonly use' :
               showAddDialog === 'customerLanguage.phrases' ? 'Add a phrase your customers commonly say' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showAddDialog === 'customerLanguage.phrases' ? (
              <Textarea
                key="phrases-textarea"
                placeholder="Enter phrase..."
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                className="min-h-[80px]"
                autoFocus
              />
            ) : (
              <Input
                key={`${showAddDialog}-input`}
                placeholder={`Enter ${showAddDialog?.split('.').pop()?.split(/(?=[A-Z])/).join(' ').toLowerCase()}...`}
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem();
                  }
                }}
                autoFocus
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
