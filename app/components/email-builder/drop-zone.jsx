"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import dragDropManager from "./drag-drop-manager";

export default function DropZone({
  id,
  accepts = ['component', 'section'],
  variant = 'default', // 'canvas', 'edge', 'between', 'minimal'
  position,
  onDrop,
  showIndicator = true,
  indicatorText = "Drop here",
  className,
  children,
  style = {},
  disabled = false,
  isActive: forceActive = false // Allow forcing active state
}) {
  const dropRef = useRef(null);
  const [isOver, setIsOver] = useState(false);
  const [isActive, setIsActive] = useState(forceActive);
  const [isValidTarget, setIsValidTarget] = useState(false);
  
  // Handle native HTML5 drag events
  useEffect(() => {
    if (!dropRef.current || disabled) return;
    
    const element = dropRef.current;
    console.log(`[DropZone ${id}] Mounted, forceActive: ${forceActive}, initial isActive: ${isActive}`);
    
    const handleDragEnter = (e) => {
      if (e.dataTransfer?.types?.includes('componenttype') || 
          e.dataTransfer?.types?.includes('componentType')) {
        e.preventDefault();
        setIsOver(true);
        setIsValidTarget(true);
        setIsActive(true);
      }
    };
    
    const handleDragOver = (e) => {
      if (e.dataTransfer?.types?.includes('componenttype') || 
          e.dataTransfer?.types?.includes('componentType')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    
    const handleDragLeave = (e) => {
      // Check if we're actually leaving the drop zone
      const rect = element.getBoundingClientRect();
      const isReallyLeaving = 
        e.clientX < rect.left || 
        e.clientX > rect.right || 
        e.clientY < rect.top || 
        e.clientY > rect.bottom;
      
      if (isReallyLeaving) {
        setIsOver(false);
        setIsValidTarget(false);
      }
    };
    
    const handleDrop = (e) => {
      if (e.dataTransfer?.types?.includes('componenttype') || 
          e.dataTransfer?.types?.includes('componentType')) {
        e.preventDefault();
        e.stopPropagation();
        
        const componentType = e.dataTransfer.getData('componenttype') || 
                            e.dataTransfer.getData('componentType');
        const componentData = e.dataTransfer.getData('text/plain');
        
        if (onDrop && (componentType || componentData)) {
          try {
            const item = componentData ? JSON.parse(componentData) : { type: componentType };
            onDrop({ item, position });
          } catch (err) {
            console.error('Error parsing drop data:', err);
          }
        }
        
        // Always reset hover states after drop
        setIsOver(false);
        setIsValidTarget(false);
        setIsActive(false);
      }
    };
    
    // Register drop target with DragDropManager for state tracking
    dragDropManager.registerDropTarget(id, {
      element: element,
      accepts,
      data: { position }
    });
    
    // Subscribe to drag state changes
    const unsubscribe = dragDropManager.subscribe((dragState) => {
      const isDragging = !!dragState?.isDragging;
      console.log(`[DropZone ${id}] DragDropManager state: isDragging=${isDragging}, forceActive=${forceActive}`);
      setIsActive(forceActive || isDragging);
      
      // Clean up states when drag ends
      if (!isDragging && !forceActive) {
        setIsOver(false);
        setIsValidTarget(false);
        setIsActive(false);
      }
    });
    
    // Add global dragend listener to ensure cleanup
    const handleGlobalDragEnd = () => {
      setIsOver(false);
      setIsValidTarget(false);
      if (!forceActive) {
        setIsActive(false);
      }
    };
    
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    // Add event listeners
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
    
    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragend', handleGlobalDragEnd);
      dragDropManager.unregisterDropTarget(id);
      unsubscribe();
    };
  }, [id, accepts, position, onDrop, disabled, forceActive]);
  
  // Variant-specific styles
  const variantStyles = {
    canvas: {
      base: "min-h-[100px] transition-all duration-300 ease-in-out",
      active: "bg-purple-50/30",
      over: "bg-purple-50/50 border-2 border-dashed border-purple-400",
      indicator: "absolute inset-0 flex items-center justify-center pointer-events-none"
    },
    edge: {
      base: "relative transition-all duration-300 ease-in-out overflow-hidden rounded-lg",
      active: "animate-fadeIn",
      over: "bg-purple-100 border-2 border-purple-400",
      indicator: "absolute inset-0 flex items-center justify-center"
    },
    between: {
      base: "relative transition-all duration-300 ease-in-out z-30 rounded-lg",
      active: "animate-fadeIn",
      over: "bg-purple-100",
      indicator: "absolute inset-0 flex items-center justify-center"
    },
    minimal: {
      base: "transition-opacity duration-200",
      active: "opacity-50",
      over: "opacity-100",
      indicator: "hidden"
    },
    default: {
      base: "min-h-[60px] border-2 border-dashed rounded-lg transition-all duration-200",
      active: "border-gray-300",
      over: "border-purple-400 bg-purple-50",
      indicator: "flex items-center justify-center"
    }
  };
  
  // Dynamic classes for edge and between variants
  const getDynamicClasses = () => {
    if (variant === 'edge') {
      if (!isActive) return "h-0 opacity-0 pointer-events-none";
      if (isOver && isValidTarget) {
        return "h-20 my-3 opacity-100 bg-gradient-to-r from-purple-100 via-purple-200 to-purple-100 border-2 border-purple-500 shadow-lg shadow-purple-500/20 scale-y-110 transition-all duration-300";
      }
      return "h-12 my-2 opacity-70 bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 border-2 border-dashed border-purple-300 hover:opacity-100 transition-all duration-200";
    }
    if (variant === 'between') {
      if (!isActive) return "h-0 opacity-0 pointer-events-none";
      if (isOver && isValidTarget) {
        return "h-16 my-3 opacity-100 bg-gradient-to-r from-purple-100 via-purple-200 to-purple-100 border-2 border-purple-500 shadow-lg shadow-purple-500/20 scale-y-110 transition-all duration-300";
      }
      return "h-8 my-2 opacity-70 bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 border-2 border-dashed border-purple-300 hover:opacity-100 transition-all duration-200";
    }
    return "";
  };
  
  const styles = variantStyles[variant] || variantStyles.default;
  
  // Don't render edge/between zones when not dragging and not forced active
  if (!isActive && !forceActive && (variant === 'edge' || variant === 'between')) {
    return null;
  }
  
  // Dynamic rendering styles
  const dropZoneStyle = {
    ...style,
    ...((variant === 'edge' || variant === 'between') && isActive && !isOver && {
      opacity: 0,
      cursor: 'pointer',
      pointerEvents: 'auto'
    })
  };
  
  // Render indicator
  const renderIndicator = () => {
    if (!showIndicator || !isActive) return null;
    if (variant === 'minimal') return null;
    
    // Show enhanced indicator when hovering
    return (
      <div className={cn(
        styles.indicator,
        "transition-all duration-300 transform",
        isOver && isValidTarget ? "opacity-100 scale-110" : "opacity-60 scale-100"
      )}>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full shadow-md transition-all duration-200",
          isOver && isValidTarget 
            ? "bg-purple-600 text-white shadow-purple-600/30" 
            : "bg-white text-purple-600 shadow-sm"
        )}>
          <Plus className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOver && isValidTarget ? "rotate-90" : ""
          )} />
          <span className="text-sm font-medium">
            {isOver && isValidTarget ? "Release to drop" : (indicatorText || (variant === 'between' ? 'Drop here' : 'Add here'))}
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <div
      ref={dropRef}
      className={cn(
        styles.base,
        getDynamicClasses(),
        isActive && styles.active,
        isOver && isValidTarget && styles.over,
        className
      )}
      style={dropZoneStyle}
      data-drop-zone
      data-variant={variant}
      data-active={isActive}
      data-over={isOver}
      data-position={position ? JSON.stringify(position) : undefined}
    >
      {renderIndicator()}
      {children}
    </div>
  );
}