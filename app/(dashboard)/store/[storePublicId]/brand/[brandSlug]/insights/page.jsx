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
import { 
  Edit2, X, Check, Plus, User, Users, Heart, Brain, 
  Shield, Sparkles, Target, Lightbulb, AlertCircle, Star,
  TrendingUp, ShoppingCart, DollarSign, XCircle, Zap, ShieldCheck, Clock
} from "lucide-react";

export default function BrandInsightsPage() {
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

  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [newPersona, setNewPersona] = useState({
    name: '',
    age: '',
    occupation: '',
    goals: [],
    challenges: [],
    bio: ''
  });
  const [tempGoal, setTempGoal] = useState('');
  const [tempChallenge, setTempChallenge] = useState('');


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-gray dark:text-gray-400">Loading customer insights...</p>
        </div>
      </div>
    );
  }

  const handleAddPersona = () => {
    if (newPersona.name && newPersona.age && newPersona.occupation) {
      setBrand(prev => ({
        ...prev,
        customerPersonas: [...(prev.customerPersonas || []), newPersona]
      }));
      setHasChanges(true);
      setShowPersonaDialog(false);
      setNewPersona({
        name: '',
        age: '',
        occupation: '',
        goals: [],
        challenges: [],
        bio: ''
      });
    }
  };

  const handleRemovePersona = (index) => {
    setBrand(prev => ({
      ...prev,
      customerPersonas: prev.customerPersonas?.filter((_, i) => i !== index) || []
    }));
    setHasChanges(true);
  };

  const addGoal = () => {
    if (tempGoal.trim()) {
      setNewPersona(prev => ({
        ...prev,
        goals: [...prev.goals, tempGoal.trim()]
      }));
      setTempGoal('');
    }
  };

  const addChallenge = () => {
    if (tempChallenge.trim()) {
      setNewPersona(prev => ({
        ...prev,
        challenges: [...prev.challenges, tempChallenge.trim()]
      }));
      setTempChallenge('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Personas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Customer Personas</CardTitle>
              <CardDescription className="dark:text-gray-400">Detailed profiles of your ideal customers</CardDescription>
            </div>
            <Button 
              onClick={() => setShowPersonaDialog(true)}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Persona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {brand?.customerPersonas?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {brand.customerPersonas.map((persona, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-sky-blue dark:hover:border-sky-blue transition-colors relative group bg-white dark:bg-gray-800">
                  <button
                    onClick={() => handleRemovePersona(idx)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                  
                  {/* Persona Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-full flex items-center justify-center">
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-gray dark:text-white">{persona.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {persona.demographics?.age || persona.age}, {persona.demographics?.occupation || persona.occupation}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {(persona.description || persona.bio) && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {persona.description || persona.bio}
                    </p>
                  )}

                  {/* Demographics */}
                  {persona.demographics && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-gray dark:text-gray-200 mb-2 uppercase tracking-wide">Demographics</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {persona.demographics.age && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Age:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{persona.demographics.age}</span>
                          </div>
                        )}
                        {persona.demographics.income && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Income:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{persona.demographics.income}</span>
                          </div>
                        )}
                        {persona.demographics.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Location:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{persona.demographics.location}</span>
                          </div>
                        )}
                        {persona.demographics.education && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Education:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{persona.demographics.education}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Psychographics */}
                  {persona.psychographics && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-gray dark:text-gray-200 mb-2 uppercase tracking-wide">Psychographics</h4>
                      
                      {persona.psychographics.interests?.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Interests</h5>
                          <div className="flex flex-wrap gap-1">
                            {persona.psychographics.interests.map((interest, iIdx) => (
                              <span key={iIdx} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-800/30">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {persona.psychographics.values?.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Values</h5>
                          <div className="flex flex-wrap gap-1">
                            {persona.psychographics.values.map((value, vIdx) => (
                              <span key={vIdx} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-full border border-purple-200 dark:border-purple-800/30">
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {persona.psychographics.personality?.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Personality</h5>
                          <div className="flex flex-wrap gap-1">
                            {persona.psychographics.personality.map((trait, pIdx) => (
                              <span key={pIdx} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full border border-green-200 dark:border-green-800/30">
                                {trait}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shopping Behavior */}
                  {persona.shoppingBehavior && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-gray dark:text-gray-200 mb-2 uppercase tracking-wide">Shopping Behavior</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {persona.shoppingBehavior.frequency && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">{persona.shoppingBehavior.frequency}</span>
                          </div>
                        )}
                        {persona.shoppingBehavior.averageOrderValue && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Avg Order:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{persona.shoppingBehavior.averageOrderValue}</span>
                          </div>
                        )}
                        {persona.shoppingBehavior.preferredChannels?.length > 0 && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Channels:</span>
                            <div className="flex flex-wrap gap-1">
                              {persona.shoppingBehavior.preferredChannels.map((channel, chIdx) => (
                                <span key={chIdx} className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded border border-orange-200 dark:border-orange-800/30">
                                  {channel}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legacy Goals & Challenges (fallback) */}
                  <div className="space-y-3">
                    {persona.goals?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Goals</h5>
                        <div className="space-y-1">
                          {persona.goals.map((goal, gIdx) => (
                            <div key={gIdx} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                              <Target className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {goal}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {persona.challenges?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Challenges</h5>
                        <div className="space-y-1">
                          {persona.challenges.map((challenge, cIdx) => (
                            <div key={cIdx} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                              <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                              {challenge}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No customer personas defined yet</p>
              <p className="text-xs mt-1">Click "Add Persona" to create your first customer profile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Barriers & Customer Fears */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Purchase Barriers</CardTitle>
            <CardDescription className="dark:text-gray-400">Main obstacles preventing customers from buying</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brand?.purchaseBarriers?.map((barrier, idx) => {
                const getBarrierIcon = (barrier) => {
                  const lowerBarrier = barrier.toLowerCase();
                  if (lowerBarrier.includes('price') || lowerBarrier.includes('cost')) {
                    return <DollarSign className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />;
                  } else if (lowerBarrier.includes('skeptic') || lowerBarrier.includes('trust')) {
                    return <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />;
                  } else if (lowerBarrier.includes('stigma') || lowerBarrier.includes('organ')) {
                    return <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />;
                  }
                  return <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />;
                };

                return (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30 group">
                    {getBarrierIcon(barrier)}
                    <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium capitalize">{barrier.replace(/-/g, ' ')}</span>
                    </p>
                    <button
                      onClick={() => handleArrayItemRemove('purchaseBarriers', idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const barrier = prompt("Enter purchase barrier:");
                  if (barrier) handleArrayItemAdd('purchaseBarriers', barrier);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Barrier
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Customer Fears</CardTitle>
            <CardDescription className="dark:text-gray-400">Common concerns that prevent purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brand?.customerFears?.map((fear, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30 group">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{fear}</p>
                  <button
                    onClick={() => handleArrayItemRemove('customerFears', idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                  const fear = prompt("Enter customer fear or concern:");
                  if (fear) handleArrayItemAdd('customerFears', fear);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Fear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Customer Journey Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Customer Journey Insights</CardTitle>
          <CardDescription className="dark:text-gray-400">Deep understanding of customer decision-making process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Primary Discovery Channel</label>
            {editingField === 'primaryDiscoveryChannel' ? (
              <div className="flex gap-2">
                <Select value={tempValue} onValueChange={(value) => setTempValue(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="search-engines">Search Engines</SelectItem>
                    <SelectItem value="word-of-mouth">Word of Mouth</SelectItem>
                    <SelectItem value="influencers">Influencers</SelectItem>
                    <SelectItem value="email-marketing">Email Marketing</SelectItem>
                    <SelectItem value="paid-ads">Paid Advertising</SelectItem>
                    <SelectItem value="content-marketing">Content Marketing</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => handleFieldSave('primaryDiscoveryChannel')} className="bg-green-500 hover:bg-green-600">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" 
                   onClick={() => handleFieldEdit('primaryDiscoveryChannel', brand?.primaryDiscoveryChannel || 'social-media')}>
                <p className="text-slate-gray dark:text-white font-medium">
                  {brand?.primaryDiscoveryChannel?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Social Media'}
                </p>
                <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-sky-blue mt-2" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Decision Factors</label>
              <div className="space-y-2">
                {brand?.customerPersonas?.[0]?.shoppingBehavior?.decisionFactors?.length > 0 ? (
                  brand.customerPersonas[0].shoppingBehavior.decisionFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{factor}</span>
                    </div>
                  ))
                ) : brand?.decisionFactors?.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <Lightbulb className="h-3 w-3 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{factor}</span>
                    <button
                      onClick={() => handleArrayItemRemove('decisionFactors', idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {!brand?.customerPersonas?.[0]?.shoppingBehavior?.decisionFactors?.length && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const factor = prompt("Enter decision factor:");
                      if (factor) handleArrayItemAdd('decisionFactors', factor);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Factor
                  </Button>
                )}
              </div>
            </div>

          </div>

          {/* Enhanced Journey Insights */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-semibold text-slate-gray dark:text-white mb-4">Advanced Journey Mapping</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchase Triggers */}
              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Purchase Triggers</label>
                <div className="space-y-2">
                  {brand?.customerJourneyInsights?.purchaseTriggers?.map((trigger, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                      <Zap className="h-3 w-3 text-yellow-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{trigger}</span>
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
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const trigger = prompt("Enter purchase trigger:");
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

              {/* Objection Handlers */}
              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Objection Handlers</label>
                <div className="space-y-2">
                  {brand?.customerJourneyInsights?.objectionHandlers?.map((handler, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800/30">
                      <Shield className="h-3 w-3 text-purple-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{handler}</span>
                      <button
                        onClick={() => {
                          setBrand(prev => ({
                            ...prev,
                            customerJourneyInsights: {
                              ...prev.customerJourneyInsights,
                              objectionHandlers: prev.customerJourneyInsights?.objectionHandlers?.filter((_, i) => i !== idx) || []
                            }
                          }));
                          setHasChanges(true);
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
                    className="w-full"
                    onClick={() => {
                      const handler = prompt("Enter objection handler:");
                      if (handler) {
                        setBrand(prev => ({
                          ...prev,
                          customerJourneyInsights: {
                            ...prev.customerJourneyInsights,
                            objectionHandlers: [...(prev.customerJourneyInsights?.objectionHandlers || []), handler]
                          }
                        }));
                        setHasChanges(true);
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Handler
                  </Button>
                </div>
              </div>

              {/* Risk Reducers */}
              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Risk Reducers</label>
                <div className="space-y-2">
                  {brand?.customerJourneyInsights?.riskReducers?.map((reducer, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <ShieldCheck className="h-3 w-3 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{reducer}</span>
                      <button
                        onClick={() => {
                          setBrand(prev => ({
                            ...prev,
                            customerJourneyInsights: {
                              ...prev.customerJourneyInsights,
                              riskReducers: prev.customerJourneyInsights?.riskReducers?.filter((_, i) => i !== idx) || []
                            }
                          }));
                          setHasChanges(true);
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
                    className="w-full"
                    onClick={() => {
                      const reducer = prompt("Enter risk reducer:");
                      if (reducer) {
                        setBrand(prev => ({
                          ...prev,
                          customerJourneyInsights: {
                            ...prev.customerJourneyInsights,
                            riskReducers: [...(prev.customerJourneyInsights?.riskReducers || []), reducer]
                          }
                        }));
                        setHasChanges(true);
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Reducer
                  </Button>
                </div>
              </div>

              {/* Urgency Creators */}
              <div>
                <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Urgency Creators</label>
                <div className="space-y-2">
                  {brand?.customerJourneyInsights?.urgencyCreators?.map((creator, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30">
                      <Clock className="h-3 w-3 text-red-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{creator}</span>
                      <button
                        onClick={() => {
                          setBrand(prev => ({
                            ...prev,
                            customerJourneyInsights: {
                              ...prev.customerJourneyInsights,
                              urgencyCreators: prev.customerJourneyInsights?.urgencyCreators?.filter((_, i) => i !== idx) || []
                            }
                          }));
                          setHasChanges(true);
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
                    className="w-full"
                    onClick={() => {
                      const creator = prompt("Enter urgency creator:");
                      if (creator) {
                        setBrand(prev => ({
                          ...prev,
                          customerJourneyInsights: {
                            ...prev.customerJourneyInsights,
                            urgencyCreators: [...(prev.customerJourneyInsights?.urgencyCreators || []), creator]
                          }
                        }));
                        setHasChanges(true);
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Creator
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Add Persona Dialog */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Create Customer Persona</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Define a detailed profile of your ideal customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-200">Name</label>
                <Input
                  placeholder="e.g., Sarah Miller"
                  value={newPersona.name}
                  onChange={(e) => setNewPersona(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-200">Age</label>
                <Input
                  placeholder="e.g., 28-35"
                  value={newPersona.age}
                  onChange={(e) => setNewPersona(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-200">Occupation</label>
                <Input
                  placeholder="e.g., Marketing Manager"
                  value={newPersona.occupation}
                  onChange={(e) => setNewPersona(prev => ({ ...prev, occupation: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block dark:text-gray-200">Bio</label>
              <Textarea
                placeholder="Brief description of this persona's lifestyle and values..."
                value={newPersona.bio}
                onChange={(e) => setNewPersona(prev => ({ ...prev, bio: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-200">Goals</label>
                <div className="space-y-2">
                  {newPersona.goals.map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded border border-green-200 dark:border-green-800/30 dark:text-gray-200">
                      <Target className="h-3 w-3 text-green-600" />
                      {goal}
                      <button
                        onClick={() => setNewPersona(prev => ({
                          ...prev,
                          goals: prev.goals.filter((_, i) => i !== idx)
                        }))}
                        className="ml-auto"
                      >
                        <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add goal..."
                      value={tempGoal}
                      onChange={(e) => setTempGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addGoal();
                        }
                      }}
                    />
                    <Button size="sm" onClick={addGoal}>Add</Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block dark:text-gray-200">Challenges</label>
                <div className="space-y-2">
                  {newPersona.challenges.map((challenge, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded border border-orange-200 dark:border-orange-800/30 dark:text-gray-200">
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      {challenge}
                      <button
                        onClick={() => setNewPersona(prev => ({
                          ...prev,
                          challenges: prev.challenges.filter((_, i) => i !== idx)
                        }))}
                        className="ml-auto"
                      >
                        <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add challenge..."
                      value={tempChallenge}
                      onChange={(e) => setTempChallenge(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addChallenge();
                        }
                      }}
                    />
                    <Button size="sm" onClick={addChallenge}>Add</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowPersonaDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPersona}
              disabled={!newPersona.name || !newPersona.age || !newPersona.occupation}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              Create Persona
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}