"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useStores } from "@/app/contexts/store-context";

export default function StoreDialog({ store, onClose }) {
  const { tags, addStore, updateStore, addTag } = useStores();
  const isEditing = !!store;

  const [formData, setFormData] = useState({
    name: store?.name || "",
    url: store?.url || "",
    tagNames: store?.tagNames || [],
  });
  
  const [newTagInput, setNewTagInput] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);
  const [urlError, setUrlError] = useState("");

  // Validate and format URL
  const validateAndFormatUrl = (url) => {
    if (!url) return { isValid: false, error: "URL is required" };
    
    // Remove whitespace
    url = url.trim();
    
    // Check if it's a valid URL pattern
    const urlPattern = /^(https?:\/\/)?(([\w-]+\.)+[\w-]+)(\/[^\s]*)?$/i;
    
    if (!urlPattern.test(url)) {
      return { isValid: false, error: "Please enter a valid URL" };
    }
    
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Convert http to https for security
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    
    return { isValid: true, formattedUrl: url };
  };
  
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, url: value }));
    
    // Clear error when user starts typing
    if (urlError) {
      setUrlError("");
    }
  };
  
  const handleUrlBlur = () => {
    if (formData.url) {
      const validation = validateAndFormatUrl(formData.url);
      if (!validation.isValid) {
        setUrlError(validation.error);
      } else {
        // Update with formatted URL
        setFormData(prev => ({ ...prev, url: validation.formattedUrl }));
        setUrlError("");
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate URL before submission
    const validation = validateAndFormatUrl(formData.url);
    if (!validation.isValid) {
      setUrlError(validation.error);
      return;
    }
    
    // Create data with formatted URL
    const submitData = {
      ...formData,
      url: validation.formattedUrl
    };
    
    if (isEditing) {
      updateStore(store.id, submitData);
    } else {
      addStore(submitData);
    }
    
    onClose();
  };

  const toggleTag = (tagName) => {
    setFormData(prev => ({
      ...prev,
      tagNames: prev.tagNames.includes(tagName)
        ? prev.tagNames.filter(t => t !== tagName)
        : [...prev.tagNames, tagName]
    }));
  };
  
  const handleAddNewTag = () => {
    if (newTagInput.trim() && !formData.tagNames.includes(newTagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tagNames: [...prev.tagNames, newTagInput.trim()]
      }));
      
      // Add to global tags if it doesn't exist
      const tagExists = tags.some(t => t.name.toLowerCase() === newTagInput.trim().toLowerCase());
      if (!tagExists) {
        addTag({
          id: newTagInput.trim().toLowerCase().replace(/\s+/g, '-'),
          name: newTagInput.trim(),
          color: 'blue'
        });
      }
      
      setNewTagInput("");
      setShowNewTag(false);
    }
  };
  
  const removeTag = (tagName) => {
    setFormData(prev => ({
      ...prev,
      tagNames: prev.tagNames.filter(t => t !== tagName)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit Store" : "Add New Store"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Name */}
            <div>
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Store"
                required
                className="mt-1"
              />
            </div>
            
            {/* Store URL */}
            <div>
              <Label htmlFor="url">Store URL *</Label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="url"
                  type="text"
                  value={formData.url}
                  onChange={handleUrlChange}
                  onBlur={handleUrlBlur}
                  placeholder="mystore.com or https://mystore.com"
                  required
                  className={`pl-10 ${urlError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {urlError && (
                <p className="text-sm text-red-500 mt-1">{urlError}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL will be automatically formatted with https://
              </p>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Add tags to categorize this store
              </p>
              
              {/* Selected Tags */}
              {formData.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tagNames.map(tagName => (
                    <Badge
                      key={tagName}
                      variant="default"
                      className="group"
                    >
                      {tagName}
                      <button
                        type="button"
                        onClick={() => removeTag(tagName)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Available Tags */}
              <div className="flex flex-wrap gap-2">
                {tags
                  .filter(tag => !formData.tagNames.includes(tag.name))
                  .map(tag => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => toggleTag(tag.name)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                
                {/* Add New Tag Button */}
                {!showNewTag ? (
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-dashed hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShowNewTag(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Tag
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
                      placeholder="Tag name"
                      className="h-7 w-32 text-sm"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={handleAddNewTag}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setShowNewTag(false);
                        setNewTagInput("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default">
                {isEditing ? "Save Changes" : "Add Store"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}