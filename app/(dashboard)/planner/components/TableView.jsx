"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  User,
  Building2,
  MoreVertical,
  Edit,
  Trash,
  Copy,
  MessageSquare,
  CheckSquare,
  AlertCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Clipboard,
  PenTool,
  Lightbulb,
  Palette,
  Search,
  MessageCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function TableView({ 
  campaigns, 
  campaignTypes, 
  priorityLevels, 
  columns,
  onStatusChange,
  stores 
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Flatten all campaigns with their status
  const allCampaigns = Object.entries(campaigns).flatMap(([status, campaignList]) =>
    campaignList.map(campaign => ({ ...campaign, status }))
  );

  // Sort campaigns
  const sortedCampaigns = [...allCampaigns].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle different field types
    if (sortField === "dueDate") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortField === "priority") {
      const priorityOrder = { urgent: 3, high: 2, normal: 1 };
      aValue = priorityOrder[aValue] || 0;
      bValue = priorityOrder[bValue] || 0;
    } else if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get column from sub-status ID
  const getColumnFromSubStatus = (subStatusId) => {
    for (const column of columns) {
      if (column.subStatuses.find(sub => sub.id === subStatusId)) {
        return column;
      }
    }
    return null;
  };
  
  // Get sub-status info
  const getSubStatusInfo = (subStatusId) => {
    for (const column of columns) {
      const subStatus = column.subStatuses.find(sub => sub.id === subStatusId);
      if (subStatus) {
        return { column, subStatus };
      }
    }
    return null;
  };

  const getStoreName = (storeId) => {
    const store = stores?.find(s => s.public_id === storeId);
    return store?.name || "Unknown Store";
  };

  const SortButton = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <span>{children}</span>
      <div className="ml-1 flex flex-col">
        <ChevronUp 
          className={cn(
            "h-2 w-2",
            sortField === field && sortDirection === "asc" 
              ? "text-sky-blue" 
              : "text-gray-300"
          )} 
        />
        <ChevronDown 
          className={cn(
            "h-2 w-2 -mt-0.5",
            sortField === field && sortDirection === "desc" 
              ? "text-sky-blue" 
              : "text-gray-300"
          )} 
        />
      </div>
    </Button>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
        <div className="col-span-3">
          <SortButton field="campaign">Campaign</SortButton>
        </div>
        <div className="col-span-2">
          <SortButton field="client">Client</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="type">Type</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="priority">Priority</SortButton>
        </div>
        <div className="col-span-2">
          <SortButton field="status">Status</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="assignee">Assignee</SortButton>
        </div>
        <div className="col-span-1">
          <SortButton field="dueDate">Due Date</SortButton>
        </div>
        <div className="col-span-1">
          <span className="text-xs">Actions</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="max-h-[600px] overflow-y-auto">
        {sortedCampaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No campaigns found</p>
          </div>
        ) : (
          sortedCampaigns.map((campaign, index) => {
            const campaignType = campaignTypes[campaign.type];
            const priority = priorityLevels[campaign.priority];
            const statusInfo = getSubStatusInfo(campaign.status);
            const statusColumn = statusInfo?.column;
            const subStatus = statusInfo?.subStatus;
            const TypeIcon = campaignType?.icon || MessageSquare;
            
            // Calculate if overdue
            const dueDate = new Date(campaign.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            const isOverdue = dueDate < today;
            const isDueToday = dueDate.getTime() === today.getTime();
            
            return (
              <div
                key={campaign.id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                  index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"
                )}
              >
                {/* Campaign Name */}
                <div className="col-span-3 flex flex-col">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {getStoreName(campaign.storeId)}
                    </span>
                  </div>
                  <p className="font-medium text-slate-gray dark:text-white mt-1 truncate">
                    {campaign.campaign}
                  </p>
                  {campaign.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate italic">
                      "{campaign.notes}"
                    </p>
                  )}
                </div>

                {/* Client */}
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-slate-gray dark:text-white truncate">
                    {campaign.client}
                  </p>
                </div>

                {/* Type */}
                <div className="col-span-1 flex items-center">
                  <Badge className={cn("text-xs px-2 py-1", campaignType?.color)}>
                    <TypeIcon className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{campaignType?.label}</span>
                  </Badge>
                </div>

                {/* Priority */}
                <div className="col-span-1 flex items-center">
                  <Badge className={cn("text-xs px-2 py-1", priority?.color, priority?.textColor)}>
                    {priority?.label}
                  </Badge>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <Select
                    value={campaign.status}
                    onValueChange={(newStatus) => onStatusChange && onStatusChange(campaign.id, campaign.status, newStatus)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {subStatus && subStatus.icon && (
                            <subStatus.icon className="h-3 w-3 text-sky-blue mr-1" />
                          )}
                          {statusColumn && (
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center bg-gradient-to-r text-white text-xs",
                              statusColumn.color
                            )}>
                              <statusColumn.icon className="h-2.5 w-2.5" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium truncate">{statusColumn?.title}</span>
                            {subStatus && (
                              <span className="text-[9px] text-neutral-gray truncate">
                                {subStatus.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => {
                        const Icon = column.icon;
                        return (
                          <div key={column.id}>
                            {/* Column Header */}
                            <div className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-3 h-3 rounded flex items-center justify-center bg-gradient-to-r text-white",
                                  column.color
                                )}>
                                  <Icon className="h-2 w-2" />
                                </div>
                                {column.title}
                              </div>
                            </div>
                            {/* Sub-statuses */}
                            {column.subStatuses.map(subStatus => {
                              const IconComponent = subStatus.icon;
                              return (
                                <SelectItem key={subStatus.id} value={subStatus.id}>
                                  <div className="flex items-center gap-2">
                                    {IconComponent && <IconComponent className="h-3 w-3 text-sky-blue" />}
                                    <span>{subStatus.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="col-span-1 flex items-center">
                  {campaign.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet flex items-center justify-center">
                        <span className="text-[10px] font-medium text-white">
                          {campaign.assignee.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-gray dark:text-white">
                        {campaign.assignee}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                </div>

                {/* Due Date */}
                <div className="col-span-1 flex items-center">
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue && "text-red-600 dark:text-red-400",
                    isDueToday && "text-yellow-600 dark:text-yellow-400",
                    !isOverdue && !isDueToday && "text-gray-600 dark:text-gray-300"
                  )}>
                    {isOverdue && <AlertCircle className="h-3 w-3" />}
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">
                      {isDueToday ? "Today" : format(dueDate, "MMM d")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-3 w-3 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="h-3 w-3 mr-2" />
                        Add Note
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}