"use client";

import { 
  Hash, 
  Type, 
  Calendar, 
  ToggleLeft,
  AlertCircle,
  Check,
  Link,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/app/components/ui/badge";

const getTypeIcon = (type) => {
  switch (type) {
    case "string":
      return <Type className="h-3 w-3 text-orange-500" />;
    case "number":
      return <Hash className="h-3 w-3 text-blue-500" />;
    case "datetime":
      return <Calendar className="h-3 w-3 text-green-500" />;
    case "boolean":
      return <ToggleLeft className="h-3 w-3 text-purple-500" />;
    default:
      return <Type className="h-3 w-3 text-gray-400" />;
  }
};

function DestinationField({ 
  field, 
  isMapped, 
  mappedSource, 
  isSelected, 
  onSelect,
  onRemoveMapping
}) {
  const handleClick = () => {
    onSelect(field);
  };

  const handleRemoveMapping = (e) => {
    e.stopPropagation();
    onRemoveMapping(field.id);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group",
        "hover:shadow-md hover:scale-[1.02]",
        isMapped ? (
          "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        ) : isSelected ? (
          "bg-vivid-violet/10 dark:bg-vivid-violet/20 border-vivid-violet"
        ) : (
          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-vivid-violet/50"
        )
      )}
      onClick={handleClick}
      data-field-id={field.id}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {isMapped ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          ) : (
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              isSelected ? (
                "border-vivid-violet bg-vivid-violet/20"
              ) : (
                "border-gray-300 dark:border-gray-600 group-hover:border-vivid-violet"
              )
            )}>
              <Target className={cn(
                "h-3 w-3",
                isSelected ? "text-vivid-violet" : "text-gray-400 group-hover:text-vivid-violet"
              )} />
            </div>
          )}
        </div>

        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon(field.type)}
            <span className={cn(
              "font-medium text-sm",
              isMapped ? (
                "text-green-700 dark:text-green-400"
              ) : isSelected ? (
                "text-vivid-violet dark:text-vivid-violet"
              ) : (
                "text-slate-gray dark:text-white"
              )
            )}>
              {field.label}
            </span>
            
            {field.required && (
              <AlertCircle className="h-3 w-3 text-red-500" title="Required field" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
            
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>

          {/* Show mapped source if exists */}
          {isMapped && mappedSource && (
            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Link className="h-3 w-3" />
                <span className="font-mono">{mappedSource.path}</span>
              </div>
              <div className="text-green-600/80 dark:text-green-400/80 truncate">
                Value: {typeof mappedSource.value === "string" && mappedSource.value.length > 30 
                  ? `"${mappedSource.value.substring(0, 30)}..."` 
                  : JSON.stringify(mappedSource.value)}
              </div>
            </div>
          )}
        </div>

        {/* Remove Mapping Button */}
        {isMapped && (
          <button
            onClick={handleRemoveMapping}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove mapping"
          >
            <Link className="h-4 w-4 rotate-45" />
          </button>
        )}
      </div>
    </div>
  );
}

function FieldCategory({ category, fields, mappings, selectedDestination, onSelect, onRemoveMapping }) {
  const categoryFields = fields.filter(field => field.category === category);
  const mappedCount = categoryFields.filter(field => mappings.has(field.id)).length;

  return (
    <div className="space-y-3">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-gray dark:text-white flex items-center gap-2">
          {category}
        </h3>
        <Badge variant="outline" className="text-xs">
          {mappedCount}/{categoryFields.length} mapped
        </Badge>
      </div>

      {/* Category Fields */}
      <div className="space-y-2">
        {categoryFields.map((field) => {
          const isMapped = mappings.has(field.id);
          const mappedSource = isMapped ? mappings.get(field.id) : null;
          const isSelected = selectedDestination?.id === field.id;

          return (
            <DestinationField
              key={field.id}
              field={field}
              isMapped={isMapped}
              mappedSource={mappedSource}
              isSelected={isSelected}
              onSelect={onSelect}
              onRemoveMapping={onRemoveMapping}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function DestinationFields({ 
  fields, 
  mappings, 
  selectedDestination, 
  onSelect, 
  onRemoveMapping 
}) {
  // Group fields by category
  const categories = [...new Set(fields.map(field => field.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <FieldCategory
          key={category}
          category={category}
          fields={fields}
          mappings={mappings}
          selectedDestination={selectedDestination}
          onSelect={onSelect}
          onRemoveMapping={onRemoveMapping}
        />
      ))}
    </div>
  );
}