"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import EmailCanvas from "./email-canvas-v4";
import PropertiesPanel from "./properties-panel-v2";
import QuickAddPanel from "./quick-add-panel-v4";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Save, Eye, Code, Palette, Layout, Settings } from "lucide-react";

export default function EmailBuilderInterface({ store }) {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [emailSections, setEmailSections] = useState([]);
  const [showProperties, setShowProperties] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  // Handle adding new sections
  const handleAddSection = (sectionType, index = emailSections.length) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: sectionType,
      columns: sectionType === 'columns' ? 2 : 1,
      children: [],
      properties: {
        padding: '20px',
        backgroundColor: '#ffffff'
      }
    };

    const updatedSections = [...emailSections];
    updatedSections.splice(index, 0, newSection);
    setEmailSections(updatedSections);
  };

  // Handle updating sections
  const handleUpdateSection = (sectionId, updates) => {
    setEmailSections(sections =>
      sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    );
  };

  // Handle deleting sections
  const handleDeleteSection = (sectionId) => {
    setEmailSections(sections => sections.filter(s => s.id !== sectionId));
  };

  // Handle saving the email template
  const handleSave = () => {
    console.log('Saving email template:', emailSections);
    // TODO: Implement save functionality
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProperties(!showProperties)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Properties
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
            >
              <Layout className="h-4 w-4 mr-2" />
              Components
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
            >
              <Code className="h-4 w-4 mr-2" />
              View Code
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Quick Add */}
        {showQuickAdd && (
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
            <QuickAddPanel
              onAddComponent={(component) => {
                console.log('Adding component:', component);
                // Add component to selected section or create new section
                if (emailSections.length === 0) {
                  handleAddSection('single');
                }
                // TODO: Add component to section
              }}
            />
          </div>
        )}

        {/* Center - Email Canvas */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-auto p-6">
          <div className="max-w-[600px] mx-auto">
            {previewMode ? (
              <Card className="bg-white dark:bg-gray-900 shadow-lg">
                <div className="p-6">
                  {emailSections.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Your email template will appear here
                    </div>
                  ) : (
                    <div>
                      {/* Render email preview */}
                      {emailSections.map(section => (
                        <div key={section.id} style={{ padding: section.properties?.padding }}>
                          {/* Render section content */}
                          Preview of {section.type} section
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <EmailCanvas
                sections={emailSections}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                onUpdateSection={handleUpdateSection}
                onDeleteSection={handleDeleteSection}
                onAddSection={handleAddSection}
                storeName={store?.name}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        {showProperties && selectedComponent && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
            <PropertiesPanel
              component={selectedComponent}
              onUpdate={(updates) => {
                // Update the selected component properties
                console.log('Updating component:', selectedComponent, updates);
                // TODO: Implement property updates
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}