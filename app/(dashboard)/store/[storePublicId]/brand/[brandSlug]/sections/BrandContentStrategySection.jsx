"use client";

import React, { useState } from "react";
import { useBrand } from "@/app/hooks/use-brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import {
  Lightbulb,
  BookOpen,
  Calendar,
  BarChart3,
  Target,
  Newspaper,
  TrendingUp,
  X,
  Plus,
  Edit2,
  Check,
  Sparkles,
  Clock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ScrollArea } from "@/app/components/ui/scroll-area";

export default function BrandContentStrategySection() {
  const {
    brand,
    editingField,
    tempValue,
    handleFieldEdit,
    handleFieldSave,
    setEditingField,
    setTempValue,
    setBrand
  } = useBrand();

  const [showAddTheme, setShowAddTheme] = useState(false);
  const [showAddPillar, setShowAddPillar] = useState(false);
  const [showAddStoryAngle, setShowAddStoryAngle] = useState(false);

  const [newTheme, setNewTheme] = useState({
    theme: "",
    description: "",
    topics: [],
    formats: [],
    frequency: ""
  });

  const [newPillar, setNewPillar] = useState({
    pillar: "",
    purpose: "",
    contentTypes: [],
    kpis: [],
    percentage: 0
  });

  const [newStoryAngle, setNewStoryAngle] = useState({
    angle: "",
    narrative: "",
    emotionalHook: "",
    callToAction: "",
    contentFormats: []
  });

  const [tempTopic, setTempTopic] = useState("");
  const [tempFormat, setTempFormat] = useState("");
  const [tempContentType, setTempContentType] = useState("");
  const [tempKpi, setTempKpi] = useState("");
  const [tempContentFormat, setTempContentFormat] = useState("");

  const handleAddTheme = () => {
    if (newTheme.theme.trim()) {
      const currentThemes = brand?.contentStrategy?.contentThemes || [];
      setBrand(prev => ({
        ...prev,
        contentStrategy: {
          ...prev.contentStrategy,
          contentThemes: [...currentThemes, newTheme]
        }
      }));
      setShowAddTheme(false);
      setNewTheme({ theme: "", description: "", topics: [], formats: [], frequency: "" });
    }
  };

  const handleAddPillar = () => {
    if (newPillar.pillar.trim()) {
      const currentPillars = brand?.contentStrategy?.contentPillars || [];
      setBrand(prev => ({
        ...prev,
        contentStrategy: {
          ...prev.contentStrategy,
          contentPillars: [...currentPillars, newPillar]
        }
      }));
      setShowAddPillar(false);
      setNewPillar({ pillar: "", purpose: "", contentTypes: [], kpis: [], percentage: 0 });
    }
  };

  const handleAddStoryAngle = () => {
    if (newStoryAngle.angle.trim()) {
      const currentAngles = brand?.contentStrategy?.storyAngles || [];
      setBrand(prev => ({
        ...prev,
        contentStrategy: {
          ...prev.contentStrategy,
          storyAngles: [...currentAngles, newStoryAngle]
        }
      }));
      setShowAddStoryAngle(false);
      setNewStoryAngle({ angle: "", narrative: "", emotionalHook: "", callToAction: "", contentFormats: [] });
    }
  };

  const removeTheme = (idx) => {
    const newThemes = brand.contentStrategy.contentThemes.filter((_, i) => i !== idx);
    setBrand(prev => ({
      ...prev,
      contentStrategy: { ...prev.contentStrategy, contentThemes: newThemes }
    }));
  };

  const removePillar = (idx) => {
    const newPillars = brand.contentStrategy.contentPillars.filter((_, i) => i !== idx);
    setBrand(prev => ({
      ...prev,
      contentStrategy: { ...prev.contentStrategy, contentPillars: newPillars }
    }));
  };

  const removeStoryAngle = (idx) => {
    const newAngles = brand.contentStrategy.storyAngles.filter((_, i) => i !== idx);
    setBrand(prev => ({
      ...prev,
      contentStrategy: { ...prev.contentStrategy, storyAngles: newAngles }
    }));
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

  const weeklyThemes = brand?.contentStrategy?.editorialCalendar?.weeklyThemes || {};

  return (
    <div className="space-y-6">
      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="themes">Content Themes</TabsTrigger>
          <TabsTrigger value="pillars">Content Pillars</TabsTrigger>
          <TabsTrigger value="calendar">Editorial Calendar</TabsTrigger>
          <TabsTrigger value="stories">Story Angles</TabsTrigger>
        </TabsList>

        {/* Content Themes Tab */}
        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Content Themes
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Main content themes that guide your content creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {brand?.contentStrategy?.contentThemes?.map((theme, idx) => (
                  <div key={idx} className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg">
                    {/* Theme Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{theme.theme}</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{theme.description}</p>
                      </div>
                      <button
                        onClick={() => removeTheme(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Topics */}
                    {theme.topics && theme.topics.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Topics:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {theme.topics.map((topic, tIdx) => (
                            <Badge key={tIdx} variant="secondary" className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formats */}
                    {theme.formats && theme.formats.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Formats:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {theme.formats.map((format, fIdx) => (
                            <Badge key={fIdx} variant="secondary" className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Frequency */}
                    {theme.frequency && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-200 dark:border-purple-800/30">
                        <Clock className="h-3 w-3 text-purple-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{theme.frequency}</span>
                      </div>
                    )}
                  </div>
                ))}

                {brand?.contentStrategy?.contentThemes?.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No content themes added yet</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTheme(true)}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Content Theme
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Pillars Tab */}
        <TabsContent value="pillars" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Content Pillars (HERO/HUB/HELP/HYGIENE)
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Strategic content buckets that define your content mix
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {brand?.contentStrategy?.contentPillars?.map((pillar, idx) => (
                  <div key={idx} className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                    {/* Pillar Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase">{pillar.pillar}</h3>
                          {pillar.percentage > 0 && (
                            <Badge className="bg-blue-500 text-white">{pillar.percentage}%</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{pillar.purpose}</p>
                      </div>
                      <button
                        onClick={() => removePillar(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Content Types */}
                    {pillar.contentTypes && pillar.contentTypes.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Content Types:</h4>
                        <ul className="space-y-1">
                          {pillar.contentTypes.map((type, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* KPIs */}
                    {pillar.kpis && pillar.kpis.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/30">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">KPIs:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {pillar.kpis.map((kpi, kIdx) => (
                            <Badge key={kIdx} variant="secondary" className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300">
                              {kpi}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {brand?.contentStrategy?.contentPillars?.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No content pillars added yet</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPillar(true)}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Content Pillar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editorial Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          {/* Weekly Themes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Weekly Content Themes
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Consistent weekly content schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(weeklyThemes).map(([day, description]) => (
                  <div key={day} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white capitalize mb-2">{day}</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Monthly Focus Areas
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Monthly content themes throughout the year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {brand?.contentStrategy?.editorialCalendar?.monthlyFocus?.map((focus, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white">{focus}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Seasonal Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Seasonal Opportunities
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Season-specific content strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brand?.contentStrategy?.editorialCalendar?.seasonalOpportunities?.map((season, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{season.season}</h4>

                    {season.themes && season.themes.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Themes:</p>
                        <ul className="space-y-0.5">
                          {season.themes.map((theme, tIdx) => (
                            <li key={tIdx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1">
                              <span>•</span> {theme}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {season.campaigns && season.campaigns.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Campaigns:</p>
                        <div className="flex flex-wrap gap-1">
                          {season.campaigns.map((campaign, cIdx) => (
                            <Badge key={cIdx} variant="secondary" className="px-2 py-0.5 text-xs">
                              {campaign}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Story Angles Tab */}
        <TabsContent value="stories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-indigo-500" />
                Story Angles
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Compelling narrative frameworks for your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {brand?.contentStrategy?.storyAngles?.map((story, idx) => (
                  <div key={idx} className="p-5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-lg">
                    {/* Story Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-1">{story.angle}</h3>
                      <button
                        onClick={() => removeStoryAngle(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Narrative */}
                    {story.narrative && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Narrative:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{story.narrative}</p>
                      </div>
                    )}

                    {/* Emotional Hook */}
                    {story.emotionalHook && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Emotional Hook:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">{story.emotionalHook}</p>
                      </div>
                    )}

                    {/* Call to Action */}
                    {story.callToAction && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Call to Action:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{story.callToAction}</p>
                      </div>
                    )}

                    {/* Content Formats */}
                    {story.contentFormats && story.contentFormats.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800/30">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Content Formats:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {story.contentFormats.map((format, fIdx) => (
                            <Badge key={fIdx} variant="secondary" className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {brand?.contentStrategy?.storyAngles?.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No story angles added yet</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStoryAngle(true)}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Story Angle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Theme Dialog */}
      <Dialog open={showAddTheme} onOpenChange={setShowAddTheme}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add Content Theme</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new content theme with topics and formats
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Theme Name *</label>
              <Input
                placeholder="e.g., Seed-to-Skin Journey"
                value={newTheme.theme}
                onChange={(e) => setNewTheme({ ...newTheme, theme: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Description</label>
              <Textarea
                placeholder="Describe the theme..."
                value={newTheme.description}
                onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Topics</label>
              <div className="space-y-2">
                {newTheme.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{topic}</p>
                    <button
                      onClick={() => {
                        const newTopics = newTheme.topics.filter((_, i) => i !== idx);
                        setNewTheme({ ...newTheme, topics: newTopics });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a topic..."
                    value={tempTopic}
                    onChange={(e) => setTempTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempTopic.trim()) {
                        setNewTheme({ ...newTheme, topics: [...newTheme.topics, tempTopic.trim()] });
                        setTempTopic("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (tempTopic.trim()) {
                        setNewTheme({ ...newTheme, topics: [...newTheme.topics, tempTopic.trim()] });
                        setTempTopic("");
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Formats</label>
              <div className="space-y-2">
                {newTheme.formats.map((format, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{format}</p>
                    <button
                      onClick={() => {
                        const newFormats = newTheme.formats.filter((_, i) => i !== idx);
                        setNewTheme({ ...newTheme, formats: newFormats });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a format..."
                    value={tempFormat}
                    onChange={(e) => setTempFormat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempFormat.trim()) {
                        setNewTheme({ ...newTheme, formats: [...newTheme.formats, tempFormat.trim()] });
                        setTempFormat("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (tempFormat.trim()) {
                        setNewTheme({ ...newTheme, formats: [...newTheme.formats, tempFormat.trim()] });
                        setTempFormat("");
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Frequency</label>
              <Input
                placeholder="e.g., Weekly, Bi-weekly, Monthly"
                value={newTheme.frequency}
                onChange={(e) => setNewTheme({ ...newTheme, frequency: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowAddTheme(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTheme} disabled={!newTheme.theme.trim()}>
              Add Theme
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pillar Dialog */}
      <Dialog open={showAddPillar} onOpenChange={setShowAddPillar}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add Content Pillar</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Define a content pillar (HERO, HUB, HELP, or HYGIENE)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Pillar Name *</label>
              <Input
                placeholder="e.g., HERO, HUB, HELP, HYGIENE"
                value={newPillar.pillar}
                onChange={(e) => setNewPillar({ ...newPillar, pillar: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Purpose</label>
              <Textarea
                placeholder="What is the purpose of this pillar?"
                value={newPillar.purpose}
                onChange={(e) => setNewPillar({ ...newPillar, purpose: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Content Mix %</label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 25"
                value={newPillar.percentage}
                onChange={(e) => setNewPillar({ ...newPillar, percentage: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Content Types</label>
              <div className="space-y-2">
                {newPillar.contentTypes.map((type, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{type}</p>
                    <button
                      onClick={() => {
                        const newTypes = newPillar.contentTypes.filter((_, i) => i !== idx);
                        setNewPillar({ ...newPillar, contentTypes: newTypes });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a content type..."
                    value={tempContentType}
                    onChange={(e) => setTempContentType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempContentType.trim()) {
                        setNewPillar({ ...newPillar, contentTypes: [...newPillar.contentTypes, tempContentType.trim()] });
                        setTempContentType("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (tempContentType.trim()) {
                        setNewPillar({ ...newPillar, contentTypes: [...newPillar.contentTypes, tempContentType.trim()] });
                        setTempContentType("");
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">KPIs</label>
              <div className="space-y-2">
                {newPillar.kpis.map((kpi, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{kpi}</p>
                    <button
                      onClick={() => {
                        const newKpis = newPillar.kpis.filter((_, i) => i !== idx);
                        setNewPillar({ ...newPillar, kpis: newKpis });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a KPI..."
                    value={tempKpi}
                    onChange={(e) => setTempKpi(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempKpi.trim()) {
                        setNewPillar({ ...newPillar, kpis: [...newPillar.kpis, tempKpi.trim()] });
                        setTempKpi("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (tempKpi.trim()) {
                        setNewPillar({ ...newPillar, kpis: [...newPillar.kpis, tempKpi.trim()] });
                        setTempKpi("");
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
            <Button variant="outline" onClick={() => setShowAddPillar(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPillar} disabled={!newPillar.pillar.trim()}>
              Add Pillar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Story Angle Dialog */}
      <Dialog open={showAddStoryAngle} onOpenChange={setShowAddStoryAngle}>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Add Story Angle</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a compelling narrative framework for content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Story Angle *</label>
              <Input
                placeholder="e.g., Founder Vision and Farm Origins"
                value={newStoryAngle.angle}
                onChange={(e) => setNewStoryAngle({ ...newStoryAngle, angle: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Narrative</label>
              <Textarea
                placeholder="The story narrative..."
                value={newStoryAngle.narrative}
                onChange={(e) => setNewStoryAngle({ ...newStoryAngle, narrative: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Emotional Hook</label>
              <Textarea
                placeholder="What emotion does this story evoke?"
                value={newStoryAngle.emotionalHook}
                onChange={(e) => setNewStoryAngle({ ...newStoryAngle, emotionalHook: e.target.value })}
                className="min-h-[60px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 block">Call to Action</label>
              <Input
                placeholder="What action should readers take?"
                value={newStoryAngle.callToAction}
                onChange={(e) => setNewStoryAngle({ ...newStoryAngle, callToAction: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">Content Formats</label>
              <div className="space-y-2">
                {newStoryAngle.contentFormats.map((format, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 rounded">
                    <p className="flex-1 text-sm text-gray-900 dark:text-white">{format}</p>
                    <button
                      onClick={() => {
                        const newFormats = newStoryAngle.contentFormats.filter((_, i) => i !== idx);
                        setNewStoryAngle({ ...newStoryAngle, contentFormats: newFormats });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a format..."
                    value={tempContentFormat}
                    onChange={(e) => setTempContentFormat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempContentFormat.trim()) {
                        setNewStoryAngle({ ...newStoryAngle, contentFormats: [...newStoryAngle.contentFormats, tempContentFormat.trim()] });
                        setTempContentFormat("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (tempContentFormat.trim()) {
                        setNewStoryAngle({ ...newStoryAngle, contentFormats: [...newStoryAngle.contentFormats, tempContentFormat.trim()] });
                        setTempContentFormat("");
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
            <Button variant="outline" onClick={() => setShowAddStoryAngle(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStoryAngle} disabled={!newStoryAngle.angle.trim()}>
              Add Story Angle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
