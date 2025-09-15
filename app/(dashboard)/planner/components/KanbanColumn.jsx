"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Filter, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import CampaignCard from "./CampaignCard";

export default function KanbanColumn({ 
  column, 
  campaigns, 
  campaignTypes, 
  priorityLevels, 
  columnFilters, 
  onToggleSubStatus 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const Icon = column.icon;
  const [showFilters, setShowFilters] = useState(false);
  
  // Group campaigns by sub-status
  const campaignsBySubStatus = {};
  column.subStatuses.forEach(subStatus => {
    campaignsBySubStatus[subStatus.id] = campaigns.filter(campaign => 
      campaign.subStatus === subStatus.id
    );
  });
  
  // Filter campaigns based on column filters
  const getFilteredCampaigns = () => {
    const filtered = [];
    column.subStatuses.forEach(subStatus => {
      if (columnFilters?.[column.id]?.[subStatus.id]) {
        filtered.push(...(campaignsBySubStatus[subStatus.id] || []));
      }
    });
    return filtered;
  };
  
  const filteredCampaigns = getFilteredCampaigns();
  const totalCampaigns = Object.values(campaignsBySubStatus).flat().length;

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={cn(
        "h-full transition-all",
        isOver && "ring-2 ring-sky-blue shadow-lg"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r text-white",
                column.color
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-gray dark:text-white">
                  {column.title}
                </h3>
                <p className="text-xs text-neutral-gray dark:text-gray-400">
                  {filteredCampaigns.length} of {totalCampaigns} campaigns
                </p>
                {column.subtitle && (
                  <p className="text-xs text-neutral-gray dark:text-gray-400 italic">
                    {column.subtitle}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7 w-7 p-0"
              title="Toggle sub-status filters"
            >
              <Filter className={cn(
                "h-3 w-3 transition-colors",
                showFilters ? "text-sky-blue" : "text-neutral-gray"
              )} />
            </Button>
          </div>
          
          {/* Sub-status Filter Toggles */}
          {showFilters && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-slate-gray dark:text-white">
                Filter by Sub-Status:
              </p>
              <div className="flex flex-wrap gap-1">
                {column.subStatuses.map(subStatus => {
                  const count = campaignsBySubStatus[subStatus.id]?.length || 0;
                  const isVisible = columnFilters?.[column.id]?.[subStatus.id];
                  
                  const IconComponent = subStatus.icon;
                  
                  return (
                    <Button
                      key={subStatus.id}
                      variant={isVisible ? "default" : "outline"}
                      size="sm"
                      onClick={() => onToggleSubStatus && onToggleSubStatus(column.id, subStatus.id)}
                      className={cn(
                        "h-6 px-2 text-xs transition-all",
                        isVisible 
                          ? "bg-sky-blue hover:bg-royal-blue text-white" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {isVisible ? (
                        <Eye className="h-2 w-2 mr-1" />
                      ) : (
                        <EyeOff className="h-2 w-2 mr-1" />
                      )}
                      {IconComponent && <IconComponent className="h-2 w-2 mr-1" />}
                      <span className="hidden sm:inline mr-1">
                        {subStatus.label}
                      </span>
                      <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          
          <p className="text-xs text-neutral-gray dark:text-gray-400 mt-2">
            {column.description}
          </p>
        </CardHeader>

        <CardContent className="p-3 pt-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div 
              ref={setNodeRef}
              className={cn(
                "space-y-3 min-h-[200px] p-2 rounded-lg transition-colors",
                isOver && "bg-sky-50 dark:bg-sky-900/10",
                filteredCampaigns.length === 0 && "flex items-center justify-center"
              )}
            >
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-gray dark:text-gray-400">
                    {totalCampaigns === 0 ? "Drop campaigns here" : "No campaigns match current filters"}
                  </p>
                  {totalCampaigns > 0 && showFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Show all sub-statuses
                        column.subStatuses.forEach(subStatus => {
                          onToggleSubStatus && onToggleSubStatus(column.id, subStatus.id, true);
                        });
                      }}
                      className="mt-2 h-7 text-xs"
                    >
                      Show All
                    </Button>
                  )}
                </div>
              ) : (
                <SortableContext
                  items={filteredCampaigns.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {/* Group campaigns by sub-status for better organization */}
                  {column.subStatuses.map(subStatus => {
                    const subStatusCampaigns = campaignsBySubStatus[subStatus.id] || [];
                    const isSubStatusVisible = columnFilters?.[column.id]?.[subStatus.id];
                    
                    if (!isSubStatusVisible || subStatusCampaigns.length === 0) return null;
                    
                    return (
                      <div key={subStatus.id} className="space-y-2">
                        {/* Sub-status header */}
                        <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                          <div className="flex items-center gap-1">
                            {subStatus.icon && <subStatus.icon className="h-3 w-3 text-sky-blue" />}
                            <span className="text-xs font-medium text-slate-gray dark:text-white">
                              {subStatus.label}
                            </span>
                          </div>
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {subStatusCampaigns.length}
                          </Badge>
                        </div>
                        
                        {/* Campaigns in this sub-status */}
                        <div className="space-y-2">
                          {subStatusCampaigns.map((campaign) => (
                            <CampaignCard
                              key={campaign.id}
                              campaign={campaign}
                              campaignTypes={campaignTypes}
                              priorityLevels={priorityLevels}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </SortableContext>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}