"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AddCampaignModal({ onAdd, onClose, campaignTypes, priorityLevels, stores }) {
  const [formData, setFormData] = useState({
    storeId: stores?.[0]?.public_id || "",
    client: "",
    campaign: "",
    type: "promotional",
    priority: "normal",
    dueDate: "",
    assignee: "",
    notes: "",
    progress: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>New Campaign Brief</CardTitle>
              <CardDescription>
                Add a new campaign to the planning board
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Store Selection */}
            {stores && stores.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="store">Store *</Label>
                <Select
                  value={formData.storeId}
                  onValueChange={(value) => handleChange("storeId", value)}
                >
                  <SelectTrigger id="store">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.public_id} value={store.public_id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client">Client Name *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => handleChange("client", e.target.value)}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign Name *</Label>
              <Input
                id="campaign"
                value={formData.campaign}
                onChange={(e) => handleChange("campaign", e.target.value)}
                placeholder="e.g., Black Friday Sale"
                required
              />
            </div>

            {/* Campaign Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(campaignTypes).map(([key, type]) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3 w-3" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange("priority", value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLevels).map(([key, level]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", level.color)} />
                          <span>{level.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date and Assignee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={formData.assignee}
                  onChange={(e) => handleChange("assignee", e.target.value)}
                  placeholder="e.g., Sarah"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Special requirements or initial notes..."
                rows={3}
              />
            </div>

            {/* Quick Brief Template */}
            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg space-y-2">
              <p className="text-xs font-medium text-slate-gray dark:text-white">
                Quick Checklist (will be added to brief):
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-gray">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 rounded" />
                  <span>Campaign objectives defined</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 rounded" />
                  <span>Target audience identified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 rounded" />
                  <span>Copy/messaging approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 rounded" />
                  <span>Brand assets collected</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Campaign
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}