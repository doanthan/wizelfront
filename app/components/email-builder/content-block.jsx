"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import ContentBlockControls from "./content-block-controls";
import InlineTextEditor from "./InlineTextEditor";

export default function ContentBlock({ 
  block, 
  children, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onUpdate,
  hoveredBlockId,
  setHoveredBlockId,
  selectedBrand
}) {
  const blockRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const isHovered = hoveredBlockId === block.id;

  const handleEdit = () => {
    if (block.type === 'text') {
      setIsEditing(true);
    } else {
      onEdit?.(block.id);
    }
  };

  const handleUpdate = (updatedBlock) => {
    onUpdate?.(updatedBlock);
  };

  const handleStopEditing = () => {
    setIsEditing(false);
  };

  return (
    <div
      ref={blockRef}
      className={cn(
        "relative transition-all duration-200 group",
        isHovered && "ring-2 ring-purple-300 ring-opacity-50 rounded",
        isEditing && "ring-2 ring-purple-500 rounded"
      )}
      onMouseEnter={() => !isEditing && setHoveredBlockId(block.id)}
      onMouseLeave={() => !isEditing && setHoveredBlockId(null)}
      onClick={() => {
        if (block.type === 'text' && !isEditing) {
          handleEdit();
        }
      }}
      data-block-id={block.id}
    >
      {/* Content Block Controls - show on right side when hovering */}
      {isHovered && !isEditing && (
        <ContentBlockControls
          blockId={block.id}
          onEdit={handleEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          position="right"
        />
      )}
      
      {/* Render text editor for text blocks, regular content for others */}
      {block.type === 'text' ? (
        <InlineTextEditor
          element={block}
          onUpdate={handleUpdate}
          selectedBrand={selectedBrand}
          isEditing={isEditing}
          onStopEditing={handleStopEditing}
        />
      ) : (
        children
      )}
    </div>
  );
}