"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function DropZone({ 
  onDrop, 
  index, 
  children, 
  className,
  accepts = ['block', 'section', 'component'],
  showAlways = false 
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Listen for global drag events to know when dragging is happening
  useEffect(() => {
    const handleDragStart = (e) => {
      if (e.dataTransfer.types.includes('application/json') || 
          e.dataTransfer.types.includes('text/plain')) {
        setIsDragging(true);
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      setIsDragOver(false);
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're dragging a valid component
    if (e.dataTransfer.types.includes('application/json') ||
        e.dataTransfer.types.includes('text/plain')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const blockData = e.dataTransfer.getData('application/json') || 
                       e.dataTransfer.getData('text/plain');
      if (blockData) {
        const block = JSON.parse(blockData);
        onDrop(block, index);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "transition-all duration-200",
        isDragOver && "bg-purple-100 border-2 border-purple-400 rounded-lg p-2 my-2",
        // Always have some height when dragging is active, so drop zones can detect drag events
        isDragging && !isDragOver && "h-4 opacity-20 bg-gray-100 rounded",
        // When not dragging and not showing always, minimize completely
        !isDragging && !showAlways && "h-0 opacity-0 pointer-events-none",
        // Show always mode
        !isDragOver && showAlways && "h-1 opacity-50 hover:opacity-100",
        className
      )}
    >
      {isDragOver && (
        <div className="flex items-center justify-center py-4">
          <span className="text-purple-600 font-medium">Drop here</span>
        </div>
      )}
      {children}
    </div>
  );
}