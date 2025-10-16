"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Edit2, X, Check, Plus, Palette, Image as ImageIcon, Type } from "lucide-react";

export default function BrandVisualsSection() {
  const {
    brand,
    setBrand,
    setHasChanges,
    editingField,
    tempValue,
    handleFieldEdit,
    handleFieldSave,
    handleArrayItemRemove,
    setEditingField,
    setTempValue
  } = useBrand();

  const [showAddColorDialog, setShowAddColorDialog] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [showAddFontDialog, setShowAddFontDialog] = useState(null);
  const [newFontValue, setNewFontValue] = useState("");

  const handleAddSecondaryColor = () => {
    if (newColorName.trim() && newColorHex) {
      const newColor = { hex: newColorHex, name: newColorName.trim() };
      setBrand(prev => ({
        ...prev,
        secondaryColors: [...(prev.secondaryColors || []), newColor]
      }));
      setHasChanges(true);
      setShowAddColorDialog(false);
      setNewColorName("");
      setNewColorHex("#000000");
    }
  };

  const handleAddFont = () => {
    if (newFontValue.trim()) {
      setBrand(prev => ({
        ...prev,
        [showAddFontDialog]: [...(prev[showAddFontDialog] || []), newFontValue.trim()]
      }));
      setHasChanges(true);
      setShowAddFontDialog(null);
      setNewFontValue("");
    }
  };

  const handlePrimaryColorChange = (hex) => {
    setBrand(prev => ({
      ...prev,
      primaryColor: [{ hex, name: "Primary" }]
    }));
    setHasChanges(true);
  };

  const handleSecondaryColorRemove = (index) => {
    setBrand(prev => ({
      ...prev,
      secondaryColors: prev.secondaryColors.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const handleLogoFieldChange = (field, value) => {
    setBrand(prev => ({
      ...prev,
      logo: {
        ...prev.logo,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const EditableField = ({ fieldName, label, value, placeholder, icon: Icon }) => {
    const isEditing = editingField === fieldName;

    return (
      <div>
        <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-sky-blue" />}
          {label}
        </label>
        {isEditing ? (
          <div className="space-y-2">
            <Input
              key={`${fieldName}-input-edit`}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
            />
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
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Logo & Brand Mark</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Logo URLs and brand visual identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-sky-blue" />
              Primary Logo URL
            </label>
            <div className="space-y-2">
              <Input
                value={brand?.logo?.primary_logo_url || ''}
                onChange={(e) => handleLogoFieldChange('primary_logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              {brand?.logo?.primary_logo_url && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <img
                    src={brand.logo.primary_logo_url}
                    alt={brand.logo.logo_alt_text || 'Brand logo'}
                    className="max-h-24 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Logo Alt Text
            </label>
            <Input
              value={brand?.logo?.logo_alt_text || ''}
              onChange={(e) => handleLogoFieldChange('logo_alt_text', e.target.value)}
              placeholder="Description for accessibility"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Brand Colors</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your brand's color palette
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Color */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-sky-blue" />
              Primary Color
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer shadow-sm"
                  style={{ backgroundColor: brand?.primaryColor?.[0]?.hex || '#000000' }}
                  onClick={() => document.getElementById('primaryColorPicker').click()}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {brand?.primaryColor?.[0]?.hex || '#000000'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Primary brand color</p>
                </div>
                <input
                  id="primaryColorPicker"
                  type="color"
                  value={brand?.primaryColor?.[0]?.hex || '#000000'}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  className="w-0 h-0 opacity-0"
                />
              </div>
            </div>
          </div>

          {/* Secondary Colors */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">
              Secondary Colors
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brand?.secondaryColors?.map((color, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{color.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{color.hex}</p>
                  </div>
                  <button
                    onClick={() => handleSecondaryColorRemove(idx)}
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
              onClick={() => setShowAddColorDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Secondary Color
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Typography</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Fonts used in your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Fonts */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Type className="h-4 w-4 text-sky-blue" />
              Primary Fonts
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.primaryFonts?.map((font, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  <Type className="h-3 w-3 mr-1" />
                  {font}
                  <button
                    onClick={() => handleArrayItemRemove('primaryFonts', idx)}
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
                onClick={() => setShowAddFontDialog('primaryFonts')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Font
              </Button>
            </div>
          </div>

          {/* Secondary Fonts */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">
              Secondary Fonts
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.secondaryFonts?.map((font, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                  <Type className="h-3 w-3 mr-1" />
                  {font}
                  <button
                    onClick={() => handleArrayItemRemove('secondaryFonts', idx)}
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
                onClick={() => setShowAddFontDialog('secondaryFonts')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Font
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Secondary Color Dialog */}
      <Dialog open={showAddColorDialog} onOpenChange={setShowAddColorDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add Secondary Color</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Add a new color to your brand palette
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                Color Name
              </label>
              <Input
                key="color-name-input"
                placeholder="e.g., Accent Blue, Light Gray"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer"
                />
                <Input
                  key="color-hex-input"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddColorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSecondaryColor} disabled={!newColorName.trim()}>
              Add Color
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Font Dialog */}
      <Dialog open={showAddFontDialog !== null} onOpenChange={() => setShowAddFontDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Add {showAddFontDialog === 'primaryFonts' ? 'Primary' : 'Secondary'} Font
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Add a font to your brand typography
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              key={`${showAddFontDialog}-font-input`}
              placeholder="e.g., Roboto, Open Sans, Montserrat"
              value={newFontValue}
              onChange={(e) => setNewFontValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddFont();
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddFontDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddFont} disabled={!newFontValue.trim()}>
              Add Font
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
