'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Calendar from 'react-calendar';
import { 
  Filter, Plus, Mail, MessageSquare, Bell, Users, Eye, MousePointer, 
  ShoppingCart, DollarSign, ChevronLeft, ChevronRight, CalendarDays, 
  CalendarRange, CalendarClock, Check, X, Store, Activity, TrendingUp, 
  Zap, Target, BarChart3, CheckCircle, XCircle, Tag, Clock, 
  TrendingDown, AlertCircle, Info, Hash, Percent, ArrowUpRight,
  Calculator, CreditCard, Package, FileText, GitCompare, ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import { format, isFuture, isToday, getDate, getYear } from 'date-fns';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import LoadingSpinner, { InlineLoading } from '@/app/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { getStoreColor, getStoreColorAssignments, resetColorAssignments } from '@/lib/calendar-colors';
import { useCampaignData } from '@/app/contexts/campaign-data-context';
// Use dynamic import to prevent compilation until needed
import dynamic from 'next/dynamic';

// Dynamically import heavy components to improve initial load time
const EmailPreviewPanel = dynamic(
  () => import('./components/EmailPreviewPanel').then(mod => mod.EmailPreviewPanel),
  { 
    loading: () => <div className="flex items-center justify-center h-full"><InlineLoading text="Loading preview..." /></div>,
    ssr: false 
  }
);
import 'react-calendar/dist/Calendar.css';
import './calendar.css';

// EmailPreviewPanel component has been moved to ./components/EmailPreviewPanel.jsx
// This reduces the file size and improves compilation performance

export default function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Use shared campaign data context for better performance
  const { getCampaignData, loading: contextLoading } = useCampaignData();
  
  // Initialize state from URL params or defaults
  const [date, setDate] = useState(() => {
    const dateParam = searchParams.get('date');
    return dateParam ? new Date(dateParam) : new Date();
  });
  
  const [view, setView] = useState(() => {
    return searchParams.get('view') || 'month';
  });
  
  const [selectedStores, setSelectedStores] = useState(() => {
    const storesParam = searchParams.get('stores');
    return storesParam ? storesParam.split(',').filter(Boolean) : [];
  });
  
  const [selectedTags, setSelectedTags] = useState(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  });
  
  const [selectedChannels, setSelectedChannels] = useState(() => {
    const channelsParam = searchParams.get('channels');
    return channelsParam ? channelsParam.split(',').filter(Boolean) : [];
  });
  
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    const statusesParam = searchParams.get('statuses');
    return statusesParam ? statusesParam.split(',').filter(Boolean) : [];
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayCampaigns, setShowDayCampaigns] = useState(false);
  const [selectedDayCampaigns, setSelectedDayCampaigns] = useState([]);
  const [dayCampaignFilter, setDayCampaignFilter] = useState('all'); // 'all' or store public_id
  const [dayCampaignView, setDayCampaignView] = useState('card'); // 'card' or 'table'
  const [dayCampaignSort, setDayCampaignSort] = useState({ field: 'date', direction: 'desc' });
  const [previousView, setPreviousView] = useState('calendar'); // 'calendar' or 'dayModal'
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [futureLoading, setFutureLoading] = useState(false);
  
  // Smart cache for campaigns - stores ALL campaigns, filter client-side
  const [campaignCache, setCampaignCache] = useState({
    past: null, // { startDate, endDate, campaigns, fetchedAt }
    future: null // { campaigns, fetchedAt } - future has ALL scheduled campaigns
  });
  
  // Smart cache for audiences (segments and lists) per store
  const [audienceCache, setAudienceCache] = useState({});
  // Format: { 
  //   [klaviyoPublicId]: { 
  //     segments: [], 
  //     lists: [], 
  //     all: [], 
  //     fetchedAt: timestamp 
  //   } 
  // }
  
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showComparisonPanel, setShowComparisonPanel] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonCampaigns, setComparisonCampaigns] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);

  // Form state for new campaign
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    store: '',
    subject: '',
    previewText: '',
    tags: [],
    scheduledDate: null,
    scheduledTime: '09:00'
  });

  // Fetch stores with analytics access
  const fetchStoresWithAnalyticsAccess = async () => {
    try {
      setLoadingStores(true);
      const response = await fetch('/api/stores/analytics-access');
      if (response.ok) {
        const data = await response.json();
        console.log('Stores with analytics access:', data.stores?.length || 0);
        console.log('Store details:', data.stores?.map(s => ({
          name: s.name,
          public_id: s.public_id,
          klaviyo_public_id: s.klaviyo_integration?.public_id
        })));
        setStores(data.stores || []);
      } else {
        console.error('Failed to fetch stores with analytics access');
        setStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  // Function to update URL with current filters
  const updateURL = (updates = {}) => {
    const params = new URLSearchParams();
    
    // Get current values or use updates
    const currentDate = updates.date || date;
    const currentView = updates.view || view;
    const currentStores = updates.stores !== undefined ? updates.stores : selectedStores;
    const currentChannels = updates.channels !== undefined ? updates.channels : selectedChannels;
    const currentStatuses = updates.statuses !== undefined ? updates.statuses : selectedStatuses;
    const currentTags = updates.tags !== undefined ? updates.tags : selectedTags;
    
    // Add date param
    params.set('date', format(currentDate, 'yyyy-MM-dd'));
    
    // Add view param
    if (currentView !== 'month') {
      params.set('view', currentView);
    }
    
    // Add filter params only if they have values
    if (currentStores.length > 0) {
      params.set('stores', currentStores.join(','));
    }
    if (currentChannels.length > 0) {
      params.set('channels', currentChannels.join(','));
    }
    if (currentStatuses.length > 0) {
      params.set('statuses', currentStatuses.join(','));
    }
    if (currentTags.length > 0) {
      params.set('tags', currentTags.join(','));
    }
    
    // Update URL without causing navigation
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Wrapper functions to update state and URL together
  const updateSelectedStores = (stores) => {
    setSelectedStores(stores);
    updateURL({ stores });
  };

  const updateSelectedChannels = (channels) => {
    setSelectedChannels(channels);
    updateURL({ channels });
  };

  const updateSelectedStatuses = (statuses) => {
    setSelectedStatuses(statuses);
    updateURL({ statuses });
  };

  const updateSelectedTags = (tags) => {
    setSelectedTags(tags);
    updateURL({ tags });
  };

  const updateDate = (newDate) => {
    setDate(newDate);
    updateURL({ date: newDate });
  };

  const updateView = (newView) => {
    setView(newView);
    updateURL({ view: newView });
  };

  // Load selected stores from localStorage on client mount (only if not in URL)
  useEffect(() => {
    // If stores are already in URL, don't override with localStorage
    if (searchParams.get('stores')) {
      return;
    }
    
    const saved = localStorage.getItem('selectedStores');
    if (saved) {
      try {
        const parsedStores = JSON.parse(saved);
        setSelectedStores(parsedStores);
        // Update URL with localStorage stores
        updateURL({ stores: parsedStores });
      } catch (e) {
        console.error('Error parsing saved stores:', e);
      }
    }
  }, []);

  // Fetch stores on mount
  useEffect(() => {
    fetchStoresWithAnalyticsAccess();
  }, []);

  // Refresh stores when window gains focus (e.g., after adding a store in another tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchStoresWithAnalyticsAccess();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Save selected stores to localStorage whenever they change (skip initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedStores', JSON.stringify(selectedStores));
      console.log('Saved selected stores to localStorage:', selectedStores);
    }
  }, [selectedStores]);

  // Reload campaigns when date/view changes or when stores change
  useEffect(() => {
    if (stores.length > 0) {
      loadCampaigns();
    }
  }, [selectedStores, date, view, stores]);
  
  // Don't clear cache when stores change - we have ALL stores cached
  // The loadCampaigns function will filter client-side

  // Extract unique tags from campaigns
  useEffect(() => {
    const tags = new Set();
    campaigns.forEach(campaign => {
      if (campaign.tags && Array.isArray(campaign.tags)) {
        campaign.tags.forEach(tag => tags.add(tag));
      }
    });
    setAvailableTags(Array.from(tags));
  }, [campaigns]);

  // Generate consistent colors for stores - vibrant pastels with good contrast
  const storeColorMap = useRef(new Map());
  
  // Initialize store colors on mount and when stores change
  useEffect(() => {
    const colors = [
      { bg: 'bg-sky-200', text: 'text-sky-900', border: 'border-sky-400' },
      { bg: 'bg-violet-200', text: 'text-violet-900', border: 'border-violet-400' },
      { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-400' },
      { bg: 'bg-rose-200', text: 'text-rose-900', border: 'border-rose-400' },
      { bg: 'bg-amber-200', text: 'text-amber-900', border: 'border-amber-400' },
      { bg: 'bg-teal-200', text: 'text-teal-900', border: 'border-teal-400' },
      { bg: 'bg-fuchsia-200', text: 'text-fuchsia-900', border: 'border-fuchsia-400' },
      { bg: 'bg-lime-200', text: 'text-lime-900', border: 'border-lime-400' },
    ];
    
    // Assign colors to stores with Klaviyo integration
    stores.filter(s => s.klaviyo_integration?.public_id).forEach((store, index) => {
      const storeId = store.id || store._id;
      if (!storeColorMap.current.has(storeId)) {
        storeColorMap.current.set(storeId, colors[index % colors.length]);
      }
      // Also map by klaviyo_public_id for easier lookup
      if (!storeColorMap.current.has(store.klaviyo_integration.public_id)) {
        storeColorMap.current.set(store.klaviyo_integration.public_id, colors[index % colors.length]);
      }
    });
  }, [stores]);
  
  const getStoreColor = (storeId) => {
    if (!storeId) return { bg: 'bg-gray-200', text: 'text-gray-900', border: 'border-gray-400' };
    
    // Return cached color if exists
    if (storeColorMap.current.has(storeId)) {
      return storeColorMap.current.get(storeId);
    }
    
    // Default gray if not found
    return { bg: 'bg-gray-200', text: 'text-gray-900', border: 'border-gray-400' };
  };

  // Helper function to check if date ranges overlap
  const dateRangesOverlap = (start1, end1, start2, end2) => {
    return start1 <= end2 && end1 >= start2;
  };

  // Helper function to check if a date range is fully covered by cached data
  const isDateRangeCached = (cacheEntry, requestedStart, requestedEnd) => {
    if (!cacheEntry) return false;
    return cacheEntry.startDate <= requestedStart && cacheEntry.endDate >= requestedEnd;
  };
  
  // Function to fetch and cache audiences for a store
  const fetchAndCacheAudiences = async (store) => {
    const klaviyoId = store.klaviyo_integration?.public_id;
    
    if (!klaviyoId) {
      console.warn(`Store ${store.name} missing Klaviyo integration`);
      return null;
    }
    
    // Check if we already have cached audiences for this store
    const cached = audienceCache[klaviyoId];
    const cacheAge = cached ? Date.now() - cached.fetchedAt : Infinity;
    const cacheExpired = cacheAge > 60 * 60 * 1000; // 1 hour cache
    
    if (cached && !cacheExpired) {
      console.log(`Using cached audiences for store ${store.name}`);
      return cached;
    }
    
    console.log(`Fetching audiences for store ${store.name}`);
    
    try {
      // Call the API route instead of the Klaviyo function directly
      const response = await fetch(`/api/klaviyo/audiences?storeId=${klaviyoId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch audiences');
      }
      
      const result = await response.json();
      const audiences = result.data;
      
      const cacheEntry = {
        ...audiences,
        fetchedAt: Date.now()
      };
      
      // Update cache
      setAudienceCache(prev => ({
        ...prev,
        [klaviyoId]: cacheEntry
      }));
      
      return cacheEntry;
    } catch (error) {
      console.error(`Failed to fetch audiences for store ${store.name}:`, error);
      return null;
    }
  };
  
  // Function to resolve audience IDs to names
  const resolveAudienceNames = (audienceIds, storeKlaviyoId) => {
    if (!audienceIds || audienceIds.length === 0) return [];
    
    const storeAudiences = audienceCache[storeKlaviyoId];
    if (!storeAudiences) return audienceIds.map(id => ({ id, name: id, type: 'unknown' }));
    
    return audienceIds.map(audienceId => {
      // Look for the audience in the combined list
      const audience = storeAudiences.all.find(a => a.id === audienceId);
      
      if (audience) {
        return {
          id: audienceId,
          name: audience.name,
          type: audience.type // 'segment' or 'list'
        };
      }
      
      // If not found, return the ID as-is
      return {
        id: audienceId,
        name: audienceId,
        type: 'unknown'
      };
    });
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      
      // Get date range based on current calendar view
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (view === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      } else if (view === 'week') {
        startDate.setDate(date.getDate() - 7);
        endDate.setDate(date.getDate() + 7);
      } else {
        // day view - set start to beginning of day and end to end of day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const now = new Date();
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      // Initialize campaign arrays
      let pastCampaigns = [];
      let futureCampaigns = [];
      
      // Use shared context for past campaigns if we have stores loaded
      if (startDate <= now && stores.length > 0) {
        console.log('📊 Using shared CampaignDataContext for past campaigns');
        
        // Get all klaviyo IDs from stores
        const klaviyoIds = stores
          .filter(store => store.klaviyo_integration?.public_id)
          .map(store => store.klaviyo_integration.public_id);
        
        if (klaviyoIds.length > 0) {
          // Use the shared context with intelligent caching
          const contextData = await getCampaignData(
            startDate.toISOString(),
            new Date(Math.min(endDate.getTime(), now.getTime())).toISOString(),
            klaviyoIds,
            { 
              forceRefresh: false,  // Use cache if available
              prefetch: true,       // Prefetch adjacent ranges
              subscribe: true       // Keep data fresh
            }
          );
          
          console.log('📊 Received from context:', contextData?.campaigns?.length || 0, 'campaigns');
          
          // Transform context data to calendar format
          if (contextData?.campaigns) {
            pastCampaigns = contextData.campaigns.map(campaign => {
              // Find the store for this campaign
              const store = stores.find(s => 
                s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
              );
              
              return {
                id: campaign._id || campaign.id,
                campaignId: campaign.groupings?.campaign_id || campaign.campaignId,
                messageId: campaign.groupings?.campaign_message_id || campaign.messageId,
                name: campaign.campaign_name || campaign.name || 'Unnamed Campaign',
                subject: campaign.subject_line || campaign.subject,
                date: campaign.send_time || campaign.scheduled_at || campaign.created_at || campaign.date,
                channel: campaign.groupings?.send_channel || campaign.channel || 'email',
                status: 'sent', // Past campaigns from context are always sent
                isScheduled: false,
                performance: {
                  recipients: campaign.statistics?.recipients || campaign.recipients || 0,
                  delivered: campaign.statistics?.delivered || campaign.delivered || 0,
                  openRate: campaign.statistics?.open_rate || campaign.openRate || 0,
                  opens: campaign.statistics?.opens || campaign.opens || 0,
                  opensUnique: campaign.statistics?.opens_unique || campaign.opensUnique || 0,
                  clickRate: campaign.statistics?.click_rate || campaign.clickRate || 0,
                  clicks: campaign.statistics?.clicks || campaign.clicks || 0,
                  clicksUnique: campaign.statistics?.clicks_unique || campaign.clicksUnique || 0,
                  conversionRate: campaign.statistics?.conversion_rate || campaign.conversionRate || 0,
                  conversions: campaign.statistics?.conversions || campaign.conversions || 0,
                  revenue: campaign.statistics?.conversion_value || campaign.revenue || 0,
                  averageOrderValue: campaign.statistics?.average_order_value || campaign.averageOrderValue || 0,
                  bounced: campaign.statistics?.bounced || campaign.bounced || 0,
                  failed: campaign.statistics?.failed || campaign.failed || 0,
                  unsubscribes: campaign.statistics?.unsubscribes || campaign.unsubscribes || 0,
                  spamComplaints: campaign.statistics?.spam_complaints || campaign.spamComplaints || 0,
                  bounceRate: campaign.statistics?.bounce_rate || campaign.bounceRate || 0,
                  unsubscribeRate: campaign.statistics?.unsubscribe_rate || campaign.unsubscribeRate || 0,
                  spamComplaintRate: campaign.statistics?.spam_complaint_rate || campaign.spamComplaintRate || 0,
                  clickToOpenRate: campaign.statistics?.click_to_open_rate || campaign.clickToOpenRate || 0,
                  revenuePerRecipient: campaign.statistics?.revenue_per_recipient || campaign.revenuePerRecipient || 0,
                },
                tags: campaign.tagNames || campaign.tags || [],
                storeIds: campaign.store_public_ids || (store?.public_id ? [store.public_id] : []),
                storeName: store?.name || 'Unknown Store',
                klaviyo_public_id: campaign.klaviyo_public_id,
                fromAddress: campaign.from_address || campaign.fromAddress,
                audiences: {
                  included: campaign.included_audiences || [],
                  excluded: campaign.excluded_audiences || []
                }
              };
            }).filter(c => {
              // Filter to requested date range
              const cDate = new Date(c.date).getTime();
              return cDate >= startTime && cDate <= endTime;
            });
          }
        }
      }
      
      // Still need to fetch future/scheduled campaigns from the API
      // because the shared context only handles historical data
      const cacheAge = campaignCache.future ? Date.now() - campaignCache.future.fetchedAt : Infinity;
      const cacheExpired = cacheAge > 5 * 60 * 1000; // 5 minutes
      let needFetchFuture = !campaignCache.future || cacheExpired;
      
      if (campaignCache.future && !cacheExpired) {
        console.log('Using cached future campaigns');
        futureCampaigns = campaignCache.future.campaigns.filter(c => {
          const cDate = new Date(c.date).getTime();
          return cDate >= startTime && cDate <= endTime;
        });
      }

      // Build params for future campaigns API call
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Fetch only what's needed
      const promises = [];
      
      // Past campaigns are now handled by the shared context
      promises.push(Promise.resolve(pastCampaigns));
      
      if (needFetchFuture) {
        console.log('Fetching new future campaigns...');
        console.log('Request params:', params.toString());
        setFutureLoading(true); // Set future loading to true
        promises.push(
          fetch(`/api/calendar/campaigns/future?${params}`)
            .then(res => {
              console.log('Future campaigns API response status:', res.status);
              if (!res.ok) {
                console.error('Future campaigns API error:', res.status, res.statusText);
                return { campaigns: [] };
              }
              return res.json();
            })
            .then(data => {
              // Store ALL scheduled campaigns from all stores
              const newCampaigns = data.campaigns || [];
              console.log('Future campaigns received from API:', newCampaigns.length);
              console.log('Future campaigns:', newCampaigns.map(c => ({
                name: c.name,
                date: c.date,
                status: c.status
              })));
              
              // Update cache with ALL scheduled campaigns
              setCampaignCache(prev => ({
                ...prev,
                future: {
                  campaigns: newCampaigns,
                  fetchedAt: Date.now()
                }
              }));
              
              // Filter for the requested date range
              const filtered = newCampaigns.filter(c => {
                const cDate = new Date(c.date).getTime();
                return cDate >= startTime && cDate <= endTime;
              });
              console.log('Future campaigns after date filter:', filtered.length);
              return filtered;
            })
            .catch(err => {
              console.error('Error fetching future campaigns:', err);
              return [];
            })
        );
      } else {
        console.log('Using cached future campaigns:', futureCampaigns.length);
        promises.push(Promise.resolve(futureCampaigns));
      }

      // Load past campaigns first (from shared context - should be instant if cached)
      const finalPastCampaigns = await promises[0];
      
      // Immediately show past campaigns
      if (finalPastCampaigns && finalPastCampaigns.length > 0) {
        let filteredPast = [...finalPastCampaigns];
        
        // Filter by selected stores if any are selected
        if (selectedStores.length > 0) {
          console.log('Filtering past campaigns by stores. Before:', filteredPast.length);
          console.log('Selected store IDs:', selectedStores);
          
          filteredPast = filteredPast.filter(campaign => {
            const store = stores.find(s => 
              s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
            );
            
            console.log('Checking past campaign:', {
              name: campaign.name,
              klaviyo_public_id: campaign.klaviyo_public_id,
              storeIds: campaign.storeIds,
              foundStore: store ? store.name : 'not found',
              storePublicId: store?.public_id,
              selectedStores: selectedStores
            });
            
            if (store && selectedStores.includes(store.public_id)) {
              console.log('Past campaign matched by klaviyo_public_id');
              return true;
            }
            
            if (campaign.storeIds && campaign.storeIds.length > 0) {
              const matches = campaign.storeIds.some(storeId => 
                selectedStores.includes(storeId)
              );
              if (matches) {
                console.log('Past campaign matched by storeIds');
                return true;
              }
            }
            
            console.log('Past campaign filtered out');
            return false;
          });
          
          console.log('After filtering past campaigns:', filteredPast.length);
        }
        
        // Sort by date (most recent first)
        filteredPast.sort((a, b) => new Date(b.date) - new Date(a.date));
        setCampaigns(filteredPast);
        setLoading(false); // Stop loading spinner once past campaigns are shown
        
        console.log('Past campaigns loaded:', {
          total: finalPastCampaigns.length,
          filtered: filteredPast.length,
          fromContext: true // Now using shared context
        });
      }
      
      // Then load future campaigns in the background (slower Klaviyo API)
      if (promises[1]) {
        promises[1].then(finalFutureCampaigns => {
          setFutureLoading(false); // Set future loading to false when done
          // Combine past and future campaigns
          let allCampaigns = [
            ...(finalPastCampaigns || []),
            ...(finalFutureCampaigns || [])
          ];
          
          // Filter by selected stores if any are selected
          if (selectedStores.length > 0) {
            console.log('Filtering campaigns by stores. Before:', allCampaigns.length);
            console.log('Selected store IDs:', selectedStores);
            console.log('Available stores:', stores.map(s => ({
              name: s.name,
              public_id: s.public_id,
              klaviyo_id: s.klaviyo_integration?.public_id
            })));
            
            allCampaigns = allCampaigns.filter(campaign => {
              // Check if campaign belongs to any selected store
              const store = stores.find(s => 
                s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
              );
              
              console.log('Checking campaign:', {
                name: campaign.name,
                klaviyo_public_id: campaign.klaviyo_public_id,
                storeIds: campaign.storeIds,
                foundStore: store ? store.name : 'not found',
                storePublicId: store?.public_id,
                selectedStores: selectedStores
              });
              
              if (store && selectedStores.includes(store.public_id)) {
                console.log('Campaign matched by klaviyo_public_id');
                return true;
              }
              
              // Also check storeIds field
              if (campaign.storeIds && campaign.storeIds.length > 0) {
                const matches = campaign.storeIds.some(storeId => 
                  selectedStores.includes(storeId)
                );
                if (matches) {
                  console.log('Campaign matched by storeIds');
                  return true;
                }
              }
              
              console.log('Campaign filtered out');
              return false;
            });
            
            console.log('After filtering by stores:', allCampaigns.length);
          }
          
          // Sort by date (most recent first)
          allCampaigns.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          console.log('Campaigns loaded:', {
            past: finalPastCampaigns?.length || 0,
            future: finalFutureCampaigns?.length || 0,
            filtered: allCampaigns.length,
            selectedStores: selectedStores.length
          });
          
          setCampaigns(allCampaigns);
          setLoading(false); // Stop loading once all campaigns are loaded
        }).catch(err => {
          console.error('Failed to load future campaigns:', err);
          setFutureLoading(false); // Set future loading to false on error
          // Keep showing past campaigns even if future fails
          setLoading(false); // Stop loading even on error
        });
      } else {
        // No future campaigns to load
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort campaigns for day view by selected account
  const getFilteredDayCampaigns = () => {
    let filtered = [...selectedDayCampaigns];
    
    // Apply account filter
    if (dayCampaignFilter !== 'all') {
      console.log('Filtering campaigns with filter:', dayCampaignFilter);
      console.log('Total campaigns before filter:', filtered.length);
      
      filtered = filtered.filter(campaign => {
        // Find the store that matches this campaign's klaviyo_public_id
        const store = stores.find(s => 
          s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
        );
        
        const matches = store && store.public_id === dayCampaignFilter;
        
        if (!matches) {
          console.log('Campaign filtered out:', {
            campaignName: campaign.name,
            campaignKlaviyoId: campaign.klaviyo_public_id,
            storeFound: store?.name,
            storePublicId: store?.public_id,
            filterValue: dayCampaignFilter
          });
        }
        
        return matches;
      });
      
      console.log('Campaigns after filter:', filtered.length);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = dayCampaignSort;
      let aValue, bValue;
      
      switch (field) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'channel':
          aValue = a.channel || '';
          bValue = b.channel || '';
          break;
        case 'store':
          const storeA = stores.find(s => s.klaviyo_integration?.public_id === a.klaviyo_public_id);
          const storeB = stores.find(s => s.klaviyo_integration?.public_id === b.klaviyo_public_id);
          aValue = storeA?.name || '';
          bValue = storeB?.name || '';
          break;
        case 'recipients':
          aValue = a.performance?.recipients || 0;
          bValue = b.performance?.recipients || 0;
          break;
        case 'openRate':
          aValue = a.performance?.openRate || 0;
          bValue = b.performance?.openRate || 0;
          break;
        case 'clickRate':
          aValue = a.performance?.clickRate || 0;
          bValue = b.performance?.clickRate || 0;
          break;
        case 'revenue':
          aValue = a.performance?.revenue || 0;
          bValue = b.performance?.revenue || 0;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }
      
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return direction === 'asc' ? comparison : -comparison;
      } else {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return filtered;
  };

  // Get unique accounts from day campaigns
  const getDayAccountOptions = () => {
    if (!selectedDayCampaigns.length) return [];
    
    const accountMap = new Map();
    selectedDayCampaigns.forEach(campaign => {
      const store = stores.find(s => 
        s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
      );
      if (store && !accountMap.has(store.public_id)) {
        accountMap.set(store.public_id, {
          id: store.public_id,
          name: store.name,
          count: selectedDayCampaigns.filter(c => {
            const s = stores.find(st => st.klaviyo_integration?.public_id === c.klaviyo_public_id);
            return s && s.public_id === store.public_id;
          }).length
        });
      }
    });
    
    return Array.from(accountMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Handle table header sorting
  const handleDayCampaignSort = (field) => {
    setDayCampaignSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDateClick = (value) => {
    const dateCampaigns = getCampaignsForDate(value);
    
    // If there are campaigns for this date, show them
    if (dateCampaigns.length > 0) {
      setSelectedDayCampaigns(dateCampaigns);
      setSelectedDate(value);
      setDayCampaignFilter('all'); // Reset filter when opening new day
      setDayCampaignView('card'); // Reset to card view
      setDayCampaignSort({ field: 'date', direction: 'desc' }); // Reset sort
      setShowDayCampaigns(true);
    } 
    // Otherwise, if it's a future date, allow creating a new campaign
    else if (isFuture(value) || isToday(value)) {
      setSelectedDate(value);
      setCampaignForm(prev => ({
        ...prev,
        scheduledDate: format(value, 'yyyy-MM-dd')
      }));
      setShowCampaignModal(true);
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(date.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(date.getDate() - 7);
    } else {
      newDate.setDate(date.getDate() - 1);
    }
    updateDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(date.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(date.getDate() + 7);
    } else {
      newDate.setDate(date.getDate() + 1);
    }
    updateDate(newDate);
  };

  const handleToday = () => {
    updateDate(new Date());
  };

  const handleCreateCampaign = async () => {
    // TODO: Implement campaign creation
    console.log('Creating campaign:', campaignForm);
    
    // Add to campaigns list
    const newCampaign = {
      id: Date.now().toString(),
      ...campaignForm,
      createdAt: new Date()
    };
    
    setCampaigns([...campaigns, newCampaign]);
    setShowCampaignModal(false);
    
    // Reset form
    setCampaignForm({
      name: '',
      store: '',
      subject: '',
      previewText: '',
      tags: [],
      scheduledDate: null,
      scheduledTime: '09:00'
    });
  };

  const getCampaignsForDate = (date) => {
    // Guard against empty campaigns array
    if (!campaigns || campaigns.length === 0) {
      console.log('getCampaignsForDate: No campaigns available');
      return [];
    }
    
    const dateCampaigns = campaigns.filter(campaign => {
      // Use campaign.date which is mapped from send_time in the API
      const campaignDate = new Date(campaign.date);
      
      // For debugging midnight campaigns
      if (campaignDate.getHours() === 0 && campaignDate.getMinutes() === 0) {
        console.log('Midnight campaign found:', {
          name: campaign.name,
          campaignDate: campaign.date,
          campaignDateObj: campaignDate,
          targetDate: date,
          campaignDay: campaignDate.getDate(),
          targetDay: date.getDate(),
          campaignMonth: campaignDate.getMonth(),
          targetMonth: date.getMonth(),
          campaignYear: campaignDate.getFullYear(),
          targetYear: date.getFullYear()
        });
      }
      
      // Check if the dates are on the same day
      const isSameDay = (
        campaignDate.getDate() === date.getDate() &&
        campaignDate.getMonth() === date.getMonth() &&
        campaignDate.getFullYear() === date.getFullYear()
      );
      
      if (!isSameDay) return false;
      
      // Apply store filter if stores are selected
      if (selectedStores.length > 0) {
        // Find the store that matches this campaign's klaviyo_public_id
        const store = stores.find(s => 
          s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
        );
        
        if (!store) {
          // If no store found by klaviyo_public_id, check if campaign has storeIds
          if (campaign.storeIds && campaign.storeIds.length > 0) {
            // Check if any of the campaign's storeIds match selected stores
            const hasMatchingStore = campaign.storeIds.some(storeId => 
              selectedStores.includes(storeId)
            );
            if (!hasMatchingStore) {
              return false;
            }
          } else {
            // No store found and no storeIds - filter out if stores are selected
            return false;
          }
        } else {
          // Store found - check if it's in selected stores
          if (!selectedStores.includes(store.public_id)) {
            return false;
          }
        }
      }
      
      // Apply channel filter (multi-select)
      if (selectedChannels.length > 0 && !selectedChannels.includes(campaign.channel)) {
        return false;
      }
      
      // Apply tags filter (multi-select)
      if (selectedTags.length > 0 && campaign.tags) {
        const hasMatchingTag = campaign.tags.some(tag => selectedTags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      // Apply status filter (multi-select)
      if (selectedStatuses.length > 0) {
        const campaignStatus = (campaign.status || '').toLowerCase();
        const isScheduled = campaign.isScheduled || 
                          campaignStatus === 'scheduled' || 
                          campaignStatus === 'draft' || 
                          campaignStatus === 'sending' || 
                          campaignStatus === 'queued without recipients';
        
        // Check if campaign matches any selected status
        let matchesStatus = false;
        for (const status of selectedStatuses) {
          switch (status.toLowerCase()) {
            case 'sent':
              // Campaigns that have been sent (not scheduled/draft)
              if (!isScheduled && campaignStatus === 'sent') matchesStatus = true;
              break;
            case 'draft':
              // Draft campaigns
              if (campaignStatus === 'draft') matchesStatus = true;
              break;
            case 'scheduled':
              // Scheduled and queued campaigns
              if (campaignStatus === 'scheduled' || campaignStatus === 'queued without recipients' || isScheduled) matchesStatus = true;
              break;
            case 'sending':
              // Campaigns currently sending
              if (campaignStatus === 'sending') matchesStatus = true;
              break;
          }
          if (matchesStatus) break;
        }
        
        if (!matchesStatus) return false;
      }
      
      return true;
    });
    
    // Debug logging
    if (dateCampaigns.length === 0 && campaigns.length > 0) {
      const sameDayCampaigns = campaigns.filter(c => {
        const cDate = new Date(c.date);
        return cDate.getDate() === date.getDate() &&
               cDate.getMonth() === date.getMonth() &&
               cDate.getFullYear() === date.getFullYear();
      });
      
      if (sameDayCampaigns.length > 0) {
        console.log('DEBUG: Campaigns exist for this day but were filtered out:', {
          date: format(date, 'yyyy-MM-dd'),
          view: view,
          totalCampaignsForDay: sameDayCampaigns.length,
          selectedStores,
          selectedChannels,
          selectedStatuses,
          availableStores: stores.map(s => ({
            name: s.name,
            public_id: s.public_id,
            klaviyo_id: s.klaviyo_integration?.public_id
          })),
          campaigns: sameDayCampaigns.map(c => ({
            name: c.name,
            klaviyo_public_id: c.klaviyo_public_id,
            storeIds: c.storeIds,
            storeName: c.storeName,
            channel: c.channel,
            status: c.status,
            isScheduled: c.isScheduled
          }))
        });
      }
    }
    
    return dateCampaigns;
  };

  const handleCampaignClick = async (campaign) => {
    setSelectedCampaign(campaign);
    setPreviousView('calendar');
    setShowCampaignDetails(true);
    
    // Find the store for this campaign
    const store = stores.find(s => 
      s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
    );
    
    if (store) {
      // Fetch audiences for this store if not already cached
      await fetchAndCacheAudiences(store);
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sms':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'push-notification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 0.2) return 'text-green-600';
    if (rate >= 0.1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateCampaigns = getCampaignsForDate(date);
      if (dateCampaigns.length > 0) {
        return (
          <div className="w-full mt-1 space-y-1">
            {dateCampaigns.slice(0, 2).map((campaign, index) => {
              const openRate = campaign.performance?.openRate || 0;
              const clickRate = campaign.performance?.clickRate || 0;
              const revenue = campaign.performance?.revenue || 0;
              
              // Determine which metric to show based on channel
              let metricDisplay = '';
              let metricValue = 0;
              
              if (campaign.channel === 'sms') {
                // For SMS, show click rate
                metricDisplay = 'CTR';
                metricValue = clickRate;
              } else {
                // For email, show open rate
                metricDisplay = 'Open';
                metricValue = openRate;
              }
              
              // Get store for color coding - try multiple ways to match
              let store = stores.find(s => 
                s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
              );
              
              // Log for debugging
              if (!store && campaign.klaviyo_public_id) {
                console.log('Could not find store for campaign:', {
                  campaignName: campaign.name,
                  campaignKlaviyoId: campaign.klaviyo_public_id,
                  availableStores: stores.map(s => ({
                    name: s.name,
                    klaviyoId: s.klaviyo_integration?.public_id
                  }))
                });
              }
              
              // Use the store ID for color lookup
              const colorKey = store?.id || store?._id || campaign.klaviyo_public_id;
              const storeColor = getStoreColor(colorKey);
              
              // Different styling for scheduled vs sent campaigns
              const isScheduled = campaign.isScheduled || campaign.status === 'scheduled' || campaign.status === 'Draft' || campaign.status === 'Scheduled';
              const baseClasses = `text-xs px-1.5 py-1 rounded-md border cursor-pointer hover:opacity-90 transition-opacity shadow-sm`;
              
              let campaignClasses;
              let titleText;
              
              if (isScheduled) {
                // Scheduled campaigns: dashed border with store color
                campaignClasses = `${baseClasses} ${storeColor.bg} ${storeColor.text} border-dashed ${storeColor.border}`;
                titleText = `📅 SCHEDULED: ${campaign.name}\n${store?.name || campaign.storeName || 'Unknown Store'}\n${campaign.channel.toUpperCase()}\nScheduled: ${format(new Date(campaign.date), 'MMM d, h:mm a')}`;
              } else {
                // Sent campaigns: solid border, store color background
                campaignClasses = `${baseClasses} ${storeColor.bg} ${storeColor.text} ${storeColor.border}`;
                titleText = `${campaign.name}\n${store?.name || campaign.storeName || 'Unknown Store'}\n${campaign.channel.toUpperCase()}\nOpen: ${(openRate * 100).toFixed(1)}%\nClick: ${(clickRate * 100).toFixed(1)}%\nRevenue: $${revenue.toFixed(2)}`;
              }
              
              return (
                <div
                  key={`${campaign.isScheduled ? 'future' : 'past'}-${campaign.id}-${index}`}
                  className={campaignClasses}
                  title={titleText}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCampaignClick(campaign);
                  }}
                >
                  <div className="truncate font-semibold text-xs flex items-center">
                    {isScheduled && <Clock className="h-3 w-3 mr-1 flex-shrink-0" />}
                    <span className="truncate">{campaign.name}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[10px] font-medium flex items-center">
                      {campaign.channel === 'email' && <Mail className="h-3 w-3 inline mr-0.5" />}
                      {campaign.channel === 'sms' && <MessageSquare className="h-3 w-3 inline mr-0.5" />}
                      {campaign.channel === 'push-notification' && <Bell className="h-3 w-3 inline mr-0.5" />}
                      {store?.name || campaign.storeName || 'Unknown'}
                    </span>
                    <span className={`text-[10px] font-bold`}>
                      {isScheduled ? format(new Date(campaign.date), 'h:mm a') : `${(metricValue * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  {!isScheduled && revenue > 0 && (
                    <div className="text-[10px] font-bold mt-0.5">
                      ${revenue >= 1000 ? `${(revenue/1000).toFixed(1)}k` : revenue.toFixed(0)}
                    </div>
                  )}
                  {isScheduled && (
                    <div className="text-[10px] font-medium mt-0.5 flex items-center">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      Scheduled
                    </div>
                  )}
                </div>
              );
            })}
            {dateCampaigns.length > 2 && (
              <div 
                className="text-xs text-sky-blue hover:text-royal-blue dark:text-sky-blue dark:hover:text-royal-blue text-center py-1 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDayCampaigns(dateCampaigns);
                  setSelectedDate(date);
                  setShowDayCampaigns(true);
                }}
              >
                +{dateCampaigns.length - 2} more
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Week view renderer
  const renderWeekView = () => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="week-view-container">
        {/* Week header */}
        <div className="week-header grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day, index) => {
            const dayName = format(day, 'EEE');
            const dayNumber = format(day, 'd');
            const isTodayDate = isToday(day);
            const isSelected = day.toDateString() === date.toDateString();
            
            return (
              <div
                key={index}
                className={cn(
                  "p-4 text-center border-r border-gray-200 dark:border-gray-700",
                  index === 6 && "border-r-0",
                  isSelected && "bg-sky-50 dark:bg-sky-900/20"
                )}
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">{dayName}</div>
                <div className={cn(
                  "text-lg font-semibold mt-1",
                  isTodayDate ? "text-sky-blue" : "text-gray-900 dark:text-white"
                )}>
                  {dayNumber}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Week content */}
        <div className="week-content grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, index) => {
            const dayCampaigns = getCampaignsForDate(day).sort((a, b) => {
              const timeA = new Date(a.date).getTime();
              const timeB = new Date(b.date).getTime();
              return timeA - timeB;
            });
            
            return (
              <div
                key={index}
                className={cn(
                  "border-r border-gray-200 dark:border-gray-700 p-2 overflow-y-auto max-h-[400px]",
                  index === 6 && "border-r-0"
                )}
              >
                {dayCampaigns.map((campaign, campaignIndex) => {
                  const isScheduled = campaign.isScheduled || campaign.status === 'scheduled';
                  
                  // Find the store for color coding
                  const store = stores.find(s => 
                    s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                  );
                  const colorKey = store?.id || store?._id || campaign.klaviyo_public_id;
                  const storeColor = getStoreColor(colorKey);
                  
                  return (
                    <div
                      key={campaignIndex}
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowCampaignDetails(true);
                      }}
                      className={cn(
                        "campaign-item mb-2 p-2 rounded border-l-3 cursor-pointer transition-all",
                        storeColor.bg, storeColor.text, storeColor.border,
                        isScheduled && "opacity-75 italic"
                      )}
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {format(new Date(campaign.date), 'HH:mm')}
                        {isScheduled && <span className="ml-1">(Scheduled)</span>}
                      </div>
                      <div className="font-medium text-sm truncate">{campaign.name}</div>
                      <div className="text-xs opacity-75 flex items-center gap-1">
                        {campaign.channel === 'email' && <Mail className="h-3 w-3" />}
                        {campaign.channel === 'sms' && <MessageSquare className="h-3 w-3" />}
                        {campaign.channel === 'push-notification' && <Bell className="h-3 w-3" />}
                        {store?.name || campaign.storeName || 'Unknown Store'}
                      </div>
                    </div>
                  );
                })}
                {dayCampaigns.length === 0 && (isFuture(day) || isToday(day)) && (
                  <div 
                    className="text-center text-gray-400 dark:text-gray-500 py-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    onClick={() => handleDateClick(day)}
                  >
                    <Plus className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">Add Campaign</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Day view renderer
  const renderDayView = () => {
    console.log('Day view - Current date:', format(date, 'yyyy-MM-dd'));
    console.log('Day view - Total campaigns available:', campaigns.length);
    console.log('Day view - Selected stores:', selectedStores);
    console.log('Day view - Selected channels:', selectedChannels);
    console.log('Day view - Selected statuses:', selectedStatuses);
    
    const dayCampaigns = getCampaignsForDate(date).sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeA - timeB;
    });
    
    console.log('Day view - Campaigns for this date:', dayCampaigns.length);
    console.log('Day view - Campaign times:', dayCampaigns.map(c => ({
      name: c.name,
      date: c.date,
      hour: new Date(c.date).getHours(),
      formatted: format(new Date(c.date), 'yyyy-MM-dd HH:mm:ss')
    })));

    // Generate hour slots
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="day-view-container">
        {/* Day header */}
        <div className="day-header p-4 border-b border-gray-200 dark:border-gray-700 bg-sky-50 dark:bg-sky-900/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {dayCampaigns.length} campaigns scheduled
            </div>
          </div>
        </div>
        
        {/* Hour timeline */}
        <div className="day-timeline max-h-[400px] overflow-y-auto">
          {hours.map(hour => {
            const hourString = hour.toString().padStart(2, '0') + ':00';
            const hourCampaigns = dayCampaigns.filter(campaign => {
              const campaignHour = new Date(campaign.date).getHours();
              const matches = campaignHour === hour;
              if (hour === 0 || hour === 5) { // Debug hours 00:00 and 05:00
                console.log(`Hour ${hour}:00 - Campaign ${campaign.name}:`, {
                  campaignDate: campaign.date,
                  campaignHour,
                  matches
                });
              }
              return matches;
            });

            // Debug logging for hour 0
            if (hour === 0 && hourCampaigns.length === 0) {
              console.log('No campaigns found for midnight slot, but dayCampaigns has:', 
                dayCampaigns.filter(c => {
                  const h = new Date(c.date).getHours();
                  return h === 0 || h === 24; // Check both 0 and 24
                }).map(c => ({
                  name: c.name,
                  hour: new Date(c.date).getHours(),
                  date: c.date
                }))
              );
            }
            
            return (
              <div key={hour} className="hour-slot border-b border-gray-100 dark:border-gray-800">
                <div className="flex">
                  <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 dark:text-gray-400 text-right border-r border-gray-200 dark:border-gray-700">
                    {hourString}
                  </div>
                  <div className="flex-1 min-h-[60px] p-2">
                    {hourCampaigns.map((campaign, index) => {
                      const isScheduled = campaign.isScheduled || 
                                        campaign.status === 'scheduled' || 
                                        campaign.status === 'Draft' || 
                                        campaign.status === 'Scheduled' ||
                                        campaign.status === 'Queued without Recipients';
                      
                      // Find the store for this campaign
                      const store = stores.find(s => 
                        s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                      );
                      const storeName = store?.name || campaign.storeName || 'Unknown Store';
                      const colorKey = store?.id || store?._id || campaign.klaviyo_public_id;
                      const storeColor = getStoreColor(colorKey);
                      
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowCampaignDetails(true);
                          }}
                          className={cn(
                            "campaign-item mb-2 p-3 rounded border-l-4 cursor-pointer transition-all",
                            storeColor.bg, storeColor.text, storeColor.border,
                            isScheduled && "opacity-75 italic"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{campaign.name}</div>
                              <div className="text-xs opacity-75 mt-1 flex items-center gap-1">
                                {campaign.channel === 'email' && <Mail className="h-3 w-3" />}
                                {campaign.channel === 'sms' && <MessageSquare className="h-3 w-3" />}
                                {campaign.channel === 'push-notification' && <Bell className="h-3 w-3" />}
                                {storeName}
                                {isScheduled && <span className="ml-2">(Scheduled)</span>}
                              </div>
                              {campaign.subject && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                  {campaign.subject}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              {format(new Date(campaign.date), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {hourCampaigns.length === 0 && (isFuture(date) || (isToday(date) && hour >= new Date().getHours())) && (
                      <div 
                        className="h-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
                        onClick={() => {
                          const scheduledDate = new Date(date);
                          scheduledDate.setHours(hour, 0, 0, 0);
                          setCampaignForm(prev => ({
                            ...prev,
                            scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
                            scheduledTime: hourString
                          }));
                          setShowCampaignModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Compact Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Campaign Calendar
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and schedule your email campaigns
          </p>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Campaigns</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaigns.length}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">This month</p>
              </div>
              <div className="p-2 bg-sky-50 dark:bg-sky-blue/20 rounded-lg">
                <Mail className="h-4 w-4 text-sky-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Open Rate</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaigns.length > 0 
                    ? (() => {
                        const totalRecipients = campaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0);
                        const totalOpens = campaigns.reduce((sum, c) => sum + (c.performance?.opensUnique || 0), 0);
                        return totalRecipients > 0 ? `${(totalOpens / totalRecipients * 100).toFixed(1)}%` : '0%';
                      })()
                    : '0%'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {campaigns.reduce((sum, c) => sum + (c.performance?.opensUnique || 0), 0).toLocaleString()} opens
                </p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-600/20 rounded-lg">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Click Rate</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaigns.length > 0 
                    ? (() => {
                        const totalRecipients = campaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0);
                        const totalClicks = campaigns.reduce((sum, c) => sum + (c.performance?.clicksUnique || 0), 0);
                        return totalRecipients > 0 ? `${(totalClicks / totalRecipients * 100).toFixed(1)}%` : '0%';
                      })()
                    : '0%'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {campaigns.reduce((sum, c) => sum + (c.performance?.clicksUnique || 0), 0).toLocaleString()} clicks
                </p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-vivid-violet/20 rounded-lg">
                <MousePointer className="h-4 w-4 text-vivid-violet" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  ${campaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0).toLocaleString()}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {(() => {
                    const totalRecipients = campaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0);
                    const totalConversions = campaigns.reduce((sum, c) => sum + (c.performance?.conversions || 0), 0);
                    return totalRecipients > 0 
                      ? `${(totalConversions / totalRecipients * 100).toFixed(1)}% conv`
                      : '0% conv';
                  })()
                  }
                </p>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-600/20 rounded-lg">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-sky-50 dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm">
            <div className="h-4 w-4 border-2 border-sky-blue border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Loading campaigns...</span>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-4">
            <div className="min-w-[180px]">
              <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider mb-1.5 block">Store</label>
              <Popover open={showStoreDropdown} onOpenChange={setShowStoreDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-between text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-sky-blue focus:border-sky-blue transition-colors font-normal"
                  >
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <Store className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium">
                        {selectedStores.length === 0 
                          ? "View All Stores" 
                          : selectedStores.length === 1 
                            ? stores.find(s => s.public_id === selectedStores[0])?.name || "1 Store"
                            : `${selectedStores.length} Stores`}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" align="start">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Select Stores</p>
                      {selectedStores.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSelectedStores([])}
                          className="h-6 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    <div className="space-y-1">
                      <div 
                        className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => updateSelectedStores([])}
                      >
                        <Checkbox 
                          checked={selectedStores.length === 0}
                          className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer flex-1">View All Stores</label>
                      </div>
                      {stores
                        .sort((a, b) => {
                          // Sort stores with Klaviyo first, then without
                          const aHasKlaviyo = a.klaviyo_integration?.public_id;
                          const bHasKlaviyo = b.klaviyo_integration?.public_id;
                          
                          if (aHasKlaviyo && !bHasKlaviyo) return -1;
                          if (!aHasKlaviyo && bHasKlaviyo) return 1;
                          
                          // If both have or don't have Klaviyo, sort alphabetically
                          return a.name.localeCompare(b.name);
                        })
                        .map(store => {
                          const hasKlaviyo = store.klaviyo_integration?.public_id;
                          const storeId = store.public_id || store.id || store._id;
                          
                          return (
                            <div 
                              key={storeId}
                              className={cn(
                                "flex items-center space-x-2 px-2 py-1.5 rounded",
                                hasKlaviyo 
                                  ? "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" 
                                  : "opacity-50 cursor-not-allowed"
                              )}
                              onClick={() => {
                                if (hasKlaviyo) {
                                  updateSelectedStores(
                                    selectedStores.includes(storeId)
                                      ? selectedStores.filter(id => id !== storeId)
                                      : [...selectedStores, storeId]
                                  );
                                }
                              }}
                              title={!hasKlaviyo ? "Klaviyo integration not configured" : undefined}
                            >
                              <Checkbox 
                                checked={selectedStores.includes(storeId)}
                                disabled={!hasKlaviyo}
                                className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                              />
                              <div className="flex items-center gap-2 flex-1">
                                {hasKlaviyo && (() => {
                                  const colorKey = store.id || store._id || store.public_id;
                                  const storeColor = getStoreColor(colorKey);
                                  return (
                                    <div 
                                      className={cn(
                                        "w-3 h-3 rounded-full border",
                                        storeColor.bg,
                                        storeColor.border
                                      )}
                                    />
                                  );
                                })()}
                                <div className="flex-1">
                                  <label className={cn(
                                    "text-sm font-medium block",
                                    hasKlaviyo ? "cursor-pointer text-gray-700 dark:text-gray-200" : "cursor-not-allowed text-gray-400 dark:text-gray-500"
                                  )}>
                                    {store.name}
                                    {!hasKlaviyo && (
                                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                        (No Klaviyo)
                                      </span>
                                    )}
                                  </label>
                                  {store.user_role && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {store.user_role.charAt(0).toUpperCase() + store.user_role.slice(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  {selectedStores.length > 0 && (
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {selectedStores.map(storeId => {
                          const store = stores.find(s => s.public_id === storeId || s.id === storeId || s._id === storeId);
                          return store ? (
                            <Badge
                              key={storeId}
                              variant="secondary"
                              className="text-xs px-2 py-0.5 bg-sky-tint/50 hover:bg-sky-tint"
                            >
                              {store.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStores(prev => prev.filter(id => id !== storeId));
                                }}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="min-w-[160px]">
              <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider mb-1.5 block">Channel</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-between text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-sky-blue focus:border-sky-blue transition-colors font-normal"
                  >
                    <span className="flex items-center gap-2">
                      {selectedChannels.length === 0 ? (
                        <>
                          <Activity className="h-4 w-4" />
                          All Channels
                        </>
                      ) : selectedChannels.length === 1 ? (
                        <>
                          {selectedChannels[0] === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                          {selectedChannels[0] === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                          {selectedChannels[0] === 'push-notification' && <Bell className="h-4 w-4 text-purple-600" />}
                          {selectedChannels[0] === 'email' && 'Email'}
                          {selectedChannels[0] === 'sms' && 'SMS'}
                          {selectedChannels[0] === 'push-notification' && 'Push'}
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4" />
                          {selectedChannels.length} Channels
                        </>
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Select Channels</div>
                      {selectedChannels.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSelectedChannels([])}
                          className="h-6 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="channel-all"
                        checked={selectedChannels.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedChannels([]);
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="channel-all" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2 font-medium">
                        <Activity className="h-4 w-4 text-gray-600" />
                        View All Channels
                      </label>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="channel-email"
                        checked={selectedChannels.includes('email')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedChannels([...selectedChannels, 'email']);
                          } else {
                            updateSelectedChannels(selectedChannels.filter(c => c !== 'email'));
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="channel-email" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Email
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="channel-sms"
                        checked={selectedChannels.includes('sms')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedChannels([...selectedChannels, 'sms']);
                          } else {
                            updateSelectedChannels(selectedChannels.filter(c => c !== 'sms'));
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="channel-sms" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        SMS
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="channel-push"
                        checked={selectedChannels.includes('push-notification')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedChannels([...selectedChannels, 'push-notification']);
                          } else {
                            updateSelectedChannels(selectedChannels.filter(c => c !== 'push-notification'));
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="channel-push" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-purple-600" />
                        Push
                      </label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="min-w-[140px]">
              <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider mb-1.5 block">Tags</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-between text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-sky-blue focus:border-sky-blue transition-colors font-normal"
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      {selectedTags.length > 0 ? `${selectedTags.length} Tags` : 'All Tags'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Select Tags</div>
                      {selectedTags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSelectedTags([])}
                          className="h-6 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {availableTags.length > 0 ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tag-all"
                            checked={selectedTags.length === 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateSelectedTags([]);
                              }
                            }}
                            className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                          />
                          <label htmlFor="tag-all" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 font-medium">
                            <span className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-gray-600" />
                              View All Tags
                            </span>
                          </label>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        {availableTags.map(tag => (
                          <div key={tag} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag}`}
                              checked={selectedTags.includes(tag)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateSelectedTags([...selectedTags, tag]);
                                } else {
                                  updateSelectedTags(selectedTags.filter(t => t !== tag));
                                }
                              }}
                              className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                            />
                            <label
                              htmlFor={`tag-${tag}`}
                              className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200"
                            >
                              {tag}
                            </label>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No tags available</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="min-w-[140px]">
              <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider mb-1.5 block">Status</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-between text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-sky-blue focus:border-sky-blue transition-colors font-normal"
                  >
                    <span className="flex items-center gap-2">
                      {selectedStatuses.length === 0 ? (
                        <>
                          <Activity className="h-4 w-4" />
                          All Statuses
                        </>
                      ) : selectedStatuses.length === 1 ? (
                        <>
                          {selectedStatuses[0] === 'sent' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {selectedStatuses[0] === 'draft' && <FileText className="h-4 w-4 text-gray-600" />}
                          {selectedStatuses[0] === 'scheduled' && <Clock className="h-4 w-4 text-sky-blue" />}
                          {selectedStatuses[0] === 'sending' && <Activity className="h-4 w-4 text-orange-600" />}
                          {selectedStatuses[0] === 'sent' && 'Sent'}
                          {selectedStatuses[0] === 'draft' && 'Draft'}
                          {selectedStatuses[0] === 'scheduled' && 'Scheduled'}
                          {selectedStatuses[0] === 'sending' && 'Sending'}
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4" />
                          {selectedStatuses.length} Statuses
                        </>
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Select Statuses</div>
                      {selectedStatuses.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSelectedStatuses([])}
                          className="h-6 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-all"
                        checked={selectedStatuses.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedStatuses([]);
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="status-all" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2 font-medium">
                        <Activity className="h-4 w-4 text-gray-600" />
                        View All Statuses
                      </label>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-sent"
                        checked={selectedStatuses.includes('sent')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedStatuses([...selectedStatuses, 'sent']);
                          } else {
                            updateSelectedStatuses(selectedStatuses.filter(s => s !== 'sent'));
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="status-sent" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Sent
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-draft"
                        checked={selectedStatuses.includes('draft')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedStatuses([...selectedStatuses, 'draft']);
                          } else {
                            updateSelectedStatuses(selectedStatuses.filter(s => s !== 'draft'));
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="status-draft" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        Draft
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-scheduled"
                        checked={selectedStatuses.includes('scheduled')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedStatuses([...selectedStatuses, 'scheduled']);
                          } else {
                            updateSelectedStatuses(selectedStatuses.filter(s => s !== 'scheduled'));
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="status-scheduled" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-sky-blue" />
                        Scheduled
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-sending"
                        checked={selectedStatuses.includes('sending')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateSelectedStatuses([...selectedStatuses, 'sending']);
                          } else {
                            updateSelectedStatuses(selectedStatuses.filter(s => s !== 'sending'));
                          }
                        }}
                        className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                      />
                      <label htmlFor="status-sending" className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-600" />
                        Sending
                      </label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear Filters & Store Legend */}
          <div className="flex items-center gap-4">
            {(selectedStores.length > 0 || selectedChannels.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateSelectedStores([]);
                  updateSelectedChannels([]);
                  updateSelectedTags([]);
                  updateSelectedStatuses([]);
                }}
                className="h-8 px-3 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear Filters
              </Button>
            )}
            
          </div>

          <div className="ml-auto">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCompareModal(true)}
                size="sm"
                variant="outline"
                className="gap-2 h-9 px-4 font-medium border-sky-blue text-sky-blue hover:bg-sky-50 dark:hover:bg-sky-blue/20 transition-all"
              >
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
              <Button
                onClick={() => {
                  setSelectedDate(new Date());
                  setCampaignForm(prev => ({
                    ...prev,
                    scheduledDate: format(new Date(), 'yyyy-MM-dd')
                  }));
                  setShowCampaignModal(true);
                }}
                size="sm"
                className="gap-2 bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white h-9 px-4 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Store Color Display */}
      <Card className="bg-gradient-to-r from-sky-50/50 to-purple-50/50 dark:from-gray-800 dark:to-gray-800 border-sky-blue/30">
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {selectedStores.length === 0 ? "All Stores:" : "Selected Stores:"}
              </span>
              {selectedStores.length === 0 ? (
                // Show all stores with Klaviyo when "View All Stores" is selected
                stores
                  .filter(store => store.klaviyo_integration?.public_id)
                  .map(store => {
                    const colorKey = store.id || store._id || store.public_id;
                    const storeColor = getStoreColor(colorKey);
                    return (
                      <div
                        key={store.public_id || store.id || store._id}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          storeColor.bg,
                          storeColor.text,
                          storeColor.border
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full", storeColor.bg)} />
                        {store.name}
                      </div>
                    );
                  })
              ) : (
                // Show selected stores
                selectedStores.map(storeId => {
                  const store = stores.find(s => s.public_id === storeId || s.id === storeId || s._id === storeId);
                  if (!store) return null;
                  const colorKey = store.id || store._id || store.public_id;
                  const storeColor = getStoreColor(colorKey);
                  return (
                    <div
                      key={storeId}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                        storeColor.bg,
                        storeColor.text,
                        storeColor.border
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", storeColor.bg)} />
                      {store.name}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Loading indicators */}
            {(loading || futureLoading) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg shadow-sm">
                <div className="h-3 w-3 border-2 border-sky-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium text-xs">
                  {loading && !futureLoading ? 'Loading campaigns...' : 
                   !loading && futureLoading ? 'Loading scheduled campaigns...' :
                   'Loading all campaigns...'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Card */}
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          {/* Calendar Controls */}
          <div className="px-6 py-4 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="h-9 px-3 hover:bg-sky-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-9 px-4 font-medium bg-white dark:bg-gray-800 hover:bg-sky-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-9 px-3 hover:bg-sky-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-xl font-semibold text-slate-gray dark:text-gray-100">
              {format(date, 'MMMM yyyy')}
            </h2>

            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-1">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateView('month')}
                className={cn(
                  "h-8 px-4 rounded-md font-medium transition-all",
                  view === 'month' 
                    ? "bg-sky-blue text-white hover:bg-royal-blue" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateView('week')}
                className={cn(
                  "h-8 px-4 rounded-md font-medium transition-all",
                  view === 'week' 
                    ? "bg-sky-blue text-white hover:bg-royal-blue" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <CalendarRange className="h-4 w-4 mr-2" />
                Week
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateView('day')}
                className={cn(
                  "h-8 px-4 rounded-md font-medium transition-all",
                  view === 'day' 
                    ? "bg-sky-blue text-white hover:bg-royal-blue" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                Day
              </Button>
            </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Calendar */}
          {view === 'month' ? (
            <div className="custom-calendar" style={{ minHeight: '500px' }}>
              <Calendar
                onChange={updateDate}
                value={date}
                onClickDay={handleDateClick}
                view="month"
                tileContent={tileContent}
                showNeighboringMonth={true}
                locale="en-US"
                minDetail="month"
                maxDetail="month"
                className="h-full w-full"
              />
            </div>
          ) : view === 'week' ? (
            <div className="week-timeline-view" style={{ minHeight: '500px' }}>
              {renderWeekView()}
            </div>
          ) : (
            <div className="day-timeline-view" style={{ minHeight: '500px' }}>
              {renderDayView()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Creation Modal */}
      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Schedule a new email campaign for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="store">Store *</Label>
              <Select
                value={campaignForm.store}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, store: value })}
              >
                <SelectTrigger id="store">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id || store._id} value={store.id || store._id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="e.g., Weekly Newsletter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                placeholder="e.g., Your Weekly Update"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previewText">Preview Text</Label>
              <Textarea
                id="previewText"
                value={campaignForm.previewText}
                onChange={(e) => setCampaignForm({ ...campaignForm, previewText: e.target.value })}
                placeholder="This text appears in the inbox preview..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Scheduled Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={campaignForm.scheduledDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, scheduledDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Scheduled Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={campaignForm.scheduledTime}
                  onChange={(e) => setCampaignForm({ ...campaignForm, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Select>
                <SelectTrigger id="tags">
                  <SelectValue placeholder="Add tags..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCampaignModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={!campaignForm.name || !campaignForm.store || !campaignForm.subject}
            >
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Campaigns List Modal */}
      <Dialog open={showDayCampaigns} onOpenChange={setShowDayCampaigns}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-sky-blue" />
                  <span>Campaigns for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {getFilteredDayCampaigns().length} campaign{getFilteredDayCampaigns().length !== 1 ? 's' : ''}
                    {dayCampaignFilter !== 'all' && selectedDayCampaigns.length !== getFilteredDayCampaigns().length && (
                      <span className="text-xs text-gray-500 ml-1">
                        (of {selectedDayCampaigns.length} total)
                      </span>
                    )}
                  </span>
                  {getFilteredDayCampaigns().length > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        Total Revenue: <span className="font-semibold text-green-600 dark:text-green-400">
                          ${getFilteredDayCampaigns().reduce((sum, c) => sum + (c.performance?.revenue || 0), 0).toLocaleString()}
                        </span>
                      </span>
                      <span className="text-gray-500">
                        Avg Open: <span className="font-semibold text-sky-blue">
                          {(getFilteredDayCampaigns().reduce((sum, c) => sum + (c.performance?.openRate || 0), 0) / getFilteredDayCampaigns().length * 100).toFixed(1)}%
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </DialogTitle>
              
              {/* Filters and View Controls */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4">
                  {/* Account Filter */}
                  {getDayAccountOptions().length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
                        Filter by Account:
                      </label>
                      <Select value={dayCampaignFilter} onValueChange={setDayCampaignFilter}>
                        <SelectTrigger className="w-48 h-8 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                          <SelectItem value="all" className="text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-600" />
                              All Accounts ({selectedDayCampaigns.length})
                            </div>
                          </SelectItem>
                          {getDayAccountOptions().map(account => {
                            const store = stores.find(s => s.public_id === account.id);
                            const colorKey = store?.id || store?._id || account.id;
                            const storeColor = getStoreColor(colorKey);
                            return (
                              <SelectItem key={account.id} value={account.id} className="text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-3 h-3 rounded-full border", storeColor.bg, storeColor.border)} />
                                  {account.name} ({account.count})
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={dayCampaignView === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "h-7 px-3 text-xs",
                      dayCampaignView === 'card' 
                        ? "bg-white dark:bg-gray-700 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setDayCampaignView('card')}
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={dayCampaignView === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "h-7 px-3 text-xs",
                      dayCampaignView === 'table' 
                        ? "bg-white dark:bg-gray-700 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setDayCampaignView('table')}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Table
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {dayCampaignView === 'card' ? (
                // Card View
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {getFilteredDayCampaigns().map((campaign, dayIdx) => {
                  const openRate = campaign.performance?.openRate || 0;
                  const clickRate = campaign.performance?.clickRate || 0;
                  const conversionRate = campaign.performance?.conversionRate || 0;
                  const revenue = campaign.performance?.revenue || 0;
                  const recipients = campaign.performance?.recipients || 0;
                  const aov = campaign.performance?.averageOrderValue || 0;
                  
                  // Get store info and color for this campaign
                  const store = stores.find(s => 
                    s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                  );
                  const colorKey = store?.id || store?._id || campaign.klaviyo_public_id;
                  const storeColor = getStoreColor(colorKey);
                  
                  return (
                    <Card 
                      key={`day-card-${campaign.id}-${dayIdx}`}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all group border-l-4",
                        storeColor.border.replace('border-', 'border-l-'), // Use store color for left border
                        "hover:border-sky-blue/50"
                      )}
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setPreviousView('dayModal');
                        setShowDayCampaigns(false);
                        setShowCampaignDetails(true);
                      }}
                    >
                      <CardContent className="p-3">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                            {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />}
                            {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-sky-blue transition-colors">
                                {campaign.name}
                              </h3>
                              {campaign.subject && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {campaign.subject}
                                </p>
                              )}
                              {/* Store Info */}
                              <div className="flex items-center gap-1 mt-1">
                                <div className={cn("w-2 h-2 rounded-full", storeColor.bg)} />
                                <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                                  {store?.name || campaign.storeName || 'Unknown Store'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-1.5 py-0.5 ${getChannelColor(campaign.channel).replace('border', '').trim()}`}>
                              {campaign.channel.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] text-gray-500">
                              {format(new Date(campaign.date), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Recipients</span>
                            <span className="font-semibold">{recipients >= 1000 ? `${(recipients/1000).toFixed(1)}k` : recipients}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Open</span>
                            <span className={`font-semibold ${getPerformanceColor(openRate)}`}>
                              {(openRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">CTR</span>
                            <span className={`font-semibold ${getPerformanceColor(clickRate)}`}>
                              {(clickRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Conv</span>
                            <span className={`font-semibold ${getPerformanceColor(conversionRate)}`}>
                              {(conversionRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Revenue</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              ${revenue >= 1000 ? `${(revenue/1000).toFixed(1)}k` : revenue.toFixed(0)}
                            </span>
                          </div>
                          {aov > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">AOV</span>
                              <span className="font-semibold">${aov.toFixed(0)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Tags */}
                        {campaign.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {campaign.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {campaign.tags.length > 3 && (
                              <span className="text-[10px] text-gray-500">+{campaign.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        
                        {/* Performance Bar */}
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Mini performance indicators */}
                              <div className="flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${openRate > 0.2 ? 'bg-green-500' : openRate > 0.1 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span className="text-[10px] text-gray-500">Open</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${clickRate > 0.05 ? 'bg-green-500' : clickRate > 0.02 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span className="text-[10px] text-gray-500">CTR</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${conversionRate > 0.02 ? 'bg-green-500' : conversionRate > 0.01 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span className="text-[10px] text-gray-500">Conv</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-sky-blue hover:text-royal-blue font-medium">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              ) : (
                // Table View
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="text-left py-3 px-4">
                            <button
                              onClick={() => handleDayCampaignSort('name')}
                              className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Campaign Name
                              {dayCampaignSort.field === 'name' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-center py-3 px-2">
                            <button
                              onClick={() => handleDayCampaignSort('date')}
                              className="flex items-center justify-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Time
                              {dayCampaignSort.field === 'date' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-center py-3 px-2">
                            <button
                              onClick={() => handleDayCampaignSort('channel')}
                              className="flex items-center justify-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Channel
                              {dayCampaignSort.field === 'channel' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-center py-3 px-2">
                            <button
                              onClick={() => handleDayCampaignSort('store')}
                              className="flex items-center justify-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Account
                              {dayCampaignSort.field === 'store' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-center py-3 px-2">
                            <button
                              onClick={() => handleDayCampaignSort('recipients')}
                              className="flex items-center justify-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Recipients
                              {dayCampaignSort.field === 'recipients' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-center py-3 px-2">
                            <button
                              onClick={() => handleDayCampaignSort('openRate')}
                              className="flex items-center justify-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Open Rate
                              {dayCampaignSort.field === 'openRate' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-center py-3 px-2">
                            <button
                              onClick={() => handleDayCampaignSort('clickRate')}
                              className="flex items-center justify-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Click Rate
                              {dayCampaignSort.field === 'clickRate' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                          <th className="text-center py-3 px-2">
                            <button
                              onClick={() => handleDayCampaignSort('revenue')}
                              className="flex items-center justify-center gap-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Revenue
                              {dayCampaignSort.field === 'revenue' && (
                                dayCampaignSort.direction === 'asc' ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {getFilteredDayCampaigns().map((campaign, dayIdx) => {
                          const store = stores.find(s => 
                            s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                          );
                          const colorKey = store?.id || store?._id || campaign.klaviyo_public_id;
                          const storeColor = getStoreColor(colorKey);
                          
                          return (
                            <tr
                              key={`day-table-${campaign.id}-${dayIdx}`}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setPreviousView('dayModal');
                                setShowDayCampaigns(false);
                                setShowCampaignDetails(true);
                              }}
                            >
                              {/* Campaign Name */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                                  {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                  {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">{campaign.name}</p>
                                    {campaign.subject && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{campaign.subject}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Time */}
                              <td className="text-center py-3 px-2 text-gray-600 dark:text-gray-400">
                                {format(new Date(campaign.date), 'h:mm a')}
                              </td>
                              
                              {/* Channel */}
                              <td className="text-center py-3 px-2">
                                <Badge className={`text-[10px] px-1.5 py-0.5 ${getChannelColor(campaign.channel).replace('border', '').trim()}`}>
                                  {campaign.channel.toUpperCase()}
                                </Badge>
                              </td>
                              
                              {/* Account */}
                              <td className="text-center py-3 px-2">
                                <div className="flex items-center justify-center gap-1">
                                  <div className={cn("w-2 h-2 rounded-full", storeColor.bg)} />
                                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {store?.name || campaign.storeName || 'Unknown'}
                                  </span>
                                </div>
                              </td>
                              
                              {/* Recipients */}
                              <td className="text-center py-3 px-2 text-gray-900 dark:text-white">
                                {(campaign.performance?.recipients || 0) >= 1000 ? 
                                  `${((campaign.performance?.recipients || 0)/1000).toFixed(1)}k` : 
                                  (campaign.performance?.recipients || 0).toLocaleString()}
                              </td>
                              
                              {/* Open Rate */}
                              <td className="text-center py-3 px-2">
                                <span className={getPerformanceColor(campaign.performance?.openRate || 0)}>
                                  {((campaign.performance?.openRate || 0) * 100).toFixed(1)}%
                                </span>
                              </td>
                              
                              {/* Click Rate */}
                              <td className="text-center py-3 px-2">
                                <span className={getPerformanceColor(campaign.performance?.clickRate || 0)}>
                                  {((campaign.performance?.clickRate || 0) * 100).toFixed(1)}%
                                </span>
                              </td>
                              
                              {/* Revenue */}
                              <td className="text-center py-3 px-2 text-green-600 dark:text-green-400 font-semibold">
                                ${(campaign.performance?.revenue || 0) >= 1000 ? 
                                  `${((campaign.performance?.revenue || 0)/1000).toFixed(1)}k` : 
                                  (campaign.performance?.revenue || 0).toFixed(0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Modal */}
      <Dialog 
        open={showCampaignDetails} 
        onOpenChange={setShowCampaignDetails}
        onEscapeKeyDown={() => setShowCampaignDetails(false)}
      >
        <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-gray-50 dark:bg-gray-900 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 min-h-0">
            {selectedCampaign && (
              <>
                {/* Email Preview Panel - Left Side */}
                <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {/* Back Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setShowCampaignDetails(false);
                          if (previousView === 'dayModal') {
                            setShowDayCampaigns(true);
                          }
                          // If previousView is 'calendar', just closing the modal returns to calendar
                        }}
                        title={previousView === 'dayModal' ? "Back to day view" : "Back to calendar"}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {selectedCampaign?.channel === 'email' && <Mail className="h-4 w-4 text-sky-blue" />}
                      {selectedCampaign?.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                      {selectedCampaign?.channel === 'push-notification' && <Bell className="h-4 w-4 text-vivid-violet" />}
                      <h3 className="text-sm font-semibold text-slate-gray dark:text-white">
                        {selectedCampaign?.name}
                      </h3>
                      <Badge className="text-xs bg-gradient-to-r from-sky-blue to-vivid-violet text-white border-0">
                        {selectedCampaign?.channel?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-neutral-gray dark:text-gray-400 ml-auto">
                        {selectedCampaign?.date && (() => {
                          const date = new Date(selectedCampaign.date);
                          const day = getDate(date);
                          const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                                        day === 2 || day === 22 ? 'nd' : 
                                        day === 3 || day === 23 ? 'rd' : 'th';
                          const isFuture = selectedCampaign.isScheduled || selectedCampaign.status === 'Draft' || selectedCampaign.status === 'Scheduled';
                          const label = isFuture ? 'Scheduled For' : 'Sent At';
                          return `${label}: ${format(date, `d'${suffix}' MMMM yy HH:mm`)}`;
                        })()}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-gray mt-1">
                      {selectedCampaign.subject || 'No subject'}
                    </p>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden bg-gray-100 dark:bg-gray-950">
                    <EmailPreviewPanel 
                      messageId={selectedCampaign.messageId} 
                      storeId={selectedCampaign.klaviyo_public_id || selectedCampaign.storeIds?.[0]}
                    />
                  </div>
                </div>

                {/* Stats Panel or Audience Info - Right Side */}
                <div className="w-1/2 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
                  {/* Check if this is a future/draft campaign */}
                  {(selectedCampaign?.isScheduled || selectedCampaign?.status === 'Draft' || selectedCampaign?.status === 'Scheduled' || selectedCampaign?.status === 'Queued without Recipients') ? (
                    /* Future Campaign - Show Audience Info */
                    <div className="flex flex-col h-full">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-slate-gray dark:text-white flex items-center gap-2">
                          <Users className="h-5 w-5 text-sky-blue" />
                          Campaign Audience
                        </h3>
                        <p className="text-sm text-neutral-gray mt-1">
                          Segments and lists targeted for this campaign
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                          {/* Campaign Status */}
                          <div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-sky-blue/30">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                              <Badge className="bg-gradient-to-r from-sky-blue to-vivid-violet text-white border-0">
                                {selectedCampaign?.status || 'Draft'}
                              </Badge>
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Scheduled Date</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {selectedCampaign?.date ? format(new Date(selectedCampaign.date), 'MMM d, yyyy h:mm a') : 'Not scheduled'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Included Audiences */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Included Audiences
                            </h4>
                            <div className="space-y-2">
                              {selectedCampaign?.audiences?.included?.length > 0 ? (
                                (() => {
                                  const resolvedAudiences = resolveAudienceNames(
                                    selectedCampaign.audiences.included,
                                    selectedCampaign.klaviyo_public_id
                                  );
                                  
                                  return resolvedAudiences.map((audience, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-sky-blue" />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                              {audience.name}
                                            </span>
                                            {audience.type !== 'unknown' && (
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {audience.type === 'segment' ? 'Segment' : 'List'} • {audience.id}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant={audience.type === 'segment' ? 'default' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {audience.type === 'segment' ? 'Segment' : audience.type === 'list' ? 'List' : 'Unknown'}
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            Included
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })()
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  No audiences selected
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Excluded Audiences */}
                          {selectedCampaign?.audiences?.excluded?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Excluded Audiences
                              </h4>
                              <div className="space-y-2">
                                {(() => {
                                  const resolvedAudiences = resolveAudienceNames(
                                    selectedCampaign.audiences.excluded,
                                    selectedCampaign.klaviyo_public_id
                                  );
                                  
                                  return resolvedAudiences.map((audience, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-900/30">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-red-600" />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                              {audience.name}
                                            </span>
                                            {audience.type !== 'unknown' && (
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {audience.type === 'segment' ? 'Segment' : 'List'} • {audience.id}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant={audience.type === 'segment' ? 'default' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {audience.type === 'segment' ? 'Segment' : audience.type === 'list' ? 'List' : 'Unknown'}
                                          </Badge>
                                          <Badge variant="destructive" className="text-xs">
                                            Excluded
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Campaign Settings */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <Settings className="h-4 w-4 text-gray-600" />
                              Campaign Settings
                            </h4>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Channel</span>
                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                  {selectedCampaign?.channel || 'email'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">From Address</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {selectedCampaign?.fromAddress ? (
                                    selectedCampaign.fromLabel ? 
                                      `${selectedCampaign.fromLabel} <${selectedCampaign.fromAddress}>` : 
                                      selectedCampaign.fromAddress
                                  ) : 'Not specified'}
                                </span>
                              </div>
                              {selectedCampaign?.tags?.length > 0 && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <span className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Tags</span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedCampaign.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Past Campaign - Show Stats */
                    <Tabs defaultValue="overview" className="flex flex-col h-full">
                      <TabsList className="w-full px-6 py-3 bg-transparent border-b border-gray-200 dark:border-gray-700 flex justify-start gap-8 rounded-none flex-shrink-0">
                        <TabsTrigger 
                          value="overview" 
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-sky-blue dark:data-[state=active]:text-sky-blue data-[state=active]:border-sky-blue dark:data-[state=active]:border-sky-blue hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Overview
                        </TabsTrigger>
                        <TabsTrigger 
                          value="performance" 
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-sky-blue dark:data-[state=active]:text-sky-blue data-[state=active]:border-sky-blue dark:data-[state=active]:border-sky-blue hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          <DollarSign className="h-4 w-4" />
                          Performance
                        </TabsTrigger>
                        <TabsTrigger 
                          value="engagement" 
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-sky-blue dark:data-[state=active]:text-sky-blue data-[state=active]:border-sky-blue dark:data-[state=active]:border-sky-blue hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Engagement
                        </TabsTrigger>
                      </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="space-y-3">
                    {/* Key Metrics - Compact Layout */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <Users className="h-4 w-4 text-sky-blue" />
                          <span className="text-xs uppercase text-neutral-gray">Recipients</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-gray dark:text-white">
                          {selectedCampaign.performance.recipients >= 1000 
                            ? `${(selectedCampaign.performance.recipients/1000).toFixed(1)}k` 
                            : selectedCampaign.performance.recipients}
                        </p>
                        <p className="text-sm text-neutral-gray mt-2">
                          {((selectedCampaign.performance.delivered || selectedCampaign.performance.recipients) / selectedCampaign.performance.recipients * 100).toFixed(0)}% delivered
                        </p>
                      </div>

                      {selectedCampaign?.channel !== 'sms' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <Eye className="h-4 w-4 text-green-600" />
                            <span className="text-xs uppercase text-neutral-gray">Opens</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-gray dark:text-white">
                            {(selectedCampaign.performance.openRate * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-neutral-gray mt-2">
                            {(selectedCampaign.performance.opensUnique || 0).toLocaleString()} unique
                          </p>
                        </div>
                      )}

                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <MousePointer className="h-4 w-4 text-vivid-violet" />
                          <span className="text-xs uppercase text-neutral-gray">Clicks</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-gray dark:text-white">
                          {(selectedCampaign.performance.clickRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-neutral-gray mt-2">
                          {(selectedCampaign.performance.clicksUnique || 0).toLocaleString()} unique
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs uppercase text-neutral-gray">Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">
                          ${(selectedCampaign.performance.revenue || 0) >= 1000 
                            ? `${(selectedCampaign.performance.revenue/1000).toFixed(1)}k` 
                            : (selectedCampaign.performance.revenue || 0).toFixed(0)}
                        </p>
                        <p className="text-sm text-neutral-gray mt-2">
                          {selectedCampaign.performance.conversions || 0} orders
                        </p>
                      </div>
                    </div>

                    {/* Delivery Performance */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-sky-blue" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Delivery Performance</h3>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-gray">Delivery Rate</span>
                          <span className="font-semibold text-slate-gray dark:text-white">
                            {(((selectedCampaign.performance.delivered || selectedCampaign.performance.recipients) / selectedCampaign.performance.recipients) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={((selectedCampaign.performance.delivered || selectedCampaign.performance.recipients) / selectedCampaign.performance.recipients) * 100}
                          className="h-1.5"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">
                            {(selectedCampaign.performance.bounced || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Bounced</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {(selectedCampaign.performance.failed || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">
                            {(selectedCampaign.performance.unsubscribes || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Unsubs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-600">
                            {(selectedCampaign.performance.spamComplaints || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Spam</div>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Score */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-vivid-violet" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Engagement Score</h3>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="ml-auto">
                              <Info className="h-3.5 w-3.5 text-gray-400 hover:text-sky-blue transition-colors" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg" align="end">
                            <div className="space-y-3 text-gray-700 dark:text-gray-200">
                              <div className="font-semibold text-sm">How We Calculate Your Score</div>
                              <div className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
                                {selectedCampaign?.channel === 'sms' ? (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium text-vivid-violet">60%</span>
                                      <div>
                                        <span className="font-medium">Click Rate:</span> Primary engagement metric for SMS. Industry avg: 20-30%
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium text-emerald-600">40%</span>
                                      <div>
                                        <span className="font-medium">Conversion Rate:</span> Ultimate success metric. Industry avg: 10-15%
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium text-sky-blue">30%</span>
                                      <div>
                                        <span className="font-medium">Open Rate:</span> Measures initial interest. Industry avg: 21-25%
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium text-vivid-violet">40%</span>
                                      <div>
                                        <span className="font-medium">Click Rate:</span> Shows content relevance. Industry avg: 2-3%
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium text-emerald-600">30%</span>
                                      <div>
                                        <span className="font-medium">Conversion Rate:</span> Ultimate success metric. Industry avg: 1-2%
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="border-t pt-3 text-xs">
                                <div className="font-semibold mb-2">Score Benchmarks:</div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                    <span><span className="font-medium">8%+</span> - Excellent (Top 20% of campaigns)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                                    <span><span className="font-medium">5-8%</span> - Good (Above average)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                    <span><span className="font-medium">&lt;5%</span> - Needs improvement</span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded text-xs">
                                <span className="font-medium">Pro tip:</span> Focus on improving your lowest metric first for the biggest score boost.
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-3xl font-bold ${
                            (() => {
                              let score;
                              if (selectedCampaign?.channel === 'sms') {
                                // SMS scoring - no opens, just clicks and conversions
                                const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.25) * 100, 100); // 25% is excellent for SMS
                                const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.12) * 100, 100); // 12% is excellent for SMS
                                score = (clickScore * 0.6 + convScore * 0.4);
                              } else {
                                // Email scoring - opens, clicks, and conversions
                                const openScore = Math.min(((selectedCampaign.performance.openRate || 0) / 0.25) * 100, 100); // 25% is excellent
                                const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.03) * 100, 100); // 3% is excellent
                                const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.02) * 100, 100); // 2% is excellent
                                score = (openScore * 0.3 + clickScore * 0.4 + convScore * 0.3);
                              }
                              return score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
                            })()
                          }`}>
                            {Math.round((() => {
                              if (selectedCampaign?.channel === 'sms') {
                                // SMS scoring - no opens, just clicks and conversions
                                const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.25) * 100, 100);
                                const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.12) * 100, 100);
                                return (clickScore * 0.6 + convScore * 0.4);
                              } else {
                                // Email scoring - opens, clicks, and conversions
                                const openScore = Math.min(((selectedCampaign.performance.openRate || 0) / 0.25) * 100, 100);
                                const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.03) * 100, 100);
                                const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.02) * 100, 100);
                                return (openScore * 0.3 + clickScore * 0.4 + convScore * 0.3);
                              }
                            })())}%
                          </div>
                          <p className="text-xs text-neutral-gray mt-1">
                            Overall Performance
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          {selectedCampaign?.channel !== 'sms' && (
                            <div className="text-xs">
                              <span className="text-neutral-gray">CTOR:</span>{' '}
                              <span className="font-semibold text-slate-gray dark:text-white">
                                {selectedCampaign.performance.opensUnique > 0
                                  ? ((selectedCampaign.performance.clicksUnique / selectedCampaign.performance.opensUnique) * 100).toFixed(1)
                                  : '0'}%
                              </span>
                            </div>
                          )}
                          <div className="text-xs">
                            <span className="text-neutral-gray">Conv Rate:</span>{' '}
                            <span className="font-semibold text-slate-gray dark:text-white">
                              {(selectedCampaign.performance.conversionRate * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Engagement Tab */}
                <TabsContent value="engagement" className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                  <div className="space-y-6">
                    {/* Engagement Funnel */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Engagement Funnel
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          {
                            label: 'Delivered',
                            value: selectedCampaign.performance.delivered || selectedCampaign.performance.recipients,
                            percentage: 100,
                            color: 'bg-blue-500'
                          },
                          ...(selectedCampaign?.channel !== 'sms' ? [{
                            label: 'Opened',
                            value: selectedCampaign.performance.opensUnique || 0,
                            percentage: ((selectedCampaign.performance.opensUnique || 0) / (selectedCampaign.performance.delivered || selectedCampaign.performance.recipients || 1)) * 100,
                            color: 'bg-indigo-500'
                          }] : []),
                          {
                            label: 'Clicked',
                            value: selectedCampaign.performance.clicksUnique || 0,
                            percentage: ((selectedCampaign.performance.clicksUnique || 0) / (selectedCampaign.performance.delivered || selectedCampaign.performance.recipients || 1)) * 100,
                            color: 'bg-purple-500'
                          },
                          {
                            label: 'Converted',
                            value: selectedCampaign.performance.conversions || 0,
                            percentage: ((selectedCampaign.performance.conversions || 0) / (selectedCampaign.performance.delivered || selectedCampaign.performance.recipients || 1)) * 100,
                            color: 'bg-green-500'
                          }
                        ].map((step) => (
                          <div key={step.label}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium">{step.label}</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {(step.value || 0).toLocaleString()} ({(step.percentage || 0).toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={step.percentage} className="h-2" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Engagement Score */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Engagement Score
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="ml-auto">
                                <Info className="h-4 w-4 text-gray-400 hover:text-sky-blue transition-colors" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg" align="end">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">{selectedCampaign?.channel === 'sms' ? 'SMS Performance Score' : 'Agency Performance Score'}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    This proprietary scoring algorithm helps {selectedCampaign?.channel === 'sms' ? 'SMS marketers' : 'email agencies'} benchmark campaign performance against industry standards and identify optimization opportunities.
                                  </p>
                                </div>
                                
                                <div className="space-y-3">
                                  <h5 className="font-medium text-xs text-gray-700 dark:text-gray-300">Weighted Calculation:</h5>
                                  <div className="space-y-2">
                                    {selectedCampaign?.channel !== 'sms' && (
                                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                        <div className="flex items-center gap-2">
                                          <Eye className="h-3 w-3 text-sky-blue" />
                                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Open Rate</span>
                                        </div>
                                        <div className="text-xs">
                                          <span className="font-bold text-sky-blue">30%</span>
                                          <span className="text-gray-500 ml-2">weight</span>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                      <div className="flex items-center gap-2">
                                        <MousePointer className="h-3 w-3 text-vivid-violet" />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Click Rate</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-bold text-vivid-violet">{selectedCampaign?.channel === 'sms' ? '60%' : '40%'}</span>
                                        <span className="text-gray-500 ml-2">weight</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                      <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-3 w-3 text-emerald-600" />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Conversion Rate</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-bold text-emerald-600">{selectedCampaign?.channel === 'sms' ? '40%' : '30%'}</span>
                                        <span className="text-gray-500 ml-2">weight</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="border-t pt-3">
                                  <h5 className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-2">Industry Benchmarks:</h5>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                      <div className="font-bold text-green-600">Excellent</div>
                                      <div className="text-gray-600 dark:text-gray-400">8%+</div>
                                      <div className="text-[10px] text-gray-500">Top 20%</div>
                                    </div>
                                    <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                      <div className="font-bold text-yellow-600">Good</div>
                                      <div className="text-gray-600 dark:text-gray-400">5-8%</div>
                                      <div className="text-[10px] text-gray-500">Above avg</div>
                                    </div>
                                    <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                      <div className="font-bold text-red-600">Improve</div>
                                      <div className="text-gray-600 dark:text-gray-400">&lt;5%</div>
                                      <div className="text-[10px] text-gray-500">Action needed</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 p-3 rounded">
                                  <div className="flex items-start gap-2">
                                    <Target className="h-4 w-4 text-sky-blue mt-0.5" />
                                    <div className="space-y-1">
                                      <div className="font-medium text-xs">Optimization Strategy</div>
                                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                        Focus on your lowest-performing metric first. A 1% improvement in clicks typically yields 2-3x ROI compared to opens.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-4xl font-bold ${
                              (() => {
                                let score;
                                if (selectedCampaign?.channel === 'sms') {
                                  // SMS scoring - no opens, just clicks and conversions
                                  const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.25) * 100, 100); // 25% is excellent for SMS
                                  const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.12) * 100, 100); // 12% is excellent for SMS
                                  score = (clickScore * 0.6 + convScore * 0.4);
                                } else {
                                  // Email scoring - opens, clicks, and conversions
                                  const openScore = Math.min(((selectedCampaign.performance.openRate || 0) / 0.25) * 100, 100);
                                  const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.03) * 100, 100);
                                  const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.02) * 100, 100);
                                  score = (openScore * 0.3 + clickScore * 0.4 + convScore * 0.3);
                                }
                                return score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
                              })()
                            }`}>
                              {Math.round((() => {
                                if (selectedCampaign?.channel === 'sms') {
                                  // SMS scoring - no opens, just clicks and conversions
                                  const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.25) * 100, 100);
                                  const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.12) * 100, 100);
                                  return (clickScore * 0.6 + convScore * 0.4);
                                } else {
                                  // Email scoring - opens, clicks, and conversions
                                  const openScore = Math.min(((selectedCampaign.performance.openRate || 0) / 0.25) * 100, 100);
                                  const clickScore = Math.min(((selectedCampaign.performance.clickRate || 0) / 0.03) * 100, 100);
                                  const convScore = Math.min(((selectedCampaign.performance.conversionRate || 0) / 0.02) * 100, 100);
                                  return (openScore * 0.3 + clickScore * 0.4 + convScore * 0.3);
                                }
                              })())}%
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Performance vs Industry Benchmarks
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            {selectedCampaign?.channel !== 'sms' && (
                              <div className="text-sm">
                                <span className="text-gray-500">Opens:</span> {(selectedCampaign.performance.openRate * 100).toFixed(1)}%
                              </div>
                            )}
                            <div className="text-sm">
                              <span className="text-gray-500">Clicks:</span> {(selectedCampaign.performance.clickRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Conversions:</span> {(selectedCampaign.performance.conversionRate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Click-to-Open Rate */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Advanced Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Click-to-Open Rate</p>
                            <p className="text-2xl font-bold">
                              {selectedCampaign.performance.opensUnique > 0
                                ? ((selectedCampaign.performance.clicksUnique / selectedCampaign.performance.opensUnique) * 100).toFixed(1)
                                : '0'}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Unsubscribe Rate</p>
                            <p className="text-2xl font-bold">
                              {((selectedCampaign.performance.unsubscribes || 0) / selectedCampaign.performance.recipients * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                  <div className="space-y-3">
                    {/* Revenue Overview - Compact Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-neutral-gray uppercase tracking-wide mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-emerald-600">
                              ${(selectedCampaign.performance.revenue || 0) >= 10000 
                                ? `${(selectedCampaign.performance.revenue/1000).toFixed(0)}k` 
                                : (selectedCampaign.performance.revenue || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-gray mt-2">
                              {selectedCampaign.performance.conversions || 0} orders
                            </p>
                          </div>
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-neutral-gray uppercase tracking-wide mb-1">AOV</p>
                            <p className="text-3xl font-bold text-indigo-600">
                              ${(selectedCampaign.performance.averageOrderValue || 0).toFixed(0)}
                            </p>
                            <p className="text-xs text-neutral-gray mt-2">
                              Per order
                            </p>
                          </div>
                          <ShoppingCart className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-violet-200 dark:border-violet-800/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-neutral-gray uppercase tracking-wide mb-1">Conv. Rate</p>
                            <p className="text-3xl font-bold text-vivid-violet">
                              {(selectedCampaign.performance.conversionRate * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-neutral-gray mt-2">
                              {selectedCampaign.performance.conversions} / {selectedCampaign.performance.recipients}
                            </p>
                          </div>
                          <Target className="h-5 w-5 text-vivid-violet" />
                        </div>
                      </div>
                    </div>

                    {/* ROI Metrics - Compact Table */}
                    <Card className="bg-white dark:bg-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-sky-blue" />
                          ROI Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-[10px] text-neutral-gray uppercase">Per Email</p>
                            <p className="text-xl font-bold text-slate-gray dark:text-white">
                              ${((selectedCampaign.performance.revenue || 0) / (selectedCampaign.performance.recipients || 1)).toFixed(2)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-[10px] text-neutral-gray uppercase">Per Open</p>
                            <p className="text-xl font-bold text-slate-gray dark:text-white">
                              ${((selectedCampaign.performance.revenue || 0) / (selectedCampaign.performance.opensUnique || 1)).toFixed(2)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-[10px] text-neutral-gray uppercase">Per Click</p>
                            <p className="text-xl font-bold text-slate-gray dark:text-white">
                              ${((selectedCampaign.performance.revenue || 0) / (selectedCampaign.performance.clicksUnique || 1)).toFixed(2)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-[10px] text-neutral-gray uppercase">Per Conv.</p>
                            <p className="text-xl font-bold text-slate-gray dark:text-white">
                              ${((selectedCampaign.performance.revenue || 0) / (selectedCampaign.performance.conversions || 1)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

              </Tabs>
                  )}
                </div>
          </>
        )}
      </div>
    </DialogContent>
  </Dialog>

  {/* Campaign Comparison Modal */}
  <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-sky-blue" />
          Select Campaigns to Compare
        </DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select up to 4 campaigns to compare their performance metrics
          </p>
          
          {/* Campaign Selection List */}
          <div className="space-y-2">
            {campaigns.map((campaign, idx) => (
              <div
                key={`campaign-select-${campaign.id}-${idx}`}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer",
                  selectedForComparison.includes(campaign.id)
                    ? "border-sky-blue bg-sky-50 dark:bg-sky-blue/10 shadow-sm"
                    : "border-gray-200 dark:border-gray-700 hover:border-sky-blue hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                onClick={() => {
                  if (selectedForComparison.includes(campaign.id)) {
                    setSelectedForComparison(prev => prev.filter(id => id !== campaign.id));
                  } else if (selectedForComparison.length < 4) {
                    setSelectedForComparison(prev => [...prev, campaign.id]);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    selectedForComparison.includes(campaign.id)
                      ? "bg-sky-blue border-sky-blue"
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  )}>
                    {selectedForComparison.includes(campaign.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">
                      {campaign.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(campaign.date), 'MMM d, yyyy')}
                      </span>
                      <Badge className={`text-xs ${getChannelColor(campaign.channel)}`}>
                        {campaign.channel}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {campaign.performance.recipients.toLocaleString()} recipients
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Open Rate</p>
                    <p className={`font-bold text-lg ${getPerformanceColor(campaign.performance.openRate)}`}>
                      {(campaign.performance.openRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Revenue</p>
                    <p className="font-bold text-lg text-green-600">
                      ${campaign.performance.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedForComparison.length} of 4 campaigns selected
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowCompareModal(false);
              setSelectedForComparison([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const selected = campaigns.filter(c => selectedForComparison.includes(c.id));
              setComparisonCampaigns(selected);
              setShowCompareModal(false);
              setShowComparisonPanel(true);
            }}
            disabled={selectedForComparison.length < 2}
            className="bg-sky-blue hover:bg-royal-blue text-white"
          >
            Compare {selectedForComparison.length} Campaigns
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* Campaign Comparison Panel */}
  <Dialog open={showComparisonPanel} onOpenChange={setShowComparisonPanel}>
    <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-sky-blue" />
          Campaign Performance Comparison
        </DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {comparisonCampaigns.map((campaign, compIdx) => (
            <div key={`comparison-${campaign.id}-${compIdx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Campaign Header */}
              <div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {campaign.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(campaign.date), 'MMM d, yyyy')}
                </p>
                <Badge className={`text-xs mt-2 ${getChannelColor(campaign.channel)}`}>
                  {campaign.channel}
                </Badge>
              </div>
              
              {/* Email Preview - Scrollable */}
              <div className="h-64 bg-gray-100 dark:bg-gray-900 p-2 overflow-y-auto">
                <ComparisonEmailPreview messageId={campaign.messageId} />
              </div>
              
              {/* Performance Metrics */}
              <div className="p-4 space-y-3">
                {/* Audience Info */}
                <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Recipients</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {campaign.performance.recipients.toLocaleString()}
                      </span>
                    </div>
                    {campaign.audiences?.included?.length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Include:</span> {campaign.audiences.included.slice(0, 2).join(', ')}
                        {campaign.audiences.included.length > 2 && ` +${campaign.audiences.included.length - 2}`}
                      </div>
                    )}
                    {campaign.audiences?.excluded?.length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Exclude:</span> {campaign.audiences.excluded.slice(0, 2).join(', ')}
                        {campaign.audiences.excluded.length > 2 && ` +${campaign.audiences.excluded.length - 2}`}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <p className="text-[10px] text-gray-500 uppercase">Open</p>
                    <p className={`text-sm font-bold ${getPerformanceColor(campaign.performance.openRate)}`}>
                      {(campaign.performance.openRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <p className="text-[10px] text-gray-500 uppercase">Click</p>
                    <p className={`text-sm font-bold ${getPerformanceColor(campaign.performance.clickRate)}`}>
                      {(campaign.performance.clickRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <p className="text-[10px] text-gray-500 uppercase">CTOR</p>
                    <p className={`text-sm font-bold ${getPerformanceColor(
                      campaign.performance.opensUnique > 0 
                        ? campaign.performance.clicksUnique / campaign.performance.opensUnique
                        : 0
                    )}`}>
                      {campaign.performance.opensUnique > 0
                        ? ((campaign.performance.clicksUnique / campaign.performance.opensUnique) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <p className="text-[10px] text-gray-500 uppercase">Conv</p>
                    <p className={`text-sm font-bold ${getPerformanceColor(campaign.performance.conversionRate)}`}>
                      {(campaign.performance.conversionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {/* Revenue Metrics */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      ${campaign.performance.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">AOV</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${campaign.performance.averageOrderValue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">$/Recipient</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${(campaign.performance.revenue / campaign.performance.recipients).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">$/Open</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${campaign.performance.opensUnique > 0 
                          ? (campaign.performance.revenue / campaign.performance.opensUnique).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">$/Click</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${campaign.performance.clicksUnique > 0
                          ? (campaign.performance.revenue / campaign.performance.clicksUnique).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Deliverability */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Deliverability</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Bounce</p>
                      <p className={`font-semibold ${
                        campaign.performance.bounceRate > 0.02 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                      }`}>
                        {(campaign.performance.bounceRate * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Unsub</p>
                      <p className={`font-semibold ${
                        campaign.performance.unsubscribeRate > 0.01 ? 'text-orange-600' : 'text-gray-900 dark:text-white'
                      }`}>
                        {(campaign.performance.unsubscribeRate * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced Comparison Summary */}
        {comparisonCampaigns.length > 0 && (
          <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sky-blue" />
              Performance Summary
            </h4>
            
            {/* Best Performers Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Best Open Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.max(...comparisonCampaigns.map(c => c.performance.openRate * 100)).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {comparisonCampaigns.find(c => 
                    c.performance.openRate === Math.max(...comparisonCampaigns.map(x => x.performance.openRate))
                  )?.name}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Best Click Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.max(...comparisonCampaigns.map(c => c.performance.clickRate * 100)).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {comparisonCampaigns.find(c => 
                    c.performance.clickRate === Math.max(...comparisonCampaigns.map(x => x.performance.clickRate))
                  )?.name}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Best CTOR</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.max(...comparisonCampaigns.map(c => 
                    c.performance.opensUnique > 0 
                      ? (c.performance.clicksUnique / c.performance.opensUnique) * 100
                      : 0
                  )).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {comparisonCampaigns.find(c => {
                    const ctor = c.performance.opensUnique > 0 
                      ? (c.performance.clicksUnique / c.performance.opensUnique)
                      : 0;
                    const maxCtor = Math.max(...comparisonCampaigns.map(x => 
                      x.performance.opensUnique > 0 
                        ? (x.performance.clicksUnique / x.performance.opensUnique)
                        : 0
                    ));
                    return ctor === maxCtor;
                  })?.name}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Best Conversion</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.max(...comparisonCampaigns.map(c => c.performance.conversionRate * 100)).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {comparisonCampaigns.find(c => 
                    c.performance.conversionRate === Math.max(...comparisonCampaigns.map(x => x.performance.conversionRate))
                  )?.name}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Best AOV</p>
                <p className="text-xl font-bold text-green-600">
                  ${Math.max(...comparisonCampaigns.map(c => c.performance.averageOrderValue || 0)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {comparisonCampaigns.find(c => 
                    (c.performance.averageOrderValue || 0) === Math.max(...comparisonCampaigns.map(x => x.performance.averageOrderValue || 0))
                  )?.name}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Best $/Email</p>
                <p className="text-xl font-bold text-green-600">
                  ${Math.max(...comparisonCampaigns.map(c => 
                    c.performance.revenue / c.performance.recipients
                  )).toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {comparisonCampaigns.find(c => {
                    const rpe = c.performance.revenue / c.performance.recipients;
                    const maxRpe = Math.max(...comparisonCampaigns.map(x => 
                      x.performance.revenue / x.performance.recipients
                    ));
                    return rpe === maxRpe;
                  })?.name}
                </p>
              </div>
            </div>
            
            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Recipients</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {comparisonCampaigns.reduce((sum, c) => sum + c.performance.recipients, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-green-600">
                  ${comparisonCampaigns.reduce((sum, c) => sum + c.performance.revenue, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Open Rate</p>
                <p className="text-lg font-bold text-sky-blue">
                  {(comparisonCampaigns.reduce((sum, c) => sum + c.performance.openRate, 0) / comparisonCampaigns.length * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Conversion</p>
                <p className="text-lg font-bold text-vivid-violet">
                  {(comparisonCampaigns.reduce((sum, c) => sum + c.performance.conversionRate, 0) / comparisonCampaigns.length * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={() => {
            setShowComparisonPanel(false);
            setSelectedForComparison([]);
            setComparisonCampaigns([]);
          }}
        >
          Close Comparison
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</div>
);
}

// Comparison Email Preview Component
function ComparisonEmailPreview({ messageId }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (messageId) {
      fetchPreview();
    }
  }, [messageId]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/klaviyo/campaign-message/${messageId}`);
      const result = await response.json();

      if (result.success) {
        // Process HTML to replace broken images with placeholders
        let processedHtml = result.data.html || '';
        
        // Replace broken image sources with placeholder images
        processedHtml = processedHtml.replace(
          /<img([^>]*?)src=["'](?:\{\{[^}]*\}\}|)["']([^>]*?)>/gi,
          '<img$1src="https://via.placeholder.com/300x200/E0F2FE/60A5FA?text=Product"$2>'
        );
        
        // Also handle cases where src might be missing entirely
        processedHtml = processedHtml.replace(
          /<img(?![^>]*src=)([^>]*?)>/gi,
          '<img src="https://via.placeholder.com/300x200/E0F2FE/60A5FA?text=Product"$1>'
        );
        
        // Add styles to make email scrollable and visible
        const scaledHtml = `
          <style>
            html, body { 
              margin: 0; 
              padding: 0; 
              overflow-x: hidden;
            }
            body {
              transform: scale(0.5);
              transform-origin: top left;
              width: 200%;
            }
          </style>
          ${processedHtml}
        `;
        
        setPreview({
          ...result.data,
          html: scaledHtml
        });
      } else {
        setError(result.error || 'Failed to load preview');
      }
    } catch (error) {
      console.error('Failed to fetch preview:', error);
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-blue"></div>
      </div>
    );
  }

  if (error || !preview?.html) {
    return (
      <div className="min-h-[600px] bg-white dark:bg-gray-800">
        <div className="p-4 space-y-3">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-sky-100 dark:bg-sky-blue/20 rounded mt-4"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded mt-4"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={preview.html}
      className="w-full border-0 bg-white"
      title="Email Preview"
      sandbox="allow-same-origin"
      style={{
        backgroundColor: '#ffffff',
        pointerEvents: 'none',
        minHeight: '1000px',
        height: 'auto'
      }}
    />  );
}