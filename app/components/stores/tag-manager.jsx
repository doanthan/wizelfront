"use client";

import { useState } from "react";
import { X, Plus, Edit2, Trash2, Tag as TagIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useStores } from "@/app/contexts/store-context";

const TAG_COLORS = [
  { id: "blue", name: "Blue", class: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { id: "purple", name: "Purple", class: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  { id: "green", name: "Green", class: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { id: "yellow", name: "Yellow", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  { id: "red", name: "Red", class: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  { id: "indigo", name: "Indigo", class: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" },
  { id: "pink", name: "Pink", class: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300" },
  { id: "orange", name: "Orange", class: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
];

export default function TagManager({ onClose }) {
  const { tags, stores, addTag, deleteTag } = useStores();
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    color: "blue"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingTag) {
      // In a real app, you'd have an updateTag function
      deleteTag(editingTag.id);
      addTag(formData);
    } else {
      addTag({
        ...formData,
        id: formData.id || formData.name.toLowerCase().replace(/\s+/g, "-")
      });
    }
    
    resetForm();
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData(tag);
  };

  const handleDelete = (tagId) => {
    const storesUsingTag = stores.filter(store => store.tags.includes(tagId));
    
    if (storesUsingTag.length > 0) {
      if (!confirm(`This tag is used by ${storesUsingTag.length} store(s). Are you sure you want to delete it?`)) {
        return;
      }
    }
    
    deleteTag(tagId);
  };

  const resetForm = () => {
    setEditingTag(null);
    setFormData({ id: "", name: "", color: "blue" });
  };

  const getTagUsageCount = (tagId) => {
    return stores.filter(store => store.tags.includes(tagId)).length;
  };

  const getColorClass = (colorId) => {
    return TAG_COLORS.find(c => c.id === colorId)?.class || TAG_COLORS[0].class;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Tags
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Add/Edit Tag Form */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              {editingTag ? "Edit Tag" : "Add New Tag"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tagName">Tag Name</Label>
                  <Input
                    id="tagName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Flagship"
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tagId">Tag ID (optional)</Label>
                  <Input
                    id="tagId"
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g., flagship"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.id }))}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        formData.color === color.id 
                          ? `ring-2 ring-offset-2 ring-sky-blue ${color.class}`
                          : color.class
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="default" size="sm">
                  {editingTag ? "Update Tag" : "Add Tag"}
                </Button>
                {editingTag && (
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Existing Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Existing Tags
            </h3>
            <div className="space-y-2">
              {tags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TagIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No tags created yet</p>
                </div>
              ) : (
                tags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-md text-sm font-medium ${getColorClass(tag.color)}`}>
                        {tag.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {tag.id}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Used by {getTagUsageCount(tag.id)} store(s)
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tag.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              How Tags Work
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Tags help categorize and organize your stores</li>
              <li>• Users can be granted access to stores based on tags</li>
              <li>• A store can have multiple tags</li>
              <li>• Deleting a tag removes it from all associated stores</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}