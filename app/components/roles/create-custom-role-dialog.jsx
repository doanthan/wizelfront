"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useToast } from "@/app/components/ui/use-toast";
import { Shield, Loader2 } from "lucide-react";

export default function CreateCustomRoleDialog({ open, onOpenChange, onSuccess, contractId }) {
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    baseRole: "creator"
  });
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const baseRoles = [
    { value: "owner", label: "Owner (Level 100)", description: "Full control" },
    { value: "admin", label: "Admin (Level 80)", description: "Administrative access" },
    { value: "manager", label: "Manager (Level 60)", description: "Team leadership" },
    { value: "creator", label: "Creator (Level 40)", description: "Content creation" },
    { value: "reviewer", label: "Reviewer (Level 30)", description: "Content review" },
    { value: "viewer", label: "Viewer (Level 10)", description: "Read-only access" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.display_name || !contractId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description,
          baseRole: formData.baseRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Custom role created successfully"
        });

        // Reset form
        setFormData({
          name: "",
          display_name: "",
          description: "",
          baseRole: "creator"
        });

        onOpenChange(false);
        if (onSuccess) onSuccess(data.role);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create custom role",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating custom role:', error);
      toast({
        title: "Error",
        description: "Failed to create custom role",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate name from display_name
    if (field === 'display_name') {
      const generatedName = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      setFormData(prev => ({ ...prev, name: generatedName }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Shield className="h-5 w-5 text-vivid-violet" />
            Create Custom Role
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Create a custom role based on a system role template. You can customize permissions after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-gray-900 dark:text-white">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display_name"
              placeholder="e.g., Content Editor, Marketing Manager"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              required
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This is how the role will appear in the UI
            </p>
          </div>

          {/* System Name (Auto-generated) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 dark:text-white">
              System Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="auto_generated_from_display_name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-mono text-sm"
              readOnly
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Auto-generated unique identifier (lowercase, no spaces)
            </p>
          </div>

          {/* Base Role Template */}
          <div className="space-y-2">
            <Label htmlFor="baseRole" className="text-gray-900 dark:text-white">
              Base Role Template <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.baseRole}
              onValueChange={(value) => handleInputChange('baseRole', value)}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {baseRoles.map((role) => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {role.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The custom role will inherit permissions from this base role
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-900 dark:text-white">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this role is for and what permissions it should have..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Optional: Add a description to help others understand this role
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.name || !formData.display_name}
              className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Role
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
