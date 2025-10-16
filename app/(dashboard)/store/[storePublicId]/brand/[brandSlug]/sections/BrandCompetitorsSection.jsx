"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Target, TrendingUp, TrendingDown, Zap, ExternalLink, X, Plus, Globe } from "lucide-react";

export default function BrandCompetitorsSection() {
  const { brand, setBrand } = useBrand();

  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    url: "",
    strengths: [],
    weaknesses: [],
    differentiators: []
  });
  const [newStrength, setNewStrength] = useState("");
  const [newWeakness, setNewWeakness] = useState("");
  const [newDifferentiator, setNewDifferentiator] = useState("");

  const handleAddCompetitor = () => {
    if (newCompetitor.name.trim()) {
      const currentCompetitors = brand?.competitors || [];
      setBrand(prev => ({
        ...prev,
        competitors: [...currentCompetitors, newCompetitor]
      }));
      setShowAddCompetitor(false);
      setNewCompetitor({
        name: "",
        url: "",
        strengths: [],
        weaknesses: [],
        differentiators: []
      });
    }
  };

  const removeCompetitor = (idx) => {
    const newCompetitors = brand.competitors.filter((_, i) => i !== idx);
    setBrand(prev => ({
      ...prev,
      competitors: newCompetitors
    }));
  };

  return (
    <div className="space-y-6">
      {/* Competitors Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-red-500" />
            Competitive Analysis
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Track and analyze your main competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {brand?.competitors?.map((competitor, idx) => (
              <div key={idx} className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                {/* Competitor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{competitor.name}</h3>
                      {competitor.url && (
                        <a
                          href={competitor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-blue hover:text-royal-blue"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {competitor.url && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{competitor.url}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeCompetitor(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Strengths */}
                {competitor.strengths && competitor.strengths.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Strengths</h4>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      {competitor.strengths.map((strength, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Weaknesses</h4>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      {competitor.weaknesses.map((weakness, wIdx) => (
                        <div key={wIdx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{weakness}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Your Differentiators */}
                {competitor.differentiators && competitor.differentiators.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">How You're Different</h4>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      {competitor.differentiators.map((diff, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{diff}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {brand?.competitors?.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No competitors added yet</p>
                <p className="text-xs mt-1">Click "Add Competitor" to start tracking your competition</p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCompetitor(true)}
              className="w-full mt-4"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Competitor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Competitor Dialog */}
      <Dialog open={showAddCompetitor} onOpenChange={setShowAddCompetitor}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Add Competitor
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Add a competitor and analyze their strengths, weaknesses, and how you differentiate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">
                  Competitor Name *
                </label>
                <Input
                  placeholder="e.g., Competitor Inc."
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">
                  Website URL
                </label>
                <Input
                  placeholder="https://competitor.com"
                  value={newCompetitor.url}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, url: e.target.value })}
                />
              </div>
            </div>

            {/* Strengths */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Their Strengths
              </label>
              <div className="space-y-2">
                {newCompetitor.strengths.map((strength, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{strength}</p>
                    <button
                      onClick={() => {
                        const newStrengths = newCompetitor.strengths.filter((_, i) => i !== idx);
                        setNewCompetitor({ ...newCompetitor, strengths: newStrengths });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a strength..."
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newStrength.trim()) {
                        setNewCompetitor({
                          ...newCompetitor,
                          strengths: [...newCompetitor.strengths, newStrength.trim()]
                        });
                        setNewStrength("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newStrength.trim()) {
                        setNewCompetitor({
                          ...newCompetitor,
                          strengths: [...newCompetitor.strengths, newStrength.trim()]
                        });
                        setNewStrength("");
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Their Weaknesses
              </label>
              <div className="space-y-2">
                {newCompetitor.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{weakness}</p>
                    <button
                      onClick={() => {
                        const newWeaknesses = newCompetitor.weaknesses.filter((_, i) => i !== idx);
                        setNewCompetitor({ ...newCompetitor, weaknesses: newWeaknesses });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a weakness..."
                    value={newWeakness}
                    onChange={(e) => setNewWeakness(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newWeakness.trim()) {
                        setNewCompetitor({
                          ...newCompetitor,
                          weaknesses: [...newCompetitor.weaknesses, newWeakness.trim()]
                        });
                        setNewWeakness("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newWeakness.trim()) {
                        setNewCompetitor({
                          ...newCompetitor,
                          weaknesses: [...newCompetitor.weaknesses, newWeakness.trim()]
                        });
                        setNewWeakness("");
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Differentiators */}
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                How You're Different
              </label>
              <div className="space-y-2">
                {newCompetitor.differentiators.map((diff, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{diff}</p>
                    <button
                      onClick={() => {
                        const newDifferentiators = newCompetitor.differentiators.filter((_, i) => i !== idx);
                        setNewCompetitor({ ...newCompetitor, differentiators: newDifferentiators });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a differentiator..."
                    value={newDifferentiator}
                    onChange={(e) => setNewDifferentiator(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDifferentiator.trim()) {
                        setNewCompetitor({
                          ...newCompetitor,
                          differentiators: [...newCompetitor.differentiators, newDifferentiator.trim()]
                        });
                        setNewDifferentiator("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newDifferentiator.trim()) {
                        setNewCompetitor({
                          ...newCompetitor,
                          differentiators: [...newCompetitor.differentiators, newDifferentiator.trim()]
                        });
                        setNewDifferentiator("");
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowAddCompetitor(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCompetitor} disabled={!newCompetitor.name.trim()}>
              Add Competitor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
