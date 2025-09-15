"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Spreadsheet from 'react-spreadsheet';
import { X, Plus, Edit, Trash2, Upload, Image as ImageIcon, Code, Type, Save, Eye, EyeOff, Copy, CheckCircle, Table, FileJson, Sparkles, RefreshCw, Zap, ExternalLink, Link } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useToast } from '@/app/hooks/use-toast';
import { Badge } from '@/app/components/ui/badge';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading code editor...</p>
        </div>
      </div>
    )
  }
);

export default function WebFeedItemsModal({ feed, onClose, onUpdate }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]); // Track original items to detect changes
  const [editingItem, setEditingItem] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [inputMode, setInputMode] = useState('individual'); // individual, json, grid
  const [jsonInput, setJsonInput] = useState('');
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [currentHtmlContent, setCurrentHtmlContent] = useState('');
  const [useSimpleEditor, setUseSimpleEditor] = useState(false);
  const [hasChanges, setHasChanges] = useState(false); // Track if there are unsaved changes
  const [showJsonPreview, setShowJsonPreview] = useState(false); // Track JSON preview visibility
  
  // Helper function to get icon for each type
  const getTypeIcon = (type) => {
    switch(type) {
      case 'image_url':
      case 'image_html':
        return <ImageIcon className="h-4 w-4 text-green-600" />;
      case 'html':
        return <Code className="h-4 w-4 text-blue-600" />;
      case 'text':
      default:
        return <Type className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Spreadsheet data for react-spreadsheet
  const [spreadsheetData, setSpreadsheetData] = useState([
    [{ value: 'Field Name' }, { value: 'Content' }],
    [{ value: '' }, { value: '' }]
  ]);
  
  const [itemForm, setItemForm] = useState({
    field_name: '',
    type: 'text',
    content: '',
    alt_text: '',
    link_url: '',
    description: ''
  });

  useEffect(() => {
    if (feed && feed.items) {
      setItems(feed.items);
      setOriginalItems(JSON.parse(JSON.stringify(feed.items))); // Deep copy original items
    }
  }, [feed]);

  // Check for changes whenever items change
  useEffect(() => {
    const itemsChanged = JSON.stringify(items) !== JSON.stringify(originalItems);
    setHasChanges(itemsChanged);
  }, [items, originalItems]);

  // Update current HTML content for preview
  useEffect(() => {
    if (itemForm.type === 'html') {
      setCurrentHtmlContent(itemForm.content);
    }
  }, [itemForm.content, itemForm.type]);

  const handleAddItem = () => {
    setEditingItem(null);
    setItemForm({
      field_name: '',
      type: 'text',
      content: '',
      alt_text: '',
      link_url: '',
      description: ''
    });
    setShowItemForm(true);
    setShowHtmlPreview(false);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      field_name: item.field_name || '',
      type: item.type || 'text',
      content: item.content || '',
      alt_text: item.alt_text || '',
      link_url: item.link_url || '',
      description: item.description || ''
    });
    setShowItemForm(true);
    if (item.type === 'html') {
      setCurrentHtmlContent(item.content);
      setShowHtmlPreview(false); // Start with preview hidden
    } else {
      setShowHtmlPreview(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', feed.store_id);
      formData.append('feedName', feed.name);
      formData.append('purpose', 'webfeed');

      const response = await fetch('/api/webfeeds/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setItemForm({ ...itemForm, content: data.url });
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to upload image",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteItem = (fieldName) => {
    if (confirm('Are you sure you want to delete this field?')) {
      const newItems = items.filter(item => item.field_name !== fieldName);
      setItems(newItems);
    }
  };

  const handleSaveItem = () => {
    if (!itemForm.field_name || !itemForm.content) {
      toast({
        title: "Error",
        description: "Field name and content are required",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate field names (except when editing)
    if (!editingItem && items.some(item => item.field_name === itemForm.field_name)) {
      toast({
        title: "Error",
        description: "Field name already exists",
        variant: "destructive",
      });
      return;
    }

    const newItem = { ...itemForm };
    let newItems;

    if (editingItem) {
      newItems = items.map(item => 
        item.field_name === editingItem.field_name ? newItem : item
      );
    } else {
      newItems = [...items, newItem];
    }
    
    setItems(newItems);
    setShowItemForm(false);
    setEditingItem(null);
    setShowHtmlPreview(false);
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const newItems = [];
      
      Object.entries(parsed).forEach(([key, value]) => {
        // Skip if key already exists
        if (items.some(item => item.field_name === key)) {
          return;
        }
        
        newItems.push({
          field_name: key,
          type: 'text',
          content: String(value),
          alt_text: '',
          link_url: '',
          description: ''
        });
      });
      
      if (newItems.length > 0) {
        setItems([...items, ...newItems]);
        setJsonInput('');
        toast({
          title: "Success",
          description: `Added ${newItems.length} fields from JSON`,
        });
      } else {
        toast({
          title: "Info",
          description: "No new fields to add (all keys already exist)",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const handleSpreadsheetImport = () => {
    // Skip the header row and filter out empty rows
    const dataRows = spreadsheetData.slice(1).filter(row => 
      row[0]?.value && row[1]?.value
    );
    
    if (dataRows.length === 0) {
      toast({
        title: "Error",
        description: "No valid data rows found",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all field names are unique
    const fieldNames = dataRows.map(row => String(row[0].value).replace(/\s+/g, '_'));
    const uniqueFieldNames = [...new Set(fieldNames)];
    
    if (fieldNames.length !== uniqueFieldNames.length) {
      toast({
        title: "Error",
        description: "Duplicate field names found in spreadsheet",
        variant: "destructive",
      });
      return;
    }
    
    // Check for conflicts with existing items
    const conflicts = fieldNames.filter(name => 
      items.some(item => item.field_name === name)
    );
    
    if (conflicts.length > 0) {
      toast({
        title: "Error",
        description: `Field names already exist: ${conflicts.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // Convert valid rows to items
    const newItems = dataRows.map(row => ({
      field_name: String(row[0].value).replace(/\s+/g, '_'),
      type: 'text',
      content: String(row[1].value),
      alt_text: '',
      link_url: '',
      description: ''
    }));
    
    setItems([...items, ...newItems]);
    
    // Reset spreadsheet to header + empty row
    setSpreadsheetData([
      [{ value: 'Field Name' }, { value: 'Content' }],
      [{ value: '' }, { value: '' }]
    ]);
    
    toast({
      title: "Success",
      description: `Added ${newItems.length} fields from spreadsheet`,
    });
  };

  const handleBulkImport = () => {
    // Parse the spreadsheet data (skip header row)
    const dataRows = spreadsheetData.slice(1).filter(row => 
      row[0]?.value && row[1]?.value
    );
    
    if (dataRows.length === 0) {
      toast({
        title: "Error",
        description: "No valid data rows found",
        variant: "destructive",
      });
      return;
    }
    
    // Build a map of field names to items for easy lookup
    const existingItemsMap = new Map(items.map(item => [item.field_name, item]));
    const updatedItems = [...items];

    validRows.forEach(newItem => {
      const existingIndex = updatedItems.findIndex(item => item.field_name === newItem.field_name);
      
      if (existingIndex !== -1) {
        // Update existing item
        updatedItems[existingIndex] = { ...updatedItems[existingIndex], ...newItem };
        updatedCount++;
      } else {
        // Add new item
        updatedItems.push(newItem);
        addedCount++;
      }
    });

    setItems(updatedItems);
    
    // Reset spreadsheet to header + empty row
    setSpreadsheetData([
      [{ value: 'Field Name' }, { value: 'Content' }],
      [{ value: '' }, { value: '' }]
    ]);
    
    // Show appropriate toast message
    let message = '';
    if (addedCount > 0 && updatedCount > 0) {
      message = `Added ${addedCount} new field${addedCount > 1 ? 's' : ''} and updated ${updatedCount} existing field${updatedCount > 1 ? 's' : ''}`;
    } else if (addedCount > 0) {
      message = `Added ${addedCount} new field${addedCount > 1 ? 's' : ''}`;
    } else if (updatedCount > 0) {
      message = `Updated ${updatedCount} existing field${updatedCount > 1 ? 's' : ''}`;
    }
    
    toast({
      title: "Success",
      description: message,
    });
  };

  const handleSaveAll = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/webfeeds/${feed._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items,
          status: 'active' // Ensure feed is active when publishing
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedFeed = data.webFeed;
        
        // Update original items to match saved state
        setOriginalItems(JSON.parse(JSON.stringify(items)));
        setHasChanges(false);
        
        // Show success with the public R2 URL
        const publicUrl = updatedFeed.feed_url; // feed_url is now always the R2 URL
        toast({
          title: "Success",
          description: "Feed fields updated and published successfully!",
        });
        
        onUpdate();
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to update feed fields",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating feed fields:', error);
      toast({
        title: "Error",
        description: "Failed to update feed fields",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, codeType) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeType);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Generate JSON preview based on current items
  const generateJsonPreview = () => {
    const jsonData = {};
    items.forEach(item => {
      if (item.type === 'image_html') {
        // Generate HTML for image_html type
        let html = `<img src="${item.content}" alt="${item.alt_text || ''}" style="max-width: 100%; height: auto;">`;
        if (item.link_url) {
          html = `<a href="${item.link_url}" target="_blank">${html}</a>`;
        }
        jsonData[item.field_name] = html;
      } else if (item.type === 'image_url') {
        // Just the URL for image_url type
        jsonData[item.field_name] = item.content;
      } else {
        // For text and HTML, use content as-is
        jsonData[item.field_name] = item.content;
      }
    });
    return jsonData;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-[1400px] w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Manage Feed Fields
              </h2>
              <Badge variant="outline" className="text-xs">
                {feed.name} - {items.length} fields
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Add Fields */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Add New Field</h3>
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant={inputMode === 'individual' ? 'default' : 'outline'}
                  onClick={() => setInputMode('individual')}
                  className={inputMode === 'individual' ? 'bg-gradient-to-r from-sky-blue to-vivid-violet text-white' : ''}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Individual
                </Button>
                <Button
                  size="sm"
                  variant={inputMode === 'json' ? 'default' : 'outline'}
                  onClick={() => setInputMode('json')}
                  className={inputMode === 'json' ? 'bg-gradient-to-r from-sky-blue to-vivid-violet text-white' : ''}
                >
                  <FileJson className="h-3 w-3 mr-1" />
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant={inputMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setInputMode('grid')}
                  className={inputMode === 'grid' ? 'bg-gradient-to-r from-sky-blue to-vivid-violet text-white' : ''}
                >
                  <Table className="h-3 w-3 mr-1" />
                  Grid
                </Button>
              </div>

              {/* Individual Field Form */}
              {inputMode === 'individual' && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  {showItemForm ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="field-name">Field Name *</Label>
                          <Input
                            id="field-name"
                            value={itemForm.field_name}
                            onChange={(e) => setItemForm({ ...itemForm, field_name: e.target.value.replace(/\s+/g, '_') })}
                            placeholder="e.g., hero_image"
                            disabled={editingItem !== null}
                          />
                        </div>
                        <div>
                          <Label htmlFor="field-type">Type *</Label>
                          <Select
                            value={itemForm.type}
                            onValueChange={(value) => {
                              setItemForm({ ...itemForm, type: value });
                              if (value === 'html') {
                                setCurrentHtmlContent(itemForm.content);
                                setShowHtmlPreview(false);
                              } else {
                                setShowHtmlPreview(false);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="image_url">Image URL</SelectItem>
                              <SelectItem value="image_html">Image HTML</SelectItem>
                              <SelectItem value="html">HTML Content</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="field-content">Content *</Label>
                        {itemForm.type === 'text' ? (
                          <Textarea
                            id="field-content"
                            value={itemForm.content}
                            onChange={(e) => setItemForm({ ...itemForm, content: e.target.value })}
                            placeholder="Enter text content"
                            rows={3}
                          />
                        ) : itemForm.type === 'html' ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                              >
                                {showHtmlPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                {showHtmlPreview ? 'Hide Preview' : 'Show Preview'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setUseSimpleEditor(!useSimpleEditor)}
                              >
                                {useSimpleEditor ? 'Use Monaco' : 'Use Simple Editor'}
                              </Button>
                            </div>
                            {useSimpleEditor ? (
                              <Textarea
                                value={itemForm.content}
                                onChange={(e) => setItemForm({ ...itemForm, content: e.target.value })}
                                placeholder="Enter HTML content"
                                rows={10}
                                className="font-mono text-sm"
                              />
                            ) : (
                              <div className="border rounded-lg overflow-hidden">
                                <MonacoEditor
                                  height="300px"
                                  language="html"
                                  theme="vs-dark"
                                  value={itemForm.content}
                                  onChange={(value) => setItemForm({ ...itemForm, content: value || '' })}
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                  }}
                                />
                              </div>
                            )}
                            {showHtmlPreview && (
                              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                                <div 
                                  dangerouslySetInnerHTML={{ __html: currentHtmlContent }}
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                />
                              </div>
                            )}
                          </div>
                        ) : (itemForm.type === 'image_url' || itemForm.type === 'image_html') ? (
                          <div className="space-y-3">
                            {itemForm.type === 'image_url' && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                <strong>Image URL:</strong> Returns just the image URL
                              </div>
                            )}
                            {itemForm.type === 'image_html' && (
                              <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                                <strong>Image HTML:</strong> Returns complete &lt;img&gt; tag
                              </div>
                            )}
                            
                            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => document.getElementById('image-file-input').click()}
                                  disabled={uploadingImage}
                                >
                                  {uploadingImage ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Image
                                    </>
                                  )}
                                </Button>
                                <span className="text-gray-500 dark:text-gray-400 self-center">or</span>
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Link className="h-3 w-3 text-gray-400" />
                                  <Label className="text-xs">Paste Image URL</Label>
                                </div>
                                <Input
                                  value={itemForm.content}
                                  onChange={(e) => setItemForm({ ...itemForm, content: e.target.value })}
                                  placeholder="https://example.com/image.jpg"
                                  className="font-mono text-sm"
                                />
                              </div>
                              
                              <input
                                id="image-file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </div>
                            
                            {itemForm.type === 'image_html' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="alt-text" className="text-xs">Alt Text</Label>
                                  <Input
                                    id="alt-text"
                                    value={itemForm.alt_text}
                                    onChange={(e) => setItemForm({ ...itemForm, alt_text: e.target.value })}
                                    placeholder="Describe the image"
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="link-url" className="text-xs">Link URL (optional)</Label>
                                  <Input
                                    id="link-url"
                                    value={itemForm.link_url}
                                    onChange={(e) => setItemForm({ ...itemForm, link_url: e.target.value })}
                                    placeholder="https://example.com"
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {itemForm.content && (
                              <div className="space-y-2">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <img
                                    src={itemForm.content}
                                    alt={itemForm.alt_text || 'Preview'}
                                    className="max-h-24 rounded"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    {itemForm.type === 'image_html' ? 'HTML Output:' : 'URL Output:'}
                                  </p>
                                  <code className="text-xs text-purple-600 dark:text-purple-400 font-mono block break-all">
                                    {itemForm.type === 'image_html' ? (
                                      itemForm.link_url ? 
                                        `<a href="${itemForm.link_url}"><img src="${itemForm.content}" alt="${itemForm.alt_text || ''}"></a>` :
                                        `<img src="${itemForm.content}" alt="${itemForm.alt_text || ''}">`
                                    ) : (
                                      itemForm.content
                                    )}
                                  </code>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveItem}
                          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                        >
                          {editingItem ? 'Update Field' : 'Add Field'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowItemForm(false);
                            setEditingItem(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAddItem}
                      className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Field
                    </Button>
                  )}
                </div>
              )}

              {/* JSON Import */}
              {inputMode === 'json' && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{"field_name": "value", "another_field": "another value"}'
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleJsonImport}
                    className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    Import from JSON
                  </Button>
                  <p className="text-xs text-gray-500">
                    Paste a JSON object with field names as keys
                  </p>
                </div>
              )}

              {/* Excel Grid */}
              {inputMode === 'grid' && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="border rounded overflow-auto max-h-96">
                    <Spreadsheet
                      data={spreadsheetData}
                      onChange={setSpreadsheetData}
                      darkMode={false}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSpreadsheetData([...spreadsheetData, [{ value: '' }, { value: '' }]]);
                      }}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                    <Button
                      onClick={handleSpreadsheetImport}
                      className="flex-1 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                    >
                      <Table className="h-4 w-4 mr-2" />
                      Import Grid
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tip: You can paste data directly from Excel
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Current Fields */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Current Fields</h3>
              {items.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="text-xs"
                >
                  <Code className="h-3 w-3 mr-1" />
                  {showJsonPreview ? 'Hide JSON' : 'View JSON'}
                </Button>
              )}
            </div>
            {items.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No fields defined yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Add fields using the form on the left
                </p>
              </div>
            ) : showJsonPreview ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm">JSON Output Preview</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const jsonStr = JSON.stringify(generateJsonPreview(), null, 2);
                      copyToClipboard(jsonStr, 'json-preview');
                    }}
                  >
                    {copiedCode === 'json-preview' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-auto max-h-[calc(100vh-350px)]">
                  <pre className="text-xs font-mono text-gray-300">
                    <code>{JSON.stringify(generateJsonPreview(), null, 2)}</code>
                  </pre>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  This is how your feed will appear when accessed via the API
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.field_name}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {item.field_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'image_url' ? 'Image URL' : 
                           item.type === 'image_html' ? 'Image HTML' : 
                           item.type === 'html' ? 'HTML' : 'Text'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {(item.type === 'image_url' || item.type === 'image_html') ? 
                          item.content : 
                          item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '')}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          copyToClipboard(
                            `{{ feeds.${feed.name?.replace(/\s+/g, '_')}.${item.field_name} }}`,
                            item.field_name
                          );
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.field_name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Simplified */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={loading || !hasChanges}
              className={hasChanges ? 
                "bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white" :
                "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save & Publish'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}