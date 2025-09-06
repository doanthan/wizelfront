"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Copy,
  Trash2,
  Columns,
  ChevronUp,
  ChevronDown,
  Square,
  Columns2,
  Columns3
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function SectionControls({
  sectionId,
  onAddAbove,
  onAddBelow,
  onDuplicate,
  onDelete,
  onChangeLayout,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  className,
  style = {}
}) {
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  
  const controls = [
    {
      id: 'add-above',
      icon: Plus,
      label: 'Add Above',
      onClick: onAddAbove,
      className: 'rotate-180'
    },
    {
      id: 'move-up',
      icon: ChevronUp,
      label: 'Move Up',
      onClick: onMoveUp,
      disabled: !canMoveUp
    },
    {
      id: 'duplicate',
      icon: Copy,
      label: 'Duplicate',
      onClick: onDuplicate
    },
    {
      id: 'columns',
      icon: Columns,
      label: 'Columns',
      onClick: () => setShowLayoutSelector(!showLayoutSelector),
      hasDropdown: true
    },
    {
      id: 'move-down',
      icon: ChevronDown,
      label: 'Move Down',
      onClick: onMoveDown,
      disabled: !canMoveDown
    },
    {
      id: 'add-below',
      icon: Plus,
      label: 'Add Below',
      onClick: onAddBelow
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      onClick: onDelete,
      variant: 'destructive'
    }
  ];
  
  const layoutOptions = [
    { id: '1-col', icon: Square, columns: 1, label: '1 Column' },
    { id: '2-col', icon: Columns2, columns: 2, label: '2 Columns' },
    { id: '3-col', icon: Columns3, columns: 3, label: '3 Columns' }
  ];
  
  return (
    <>
      {/* Invisible bridge for maintaining hover */}
      <div 
        className="absolute left-[-54px] top-0 w-[54px] h-full pointer-events-auto"
        style={{ zIndex: 999 }}
        data-hover-bridge
      />
      
      {/* Controls container */}
      <div
        className={cn(
          "absolute left-[-46px] top-0 z-[1000]",
          "flex flex-col gap-[3px]",
          "bg-white rounded-lg shadow-lg border border-gray-200",
          "p-1",
          "transition-all duration-200",
          className
        )}
        style={style}
        data-section-controls
      >
        {controls.map((control) => {
          const Icon = control.icon;
          const isDelete = control.variant === 'destructive';
          
          return (
            <div key={control.id} className="relative">
              <button
                onClick={control.onClick}
                disabled={control.disabled}
                className={cn(
                  "w-9 h-9 rounded-md",
                  "flex items-center justify-center",
                  "border border-gray-200",
                  "transition-all duration-150",
                  "hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600",
                  isDelete && "hover:border-red-500 hover:bg-red-50 hover:text-red-600",
                  control.disabled && "opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white hover:text-gray-400"
                )}
                title={control.label}
                aria-label={control.label}
              >
                <Icon className={cn("h-4 w-4", control.className)} />
              </button>
              
              {/* Layout selector dropdown */}
              {control.hasDropdown && showLayoutSelector && (
                <div className="absolute left-full ml-2 top-0 z-[1001]">
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex gap-1">
                    {layoutOptions.map((option) => {
                      const LayoutIcon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            onChangeLayout?.(option.columns);
                            setShowLayoutSelector(false);
                          }}
                          className={cn(
                            "w-9 h-9 rounded-md",
                            "flex items-center justify-center",
                            "border border-gray-200",
                            "transition-all duration-150",
                            "hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600"
                          )}
                          title={option.label}
                        >
                          <LayoutIcon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}