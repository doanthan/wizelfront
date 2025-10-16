"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Shield, Award, Star, Quote, Trophy, Newspaper, X, Plus, Edit2, Check } from "lucide-react";

export default function BrandTrustSection() {
  const {
    brand,
    editingField,
    tempValue,
    handleFieldEdit,
    handleFieldSave,
    handleArrayItemAdd,
    handleArrayItemRemove,
    setEditingField,
    setTempValue,
    setBrand
  } = useBrand();

  const [showAddDialog, setShowAddDialog] = useState(null);
  const [newItemValue, setNewItemValue] = useState("");
  const [newTestimonial, setNewTestimonial] = useState("");

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      handleArrayItemAdd(showAddDialog, newItemValue.trim());
      setShowAddDialog(null);
      setNewItemValue("");
    }
  };

  const handleAddTestimonial = () => {
    if (newTestimonial.trim()) {
      const currentTestimonials = brand?.socialProof?.testimonials || [];
      setBrand(prev => ({
        ...prev,
        socialProof: {
          ...prev.socialProof,
          testimonials: [...currentTestimonials, newTestimonial.trim()]
        }
      }));
      setShowAddDialog(null);
      setNewTestimonial("");
    }
  };

  const removeTestimonial = (idx) => {
    const newTestimonials = brand.socialProof.testimonials.filter((_, i) => i !== idx);
    setBrand(prev => ({
      ...prev,
      socialProof: {
        ...prev.socialProof,
        testimonials: newTestimonials
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Social Proof Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            Social Proof Overview
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Review statistics and social validation metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {brand?.socialProof?.reviewCount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {brand?.socialProof?.averageRating?.toFixed(1) || '0.0'}
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(brand?.socialProof?.averageRating || 0)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Quote className="h-5 w-5 text-indigo-500" />
            Customer Testimonials
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Featured customer reviews and testimonials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brand?.socialProof?.testimonials?.map((testimonial, idx) => (
              <div key={idx} className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-lg group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <Quote className="h-5 w-5 text-indigo-400 mb-2" />
                <p className="text-sm text-gray-900 dark:text-white italic leading-relaxed mb-3">
                  "{testimonial}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <button
                    onClick={() => removeTestimonial(idx)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('testimonials')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Testimonial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Trust Badges
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Trust signals and certifications displayed to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brand?.trustBadges?.map((badge, idx) => (
              <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg group hover:border-green-300 dark:hover:border-green-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{badge.text}</p>
                    </div>
                    {badge.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">{badge.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleArrayItemRemove('trustBadges', idx)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('trustBadges')}
              className="h-auto min-h-[60px]"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Trust Badge
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Features & Awards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-purple-500" />
            Media Features & Awards
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Press mentions, awards, and recognitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {brand?.socialProof?.mediaFeatures?.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg group hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                <Newspaper className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-900 dark:text-white">{feature}</p>
                <button
                  onClick={() => {
                    const newFeatures = brand.socialProof.mediaFeatures.filter((_, i) => i !== idx);
                    setBrand(prev => ({
                      ...prev,
                      socialProof: {
                        ...prev.socialProof,
                        mediaFeatures: newFeatures
                      }
                    }));
                  }}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('mediaFeatures')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Media Feature
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Celebrity Endorsements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Celebrity Endorsements
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Notable figures and influencers who endorse your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {brand?.socialProof?.celebrityEndorsements?.map((celebrity, idx) => (
              <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:text-amber-300 dark:border-amber-800">
                <Trophy className="h-3 w-3 mr-1" />
                {celebrity}
                <button
                  onClick={() => {
                    const newEndorsements = brand.socialProof.celebrityEndorsements.filter((_, i) => i !== idx);
                    setBrand(prev => ({
                      ...prev,
                      socialProof: {
                        ...prev.socialProof,
                        celebrityEndorsements: newEndorsements
                      }
                    }));
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
              onClick={() => setShowAddDialog('celebrityEndorsements')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Celebrity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog !== null} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Add {showAddDialog === 'testimonials' ? 'Testimonial' :
                   showAddDialog === 'mediaFeatures' ? 'Media Feature' :
                   showAddDialog === 'celebrityEndorsements' ? 'Celebrity Endorsement' :
                   showAddDialog === 'trustBadges' ? 'Trust Badge' : 'Item'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {showAddDialog === 'testimonials' && 'Add a customer testimonial or review'}
              {showAddDialog === 'mediaFeatures' && 'Add a media mention, award, or press feature'}
              {showAddDialog === 'celebrityEndorsements' && 'Add a celebrity or influencer who endorses your brand'}
              {showAddDialog === 'trustBadges' && 'Add a trust badge or certification'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showAddDialog === 'testimonials' ? (
              <Textarea
                placeholder="Enter customer testimonial..."
                value={newTestimonial}
                onChange={(e) => setNewTestimonial(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
            ) : (
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
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={showAddDialog === 'testimonials' ? handleAddTestimonial : handleAddItem}
              disabled={showAddDialog === 'testimonials' ? !newTestimonial.trim() : !newItemValue.trim()}
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
