"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Edit2, X, Check, Plus, Users, Target, TrendingUp, Heart, AlertCircle, MessageSquare, ShoppingBag, Shield, UserCircle, Briefcase, MapPin, DollarSign, GraduationCap, Calendar } from "lucide-react";

export default function BrandAudienceSection() {
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
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder={placeholder}
                className="min-h-[100px]"
                autoFocus
              />
            ) : (
              <Input
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
      {/* Customer Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-sky-blue" />
            Customer Personas
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Detailed profiles of your ideal customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {brand?.customerPersonas?.map((persona, idx) => (
              <div key={idx} className="p-6 bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-900/10 dark:to-purple-900/10 border-2 border-sky-200 dark:border-sky-800/30 rounded-lg space-y-4">
                {/* Persona Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-sky-blue" />
                      {persona.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{persona.description}</p>
                  </div>
                  <button
                    onClick={() => handleArrayItemRemove('customerPersonas', idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Demographics */}
                {persona.demographics && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      Demographics
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {persona.demographics.age && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Age:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{persona.demographics.age}</span>
                        </div>
                      )}
                      {persona.demographics.income && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Income:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{persona.demographics.income}</span>
                        </div>
                      )}
                      {persona.demographics.education && (
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Education:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{persona.demographics.education}</span>
                        </div>
                      )}
                      {persona.demographics.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{persona.demographics.location}</span>
                        </div>
                      )}
                    </div>
                    {persona.demographics.occupation && (
                      <div className="flex items-start gap-2 text-sm mt-2">
                        <Briefcase className="h-3.5 w-3.5 text-gray-500 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">Occupation:</span>
                        <span className="text-gray-900 dark:text-white font-medium flex-1">{persona.demographics.occupation}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Psychographics */}
                {persona.psychographics && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                      Psychographics
                    </h4>

                    {/* Interests */}
                    {persona.psychographics.interests && persona.psychographics.interests.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Interests</span>
                        <div className="flex flex-wrap gap-1.5">
                          {persona.psychographics.interests.map((interest, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Values */}
                    {persona.psychographics.values && persona.psychographics.values.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Values</span>
                        <div className="flex flex-wrap gap-1.5">
                          {persona.psychographics.values.map((value, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifestyle */}
                    {persona.psychographics.lifestyle && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Lifestyle</span>
                        <p className="text-sm text-gray-900 dark:text-white">{persona.psychographics.lifestyle}</p>
                      </div>
                    )}

                    {/* Personality */}
                    {persona.psychographics.personality && persona.psychographics.personality.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Personality Traits</span>
                        <div className="flex flex-wrap gap-1.5">
                          {persona.psychographics.personality.map((trait, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Shopping Behavior */}
                {persona.shoppingBehavior && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-green-500" />
                      Shopping Behavior
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {persona.shoppingBehavior.frequency && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Purchase Frequency:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{persona.shoppingBehavior.frequency}</p>
                        </div>
                      )}
                      {persona.shoppingBehavior.averageOrderValue && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Average Order Value:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{persona.shoppingBehavior.averageOrderValue}</p>
                        </div>
                      )}
                    </div>

                    {/* Preferred Channels */}
                    {persona.shoppingBehavior.preferredChannels && persona.shoppingBehavior.preferredChannels.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Preferred Channels</span>
                        <div className="flex flex-wrap gap-1.5">
                          {persona.shoppingBehavior.preferredChannels.map((channel, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Decision Factors */}
                    {persona.shoppingBehavior.decisionFactors && persona.shoppingBehavior.decisionFactors.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Decision Factors</span>
                        <ul className="space-y-1">
                          {persona.shoppingBehavior.decisionFactors.map((factor, i) => (
                            <li key={i} className="text-sm text-gray-900 dark:text-white flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add New Persona Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('customerPersonas')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Customer Persona
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Target Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-blue" />
            Target Demographics
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Define your ideal customer demographics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Age Groups */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Age Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.targetAudienceAge?.map((age, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-300 dark:border-purple-800">
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
                Add Age Group
              </Button>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Gender Focus
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.targetAudienceGender?.map((gender, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-300 dark:border-blue-800">
                  {gender}
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
                Add Gender
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Pain Points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Customer Pain Points
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Problems and frustrations your customers experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.customerPainPoints?.map((pain, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-lg group hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-900 dark:text-white">{pain}</p>
                <button
                  onClick={() => handleArrayItemRemove('customerPainPoints', idx)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('customerPainPoints')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Pain Point
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Aspirations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Customer Aspirations
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Goals and desires your customers want to achieve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.customerAspirations?.map((aspiration, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg group hover:border-green-300 dark:hover:border-green-700 transition-colors">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-900 dark:text-white">{aspiration}</p>
                <button
                  onClick={() => handleArrayItemRemove('customerAspirations', idx)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('customerAspirations')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Aspiration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Fears */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Customer Fears
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Concerns and worries that prevent purchase decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brand?.customerFears?.map((fear, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg group hover:border-red-300 dark:hover:border-red-700 transition-colors">
                <Shield className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-900 dark:text-white">{fear}</p>
                <button
                  onClick={() => handleArrayItemRemove('customerFears', idx)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog('customerFears')}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Fear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emotional Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Emotional Triggers
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Emotions that drive customer decision-making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {brand?.emotionalTriggers?.map((trigger, idx) => (
              <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-200 dark:from-pink-900/20 dark:to-rose-900/20 dark:text-pink-300 dark:border-pink-800">
                <Heart className="h-3 w-3 mr-1" />
                {trigger}
                <button
                  onClick={() => handleArrayItemRemove('emotionalTriggers', idx)}
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
              onClick={() => setShowAddDialog('emotionalTriggers')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Trigger
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            Customer Language
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            How your customers talk about your products and category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keywords */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Keywords
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.customerLanguage?.keywords?.map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800">
                  {keyword}
                  <button
                    onClick={() => {
                      const newKeywords = brand.customerLanguage.keywords.filter((_, i) => i !== idx);
                      handleFieldSave('customerLanguage', { ...brand.customerLanguage, keywords: newKeywords });
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

          {/* Phrases */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Common Phrases
            </label>
            <div className="space-y-2">
              {brand?.customerLanguage?.phrases?.map((phrase, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded">
                  <p className="flex-1 text-sm text-gray-900 dark:text-white italic">"{phrase}"</p>
                  <button
                    onClick={() => {
                      const newPhrases = brand.customerLanguage.phrases.filter((_, i) => i !== idx);
                      handleFieldSave('customerLanguage', { ...brand.customerLanguage, phrases: newPhrases });
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog('customerLanguage.phrases')}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Phrase
              </Button>
            </div>
          </div>

          {/* Avoid Words */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Words to Avoid
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.customerLanguage?.avoidWords?.map((word, idx) => (
                <Badge key={idx} variant="destructive" className="px-3 py-1.5">
                  {word}
                  <button
                    onClick={() => {
                      const newAvoidWords = brand.customerLanguage.avoidWords.filter((_, i) => i !== idx);
                      handleFieldSave('customerLanguage', { ...brand.customerLanguage, avoidWords: newAvoidWords });
                    }}
                    className="ml-2 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setShowAddDialog('customerLanguage.avoidWords')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Word to Avoid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buying Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-500" />
            Buying Behavior
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Understanding customer purchase patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buying Motivations */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Buying Motivations
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.buyingMotivations?.map((motivation, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                  {motivation}
                  <button
                    onClick={() => handleArrayItemRemove('buyingMotivations', idx)}
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
                onClick={() => setShowAddDialog('buyingMotivations')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Motivation
              </Button>
            </div>
          </div>

          {/* Purchase Barriers */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
              Purchase Barriers
            </label>
            <div className="flex flex-wrap gap-2">
              {brand?.purchaseBarriers?.map((barrier, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1.5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
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
                className="h-8"
                onClick={() => setShowAddDialog('purchaseBarriers')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Barrier
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
              Add {showAddDialog?.split('.').pop().split(/(?=[A-Z])/).join(' ')}
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
