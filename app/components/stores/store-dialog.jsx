"use client";

import { useState, useEffect } from "react";
import { X, Plus, Globe, Store, AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useStores } from "@/app/contexts/store-context";


export default function StoreDialog({ store, onClose }) {
  const { tags, addStore, updateStore, addTag, deleteStore } = useStores();
  const isEditing = !!store;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

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
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate URL before submission
    const validation = validateAndFormatUrl(formData.url);
    if (!validation.isValid) {
      setUrlError(validation.error);
      setIsLoading(false);
      return;
    }
    
    try {
      if (isEditing) {
        // Update existing store
        const submitData = {
          ...formData,
          url: validation.formattedUrl
        };
        updateStore(store.id, submitData);
        onClose();
      } else {
        // Create new store with Stripe integration
        const response = await fetch('/api/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            url: validation.formattedUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create store');
        }

        // Store created successfully
        // Add store to context with proper field mapping
        addStore({
          id: data.store.id,
          _id: data.store.id,
          public_id: data.store.public_id, // Include the public_id from API response
          name: data.store.name,
          url: data.store.url,
          platform: data.store.platform,
          subscription_status: data.store.subscription_status,
          trial_ends_at: data.store.trial_ends_at,
          tagNames: formData.tagNames,
          tags: formData.tagNames.map(name => {
            const tag = tags.find(t => t.name === name);
            return tag ? tag.id : name.toLowerCase().replace(/\s+/g, '-');
          }),
        });
        
        // Close dialog
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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

  const handleDelete = async () => {
    // Double-check the name matches
    if (deleteConfirmName !== formData.name) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/store?id=${store.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete store');
      }

      // Remove from context
      deleteStore(store.id);
      
      // Clear confirmation state
      setDeleteConfirmName("");
      setShowDeleteConfirm(false);
      
      // Close dialog
      onClose();
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
      // Don't hide the confirmation dialog on error, let user retry
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
            <Store className="h-5 w-5" />
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

            {/* Billing Info for new stores */}
            {!isEditing && (
              <Card className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sky-900 dark:text-sky-100">14-Day Free Trial</h4>
                      <p className="text-sm text-sky-700 dark:text-sky-300 mt-1">
                        Full access to all features. No payment required upfront.
                        <br />
                        <span className="font-medium">$29/month</span> after trial ends.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* Delete Confirmation */}
            {isEditing && showDeleteConfirm && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900 dark:text-red-100">Delete Store?</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        This will permanently delete <span className="font-semibold">"{formData.name}"</span> and remove it from your account.
                        This action cannot be undone.
                      </p>
                      
                      <div className="mt-3">
                        <Label htmlFor="delete-confirm" className="text-sm text-red-800 dark:text-red-200">
                          Type <span className="font-mono font-semibold">{formData.name}</span> to confirm deletion:
                        </Label>
                        <Input
                          id="delete-confirm"
                          type="text"
                          value={deleteConfirmName}
                          onChange={(e) => setDeleteConfirmName(e.target.value)}
                          placeholder="Enter store name"
                          className="mt-1 border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500"
                          disabled={isDeleting}
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting || deleteConfirmName !== formData.name}
                          className={deleteConfirmName !== formData.name ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {isDeleting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          Delete Store
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmName("");
                          }}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Delete Button (only in edit mode) */}
              <div>
                {isEditing && !showDeleteConfirm && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setDeleteConfirmName(""); // Clear any previous input
                    }}
                    disabled={isLoading || isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Store
                  </Button>
                )}
              </div>
              
              {/* Save/Cancel Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading || isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-royal-blue hover:bg-blue-700 text-white transition-colors"
                  disabled={isLoading || isDeleting || !formData.name || !formData.url || showDeleteConfirm}
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Save Changes" : "Start Free Trial"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}