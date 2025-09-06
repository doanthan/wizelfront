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
  Edit2, X, Check, Plus, TrendingUp, BarChart3, Users, Target, 
  Shield, Zap, Award, AlertCircle, ChevronRight, Eye,
  Leaf, ShieldCheck, Truck, Package, Star, Heart, Clock, CreditCard,
  Gift, Percent, RefreshCw, Lock, Globe, Headphones, BadgeCheck,
  Sparkles, Rocket, ThumbsUp, ShoppingCart, DollarSign, Tag,
  CheckCircle, Info, Settings, Box, Send, MapPin
} from "lucide-react";

export default function BrandAnalyticsPage() {
  const {
    brand,
    isLoading,
    editingField,
    tempValue,
    handleFieldEdit,
    handleFieldSave,
    setEditingField,
    setTempValue,
    setBrand,
    setHasChanges
  } = useBrand();

  const [showCompetitorDialog, setShowCompetitorDialog] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    website: '',
    strengths: [],
    weaknesses: [],
    differentiators: [],
    marketPosition: '',
    priceRange: ''
  });
  const [tempStrength, setTempStrength] = useState('');
  const [tempWeakness, setTempWeakness] = useState('');
  const [tempDifferentiator, setTempDifferentiator] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-neutral-gray dark:text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const handleAddCompetitor = () => {
    if (newCompetitor.name) {
      setBrand(prev => ({
        ...prev,
        competitors: [...(prev.competitors || []), newCompetitor]
      }));
      setHasChanges(true);
      setShowCompetitorDialog(false);
      setNewCompetitor({
        name: '',
        website: '',
        strengths: [],
        weaknesses: [],
        differentiators: [],
        marketPosition: '',
        priceRange: ''
      });
    }
  };

  const handleRemoveCompetitor = (index) => {
    setBrand(prev => ({
      ...prev,
      competitors: prev.competitors?.filter((_, i) => i !== index) || []
    }));
    setHasChanges(true);
  };

  const addStrength = () => {
    if (tempStrength.trim()) {
      setNewCompetitor(prev => ({
        ...prev,
        strengths: [...prev.strengths, tempStrength.trim()]
      }));
      setTempStrength('');
    }
  };

  const addWeakness = () => {
    if (tempWeakness.trim()) {
      setNewCompetitor(prev => ({
        ...prev,
        weaknesses: [...prev.weaknesses, tempWeakness.trim()]
      }));
      setTempWeakness('');
    }
  };

  const addDifferentiator = () => {
    if (tempDifferentiator.trim()) {
      setNewCompetitor(prev => ({
        ...prev,
        differentiators: [...prev.differentiators, tempDifferentiator.trim()]
      }));
      setTempDifferentiator('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Position */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-white">Market Position</CardTitle>
          <CardDescription className="dark:text-gray-400">Your brand's standing in the competitive landscape</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Market Position</label>
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <p className="text-slate-gray dark:text-white font-medium">
                    {brand?.marketPosition ? brand.marketPosition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-2 block">Competitive Pricing</label>
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-slate-gray dark:text-white font-medium">
                    {brand?.competitivePricing ? brand.competitivePricing.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Unique Features */}
          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Unique Features</label>
            <div className="space-y-2 mb-6">
              {brand?.uniqueFeatures?.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/30">
                  <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Competitive Advantages */}
          <div>
            <label className="text-sm font-medium text-slate-gray dark:text-gray-200 mb-3 block">Competitive Advantages</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brand?.competitiveAdvantages?.map((advantage, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30 group">
                  <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{advantage}</span>
                  <button
                    onClick={() => {
                      setBrand(prev => ({
                        ...prev,
                        competitiveAdvantages: prev.competitiveAdvantages?.filter((_, i) => i !== idx)
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
                className="h-[52px]"
                onClick={() => {
                  const advantage = prompt("Enter competitive advantage:");
                  if (advantage) {
                    setBrand(prev => ({
                      ...prev,
                      competitiveAdvantages: [...(prev.competitiveAdvantages || []), advantage]
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Advantage
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Competitor Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Competitor Analysis</CardTitle>
              <CardDescription className="dark:text-gray-400">Track and analyze your competition</CardDescription>
            </div>
            <Button 
              onClick={() => setShowCompetitorDialog(true)}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {brand?.competitors?.length > 0 ? (
            <div className="space-y-4">
              {brand.competitors.map((competitor, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:border-sky-blue transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-gray dark:text-white text-lg">{competitor.name}</h3>
                      {competitor.website && (
                        <a href={competitor.website} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-sky-blue hover:text-royal-blue flex items-center gap-1">
                          {competitor.website}
                          <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {competitor.priceRange || 'Mid-Range'}
                      </Badge>
                      <button
                        onClick={() => handleRemoveCompetitor(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                      <div className="space-y-1">
                        {competitor.strengths?.map((strength, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-sm text-gray-600">
                            <Zap className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-orange-700 mb-2">Weaknesses</h4>
                      <div className="space-y-1">
                        {competitor.weaknesses?.map((weakness, wIdx) => (
                          <div key={wIdx} className="flex items-start gap-2 text-sm text-gray-600">
                            <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{weakness}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-2">Our Differentiators</h4>
                      <div className="space-y-1">
                        {competitor.differentiators?.map((diff, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-2 text-sm text-gray-600">
                            <Shield className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{diff}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {competitor.marketPosition && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Market Position:</span> {competitor.marketPosition}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No competitors added yet</p>
              <p className="text-xs mt-1">Click "Add Competitor" to start tracking competition</p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Market Opportunities & Threats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Market Opportunities</CardTitle>
            <CardDescription className="dark:text-gray-400">Potential growth areas with strategic planning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brand?.marketOpportunities?.map((opp, idx) => {
                const opportunity = typeof opp === 'string' ? { opportunity: opp } : opp;
                return (
                  <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30 group">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{opportunity.opportunity}</p>
                        {opportunity.impact && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Impact: {opportunity.impact}</p>
                        )}
                        {opportunity.timeframe && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">Timeframe: {opportunity.timeframe}</p>
                        )}
                        {opportunity.actionRequired && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Action: {opportunity.actionRequired}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setBrand(prev => ({
                            ...prev,
                            marketOpportunities: prev.marketOpportunities?.filter((_, i) => i !== idx)
                          }));
                          setHasChanges(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const opportunity = prompt("Enter market opportunity:");
                  if (opportunity) {
                    const impact = prompt("What's the potential impact? (e.g., High, Medium, Low):");
                    const timeframe = prompt("What's the timeframe? (e.g., Q1 2024, 6 months):");
                    const actionRequired = prompt("What action is required?:");
                    
                    setBrand(prev => ({
                      ...prev,
                      marketOpportunities: [...(prev.marketOpportunities || []), {
                        opportunity,
                        impact: impact || undefined,
                        timeframe: timeframe || undefined,
                        actionRequired: actionRequired || undefined
                      }]
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Opportunity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">Market Threats</CardTitle>
            <CardDescription className="dark:text-gray-400">Risks to monitor and mitigate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brand?.marketThreats?.map((thr, idx) => {
                const threat = typeof thr === 'string' ? { threat: thr } : thr;
                return (
                  <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30 group">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{threat.threat}</p>
                        {threat.severity && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Severity: {threat.severity}</p>
                        )}
                        {threat.likelihood && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">Likelihood: {threat.likelihood}</p>
                        )}
                        {threat.mitigationStrategy && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Mitigation: {threat.mitigationStrategy}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setBrand(prev => ({
                            ...prev,
                            marketThreats: prev.marketThreats?.filter((_, i) => i !== idx)
                          }));
                          setHasChanges(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const threat = prompt("Enter market threat:");
                  if (threat) {
                    const severity = prompt("What's the severity? (e.g., Critical, High, Medium, Low):");
                    const likelihood = prompt("What's the likelihood? (e.g., Very Likely, Likely, Possible, Unlikely):");
                    const mitigationStrategy = prompt("What's the mitigation strategy?:");
                    
                    setBrand(prev => ({
                      ...prev,
                      marketThreats: [...(prev.marketThreats || []), {
                        threat,
                        severity: severity || undefined,
                        likelihood: likelihood || undefined,
                        mitigationStrategy: mitigationStrategy || undefined
                      }]
                    }));
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Threat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Competitor Dialog */}
      <Dialog open={showCompetitorDialog} onOpenChange={setShowCompetitorDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>Track a competitor's strengths, weaknesses, and market position</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Competitor Name</label>
                <Input
                  placeholder="e.g., Nike, Adidas"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Website</label>
                <Input
                  placeholder="https://example.com"
                  value={newCompetitor.website}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <Select 
                  value={newCompetitor.priceRange} 
                  onValueChange={(value) => setNewCompetitor(prev => ({ ...prev, priceRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="mid-range">Mid-Range</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Market Position</label>
                <Input
                  placeholder="e.g., Market leader, challenger"
                  value={newCompetitor.marketPosition}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, marketPosition: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Strengths</label>
                <div className="space-y-2">
                  {newCompetitor.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-green-50 px-2 py-1 rounded">
                      <Zap className="h-3 w-3 text-green-600" />
                      <span className="truncate">{strength}</span>
                      <button
                        onClick={() => setNewCompetitor(prev => ({
                          ...prev,
                          strengths: prev.strengths.filter((_, i) => i !== idx)
                        }))}
                        className="ml-auto flex-shrink-0"
                      >
                        <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add strength..."
                      value={tempStrength}
                      onChange={(e) => setTempStrength(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addStrength();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={addStrength}>Add</Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Weaknesses</label>
                <div className="space-y-2">
                  {newCompetitor.weaknesses.map((weakness, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-orange-50 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      <span className="truncate">{weakness}</span>
                      <button
                        onClick={() => setNewCompetitor(prev => ({
                          ...prev,
                          weaknesses: prev.weaknesses.filter((_, i) => i !== idx)
                        }))}
                        className="ml-auto flex-shrink-0"
                      >
                        <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add weakness..."
                      value={tempWeakness}
                      onChange={(e) => setTempWeakness(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addWeakness();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={addWeakness}>Add</Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Our Differentiators</label>
                <div className="space-y-2">
                  {newCompetitor.differentiators?.map((diff, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-blue-50 px-2 py-1 rounded">
                      <Shield className="h-3 w-3 text-blue-600" />
                      <span className="truncate">{diff}</span>
                      <button
                        onClick={() => setNewCompetitor(prev => ({
                          ...prev,
                          differentiators: prev.differentiators.filter((_, i) => i !== idx)
                        }))}
                        className="ml-auto flex-shrink-0"
                      >
                        <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="How we differ..."
                      value={tempDifferentiator}
                      onChange={(e) => setTempDifferentiator(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDifferentiator();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={addDifferentiator}>Add</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowCompetitorDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCompetitor}
              disabled={!newCompetitor.name}
              className="bg-sky-blue hover:bg-royal-blue text-white"
            >
              Add Competitor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}