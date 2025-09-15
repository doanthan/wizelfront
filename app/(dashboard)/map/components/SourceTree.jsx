"use client";

import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Hash, 
  Type, 
  Calendar, 
  ToggleLeft,
  Database,
  Braces,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";

const getDataTypeIcon = (value, path) => {
  if (value === null) return <Hash className="h-3 w-3 text-gray-400" />;
  if (typeof value === "boolean") return <ToggleLeft className="h-3 w-3 text-purple-500" />;
  if (typeof value === "number") return <Hash className="h-3 w-3 text-blue-500" />;
  if (typeof value === "string") {
    // Check if it looks like a date
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || value.includes("T") && value.includes("Z")) {
      return <Calendar className="h-3 w-3 text-green-500" />;
    }
    return <Type className="h-3 w-3 text-orange-500" />;
  }
  if (Array.isArray(value)) return <List className="h-3 w-3 text-indigo-500" />;
  if (typeof value === "object") return <Braces className="h-3 w-3 text-sky-blue" />;
  return <Database className="h-3 w-3 text-gray-400" />;
};

const getDataTypeLabel = (value) => {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || value.includes("T") && value.includes("Z")) {
      return "datetime";
    }
    return "string";
  }
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "unknown";
};

const formatValue = (value) => {
  if (value === null) return "null";
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") {
    // Truncate long strings
    if (value.length > 40) {
      return `"${value.substring(0, 40)}..."`;
    }
    return `"${value}"`;
  }
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `{${keys.length} fields}`;
  }
  return String(value);
};

function TreeNode({ 
  keyName, 
  value, 
  path, 
  level = 0, 
  isLast = false,
  expandedNodes,
  selectedSource,
  onToggle,
  onSelect 
}) {
  const fullPath = path ? `${path}.${keyName}` : keyName;
  const isExpanded = expandedNodes.has(fullPath);
  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isLeaf = !isObject && !isArray;
  const isSelected = selectedSource?.path === fullPath;

  const handleToggle = () => {
    if (isObject || isArray) {
      onToggle(fullPath);
    }
  };

  const handleSelect = () => {
    if (isLeaf) {
      onSelect(fullPath, value);
    }
  };

  const indentLevel = level * 16; // 16px per level

  return (
    <div className="select-none">
      {/* Node Header */}
      <div 
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-150 group",
          "hover:bg-sky-tint/20 dark:hover:bg-sky-blue/10",
          isSelected && "bg-sky-blue/20 dark:bg-sky-blue/30 border-l-2 border-sky-blue",
          isLeaf && "hover:bg-green-50 dark:hover:bg-green-900/20",
          isSelected && isLeaf && "bg-green-100 dark:bg-green-900/30"
        )}
        style={{ marginLeft: `${indentLevel}px` }}
        onClick={isLeaf ? handleSelect : handleToggle}
        data-source-path={isLeaf ? fullPath : undefined}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-4 h-4 flex items-center justify-center">
          {(isObject || isArray) ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className="p-0.5 rounded hover:bg-sky-blue/20 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-neutral-gray" />
              ) : (
                <ChevronRight className="h-3 w-3 text-neutral-gray" />
              )}
            </button>
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>

        {/* Data Type Icon */}
        {getDataTypeIcon(value, fullPath)}

        {/* Key Name */}
        <span className={cn(
          "font-medium text-sm",
          isSelected ? "text-sky-blue dark:text-sky-blue" : "text-slate-gray dark:text-white"
        )}>
          {keyName}
        </span>

        {/* Type Badge */}
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded font-mono",
          "bg-gray-100 dark:bg-gray-800 text-neutral-gray dark:text-gray-400"
        )}>
          {getDataTypeLabel(value)}
        </span>

        {/* Value Preview */}
        {isLeaf && (
          <span className={cn(
            "text-xs font-mono flex-1 truncate ml-2",
            "text-neutral-gray dark:text-gray-400 group-hover:text-slate-gray dark:group-hover:text-gray-300"
          )}>
            {formatValue(value)}
          </span>
        )}

        {/* Mapping Indicator */}
        {isSelected && (
          <div className="w-2 h-2 bg-sky-blue rounded-full animate-pulse" />
        )}
      </div>

      {/* Children */}
      {(isObject || isArray) && isExpanded && (
        <div className="mt-1">
          {isArray ? (
            // Array items
            value.map((item, index) => (
              <TreeNode
                key={index}
                keyName={`[${index}]`}
                value={item}
                path={fullPath}
                level={level + 1}
                isLast={index === value.length - 1}
                expandedNodes={expandedNodes}
                selectedSource={selectedSource}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))
          ) : (
            // Object properties
            Object.entries(value).map(([key, val], index, entries) => (
              <TreeNode
                key={key}
                keyName={key}
                value={val}
                path={fullPath}
                level={level + 1}
                isLast={index === entries.length - 1}
                expandedNodes={expandedNodes}
                selectedSource={selectedSource}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function SourceTree({ 
  data, 
  expandedNodes, 
  selectedSource, 
  onToggle, 
  onSelect 
}) {
  return (
    <div className="space-y-1">
      {Object.entries(data).map(([key, value], index, entries) => (
        <TreeNode
          key={key}
          keyName={key}
          value={value}
          path=""
          level={0}
          isLast={index === entries.length - 1}
          expandedNodes={expandedNodes}
          selectedSource={selectedSource}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}