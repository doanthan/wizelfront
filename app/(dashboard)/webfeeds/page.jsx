"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, ExternalLink, Upload, Rss, CheckCircle, XCircle, CopyPlus, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useStores } from '@/app/contexts/store-context';
import { useToast } from '@/app/hooks/use-toast';
import WebFeedModal from './components/WebFeedModal';
import WebFeedItemsModal from './components/WebFeedItemsModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

export default function WebFeedsPage() {
  const { toast } = useToast();
  const [webFeeds, setWebFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [deletingFeedId, setDeletingFeedId] = useState(null);
  const [removingCardId, setRemovingCardId] = useState(null);
  const { stores } = useStores();

  useEffect(() => {
    fetchWebFeeds();
  }, []);

  const fetchWebFeeds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/webfeeds');
      const data = await response.json();
      
      if (data.success) {
        setWebFeeds(data.webFeeds);
      }
    } catch (error) {
      console.error('Error fetching web feeds:', error);
      toast({
        title: "Error",
        description: "Failed to load web feeds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeed = () => {
    setSelectedFeed(null);
    setIsCreating(true);
    setShowFeedModal(true);
  };

  const handleEditFeed = (feed) => {
    setSelectedFeed(feed);
    setIsCreating(false);
    setIsDuplicating(false);
    setShowFeedModal(true);
  };

  const handleDuplicateFeed = (feed) => {
    // Create a copy of the feed with a new name
    const duplicatedFeed = {
      ...feed,
      name: `${feed.name}_copy`,
      _id: null // Clear the ID so it creates a new feed
    };
    setSelectedFeed(duplicatedFeed);
    setIsCreating(true);
    setIsDuplicating(true);
    setShowFeedModal(true);
  };

  const handleManageItems = (feed) => {
    setSelectedFeed(feed);
    setShowItemsModal(true);
  };

  const handleDeleteClick = (feed) => {
    setSelectedFeed(feed);
    setShowDeleteModal(true);
  };

  const handleDeleteFeed = async () => {
    if (!selectedFeed) return;

    const feedId = selectedFeed._id;
    setDeletingFeedId(feedId);

    try {
      const response = await fetch(`/api/webfeeds/${feedId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Start the removal animation
        setRemovingCardId(feedId);
        
        // Wait for animation to complete before updating state
        setTimeout(() => {
          setWebFeeds(prev => prev.filter(feed => feed._id !== feedId));
          setRemovingCardId(null);
        }, 300);

        toast({
          title: "Success",
          description: "Web feed and all assets deleted successfully",
        });
        
        setShowDeleteModal(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete web feed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting web feed:', error);
      toast({
        title: "Error",
        description: "Failed to delete web feed",
        variant: "destructive",
      });
    } finally {
      setDeletingFeedId(null);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Success",
      description: "Feed URL copied to clipboard",
    });
  };

  const handleSyncToKlaviyo = async (feedId) => {
    try {
      const response = await fetch('/api/webfeeds/klaviyo-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Web feed synced to Klaviyo successfully",
        });
        fetchWebFeeds();
      } else {
        toast({
          title: "Error",
          description: data.details || data.error || "Failed to sync with Klaviyo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing to Klaviyo:', error);
      toast({
        title: "Error",
        description: "Failed to sync with Klaviyo",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (feed) => {
    const newStatus = feed.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/webfeeds/${feed._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Web feed ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
        });
        fetchWebFeeds();
      } else {
        toast({
          title: "Error",
          description: "Failed to update feed status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating feed status:', error);
      toast({
        title: "Error",
        description: "Failed to update feed status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Inactive</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Draft</Badge>;
      default:
        return null;
    }
  };

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.public_id === storeId);
    return store?.name || 'Unknown Store';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Web Feeds</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage product feeds for Klaviyo email campaigns
          </p>
        </div>
        <Button 
          onClick={handleCreateFeed}
          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Web Feed
        </Button>
      </div>

      {/* Instructions Card */}
      <Card className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-sky-blue/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rss className="h-5 w-5 text-sky-blue" />
            How to Use Web Feeds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>1. Create a web feed and add product items with images, prices, and descriptions</p>
          <p>2. Upload images directly or use external URLs for product images</p>
          <p>3. Click "Sync to Klaviyo" to automatically add the feed to your Klaviyo account</p>
          <p>4. Use the feed data in your Klaviyo email templates with dynamic content blocks</p>
          <p className="text-xs text-sky-600 dark:text-sky-400 mt-2 flex items-center gap-1">
            <Send className="h-3 w-3" />
            New: Feeds can now be synced automatically to Klaviyo using the Web Feeds API!
          </p>
        </CardContent>
      </Card>

      {/* Web Feeds Grid */}
      {webFeeds.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Rss className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No web feeds yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first web feed to start syncing product data with Klaviyo
            </p>
            <Button 
              onClick={handleCreateFeed}
              className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {webFeeds.map((feed) => (
            <Card 
              key={feed._id} 
              className={`hover:shadow-lg transition-all duration-300 ${
                removingCardId === feed._id ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{feed.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getStoreName(feed.store_id)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(feed.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Items:</span>
                    <span className="font-medium">{feed.metadata?.total_items || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Format:</span>
                    <Badge variant="outline">{feed.feed_type?.toUpperCase()}</Badge>
                  </div>
                </div>

                {/* R2 Feed URL */}
                {feed.feed_url && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Feed URL:</p>
                    <div className="p-2.5 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-sky-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs font-mono text-sky-700 dark:text-sky-400 break-all">
                        {feed.feed_url}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManageItems(feed)}
                    className="flex-1"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Items
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditFeed(feed)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {feed.sync_status === 'synced' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      title="Already synced to Klaviyo"
                      className="text-green-600"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  ) : feed.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncToKlaviyo(feed._id)}
                      title="Sync to Klaviyo"
                      className="text-sky-600 hover:text-sky-700"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateFeed(feed)}
                    title="Duplicate Feed"
                  >
                    <CopyPlus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyUrl(feed.feed_url)}
                    disabled={!feed.feed_url}
                    title="Copy Feed URL"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(feed.feed_url, '_blank')}
                    disabled={!feed.feed_url || feed.status !== 'active'}
                    title="Open Feed URL"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(feed)}
                    className={feed.status === 'active' ? 'text-green-600' : 'text-gray-600'}
                  >
                    {feed.status === 'active' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(feed)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showFeedModal && (
        <WebFeedModal
          feed={selectedFeed}
          isCreating={isCreating}
          isDuplicating={isDuplicating}
          stores={stores}
          onClose={() => {
            setShowFeedModal(false);
            setIsDuplicating(false);
          }}
          onSuccess={() => {
            setShowFeedModal(false);
            setIsDuplicating(false);
            fetchWebFeeds();
          }}
        />
      )}

      {showItemsModal && selectedFeed && (
        <WebFeedItemsModal
          feed={selectedFeed}
          onClose={() => setShowItemsModal(false)}
          onUpdate={() => fetchWebFeeds()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFeed && (
        <DeleteConfirmModal
          feed={selectedFeed}
          onConfirm={handleDeleteFeed}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedFeed(null);
          }}
        />
      )}
    </div>
  );
}