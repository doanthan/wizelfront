"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import DropZone from "./drop-zone";
import SectionControls from "./section-controls";
import dragDropManager from "./drag-drop-manager";

// Hook for managing hover states with invisible bridge
const useHoverState = (elementRef, sectionId, setActiveSection) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideTimeout = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  
  const checkMousePosition = useCallback(() => {
    if (!elementRef.current) return false;
    
    const rect = elementRef.current.getBoundingClientRect();
    const { x, y } = mousePosition.current;
    
    // Extended bounds for invisible bridge
    const extendedBounds = {
      top: rect.top - 10,
      bottom: rect.bottom + 10,
      left: rect.left - 60, // Extended left for controls
      right: rect.right + 10
    };
    
    return x >= extendedBounds.left && 
           x <= extendedBounds.right && 
           y >= extendedBounds.top && 
           y <= extendedBounds.bottom;
  }, []);
  
  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimeout.current);
    setIsHovered(true);
    setShowControls(true);
    setActiveSection(sectionId);
  }, [sectionId, setActiveSection]);
  
  const handleMouseLeave = useCallback(() => {
    hideTimeout.current = setTimeout(() => {
      if (!checkMousePosition()) {
        setIsHovered(false);
        setShowControls(false);
      }
    }, 200);
  }, [checkMousePosition]);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      
      if (showControls && !checkMousePosition()) {
        handleMouseLeave();
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimeout.current);
    };
  }, [showControls, checkMousePosition, handleMouseLeave]);
  
  return { isHovered, showControls, handleMouseEnter, handleMouseLeave };
};

// Email Section Component with hover controls
const EmailSection = ({ 
  section, 
  index, 
  totalSections,
  onUpdate, 
  onDelete, 
  onDuplicate,
  onMove,
  onAddSection,
  onChangeLayout,
  isSelected,
  onSelect,
  activeSection,
  setActiveSection
}) => {
  const sectionRef = useRef(null);
  const { isHovered, showControls, handleMouseEnter, handleMouseLeave } = 
    useHoverState(sectionRef, section.id, setActiveSection);
  
  const isActive = activeSection === section.id;
  
  return (
    <div
      ref={sectionRef}
      className={cn(
        "relative transition-all duration-200 group",
        "border-2",
        isSelected ? "border-purple-500 shadow-lg shadow-purple-500/10" : "border-transparent",
        isHovered && !isSelected && "border-gray-200 bg-purple-50/30"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(section)}
      data-section-id={section.id}
    >
      {/* Section Controls */}
      {showControls && isActive && (
        <SectionControls
          sectionId={section.id}
          onAddAbove={() => onAddSection(index, 'above')}
          onAddBelow={() => onAddSection(index, 'below')}
          onDuplicate={() => onDuplicate(section)}
          onDelete={() => onDelete(section.id)}
          onChangeLayout={(columns) => onChangeLayout(section.id, columns)}
          onMoveUp={() => onMove(index, index - 1)}
          onMoveDown={() => onMove(index, index + 1)}
          canMoveUp={index > 0}
          canMoveDown={index < totalSections - 1}
        />
      )}
      
      {/* Section Content */}
      <div className={cn(
        "p-4",
        section.type === 'columns' && "grid gap-4",
        section.type === 'columns' && section.columns === 2 && "grid-cols-2",
        section.type === 'columns' && section.columns === 3 && "grid-cols-3"
      )}>
        {section.children && section.children.length > 0 ? (
          section.children.map((child, childIndex) => (
            <div key={child.id} className="min-h-[50px]">
              {renderContent(child)}
            </div>
          ))
        ) : (
          <div className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
            {section.type === 'columns' ? 'Drop content here' : 'Empty section'}
          </div>
        )}
      </div>
    </div>
  );
};

// Render content based on type
const renderContent = (component) => {
  const props = component.properties || {};
  
  switch (component.type) {
    case 'text':
      return <p style={{ fontSize: props.fontSize, color: props.color }}>{props.content}</p>;
    case 'heading':
      const HeadingTag = props.level || 'h2';
      return <HeadingTag style={{ fontSize: props.fontSize, color: props.color }}>{props.content}</HeadingTag>;
    case 'button':
      return (
        <div style={{ textAlign: props.alignment }}>
          <a 
            href={props.url} 
            style={{
              backgroundColor: props.backgroundColor,
              color: props.textColor,
              padding: `${props.padding?.top}px ${props.padding?.right}px ${props.padding?.bottom}px ${props.padding?.left}px`,
              borderRadius: `${props.borderRadius}px`,
              display: 'inline-block',
              textDecoration: 'none'
            }}
          >
            {props.text}
          </a>
        </div>
      );
    case 'image':
      return (
        <div style={{ textAlign: props.alignment }}>
          <img src={props.src} alt={props.alt} style={{ width: props.width, height: props.height }} />
        </div>
      );
    case 'divider':
      return <hr style={{ height: props.height, backgroundColor: props.color, border: 'none' }} />;
    case 'spacer':
      return <div style={{ height: props.height }} />;
    default:
      return <div>Unknown component: {component.type}</div>;
  }
};

// Main Canvas Component
export default function EmailCanvasV3({
  sections,
  setSections,
  selectedSection,
  setSelectedSection,
  viewMode = 'desktop'
}) {
  const canvasRef = useRef(null);
  const [activeSection, setActiveSection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Create new section
  const createNewSection = useCallback((type = 'container') => {
    // Generate unique ID inline
    const id = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      type,
      columns: type === 'columns' ? 2 : undefined,
      children: [],
      properties: {
        backgroundColor: '#ffffff',
        padding: { top: 20, right: 20, bottom: 20, left: 20 }
      }
    };
  }, []);
  
  // Subscribe to drag state and handle native HTML5 drag events
  useEffect(() => {
    const unsubscribe = dragDropManager.subscribe((dragState) => {
      console.log('[Canvas] DragDropManager subscription update:', dragState);
      setIsDragging(!!dragState?.isDragging);
    });
    
    // Global drag start listener to detect when dragging begins anywhere
    const handleGlobalDragStart = (e) => {
      console.log('[DEBUG] dragstart event detected', e.target);
      // Check if this is a component being dragged
      const isDraggableComponent = e.target.closest('[draggable="true"]');
      if (isDraggableComponent) {
        console.log('[DEBUG] Found draggable component, activating drop zones');
        setIsDragging(true);
      }
    };
    
    // Global drag end listener to ensure state is cleared
    const handleGlobalDragEnd = () => {
      console.log('[DEBUG] dragend event, deactivating drop zones');
      setIsDragging(false);
    };
    
    // Handle native HTML5 drag events for browser compatibility
    const handleDragEnter = (e) => {
      if (e.dataTransfer?.types?.includes('componenttype') || 
          e.dataTransfer?.types?.includes('componentType') ||
          e.dataTransfer?.types?.includes('text/plain')) {
        console.log('[DEBUG] Canvas dragenter, activating drop zones');
        setIsDragging(true);
      }
    };
    
    const handleDragLeave = (e) => {
      // Only hide if leaving the entire canvas
      if (e.target === canvasRef.current && !canvasRef.current.contains(e.relatedTarget)) {
        // Don't hide immediately - let drop zones handle their own state
      }
    };
    
    const handleDragOver = (e) => {
      if (e.dataTransfer?.types?.includes('componenttype') || 
          e.dataTransfer?.types?.includes('componentType') ||
          e.dataTransfer?.types?.includes('text/plain')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragging(true); // Ensure drag state is active
      }
    };
    
    const handleDrop = (e) => {
      if (e.dataTransfer?.types?.includes('componenttype') || 
          e.dataTransfer?.types?.includes('componentType') ||
          e.dataTransfer?.types?.includes('text/plain')) {
        e.preventDefault();
        console.log('[Canvas] Drop event handled');
        
        // Try to get component data
        const componentType = e.dataTransfer.getData('componenttype') || 
                            e.dataTransfer.getData('componentType');
        const componentData = e.dataTransfer.getData('text/plain');
        
        if (componentType || componentData) {
          try {
            const component = componentData ? JSON.parse(componentData) : { type: componentType };
            
            // Find which drop zone we're over
            const dropZone = e.target.closest('[data-drop-zone]');
            if (dropZone) {
              const position = dropZone.dataset.position ? 
                JSON.parse(dropZone.dataset.position) : null;
              
              // Create new section based on component type
              const newSection = createNewSection(component.type || 'container');
              
              if (position?.index !== undefined) {
                const newSections = [...sections];
                newSections.splice(position.index, 0, newSection);
                setSections(newSections);
              } else {
                setSections([...sections, newSection]);
              }
              
              setSelectedSection(newSection);
            } else {
              // Default drop at the end
              const newSection = createNewSection(component.type || 'container');
              setSections([...sections, newSection]);
              setSelectedSection(newSection);
            }
          } catch (err) {
            console.error('Error handling drop:', err);
          }
        }
        
        // Reset drag state after drop - ensure DragDropManager also knows
        setIsDragging(false);
        dragDropManager.endDrag();
      }
    };
    
    const handleDragEnd = () => {
      setIsDragging(false);
      dragDropManager.endDrag();
    };
    
    const canvas = canvasRef.current;
    
    // Add global drag start and end listeners to document
    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    if (canvas) {
      canvas.addEventListener('dragenter', handleDragEnter);
      canvas.addEventListener('dragleave', handleDragLeave);
      canvas.addEventListener('dragover', handleDragOver);
      canvas.addEventListener('drop', handleDrop);
      canvas.addEventListener('dragend', handleDragEnd);
    }
    
    return () => {
      unsubscribe();
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
      if (canvas) {
        canvas.removeEventListener('dragenter', handleDragEnter);
        canvas.removeEventListener('dragleave', handleDragLeave);
        canvas.removeEventListener('dragover', handleDragOver);
        canvas.removeEventListener('drop', handleDrop);
        canvas.removeEventListener('dragend', handleDragEnd);
      }
    };
  }, [sections, setSections, setSelectedSection, createNewSection]);
  
  // Handle drop on canvas
  const handleCanvasDrop = useCallback(({ item, position }) => {
    const newSection = createNewSection(item.type || 'container');
    
    if (position?.index !== undefined) {
      const newSections = [...sections];
      newSections.splice(position.index, 0, newSection);
      setSections(newSections);
    } else {
      setSections([...sections, newSection]);
    }
    
    setSelectedSection(newSection);
  }, [sections, setSections, setSelectedSection]);
  
  // Add section at specific position
  const handleAddSection = (index, position) => {
    const newSection = createNewSection();
    const newSections = [...sections];
    
    if (position === 'above') {
      newSections.splice(index, 0, newSection);
    } else {
      newSections.splice(index + 1, 0, newSection);
    }
    
    setSections(newSections);
    setSelectedSection(newSection);
  };
  
  // Delete section
  const handleDeleteSection = (sectionId) => {
    setSections(sections.filter(s => s.id !== sectionId));
    setSelectedSection(null);
  };
  
  // Duplicate section
  const handleDuplicateSection = (section) => {
    const duplicate = {
      ...section,
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      children: section.children ? [...section.children] : []
    };
    
    const index = sections.findIndex(s => s.id === section.id);
    const newSections = [...sections];
    newSections.splice(index + 1, 0, duplicate);
    
    setSections(newSections);
    setSelectedSection(duplicate);
  };
  
  // Move section
  const handleMoveSection = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    
    setSections(newSections);
  };
  
  // Change section layout
  const handleChangeLayout = (sectionId, columns) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          type: columns > 1 ? 'columns' : 'container',
          columns
        };
      }
      return section;
    }));
  };
  
  // Auto-scroll during drag
  useEffect(() => {
    if (!isDragging || !canvasRef.current) return;
    
    let scrollInterval;
    
    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const threshold = 150;
      const maxSpeed = 20;
      
      let scrollSpeed = 0;
      
      if (e.clientY < rect.top + threshold) {
        scrollSpeed = -Math.min(maxSpeed, (threshold - (e.clientY - rect.top)) / 10);
      } else if (e.clientY > rect.bottom - threshold) {
        scrollSpeed = Math.min(maxSpeed, ((e.clientY - rect.bottom) + threshold) / 10);
      }
      
      if (scrollSpeed !== 0) {
        clearInterval(scrollInterval);
        scrollInterval = setInterval(() => {
          canvasRef.current.scrollTop += scrollSpeed;
        }, 16);
      } else {
        clearInterval(scrollInterval);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(scrollInterval);
    };
  }, [isDragging]);
  
  return (
    <div 
      ref={canvasRef}
      className={cn(
        "h-full overflow-auto bg-gray-50 p-8",
        viewMode === 'mobile' && "max-w-sm mx-auto"
      )}
    >
      {/* Visual drag indicator */}
      {isDragging && (
        <div className="fixed top-20 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <span>Drop zones active</span>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        {sections.length === 0 ? (
          // Empty canvas state
          <DropZone
            id="email-canvas-empty"
            accepts={['component', 'section']}
            variant="canvas"
            showIndicator={true}
            indicatorText="Drop component here to start"
            className="min-h-[400px] bg-white rounded-lg shadow-sm flex items-center justify-center"
            onDrop={handleCanvasDrop}
          >
            <div className="text-center">
              <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-gray mb-2">
                Start Building Your Email
              </h3>
              <p className="text-gray-500 mb-6">
                Drag components from the left panel
              </p>
              <Button
                onClick={() => handleAddSection(0, 'below')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Add First Section
              </Button>
            </div>
          </DropZone>
        ) : (
          <div className="relative bg-white rounded-lg shadow-sm">
            {/* Top drop zone - only visible when dragging */}
            {isDragging && (
              <DropZone
                id="drop-zone-top"
                accepts={['component', 'section']}
                position={{ index: 0, location: 'top' }}
                variant="edge"
                indicatorText="Add to top"
                onDrop={handleCanvasDrop}
                className="transition-all duration-200"
                forceActive={true}
              />
            )}
            
            {/* Render sections with drop zones between them */}
            {sections.map((section, index) => (
              <React.Fragment key={section.id}>
                <EmailSection
                  section={section}
                  index={index}
                  totalSections={sections.length}
                  onUpdate={(updated) => {
                    setSections(sections.map(s => s.id === section.id ? updated : s));
                  }}
                  onDelete={handleDeleteSection}
                  onDuplicate={handleDuplicateSection}
                  onMove={handleMoveSection}
                  onAddSection={handleAddSection}
                  onChangeLayout={handleChangeLayout}
                  isSelected={selectedSection?.id === section.id}
                  onSelect={setSelectedSection}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                />
                
                {/* Drop zone after each section */}
                {isDragging && (
                  <DropZone
                    id={`drop-zone-after-${index}`}
                    accepts={['component', 'section']}
                    position={{ index: index + 1, location: 'after' }}
                    variant="between"
                    indicatorText={`Add after section ${index + 1}`}
                    onDrop={handleCanvasDrop}
                    className="w-full my-2"
                    forceActive={true}
                  />
                )}
              </React.Fragment>
            ))}
            
          </div>
        )}
      </div>
    </div>
  );
}