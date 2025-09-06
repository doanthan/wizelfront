"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Trash2, 
  Copy, 
  Move,
  ChevronUp,
  ChevronDown,
  Settings,
  Columns,
  Square
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

// Component that handles the email canvas with drag and drop
export default function EmailCanvasV2({ 
  emailComponents, 
  setEmailComponents, 
  selectedComponent, 
  setSelectedComponent,
  viewMode = 'desktop' 
}) {
  const [draggedOver, setDraggedOver] = useState(null);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState(null);
  
  // Generate unique ID
  const generateId = () => `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get default properties for component types
  const getDefaultProperties = (type) => {
    const defaults = {
      container: {
        backgroundColor: '#ffffff',
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        borderRadius: 0,
        maxWidth: '600px',
        alignment: 'center'
      },
      columns: {
        columnCount: 2,
        gap: 20,
        stackOnMobile: true,
        columnWidths: [50, 50],
        verticalAlignment: 'top'
      },
      text: {
        content: 'Your text goes here',
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        color: '#333333',
        lineHeight: 1.5,
        textAlign: 'left',
        fontWeight: 'normal'
      },
      heading: {
        content: 'Your Heading',
        level: 'h2',
        fontSize: 24,
        fontFamily: 'Arial, sans-serif',
        color: '#1e293b',
        textAlign: 'left',
        fontWeight: 'bold'
      },
      button: {
        text: 'Click Me',
        url: '#',
        backgroundColor: '#60A5FA',
        textColor: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        padding: { top: 12, right: 24, bottom: 12, left: 24 },
        borderRadius: 8,
        alignment: 'center',
        width: 'auto'
      },
      image: {
        src: '/api/placeholder/600/400',
        alt: 'Image',
        width: '100%',
        height: 'auto',
        alignment: 'center',
        link: '',
        padding: { top: 0, right: 0, bottom: 0, left: 0 }
      },
      divider: {
        height: 1,
        color: '#e5e7eb',
        style: 'solid',
        margin: { top: 20, right: 0, bottom: 20, left: 0 }
      },
      spacer: {
        height: 20
      },
      html: {
        content: '<!-- Custom HTML -->',
        backgroundColor: 'transparent'
      }
    };
    
    return defaults[type] || {};
  };

  // Create a new component
  const createComponent = (type, properties = {}) => {
    return {
      id: generateId(),
      type,
      properties: { ...getDefaultProperties(type), ...properties },
      children: type === 'container' || type === 'columns' ? [] : undefined
    };
  };

  // Handle drag start from sidebar
  const handleDragStart = (e, component) => {
    setIsDragging(true);
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('componentType', component.type || component.id);
  };

  // Handle drag over
  const handleDragOver = useCallback((e, targetId = null, position = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Determine drop position
    let dropPos = 'inside';
    if (position) {
      dropPos = position;
    } else if (y < height * 0.25) {
      dropPos = 'before';
    } else if (y > height * 0.75) {
      dropPos = 'after';
    }
    
    setDropIndicator({ targetId, position: dropPos });
  }, [isDragging]);

  // Handle drop
  const handleDrop = useCallback((e, targetId = null, position = 'inside') => {
    e.preventDefault();
    e.stopPropagation();
    
    const componentType = e.dataTransfer.getData('componentType');
    if (!componentType) return;
    
    const newComponent = createComponent(componentType);
    
    if (!targetId || emailComponents.length === 0) {
      // Drop at root level
      setEmailComponents([...emailComponents, newComponent]);
    } else {
      // Drop relative to target
      const updatedComponents = insertComponent(emailComponents, newComponent, targetId, position);
      setEmailComponents(updatedComponents);
    }
    
    // Reset drag state
    setIsDragging(false);
    setDraggedComponent(null);
    setDropIndicator(null);
    setSelectedComponent(newComponent);
  }, [emailComponents, setEmailComponents, setSelectedComponent]);

  // Insert component at specific position
  const insertComponent = (components, newComponent, targetId, position) => {
    if (position === 'inside') {
      // Insert inside a container
      return components.map(comp => {
        if (comp.id === targetId) {
          if (comp.type === 'container' || comp.type === 'columns') {
            return {
              ...comp,
              children: [...(comp.children || []), newComponent]
            };
          }
        } else if (comp.children) {
          return {
            ...comp,
            children: insertComponent(comp.children, newComponent, targetId, position)
          };
        }
        return comp;
      });
    } else {
      // Insert before or after
      const result = [];
      let inserted = false;
      
      for (const comp of components) {
        if (comp.id === targetId) {
          if (position === 'before') {
            result.push(newComponent);
            result.push(comp);
          } else {
            result.push(comp);
            result.push(newComponent);
          }
          inserted = true;
        } else {
          if (comp.children && !inserted) {
            result.push({
              ...comp,
              children: insertComponent(comp.children, newComponent, targetId, position)
            });
          } else {
            result.push(comp);
          }
        }
      }
      
      return result;
    }
  };

  // Delete component
  const deleteComponent = (componentId) => {
    const deleteFromComponents = (components) => {
      return components.filter(comp => {
        if (comp.id === componentId) {
          return false;
        }
        if (comp.children) {
          comp.children = deleteFromComponents(comp.children);
        }
        return true;
      });
    };
    
    setEmailComponents(deleteFromComponents(emailComponents));
    setSelectedComponent(null);
  };

  // Duplicate component
  const duplicateComponent = (component) => {
    const duplicate = {
      ...component,
      id: generateId(),
      children: component.children ? component.children.map(child => duplicateComponent(child)) : undefined
    };
    
    const insertAfter = (components) => {
      const result = [];
      for (const comp of components) {
        result.push(comp);
        if (comp.id === component.id) {
          result.push(duplicate);
        } else if (comp.children) {
          comp.children = insertAfter(comp.children);
        }
      }
      return result;
    };
    
    setEmailComponents(insertAfter(emailComponents));
  };

  // Move component up/down
  const moveComponent = (componentId, direction) => {
    const moveInArray = (components) => {
      const index = components.findIndex(c => c.id === componentId);
      if (index === -1) {
        // Check children
        return components.map(comp => ({
          ...comp,
          children: comp.children ? moveInArray(comp.children) : undefined
        }));
      }
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= components.length) return components;
      
      const result = [...components];
      [result[index], result[newIndex]] = [result[newIndex], result[index]];
      return result;
    };
    
    setEmailComponents(moveInArray(emailComponents));
  };

  // Render component
  const renderComponent = (component, depth = 0) => {
    const isSelected = selectedComponent?.id === component.id;
    const isContainer = component.type === 'container';
    const isColumns = component.type === 'columns';
    const hasDropIndicator = dropIndicator?.targetId === component.id;
    
    return (
      <div
        key={component.id}
        className={cn(
          "relative group transition-all",
          isSelected && "ring-2 ring-sky-blue ring-offset-2",
          hasDropIndicator && dropIndicator.position === 'before' && "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-sky-blue before:z-10",
          hasDropIndicator && dropIndicator.position === 'after' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-sky-blue after:z-10",
          hasDropIndicator && dropIndicator.position === 'inside' && "ring-2 ring-sky-blue ring-dashed"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(component);
        }}
        onDragOver={(e) => handleDragOver(e, component.id)}
        onDrop={(e) => handleDrop(e, component.id, dropIndicator?.position || 'inside')}
        style={getComponentStyles(component)}
      >
        {/* Component toolbar */}
        <div className={cn(
          "absolute -top-8 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20",
          isSelected && "opacity-100"
        )}>
          <div className="bg-slate-gray text-white text-xs px-2 py-1 rounded">
            {component.type}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              moveComponent(component.id, 'up');
            }}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              moveComponent(component.id, 'down');
            }}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              duplicateComponent(component);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              deleteComponent(component.id);
            }}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>

        {/* Component content */}
        {renderComponentContent(component)}
        
        {/* Children for containers */}
        {(isContainer || isColumns) && (
          <div className={cn(
            isColumns && "grid gap-4",
            isColumns && component.properties.columnCount === 2 && "grid-cols-2",
            isColumns && component.properties.columnCount === 3 && "grid-cols-3",
            isColumns && component.properties.columnCount === 4 && "grid-cols-4"
          )}>
            {component.children && component.children.length > 0 ? (
              component.children.map(child => renderComponent(child, depth + 1))
            ) : (
              <div 
                className="min-h-[50px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400"
                onDragOver={(e) => handleDragOver(e, component.id, 'inside')}
                onDrop={(e) => handleDrop(e, component.id, 'inside')}
              >
                Drop components here
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get component styles
  const getComponentStyles = (component) => {
    const props = component.properties;
    const styles = {};
    
    switch (component.type) {
      case 'container':
        styles.backgroundColor = props.backgroundColor;
        styles.padding = `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`;
        styles.margin = `${props.margin.top}px ${props.margin.right}px ${props.margin.bottom}px ${props.margin.left}px`;
        styles.borderRadius = `${props.borderRadius}px`;
        styles.maxWidth = props.maxWidth;
        if (props.alignment === 'center') styles.marginLeft = styles.marginRight = 'auto';
        break;
      
      case 'text':
      case 'heading':
        styles.fontSize = `${props.fontSize}px`;
        styles.fontFamily = props.fontFamily;
        styles.color = props.color;
        styles.textAlign = props.textAlign;
        styles.fontWeight = props.fontWeight;
        if (props.lineHeight) styles.lineHeight = props.lineHeight;
        break;
      
      case 'button':
        styles.backgroundColor = props.backgroundColor;
        styles.color = props.textColor;
        styles.fontSize = `${props.fontSize}px`;
        styles.fontFamily = props.fontFamily;
        styles.padding = `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`;
        styles.borderRadius = `${props.borderRadius}px`;
        styles.display = 'inline-block';
        styles.textDecoration = 'none';
        styles.textAlign = 'center';
        if (props.width === 'full') styles.width = '100%';
        break;
      
      case 'divider':
        styles.height = `${props.height}px`;
        styles.backgroundColor = props.color;
        styles.margin = `${props.margin.top}px ${props.margin.right}px ${props.margin.bottom}px ${props.margin.left}px`;
        break;
      
      case 'spacer':
        styles.height = `${props.height}px`;
        break;
    }
    
    return styles;
  };

  // Render component content
  const renderComponentContent = (component) => {
    const props = component.properties;
    
    switch (component.type) {
      case 'text':
        return <p style={getComponentStyles(component)}>{props.content}</p>;
      
      case 'heading':
        const HeadingTag = props.level || 'h2';
        return <HeadingTag style={getComponentStyles(component)}>{props.content}</HeadingTag>;
      
      case 'button':
        return (
          <div style={{ textAlign: props.alignment }}>
            <a href={props.url} style={getComponentStyles(component)}>
              {props.text}
            </a>
          </div>
        );
      
      case 'image':
        return (
          <div style={{ textAlign: props.alignment, padding: `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px` }}>
            <img 
              src={props.src} 
              alt={props.alt}
              style={{ 
                width: props.width, 
                height: props.height,
                display: 'inline-block'
              }}
            />
          </div>
        );
      
      case 'divider':
        return <hr style={getComponentStyles(component)} />;
      
      case 'spacer':
        return <div style={getComponentStyles(component)} />;
      
      case 'html':
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: props.content }}
            style={{ backgroundColor: props.backgroundColor }}
          />
        );
      
      case 'container':
      case 'columns':
        return null; // Children are rendered separately
      
      default:
        return <div>Unknown component type: {component.type}</div>;
    }
  };

  // Handle empty state
  if (emailComponents.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-full min-h-[600px] p-8"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null, 'root')}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-gray mb-2">
              Start Building Your Email
            </h3>
            <p className="text-gray-500">
              Drag components from the left panel or click below to add your first section
            </p>
          </div>
          
          <Button
            onClick={() => {
              const container = createComponent('container');
              setEmailComponents([container]);
              setSelectedComponent(container);
            }}
            className="w-full bg-vivid-violet hover:bg-deep-purple text-white"
          >
            Add First Section
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "min-h-[600px] bg-white rounded-lg",
        viewMode === 'mobile' && "max-w-sm mx-auto"
      )}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, null, 'root')}
    >
      <div className="p-4">
        {emailComponents.map(component => renderComponent(component))}
        
        {/* Drop zone at the end */}
        <div 
          className={cn(
            "min-h-[40px] border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 mt-4 transition-colors",
            dropIndicator?.targetId === 'end' && "border-sky-blue bg-sky-tint"
          )}
          onDragOver={(e) => handleDragOver(e, 'end', 'after')}
          onDrop={(e) => handleDrop(e, emailComponents[emailComponents.length - 1]?.id, 'after')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Drop component here
        </div>
      </div>
    </div>
  );
}