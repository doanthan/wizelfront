"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Edit3, Trash2, Copy, Move } from "lucide-react";

export default function ContentBlockControls({ 
  blockId, 
  onEdit, 
  onDelete, 
  onDuplicate,
  position = "right" // "left" | "right"
}) {
  return (
    <div className={cn(
      "absolute flex flex-col gap-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-1",
      position === "right" ? "-right-12 top-0" : "-left-12 top-0"
    )}>
      <button
        onClick={() => onEdit && onEdit(blockId)}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-purple-600 transition-colors"
        title="Edit content"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => onDuplicate && onDuplicate(blockId)}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-blue-600 transition-colors"
        title="Duplicate"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={() => onDelete && onDelete(blockId)}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}