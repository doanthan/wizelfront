"use client";

import React from "react";
import { cn } from "@/lib/utils";

export default function DraggableBlock({ 
  block, 
  children, 
  className,
  onDragStart,
  onDragEnd 
}) {
  const handleDragStart = (e) => {
    // Set the data for the drag operation
    const blockData = JSON.stringify(block);
    e.dataTransfer.setData('application/json', blockData);
    e.dataTransfer.setData('text/plain', blockData);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Add visual feedback
    e.currentTarget.classList.add('opacity-50');
    
    // Call parent handler if provided
    if (onDragStart) {
      onDragStart(e, block);
    }
  };

  const handleDragEnd = (e) => {
    // Remove visual feedback
    e.currentTarget.classList.remove('opacity-50');
    
    // Call parent handler if provided
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "cursor-move transition-opacity duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}