"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Plus, Trash2, Copy } from "lucide-react";
import DropZone from "./drag-drop-system/DropZone";
import EmailCanvasDropZone from "./drag-drop-system/EmailCanvasDropZone";
import SectionControls from "./section-controls";
import ContentBlock from "./content-block";

// Email Section Component
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
  hoveredSectionId,
  setHoveredSectionId,
  hoveredBlockId,
  setHoveredBlockId,
  onEditBlock,
  onDeleteBlock,
  onDuplicateBlock
}) => {
  const sectionRef = useRef(null);
  const isHovered = hoveredSectionId === section.id;

  return (
    <div
      ref={sectionRef}
      className={cn(
        "relative transition-all duration-200 group",
        isSelected && "border-2 border-purple-500 shadow-lg shadow-purple-500/10",
        isHovered && !isSelected && "border border-gray-200 bg-purple-50/30"
      )}
      onMouseEnter={() => setHoveredSectionId(section.id)}
      onMouseLeave={() => setHoveredSectionId(null)}
      onClick={() => onSelect(section)}
      data-section-id={section.id}
    >
      {/* Section Controls - only show on hover */}
      {isHovered && (
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
        section.type === 'columns' && "grid gap-0",
        section.type === 'columns' && section.columns === 2 && "grid-cols-2",
        section.type === 'columns' && section.columns === 3 && "grid-cols-3"
      )}>
        {section.children && section.children.length > 0 ? (
          section.children.map((child, childIndex) => (
            <ContentBlock
              key={child.id}
              block={child}
              hoveredBlockId={hoveredBlockId}
              setHoveredBlockId={setHoveredBlockId}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
              onDuplicate={onDuplicateBlock}
              onUpdate={handleUpdateBlock}
              selectedBrand={selectedBrand}
            >
              {renderContent(child)}
            </ContentBlock>
          ))
        ) : (
          <div className="min-h-[80px] border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
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
      return (
        <div style={{ 
          textAlign: props.textAlign || 'left',
          padding: '16px'
        }}>
          <p style={{ 
            fontSize: props.fontSize || '16px', 
            color: props.color || '#374151',
            margin: 0,
            lineHeight: 1.5
          }}>
            {props.content || 'This is sample text content. Click to edit.'}
          </p>
        </div>
      );
    case 'button':
      return (
        <div style={{ 
          textAlign: props.alignment || 'left',
          padding: '16px'
        }}>
          <a 
            href={props.url || '#'} 
            style={{
              backgroundColor: props.backgroundColor || '#60A5FA',
              color: props.textColor || '#FFFFFF',
              padding: `${props.padding?.top || 12}px ${props.padding?.right || 24}px ${props.padding?.bottom || 12}px ${props.padding?.left || 24}px`,
              borderRadius: `${props.borderRadius || 8}px`,
              display: 'inline-block',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {props.text || 'Click Here'}
          </a>
        </div>
      );
    case 'image':
      return (
        <div style={{ 
          textAlign: props.alignment || 'left',
          padding: '16px'
        }}>
          <img 
            src={props.src || 'https://via.placeholder.com/400x200/60A5FA/FFFFFF?text=Sample+Image'} 
            alt={props.alt || 'Sample Image'} 
            style={{ 
              width: props.width || 'auto', 
              height: props.height || 'auto', 
              maxWidth: '100%',
              display: 'block'
            }} 
          />
        </div>
      );
    case 'divider':
      return (
        <div style={{ padding: '16px 0' }}>
          <hr style={{ 
            height: `${props.height || 2}px`, 
            backgroundColor: props.color || '#E5E7EB', 
            border: 'none',
            margin: 0
          }} />
        </div>
      );
    case 'spacer':
      return <div style={{ height: `${props.height || 40}px` }} />;
    default:
      return <div className="p-4 bg-gray-100 rounded">New {component.type} section</div>;
  }
};

// Main Canvas Component
export default function EmailCanvasV4({
  sections,
  setSections,
  selectedSection,
  setSelectedSection,
  viewMode = 'desktop',
  selectedBrand
}) {
  const [hoveredSectionId, setHoveredSectionId] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  
  // Create new section with content
  const createNewSection = (type = 'container') => {
    const id = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const childId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create default content based on type
    let children = [];
    if (type !== 'container' && type !== 'columns') {
      children = [{
        id: childId,
        type: type,
        properties: getDefaultProperties(type)
      }];
    }
    
    return {
      id,
      type: type === 'columns' ? 'columns' : 'container',
      columns: type === 'columns' ? 2 : undefined,
      children,
      properties: {
        backgroundColor: '#ffffff',
        padding: { top: 20, right: 20, bottom: 20, left: 20 }
      }
    };
  };

  // Get default properties for component types
  const getDefaultProperties = (type) => {
    switch (type) {
      case 'text':
        return {
          content: 'This is sample text content. Click to edit.',
          fontSize: '16px',
          color: '#374151',
          textAlign: 'left'
        };
      case 'button':
        return {
          text: 'Click Here',
          backgroundColor: '#60A5FA',
          textColor: '#FFFFFF',
          url: '#',
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
          borderRadius: 8,
          alignment: 'left'
        };
      case 'image':
        return {
          src: 'https://via.placeholder.com/400x200/60A5FA/FFFFFF?text=Sample+Image',
          alt: 'Sample Image',
          width: '400px',
          height: '200px',
          alignment: 'left'
        };
      case 'divider':
        return {
          height: 2,
          color: '#E5E7EB'
        };
      case 'spacer':
        return {
          height: 40
        };
      default:
        return {};
    }
  };

  // Handle drop on canvas (when empty)
  const handleCanvasDrop = (block) => {
    const newSection = createNewSection(block.type || 'container');
    setSections([newSection]);
    setSelectedSection(newSection);
  };

  // Handle drop between sections
  const handleSectionDrop = (block, index) => {
    const newSection = createNewSection(block.type || 'container');
    const newSections = [...sections];
    newSections.splice(index, 0, newSection);
    setSections(newSections);
    setSelectedSection(newSection);
  };

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

  // Content block handlers
  const handleEditBlock = (blockId) => {
    // Find the block and section
    sections.forEach(section => {
      const block = section.children?.find(child => child.id === blockId);
      if (block) {
        setSelectedSection(section);
        // You can add more specific block editing logic here
        console.log('Edit block:', block);
      }
    });
  };

  const handleUpdateBlock = (updatedBlock) => {
    setSections(sections.map(section => ({
      ...section,
      children: section.children?.map(child => 
        child.id === updatedBlock.id ? updatedBlock : child
      ) || []
    })));
  };

  const handleDeleteBlock = (blockId) => {
    setSections(sections.map(section => ({
      ...section,
      children: section.children?.filter(child => child.id !== blockId) || []
    })));
    setHoveredBlockId(null);
  };

  const handleDuplicateBlock = (blockId) => {
    setSections(sections.map(section => {
      const blockIndex = section.children?.findIndex(child => child.id === blockId);
      if (blockIndex !== -1 && section.children) {
        const originalBlock = section.children[blockIndex];
        const duplicatedBlock = {
          ...originalBlock,
          id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        const newChildren = [...section.children];
        newChildren.splice(blockIndex + 1, 0, duplicatedBlock);
        return {
          ...section,
          children: newChildren
        };
      }
      return section;
    }));
  };

  return (
    <div className={cn(
      "h-full overflow-auto bg-gray-50 p-8",
      viewMode === 'mobile' && "max-w-sm mx-auto"
    )}>
      <div className="max-w-3xl mx-auto">
        {sections.length === 0 ? (
          // Empty canvas state
          <EmailCanvasDropZone
            isEmpty={true}
            onDrop={handleCanvasDrop}
            className="bg-white rounded-lg shadow-sm"
          />
        ) : (
          <EmailCanvasDropZone
            onDrop={(block) => handleSectionDrop(block, sections.length)}
            className="bg-white rounded-lg shadow-sm"
          >
            {/* Top drop zone */}
            <DropZone 
              onDrop={handleSectionDrop} 
              index={0}
              className="h-1"
            />
            
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
                  hoveredSectionId={hoveredSectionId}
                  setHoveredSectionId={setHoveredSectionId}
                  hoveredBlockId={hoveredBlockId}
                  setHoveredBlockId={setHoveredBlockId}
                  onEditBlock={handleEditBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                />
                
                {/* Drop zone after each section */}
                <DropZone 
                  onDrop={handleSectionDrop} 
                  index={index + 1}
                  className="h-1"
                />
              </React.Fragment>
            ))}
          </EmailCanvasDropZone>
        )}
      </div>
    </div>
  );
}