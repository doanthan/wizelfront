"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Layers,
  Type,
  Heading,
  Image,
  MousePointer,
  Square,
  Columns,
  Code,
  Divide,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Link,
  Settings
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export default function PropertiesPanelV2({ 
  selectedComponent, 
  emailComponents, 
  setEmailComponents,
  setSelectedComponent 
}) {
  const [localProperties, setLocalProperties] = useState({});

  useEffect(() => {
    if (selectedComponent) {
      setLocalProperties(selectedComponent.properties || {});
    }
  }, [selectedComponent]);

  // Update component properties
  const updateComponentProperties = (updates) => {
    if (!selectedComponent) return;
    
    const newProperties = { ...localProperties, ...updates };
    setLocalProperties(newProperties);
    
    // Update in the main components array
    const updateInTree = (components) => {
      return components.map(comp => {
        if (comp.id === selectedComponent.id) {
          return { ...comp, properties: newProperties };
        }
        if (comp.children) {
          return { ...comp, children: updateInTree(comp.children) };
        }
        return comp;
      });
    };
    
    setEmailComponents(updateInTree(emailComponents));
    setSelectedComponent({ ...selectedComponent, properties: newProperties });
  };

  // Update nested properties (like padding, margin)
  const updateNestedProperty = (propertyName, field, value) => {
    const updated = {
      [propertyName]: {
        ...localProperties[propertyName],
        [field]: parseInt(value) || 0
      }
    };
    updateComponentProperties(updated);
  };

  if (!selectedComponent) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-gray mb-4">Properties</h2>
        <div className="text-center py-8">
          <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No component selected</p>
          <p className="text-sm text-gray-400 mt-1">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const renderComponentProperties = () => {
    switch (selectedComponent.type) {
      case 'container':
        return <ContainerProperties />;
      case 'columns':
        return <ColumnsProperties />;
      case 'text':
        return <TextProperties />;
      case 'heading':
        return <HeadingProperties />;
      case 'button':
        return <ButtonProperties />;
      case 'image':
        return <ImageProperties />;
      case 'divider':
        return <DividerProperties />;
      case 'spacer':
        return <SpacerProperties />;
      case 'html':
        return <HtmlProperties />;
      default:
        return <div>No properties available for this component</div>;
    }
  };

  // Container Properties Component
  const ContainerProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Background Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={localProperties.backgroundColor || '#ffffff'}
            onChange={(e) => updateComponentProperties({ backgroundColor: e.target.value })}
            className="w-12 h-8 p-1"
          />
          <Input
            value={localProperties.backgroundColor || '#ffffff'}
            onChange={(e) => updateComponentProperties({ backgroundColor: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Padding</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Top</Label>
            <Input
              type="number"
              value={localProperties.padding?.top || 0}
              onChange={(e) => updateNestedProperty('padding', 'top', e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Right</Label>
            <Input
              type="number"
              value={localProperties.padding?.right || 0}
              onChange={(e) => updateNestedProperty('padding', 'right', e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Bottom</Label>
            <Input
              type="number"
              value={localProperties.padding?.bottom || 0}
              onChange={(e) => updateNestedProperty('padding', 'bottom', e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Left</Label>
            <Input
              type="number"
              value={localProperties.padding?.left || 0}
              onChange={(e) => updateNestedProperty('padding', 'left', e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Max Width</Label>
        <Input
          value={localProperties.maxWidth || '600px'}
          onChange={(e) => updateComponentProperties({ maxWidth: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Alignment</Label>
        <Select 
          value={localProperties.alignment || 'center'}
          onValueChange={(value) => updateComponentProperties({ alignment: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Border Radius</Label>
        <Input
          type="number"
          value={localProperties.borderRadius || 0}
          onChange={(e) => updateComponentProperties({ borderRadius: parseInt(e.target.value) || 0 })}
          className="mt-1"
        />
      </div>
    </div>
  );

  // Columns Properties Component
  const ColumnsProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Number of Columns</Label>
        <Select 
          value={String(localProperties.columnCount || 2)}
          onValueChange={(value) => updateComponentProperties({ columnCount: parseInt(value) })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Gap Between Columns</Label>
        <Input
          type="number"
          value={localProperties.gap || 20}
          onChange={(e) => updateComponentProperties({ gap: parseInt(e.target.value) || 0 })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Vertical Alignment</Label>
        <Select 
          value={localProperties.verticalAlignment || 'top'}
          onValueChange={(value) => updateComponentProperties({ verticalAlignment: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="middle">Middle</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localProperties.stackOnMobile !== false}
            onChange={(e) => updateComponentProperties({ stackOnMobile: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Stack on Mobile</span>
        </Label>
      </div>
    </div>
  );

  // Text Properties Component
  const TextProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Content</Label>
        <Textarea
          value={localProperties.content || ''}
          onChange={(e) => updateComponentProperties({ content: e.target.value })}
          className="mt-1 min-h-[100px]"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Font Size</Label>
        <Input
          type="number"
          value={localProperties.fontSize || 14}
          onChange={(e) => updateComponentProperties({ fontSize: parseInt(e.target.value) || 14 })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Font Family</Label>
        <Select 
          value={localProperties.fontFamily || 'Arial, sans-serif'}
          onValueChange={(value) => updateComponentProperties({ fontFamily: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
            <SelectItem value="Georgia, serif">Georgia</SelectItem>
            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
            <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Text Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={localProperties.color || '#333333'}
            onChange={(e) => updateComponentProperties({ color: e.target.value })}
            className="w-12 h-8 p-1"
          />
          <Input
            value={localProperties.color || '#333333'}
            onChange={(e) => updateComponentProperties({ color: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Text Alignment</Label>
        <div className="flex gap-1">
          <Button
            variant={localProperties.textAlign === 'left' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateComponentProperties({ textAlign: 'left' })}
            className="flex-1"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={localProperties.textAlign === 'center' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateComponentProperties({ textAlign: 'center' })}
            className="flex-1"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={localProperties.textAlign === 'right' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateComponentProperties({ textAlign: 'right' })}
            className="flex-1"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant={localProperties.textAlign === 'justify' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateComponentProperties({ textAlign: 'justify' })}
            className="flex-1"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Text Style</Label>
        <div className="flex gap-2">
          <Button
            variant={localProperties.fontWeight === 'bold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateComponentProperties({ 
              fontWeight: localProperties.fontWeight === 'bold' ? 'normal' : 'bold' 
            })}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={localProperties.fontStyle === 'italic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateComponentProperties({ 
              fontStyle: localProperties.fontStyle === 'italic' ? 'normal' : 'italic' 
            })}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={localProperties.textDecoration === 'underline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateComponentProperties({ 
              textDecoration: localProperties.textDecoration === 'underline' ? 'none' : 'underline' 
            })}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Line Height</Label>
        <Input
          type="number"
          step="0.1"
          value={localProperties.lineHeight || 1.5}
          onChange={(e) => updateComponentProperties({ lineHeight: parseFloat(e.target.value) || 1.5 })}
          className="mt-1"
        />
      </div>
    </div>
  );

  // Heading Properties Component
  const HeadingProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Heading Text</Label>
        <Input
          value={localProperties.content || ''}
          onChange={(e) => updateComponentProperties({ content: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Heading Level</Label>
        <Select 
          value={localProperties.level || 'h2'}
          onValueChange={(value) => updateComponentProperties({ level: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1 - Main Title</SelectItem>
            <SelectItem value="h2">H2 - Section Title</SelectItem>
            <SelectItem value="h3">H3 - Subsection</SelectItem>
            <SelectItem value="h4">H4 - Minor Heading</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TextProperties />
    </div>
  );

  // Button Properties Component
  const ButtonProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Button Text</Label>
        <Input
          value={localProperties.text || ''}
          onChange={(e) => updateComponentProperties({ text: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Link URL</Label>
        <Input
          value={localProperties.url || ''}
          onChange={(e) => updateComponentProperties({ url: e.target.value })}
          placeholder="https://example.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Background Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={localProperties.backgroundColor || '#60A5FA'}
            onChange={(e) => updateComponentProperties({ backgroundColor: e.target.value })}
            className="w-12 h-8 p-1"
          />
          <Input
            value={localProperties.backgroundColor || '#60A5FA'}
            onChange={(e) => updateComponentProperties({ backgroundColor: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Text Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={localProperties.textColor || '#FFFFFF'}
            onChange={(e) => updateComponentProperties({ textColor: e.target.value })}
            className="w-12 h-8 p-1"
          />
          <Input
            value={localProperties.textColor || '#FFFFFF'}
            onChange={(e) => updateComponentProperties({ textColor: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Padding</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Top/Bottom</Label>
            <Input
              type="number"
              value={localProperties.padding?.top || 12}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                updateComponentProperties({
                  padding: {
                    ...localProperties.padding,
                    top: value,
                    bottom: value
                  }
                });
              }}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Left/Right</Label>
            <Input
              type="number"
              value={localProperties.padding?.left || 24}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                updateComponentProperties({
                  padding: {
                    ...localProperties.padding,
                    left: value,
                    right: value
                  }
                });
              }}
              className="h-8"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Border Radius</Label>
        <Input
          type="number"
          value={localProperties.borderRadius || 8}
          onChange={(e) => updateComponentProperties({ borderRadius: parseInt(e.target.value) || 0 })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Width</Label>
        <Select 
          value={localProperties.width || 'auto'}
          onValueChange={(value) => updateComponentProperties({ width: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Alignment</Label>
        <Select 
          value={localProperties.alignment || 'center'}
          onValueChange={(value) => updateComponentProperties({ alignment: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Image Properties Component
  const ImageProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Image Source</Label>
        <Input
          value={localProperties.src || ''}
          onChange={(e) => updateComponentProperties({ src: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Alt Text</Label>
        <Input
          value={localProperties.alt || ''}
          onChange={(e) => updateComponentProperties({ alt: e.target.value })}
          placeholder="Describe the image"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Width</Label>
        <Input
          value={localProperties.width || '100%'}
          onChange={(e) => updateComponentProperties({ width: e.target.value })}
          placeholder="100% or 300px"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Height</Label>
        <Input
          value={localProperties.height || 'auto'}
          onChange={(e) => updateComponentProperties({ height: e.target.value })}
          placeholder="auto or 200px"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Link URL (optional)</Label>
        <Input
          value={localProperties.link || ''}
          onChange={(e) => updateComponentProperties({ link: e.target.value })}
          placeholder="https://example.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Alignment</Label>
        <Select 
          value={localProperties.alignment || 'center'}
          onValueChange={(value) => updateComponentProperties({ alignment: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Divider Properties Component
  const DividerProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Height</Label>
        <Input
          type="number"
          value={localProperties.height || 1}
          onChange={(e) => updateComponentProperties({ height: parseInt(e.target.value) || 1 })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={localProperties.color || '#e5e7eb'}
            onChange={(e) => updateComponentProperties({ color: e.target.value })}
            className="w-12 h-8 p-1"
          />
          <Input
            value={localProperties.color || '#e5e7eb'}
            onChange={(e) => updateComponentProperties({ color: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Margin</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Top</Label>
            <Input
              type="number"
              value={localProperties.margin?.top || 20}
              onChange={(e) => updateNestedProperty('margin', 'top', e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Bottom</Label>
            <Input
              type="number"
              value={localProperties.margin?.bottom || 20}
              onChange={(e) => updateNestedProperty('margin', 'bottom', e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Spacer Properties Component
  const SpacerProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Height</Label>
        <Input
          type="number"
          value={localProperties.height || 20}
          onChange={(e) => updateComponentProperties({ height: parseInt(e.target.value) || 20 })}
          className="mt-1"
        />
      </div>
    </div>
  );

  // HTML Properties Component
  const HtmlProperties = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700">Custom HTML</Label>
        <Textarea
          value={localProperties.content || ''}
          onChange={(e) => updateComponentProperties({ content: e.target.value })}
          className="mt-1 font-mono text-xs min-h-[200px]"
          placeholder="<div>Your custom HTML here</div>"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Background Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={localProperties.backgroundColor || 'transparent'}
            onChange={(e) => updateComponentProperties({ backgroundColor: e.target.value })}
            className="w-12 h-8 p-1"
          />
          <Input
            value={localProperties.backgroundColor || 'transparent'}
            onChange={(e) => updateComponentProperties({ backgroundColor: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-slate-gray mb-4">Properties</h2>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <ComponentIcon type={selectedComponent.type} />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1)}
            </p>
            <p className="text-xs text-gray-500">ID: {selectedComponent.id}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="mt-4">
          {renderComponentProperties()}
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Custom CSS Class</Label>
              <Input
                value={localProperties.className || ''}
                onChange={(e) => updateComponentProperties({ className: e.target.value })}
                placeholder="custom-class"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Custom ID</Label>
              <Input
                value={localProperties.customId || ''}
                onChange={(e) => updateComponentProperties({ customId: e.target.value })}
                placeholder="custom-id"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Hide on Mobile</Label>
              <input
                type="checkbox"
                checked={localProperties.hideOnMobile || false}
                onChange={(e) => updateComponentProperties({ hideOnMobile: e.target.checked })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Hide on Desktop</Label>
              <input
                type="checkbox"
                checked={localProperties.hideOnDesktop || false}
                onChange={(e) => updateComponentProperties({ hideOnDesktop: e.target.checked })}
                className="mt-1"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component Icon Helper
const ComponentIcon = ({ type }) => {
  const icons = {
    container: Square,
    columns: Columns,
    text: Type,
    heading: Heading,
    button: MousePointer,
    image: Image,
    divider: Divide,
    spacer: Code,
    html: Code
  };
  
  const Icon = icons[type] || Square;
  return <Icon className="h-5 w-5 text-gray-600" />;
};