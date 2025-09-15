"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
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
  AlertCircle,
  Mail,
  Clipboard,
  PenTool,
  Lightbulb,
  Palette,
  Search,
  MessageCircle,
  CheckCircle2,
  CheckCircle
} from "lucide-react";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function CampaignCard({ campaign, campaignTypes, priorityLevels, isDragging, showSubStatus = true, columns = [] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: campaign.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const campaignType = campaignTypes[campaign.type];
  const priority = priorityLevels[campaign.priority];
  const TypeIcon = campaignType?.icon || Mail;
  
  // Get icon for current sub-status
  const getSubStatusIcon = () => {
    if (!campaign.subStatus) return null;
    
    const statusIconMap = {
      'brief_new': Clipboard,
      'brief_in_progress': PenTool,
      'design_concept': Lightbulb, 
      'design_creation': Palette,
      'review_internal': Search,
      'review_client': MessageCircle,
      'approved_ready': CheckCircle2,
      'approved_scheduled': Calendar,
      'klaviyo_scheduled': Clock,
      'klaviyo_live': CheckCircle
    };
    
    return statusIconMap[campaign.subStatus] || null;
  };
  
  const SubStatusIcon = getSubStatusIcon();
  
  // Get readable sub-status name
  const getSubStatusLabel = () => {
    if (!campaign.subStatus) return null;
    
    // Find the sub-status in the columns to get the label
    for (const column of columns) {
      const subStatus = column.subStatuses?.find(sub => sub.id === campaign.subStatus);
      if (subStatus) {
        return subStatus.label;
      }
    }
    
    const statusLabelMap = {
      'brief_new': 'New Brief',
      'brief_in_progress': 'In Progress', 
      'design_concept': 'Concept',
      'design_creation': 'Creation',
      'review_internal': 'Internal Review',
      'review_client': 'Client Review',
      'approved_ready': 'Approved',
      'approved_scheduled': 'Scheduled',
      'klaviyo_scheduled': 'Scheduled',
      'klaviyo_live': 'Live'
    };
    
    return statusLabelMap[campaign.subStatus] || campaign.subStatus;
  };

  // Calculate if overdue
  const dueDate = new Date(campaign.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const isOverdue = dueDate < today;
  const isDueToday = dueDate.getTime() === today.getTime();

  // Calculate checklist completion if exists
  const checklistCompletion = campaign.checklist 
    ? Math.round((Object.values(campaign.checklist).filter(Boolean).length / Object.keys(campaign.checklist).length) * 100)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card className={cn(
        "cursor-grab transition-all hover:shadow-md",
        (isSortableDragging || isDragging) && "opacity-50 cursor-grabbing rotate-2 scale-105",
        isOverdue && "border-red-500/50",
        isDueToday && "border-yellow-500/50"
      )}>
        <CardContent className="p-3">
          {/* Header with Client and Actions */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="h-3 w-3 text-neutral-gray flex-shrink-0" />
              <span className="text-xs font-medium text-slate-gray dark:text-white truncate">
                {campaign.client}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
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

          {/* Campaign Title with Status Icon */}
          <div className="flex items-start gap-2 mb-2">
            {showSubStatus && SubStatusIcon && (
              <SubStatusIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-sky-blue" title={getSubStatusLabel()} />
            )}
            <h4 className="font-semibold text-sm text-slate-gray dark:text-white line-clamp-2">
              {campaign.campaign}
            </h4>
          </div>

          {/* Sub-status, Campaign Type and Priority */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {showSubStatus && campaign.subStatus && SubStatusIcon && (
              <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <SubStatusIcon className="h-3 w-3 mr-1" />
                {getSubStatusLabel()}
              </Badge>
            )}
            <Badge className={cn("text-xs px-2 py-0.5", campaignType?.color)}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {campaignType?.label}
            </Badge>
            <Badge className={cn("text-xs px-2 py-0.5", priority?.color, priority?.textColor)}>
              {priority?.label}
            </Badge>
          </div>

          {/* Progress Bar (if applicable) */}
          {campaign.progress !== undefined && campaign.progress > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-gray">Progress</span>
                <span className="text-xs font-medium text-slate-gray dark:text-white">
                  {campaign.progress}%
                </span>
              </div>
              <Progress value={campaign.progress} className="h-1.5" />
            </div>
          )}

          {/* Checklist Progress (if applicable) */}
          {checklistCompletion !== null && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3 text-neutral-gray" />
                  <span className="text-xs text-neutral-gray">Checklist</span>
                </div>
                <span className="text-xs font-medium text-slate-gray dark:text-white">
                  {checklistCompletion}%
                </span>
              </div>
              <Progress value={checklistCompletion} className="h-1.5" />
            </div>
          )}

          {/* Review Round Info (if applicable) */}
          {campaign.reviewRound && (
            <div className="mb-3">
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <MessageSquare className="h-3 w-3" />
                <span>Review Round {campaign.reviewRound}</span>
              </div>
              {campaign.sentDate && (
                <p className="text-[10px] text-neutral-gray dark:text-gray-400 ml-4">
                  Sent: {format(new Date(campaign.sentDate), "MMM d")}
                </p>
              )}
            </div>
          )}
          
          {/* Send/Launch Date Info (if applicable) */}
          {(campaign.sendDateTime || campaign.launchDate) && (
            <div className="mb-3">
              <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                <Clock className="h-3 w-3" />
                {campaign.sendDateTime && (
                  <span>Send: {format(new Date(campaign.sendDateTime), "MMM d, h:mm a")}</span>
                )}
                {campaign.launchDate && !campaign.sendDateTime && (
                  <span>Launch: {format(new Date(campaign.launchDate), "MMM d")}</span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {campaign.notes && (
            <p className="text-xs text-neutral-gray dark:text-gray-400 mb-3 italic line-clamp-2">
              "{campaign.notes}"
            </p>
          )}

          {/* Footer with Due Date and Assignee */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue && "text-red-600 dark:text-red-400",
                isDueToday && "text-yellow-600 dark:text-yellow-400",
                !isOverdue && !isDueToday && "text-neutral-gray"
              )}>
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                <span className="font-medium">
                  {isDueToday ? "Today" : format(dueDate, "MMM d")}
                </span>
              </div>
            </div>
            
            {campaign.assignee && (
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet flex items-center justify-center">
                  <span className="text-[10px] font-medium text-white">
                    {campaign.assignee.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}