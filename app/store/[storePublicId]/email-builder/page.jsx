"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
// import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  Type, 
  Heading, 
  Image, 
  MousePointer, 
  Square, 
  Columns, 
  Minus,
  Plus,
  Undo,
  Redo,
  Save,
  ChevronDown,
  Layers,
  Upload,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Link,
  Trash2,
  Copy,
  Eye,
  Code,
  Smartphone,
  Monitor,
  Settings,
  ArrowLeft,
  Table,
  Divide,
  Gift,
  X,
  Store,
  Loader2,
  Share2,
  Video,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/hooks/use-toast";
import QuickAddPanelV4 from "@/app/components/email-builder/quick-add-panel-v4";
import EmailCanvasV2 from "@/app/components/email-builder/email-canvas-v2";
import EmailCanvasV3 from "@/app/components/email-builder/email-canvas-v3";
import EmailCanvasV4 from "@/app/components/email-builder/email-canvas-v4";
import PropertiesPanelV2 from "@/app/components/email-builder/properties-panel-v2";
import DraggableBlock from "@/app/components/email-builder/drag-drop-system/DraggableBlock";
import dragDropManager from "@/app/components/email-builder/drag-drop-manager";

// Component definitions for the sidebar
const componentCategories = {
  content: [
    { id: 'text', name: 'Text Block', icon: Type, description: 'Add text content', type: 'text' },
    { id: 'image', name: 'Image', icon: Image, description: 'Add images', type: 'image' },
    { id: 'button', name: 'Button', icon: MousePointer, description: 'Add call-to-action buttons', type: 'button' },
  ],
  layout: [
    { id: 'container', name: 'Container', icon: Square, description: 'Group elements', type: 'container' },
    { id: 'columns', name: 'Columns', icon: Columns, description: 'Multi-column layout', type: 'columns' },
    { id: 'spacer', name: 'Spacer', icon: Code, description: 'Add spacing', type: 'spacer' },
    { id: 'divider', name: 'Divider', icon: Divide, description: 'Visual separator', type: 'divider' },
  ],
  advanced: [
    { id: 'html', name: 'HTML Block', icon: Hash, description: 'Custom HTML content', type: 'html' },
    { id: 'video', name: 'Video', icon: Video, description: 'Embed videos', type: 'video' },
    { id: 'social', name: 'Social Icons', icon: Share2, description: 'Social media links', type: 'social' },
  ]
};

export default function StoreEmailBuilderPage() {
  const router = useRouter();
  const params = useParams(); // Client component, no await needed
  const { toast } = useToast();
  const canvasRef = useRef(null);
  
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [emailComponents, setEmailComponents] = useState([]);
  
  // Initialize with empty sections for V3 canvas
  const [emailSections, setEmailSections] = useState([]); // For V3 canvas
  const [selectedSection, setSelectedSection] = useState(null); // For V3 canvas
  const [isDragging, setIsDragging] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [draggedOver, setDraggedOver] = useState(null);
  const [canvasVersion, setCanvasVersion] = useState('v4'); // v2, v3, v4
  const [activeTab, setActiveTab] = useState('components');
  const [viewMode, setViewMode] = useState('desktop');
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [currentStore, setCurrentStore] = useState(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [currentBrand, setCurrentBrand] = useState(null);

  // Track mouse position for drag operations (V3 canvas)
  useEffect(() => {
    if (canvasVersion !== 'v3') return;
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        dragDropManager.updateActiveDropTarget(e.clientX, e.clientY);
      }
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        dragDropManager.handleDrop();
        setIsDragging(false);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, canvasVersion]);

  useEffect(() => {
    // Fetch store data directly
    const fetchStore = async () => {
      if (!params.storePublicId) {
        setIsLoadingStore(false);
        return;
      }

      try {
        const response = await fetch(`/api/store/${params.storePublicId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentStore(data.store);
        } else {
          toast({
            title: "Store not found",
            description: "Please select a valid store.",
            variant: "destructive"
          });
          router.push('/email-builder');
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        toast({
          title: "Error",
          description: "Failed to load store data.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingStore(false);
      }
    };

    fetchStore();
  }, [params.storePublicId, router, toast]);

  // Handle drag start
  const handleDragStart = (e, component) => {
    setIsDragging(true);
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Set both componentType and componenttype for compatibility
    e.dataTransfer.setData('componentType', component.type || component.id);
    e.dataTransfer.setData('componenttype', component.type || component.id);
    e.dataTransfer.setData('text/plain', JSON.stringify(component));
    
    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
    
    // Register with DragDropManager for V3 canvas
    if (canvasVersion === 'v3') {
      dragDropManager.startDrag(component, component.type || 'section');
    }
  };
  
  // Handle drag end
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setIsDragging(false);
    setDraggedComponent(null);
    setDraggedOver(null);
    
    // End drag in DragDropManager for V3 canvas
    if (canvasVersion === 'v3') {
      dragDropManager.endDrag();
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (draggedComponent) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newComponent = {
        id: Date.now(),
        type: draggedComponent.id,
        name: draggedComponent.name,
        icon: draggedComponent.icon,
        x,
        y,
        content: getDefaultContent(draggedComponent.id),
        styles: getDefaultStyles(draggedComponent.id)
      };
      
      setEmailComponents([...emailComponents, newComponent]);
      setSelectedComponent(newComponent);
      setDraggedComponent(null);
    }
  };

  // Get default content for component types
  const getDefaultContent = (type) => {
    switch(type) {
      case 'text':
      case 'text-basic':
        return 'Your text goes here. Click to edit.';
      case 'heading':
        return 'Your Heading';
      case 'button':
      case 'button-basic':
        return 'Click Me';
      case 'image':
      case 'image-basic':
        return '/api/placeholder/600/400';
      default:
        return '';
    }
  };

  // Get default styles for component types
  const getDefaultStyles = (type) => {
    switch(type) {
      case 'heading':
        return { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' };
      case 'text':
      case 'text-basic':
        return { fontSize: '14px', color: '#475569' };
      case 'button':
      case 'button-basic':
        return { 
          backgroundColor: '#60A5FA', 
          color: '#FFFFFF', 
          padding: '10px 20px',
          borderRadius: '8px',
          textAlign: 'center'
        };
      default:
        return {};
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setRedoStack([...redoStack, emailComponents]);
      setEmailComponents(lastState);
      setUndoStack(undoStack.slice(0, -1));
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const lastState = redoStack[redoStack.length - 1];
      setUndoStack([...undoStack, emailComponents]);
      setEmailComponents(lastState);
      setRedoStack(redoStack.slice(0, -1));
    }
  };

  // Handle save
  const handleSave = () => {
    toast({
      title: "Template Saved",
      description: `Your email template has been saved to ${currentStore?.name}.`,
    });
  };

  // Handle component deletion
  const handleDeleteComponent = (componentId) => {
    setEmailComponents(emailComponents.filter(c => c.id !== componentId));
    setSelectedComponent(null);
  };

  // Add first section
  const handleAddFirstSection = () => {
    const newComponent = {
      id: Date.now(),
      type: 'container',
      name: 'Section',
      content: '',
      styles: {
        backgroundColor: '#ffffff',
        padding: '20px',
        minHeight: '100px',
        border: '1px dashed #e0f2fe'
      }
    };
    
    setEmailComponents([newComponent]);
  };

  // Handle adding template from Quick Add
  const handleAddTemplate = (template) => {
    const newComponent = {
      id: Date.now(),
      type: 'template',
      name: template.name,
      category: template.category,
      html: template.html,
      styles: {}
    };
    
    setUndoStack([...undoStack, emailComponents]);
    setEmailComponents([...emailComponents, newComponent]);
    setShowQuickAdd(false);
    
    toast({
      title: "Template Added",
      description: `${template.name} has been added to your canvas.`,
    });
  };

  if (isLoadingStore) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-sky-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Store not found</p>
          <Button 
            onClick={() => router.push('/email-builder')}
            className="mt-4 bg-vivid-violet hover:bg-deep-purple text-white"
          >
            Select a Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Quick Add Panel */}
      <QuickAddPanelV4
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAddTemplate={handleAddTemplate}
        storePublicId={params.storePublicId}
      />

      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/store/${params.storePublicId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-48 h-8 text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
              <Store className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {currentStore.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Canvas Version Toggle */}
            <div className="flex items-center gap-1 p-1 bg-purple-100 rounded-lg">
              <Button
                variant={canvasVersion === 'v4' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCanvasVersion('v4')}
                className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                title="New simplified drag-drop"
              >
                V4
              </Button>
              <Button
                variant={canvasVersion === 'v3' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCanvasVersion('v3')}
                className="h-7 px-2 text-xs"
                title="Enhanced canvas with hover states"
              >
                V3
              </Button>
              <Button
                variant={canvasVersion === 'v2' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCanvasVersion('v2')}
                className="h-7 px-2 text-xs"
                title="Standard canvas"
              >
                V2
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="h-7 px-2"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="h-7 px-2"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="gap-2"
            >
              <Undo className="h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="gap-2"
            >
              <Redo className="h-4 w-4" />
              Redo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            
            <Button
              onClick={handleSave}
              className="gap-2 bg-vivid-violet hover:bg-deep-purple text-white"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Components */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Components</h2>
            <p className="text-xs text-gray-500 mb-4">Drag components to the canvas</p>
            
            {/* Quick Add Button */}
            <Button 
              className="w-full mb-4 gap-2 bg-vivid-violet hover:bg-deep-purple text-white"
              onClick={() => setShowQuickAdd(true)}
            >
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>

            {/* Content Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Content</h3>
              <div className="space-y-1">
                {componentCategories.content.map((component) => {
                  const ComponentWrapper = canvasVersion === 'v4' ? DraggableBlock : 'div';
                  const wrapperProps = canvasVersion === 'v4' 
                    ? { block: component, onDragStart: () => setIsDragging(true), onDragEnd: () => setIsDragging(false) }
                    : { draggable: true, onDragStart: (e) => handleDragStart(e, component), onDragEnd: handleDragEnd };
                  
                  return (
                    <ComponentWrapper
                      key={component.id}
                      {...wrapperProps}
                      className={cn(
                        "flex items-center gap-3 p-2.5 bg-white rounded-lg cursor-move hover:bg-sky-tint/50 hover:border-sky-blue border border-transparent transition-all group",
                        isDragging && draggedComponent?.id === component.id && "opacity-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 group-hover:bg-sky-tint">
                        <component.icon className="h-4 w-4 text-gray-600 group-hover:text-sky-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{component.name}</p>
                        <p className="text-xs text-gray-500">{component.description}</p>
                      </div>
                    </ComponentWrapper>
                  );
                })}
              </div>
            </div>

            {/* Layout Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Layout</h3>
              <div className="space-y-1">
                {componentCategories.layout.map((component) => {
                  const ComponentWrapper = canvasVersion === 'v4' ? DraggableBlock : 'div';
                  const wrapperProps = canvasVersion === 'v4' 
                    ? { block: component, onDragStart: () => setIsDragging(true), onDragEnd: () => setIsDragging(false) }
                    : { draggable: true, onDragStart: (e) => handleDragStart(e, component), onDragEnd: handleDragEnd };
                  
                  return (
                    <ComponentWrapper
                      key={component.id}
                      {...wrapperProps}
                      className={cn(
                        "flex items-center gap-3 p-2.5 bg-white rounded-lg cursor-move hover:bg-sky-tint/50 hover:border-sky-blue border border-transparent transition-all group",
                        isDragging && draggedComponent?.id === component.id && "opacity-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 group-hover:bg-sky-tint">
                        <component.icon className="h-4 w-4 text-gray-600 group-hover:text-sky-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{component.name}</p>
                        <p className="text-xs text-gray-500">{component.description}</p>
                      </div>
                    </ComponentWrapper>
                  );
                })}
              </div>
            </div>

            {/* Advanced Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Advanced</h3>
              <div className="space-y-1">
                {componentCategories.advanced.map((component) => {
                  const ComponentWrapper = canvasVersion === 'v4' ? DraggableBlock : 'div';
                  const wrapperProps = canvasVersion === 'v4' 
                    ? { block: component, onDragStart: () => setIsDragging(true), onDragEnd: () => setIsDragging(false) }
                    : { draggable: true, onDragStart: (e) => handleDragStart(e, component), onDragEnd: handleDragEnd };
                  
                  return (
                    <ComponentWrapper
                      key={component.id}
                      {...wrapperProps}
                      className={cn(
                        "flex items-center gap-3 p-2.5 bg-white rounded-lg cursor-move hover:bg-sky-tint/50 hover:border-sky-blue border border-transparent transition-all group",
                        isDragging && draggedComponent?.id === component.id && "opacity-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 group-hover:bg-sky-tint">
                        <component.icon className="h-4 w-4 text-gray-600 group-hover:text-sky-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{component.name}</p>
                        <p className="text-xs text-gray-500">{component.description}</p>
                      </div>
                    </ComponentWrapper>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Email Canvas */}
        <div className="flex-1 bg-gray-100 overflow-auto">
          {canvasVersion === 'v4' ? (
            <EmailCanvasV4
              sections={emailSections}
              setSections={setEmailSections}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              viewMode={viewMode}
              selectedBrand={currentStore}
            />
          ) : canvasVersion === 'v3' ? (
            <EmailCanvasV3
              sections={emailSections}
              setSections={setEmailSections}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              viewMode={viewMode}
            />
          ) : (
            <div className="p-8">
              <div className="max-w-3xl mx-auto">
                <EmailCanvasV2
                  emailComponents={emailComponents}
                  setEmailComponents={setEmailComponents}
                  selectedComponent={selectedComponent}
                  setSelectedComponent={setSelectedComponent}
                  viewMode={viewMode}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          {canvasVersion === 'v3' || canvasVersion === 'v4' ? (
            <div className="p-4">
              <h2 className="text-lg font-semibold text-slate-gray mb-4">Section Properties</h2>
              {selectedSection ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Section Type</p>
                    <p className="text-sm text-gray-500">{selectedSection.type}</p>
                  </div>
                  {selectedSection.type === 'columns' && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Columns</p>
                      <p className="text-sm text-gray-500">{selectedSection.columns || 2}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No section selected</p>
                </div>
              )}
            </div>
          ) : (
            <PropertiesPanelV2
              selectedComponent={selectedComponent}
              emailComponents={emailComponents}
              setEmailComponents={setEmailComponents}
              setSelectedComponent={setSelectedComponent}
            />
          )}
        </div>
      </div>
    </div>
  );
}