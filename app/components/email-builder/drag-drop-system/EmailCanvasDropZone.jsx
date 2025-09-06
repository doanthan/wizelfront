"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function EmailCanvasDropZone({ 
  onDrop, 
  children, 
  isEmpty = false,
  className 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    // Listen for drag start events anywhere in the document
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
    
    if (e.dataTransfer.types.includes('application/json') ||
        e.dataTransfer.types.includes('text/plain')) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide if we're leaving the canvas entirely
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
      if (blockData && onDrop) {
        const block = JSON.parse(blockData);
        onDrop(block);
      }
    } catch (error) {
      console.error('Error handling canvas drop:', error);
    }
  };

  if (isEmpty) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "min-h-[400px] border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200",
          isDragOver ? "border-purple-400 bg-purple-50" : "border-gray-300 bg-gray-50",
          className
        )}
      >
        <div className="text-center">
          <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {isDragOver ? "Drop to add section" : "Start Building Your Email"}
          </h3>
          <p className="text-gray-500">
            Drag components from the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative transition-all duration-200",
        isDragOver && "bg-purple-50/30",
        className
      )}
    >
      {/* Visual indicator when dragging */}
      {isDragging && (
        <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <span>Drop zones active</span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}