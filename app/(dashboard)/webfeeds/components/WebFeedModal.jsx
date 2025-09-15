"use client";

import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useToast } from '@/app/hooks/use-toast';

export default function WebFeedModal({ feed, isCreating, isDuplicating, stores, onClose, onSuccess }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    store_id: '',
    klaviyo_account_id: '',
    feed_type: 'json',  // Always JSON
    status: 'active'    // Default to active so it's ready to use
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(feed?.sync_status || 'not_synced');

  useEffect(() => {
    if (feed) {
      setFormData({
        name: isDuplicating ? `${feed.name}_copy` : (feed.name || ''),
        description: feed.description || '',
        store_id: isDuplicating ? '' : (feed.store_id || ''), // Clear store for duplicate
        klaviyo_account_id: isDuplicating ? '' : (feed.klaviyo_account_id || ''),
        feed_type: feed.feed_type || 'json',  // Keep existing or default to JSON
        status: feed.status || 'active'        // Keep existing or default to active
      });
    }
  }, [feed, isDuplicating]);

  const handleStoreChange = (storeId) => {
    const selectedStore = stores.find(s => s.public_id === storeId);
    setFormData({
      ...formData,
      store_id: storeId,
      klaviyo_account_id: selectedStore?.klaviyo_integration?.public_id || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.store_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const url = isCreating ? '/api/webfeeds' : `/api/webfeeds/${feed._id}`;
      const method = isCreating ? 'POST' : 'PUT';

      // If duplicating, include the original feed's items
      const requestData = isDuplicating && feed.items 
        ? { ...formData, items: feed.items }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        const feedUrl = data.webFeed?.feed_url || '';
        const isNewFeed = isCreating || isDuplicating;
        
        toast({
          title: "Success",
          description: isNewFeed 
            ? `Web feed created! You can now sync it to Klaviyo.`
            : `Web feed updated successfully`,
        });
        
        // Store the feed ID for potential sync
        if (isNewFeed && data.webFeed?._id) {
          // Offer to sync immediately if it's active
          if (formData.status === 'active') {
            setTimeout(() => {
              handleSyncToKlaviyo(data.webFeed._id);
            }, 500);
          }
        }
        
        onSuccess();
      } else {
        // Check if it's a duplicate name error
        if (data.field === 'name') {
          toast({
            title: "Duplicate Name",
            description: data.error || "A web feed with this name already exists for this store",
            variant: "destructive",
          });
          // You could also highlight the name field here if needed
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to save web feed",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error saving web feed:', error);
      toast({
        title: "Error",
        description: "Failed to save web feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToKlaviyo = async (feedId) => {
    setSyncing(true);
    
    try {
      const response = await fetch('/api/webfeeds/klaviyo-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedId: feedId || feed._id }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus('synced');
        toast({
          title: "Success",
          description: "Web feed synced to Klaviyo! It will appear in your Klaviyo account under Data → Web Feeds.",
        });
        
        // Show the feed URL for reference
        if (data.feedUrl) {
          setTimeout(() => {
            toast({
              title: "Feed URL",
              description: `Your feed is available at: ${data.feedUrl}`,
            });
          }, 1000);
        }
      } else {
        setSyncStatus('sync_error');
        toast({
          title: "Sync Error",
          description: data.details || data.error || "Failed to sync with Klaviyo. Please check your Klaviyo API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing to Klaviyo:', error);
      setSyncStatus('sync_error');
      toast({
        title: "Error",
        description: "Failed to sync with Klaviyo",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isDuplicating ? 'Duplicate Web Feed' : isCreating ? 'Create Web Feed' : 'Edit Web Feed'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Feed Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  // Only allow letters, numbers, and underscores
                  const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                  // Limit to 64 characters
                  const truncatedValue = value.slice(0, 64);
                  setFormData({ ...formData, name: truncatedValue });
                }}
                placeholder="e.g., product_recommendations"
                pattern="[a-zA-Z0-9_]{1,64}"
                maxLength={64}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only letters, numbers and underscores. Max 64 characters. ({formData.name.length}/64)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this feed contains..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="store">Store *</Label>
              <Select
                value={formData.store_id}
                onValueChange={handleStoreChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.public_id} value={store.public_id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.klaviyo_account_id && (
              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-sm space-y-2">
                <p className="text-sky-700 dark:text-sky-300">
                  Klaviyo Account ID: <span className="font-mono">{formData.klaviyo_account_id}</span>
                </p>
                {!isCreating && feed?.feed_url && (
                  <div className="pt-2 border-t border-sky-200 dark:border-sky-800">
                    <p className="text-xs text-sky-600 dark:text-sky-400 mb-1">Feed URL:</p>
                    <p className="font-mono text-xs break-all text-sky-800 dark:text-sky-200">
                      {feed.feed_url}
                    </p>
                    {syncStatus === 'synced' && (
                      <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Synced to Klaviyo</span>
                      </div>
                    )}
                    {syncStatus === 'sync_error' && (
                      <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-xs">Sync error</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            <div className="flex justify-between items-center pt-4">
              <div className="flex gap-2">
                {!isCreating && feed?._id && formData.status === 'active' && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => handleSyncToKlaviyo(feed._id)}
                    disabled={syncing || syncStatus === 'synced'}
                    className="flex items-center gap-2"
                  >
                    {syncing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-blue"></div>
                        Syncing...
                      </>
                    ) : syncStatus === 'synced' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Synced
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Sync to Klaviyo
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                >
                  {loading ? 'Saving...' : (isDuplicating ? 'Duplicate Feed' : isCreating ? 'Create Feed' : 'Update Feed')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}