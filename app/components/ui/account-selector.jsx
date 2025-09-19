"use client";

import * as React from "react";
import { Store, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";

export function AccountSelector({ 
  accounts = [],
  value = [],
  onChange,
  className 
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedAccounts, setSelectedAccounts] = React.useState(() => {
    // Always initialize with value prop to prevent hydration mismatch
    return value && value.length > 0 ? value : [{ value: 'all', label: 'View All' }];
  });
  const [isClient, setIsClient] = React.useState(false);

  // Set client flag after mount to prevent hydration issues
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value && value.length > 0) {
      setSelectedAccounts(value);
    }
  }, [value]);

  const hasViewAll = selectedAccounts.some(acc => acc.value === 'all');
  const totalSelected = hasViewAll ? 0 : selectedAccounts.filter(acc => !acc.isTag).length;
  const tagsSelected = hasViewAll ? 0 : selectedAccounts.filter(acc => acc.isTag).length;

  const handleAccountToggle = (account) => {
    const isViewAll = account.value === 'all';
    const isTag = account.isTag;
    const isSelected = selectedAccounts.some(acc => acc.value === account.value);
    
    let newSelection = [];
    
    if (isViewAll) {
      // If clicking View All, select it and clear all others
      if (!isSelected) {
        newSelection = [account];
      } else {
        // If unchecking View All, keep existing selection or default to empty
        newSelection = selectedAccounts.filter(acc => acc.value !== 'all');
        if (newSelection.length === 0) {
          // If no accounts selected, keep View All selected
          newSelection = [account];
        }
      }
    } else if (isTag) {
      // Handle tag selection - when a tag is selected, it filters stores with that tag
      if (hasViewAll) {
        // If View All is selected, replace it with this tag
        newSelection = [account];
      } else {
        // Toggle the tag
        if (isSelected) {
          newSelection = selectedAccounts.filter(acc => acc.value !== account.value);
          // If nothing selected after removal, select View All
          if (newSelection.length === 0) {
            newSelection = [{ value: 'all', label: 'View All' }];
          }
        } else {
          // Add the tag to selection
          newSelection = [...selectedAccounts, account];
        }
      }
    } else {
      // Clicking on an individual account
      if (hasViewAll) {
        // If View All is selected, replace it with this account
        newSelection = [account];
      } else {
        // Toggle the specific account
        if (isSelected) {
          newSelection = selectedAccounts.filter(acc => acc.value !== account.value);
          // If nothing selected after removal, select View All
          if (newSelection.length === 0) {
            newSelection = [{ value: 'all', label: 'View All' }];
          }
        } else {
          // Add the account to selection
          newSelection = [...selectedAccounts, account];
        }
      }
    }
    
    setSelectedAccounts(newSelection);
  };

  const handleApply = () => {
    if (onChange) {
      onChange(selectedAccounts);
    }
    setOpen(false);
  };

  const handleClear = () => {
    const viewAll = [{ value: 'all', label: 'View All' }];
    setSelectedAccounts(viewAll);
  };

  const handleCancel = () => {
    // Reset to original value
    setSelectedAccounts(value || [{ value: 'all', label: 'View All' }]);
    setOpen(false);
  };

  const getButtonLabel = () => {
    if (hasViewAll) {
      return "All Accounts";
    }
    if (selectedAccounts.length === 1) {
      const account = selectedAccounts[0];
      if (account.isTag) {
        return account.label;
      }
      return account.label;
    }
    
    const tagCount = selectedAccounts.filter(acc => acc.isTag).length;
    const storeCount = selectedAccounts.filter(acc => !acc.isTag && acc.value !== 'all').length;
    
    if (tagCount > 0 && storeCount > 0) {
      return `${tagCount} Tags, ${storeCount} Stores`;
    } else if (tagCount > 0) {
      return `${tagCount} Tag${tagCount > 1 ? 's' : ''}`;
    } else {
      return `${storeCount} Store${storeCount > 1 ? 's' : ''}`;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 border-neutral-gray/30 hover:border-sky-blue hover:bg-sky-tint/50 transition-all relative",
            totalSelected > 0 && "border-sky-blue bg-sky-tint/20",
            className
          )}
        >
          <Store className="h-4 w-4" />
          <span className="text-sm">{getButtonLabel()}</span>
          {(totalSelected > 0 || tagsSelected > 0) && (
            <Badge 
              variant="default" 
              className="ml-1 h-5 px-1.5 text-xs bg-sky-blue text-white"
            >
              {totalSelected + tagsSelected}
            </Badge>
          )}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg" 
        align="start"
      >
        <div className="p-4 bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Select Accounts</h3>
            <div className="flex items-center gap-2">
              {accounts.length > 0 && !hasViewAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Select all individual accounts (not tags)
                    const storeAccounts = accounts.filter(acc => !acc.isTag);
                    setSelectedAccounts(storeAccounts);
                  }}
                  className="h-auto p-1 text-xs hover:bg-sky-tint/50"
                >
                  Select all
                </Button>
              )}
              {totalSelected > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-auto p-1 text-xs hover:bg-sky-tint/50"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Account List */}
          <div className="space-y-2">
            {/* View All Option */}
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox
                id="view-all"
                checked={hasViewAll}
                onCheckedChange={() => handleAccountToggle({ value: 'all', label: 'View All' })}
                className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
              />
              <label
                htmlFor="view-all"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-sky-blue transition-colors"
              >
                View All Accounts
              </label>
            </div>

            {accounts.length > 0 && <Separator className="my-2" />}

            {/* Tags and Individual Accounts */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {accounts.map(account => {
                const isSelected = selectedAccounts.some(acc => acc.value === account.value);
                const isTag = account.isTag;
                
                return (
                  <div 
                    key={account.value} 
                    className={cn(
                      "flex items-center space-x-2",
                      isTag && "bg-purple-50 dark:bg-purple-900/20 p-1 rounded"
                    )}
                  >
                    <Checkbox
                      id={account.value}
                      checked={isSelected && !hasViewAll}
                      onCheckedChange={() => handleAccountToggle(account)}
                      className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                    />
                    <label
                      htmlFor={account.value}
                      className={cn(
                        "text-sm cursor-pointer transition-colors flex-1",
                        isTag ? "font-semibold text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300 hover:text-sky-blue"
                      )}
                    >
                      {account.label}
                      {account.storeTags && account.storeTags.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          [{account.storeTags.join(", ")}]
                        </span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Separator before action buttons */}
          {accounts.length > 0 && <Separator className="my-4" />}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              size="sm"
              className="flex-1 bg-sky-blue hover:bg-royal-blue text-white font-semibold transition-all"
            >
              Apply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 border-neutral-gray/30 hover:bg-sky-tint/50 transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}