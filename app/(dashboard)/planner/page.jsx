"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/app/hooks/use-toast";
import { useStores } from "@/app/contexts/store-context";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
  Mail,
  MessageSquare,
  ShoppingBag,
  Gift,
  Heart,
  Package,
  MoreVertical,
  ChevronRight,
  Sparkles,
  Target,
  Edit3,
  Eye,
  UserCheck,
  Rocket,
  Archive,
  User,
  Building2,
  LayoutGrid,
  Store,
  List,
  Grid3X3,
  FileText,
  Clipboard,
  PenTool,
  Lightbulb,
  Palette,
  MessageCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import KanbanColumn from "./components/KanbanColumn";
import CampaignCard from "./components/CampaignCard";
import AddCampaignModal from "./components/AddCampaignModal";
import TableView from "./components/TableView";

// Define the kanban columns with sub-statuses
const COLUMNS = [
  { 
    id: "brief", 
    title: "BRIEF", 
    subtitle: "Requirements → Scope",
    icon: FileText,
    color: "from-gray-500 to-gray-600",
    description: "Gathering Requirements",
    subStatuses: [
      { id: "brief_new", label: "New Brief", icon: Clipboard },
      { id: "brief_in_progress", label: "In Progress", icon: PenTool }
    ]
  },
  { 
    id: "design", 
    title: "DESIGN", 
    subtitle: "Creative → Assets",
    icon: Palette,
    color: "from-blue-500 to-blue-600",
    description: "Creating Assets",
    subStatuses: [
      { id: "design_concept", label: "Concept", icon: Lightbulb },
      { id: "design_creation", label: "Creation", icon: Palette }
    ]
  },
  { 
    id: "review", 
    title: "REVIEW", 
    subtitle: "Internal → Client",
    icon: Eye,
    color: "from-orange-500 to-orange-600",
    description: "Under Review",
    subStatuses: [
      { id: "review_internal", label: "Internal", icon: Search },
      { id: "review_client", label: "Client", icon: MessageCircle }
    ]
  },
  { 
    id: "approved", 
    title: "APPROVED", 
    subtitle: "Ready for Klaviyo",
    icon: CheckCircle2,
    color: "from-green-500 to-green-600",
    description: "Approved & Ready",
    subStatuses: [
      { id: "approved_ready", label: "Approved", icon: CheckCircle2 },
      { id: "approved_scheduled", label: "Scheduled", icon: Calendar }
    ]
  },
  { 
    id: "klaviyo", 
    title: "KLAVIYO UPCOMING", 
    subtitle: "Scheduled → Live",
    icon: Rocket,
    color: "from-purple-500 to-purple-600",
    description: "Live Campaigns",
    subStatuses: [
      { id: "klaviyo_scheduled", label: "Scheduled", icon: Clock },
      { id: "klaviyo_live", label: "Live", icon: CheckCircle }
    ]
  }
];

// Campaign types with icons
const CAMPAIGN_TYPES = {
  promotional: { label: "Promotional", icon: ShoppingBag, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  welcome: { label: "Welcome", icon: Heart, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  abandoned: { label: "Abandoned Cart", icon: ShoppingBag, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  newsletter: { label: "Newsletter", icon: Mail, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  birthday: { label: "Birthday", icon: Gift, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  winback: { label: "Win-back", icon: Target, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  postpurchase: { label: "Post-Purchase", icon: Package, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" }
};

// Priority levels
const PRIORITY_LEVELS = {
  urgent: { label: "Urgent", color: "bg-red-500", textColor: "text-white" },
  high: { label: "High", color: "bg-yellow-500", textColor: "text-white" },
  normal: { label: "Normal", color: "bg-green-500", textColor: "text-white" }
};

export default function PlannerPage() {
  const { toast } = useToast();
  const { stores, selectedStoreId, refreshStores } = useStores();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStores, setSelectedStores] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "table"
  const [columnFilters, setColumnFilters] = useState({}); // Track which sub-statuses are visible per column
  const dropdownRef = useRef(null);
  
  // Load stores on mount
  useEffect(() => {
    if (refreshStores) {
      refreshStores();
    }
  }, []);

  // Initialize with all stores selected
  useEffect(() => {
    if (stores && stores.length > 0 && selectedStores.length === 0) {
      setSelectedStores(stores.map(s => s.public_id));
    }
  }, [stores]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStoreDropdown(false);
      }
    };

    if (showStoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStoreDropdown]);
  
  // Initialize with all sub-status filters enabled
  useEffect(() => {
    if (Object.keys(columnFilters).length === 0) {
      const initialFilters = {};
      COLUMNS.forEach(column => {
        initialFilters[column.id] = column.subStatuses.reduce((acc, status) => {
          acc[status.id] = true;
          return acc;
        }, {});
      });
      setColumnFilters(initialFilters);
    }
  }, []);

  // Initialize campaigns state with new granular statuses
  const [campaigns, setCampaigns] = useState({
    brief: [
      {
        id: "1",
        storeId: stores?.[0]?.public_id || "store1",
        client: "Acme Corp",
        campaign: "Black Friday Sale",
        type: "promotional",
        priority: "urgent",
        dueDate: "2024-11-24",
        assignee: "Sarah",
        progress: 0,
        notes: "Gathering assets",
        reviewRound: null,
        sentDate: null,
        launchDate: null,
        sendDateTime: null
      },
      {
        id: "2",
        storeId: stores?.[1]?.public_id || "store2",
        client: "Beauty Brand",
        campaign: "Welcome Series",
        type: "welcome",
        priority: "high",
        dueDate: "2024-11-26",
        assignee: "Mike",
        progress: 0,
        notes: "Writing copy",
        reviewRound: null,
        sentDate: null,
        launchDate: null,
        sendDateTime: null
      }
    ],
    designing: [
      {
        id: "3",
        storeId: stores?.[0]?.public_id || "store1",
        client: "Fashion Co",
        campaign: "Abandoned Cart",
        type: "abandoned",
        priority: "normal",
        dueDate: "2024-11-28",
        assignee: "Emma",
        progress: 65,
        notes: "Working on mobile version",
        reviewRound: null,
        sentDate: null,
        launchDate: null,
        sendDateTime: null
      }
    ],
    internal_review: [],
    client_review: [
      {
        id: "4",
        storeId: stores?.[0]?.public_id || "store1",
        client: "Tech Startup",
        campaign: "Product Launch",
        type: "promotional",
        priority: "high",
        dueDate: "2024-11-22",
        assignee: "Alex",
        progress: 90,
        notes: "Awaiting client feedback",
        reviewRound: 1,
        sentDate: "2024-11-20",
        launchDate: null,
        sendDateTime: null
      }
    ],
    approved_ready: [],
    approved_launch: [],
    scheduled: [],
    live: []
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;

    if (!activeContainer || !overContainer) {
      setActiveId(null);
      return;
    }

    if (activeContainer !== overContainer) {
      // Moving between sub-status containers
      setCampaigns((prev) => {
        const activeItems = [...prev[activeContainer]];
        const overItems = [...prev[overContainer]];
        const activeIndex = activeItems.findIndex((item) => item.id === active.id);
        const activeItem = {...activeItems[activeIndex]};

        // Update the campaign's subStatus to match new container
        activeItem.subStatus = overContainer;

        // Remove from source container
        activeItems.splice(activeIndex, 1);

        // Add to destination container
        const overIndex = overItems.findIndex((item) => item.id === over.id);
        if (overIndex === -1) {
          overItems.push(activeItem);
        } else {
          overItems.splice(overIndex, 0, activeItem);
        }

        return {
          ...prev,
          [activeContainer]: activeItems,
          [overContainer]: overItems
        };
      });

      // Show toast for status change
      const targetColumn = getColumnFromSubStatus(overContainer);
      toast({
        title: "Campaign moved",
        description: `Moved to ${targetColumn?.title || 'Unknown Status'}`,
      });
    } else {
      // Reordering within the same sub-status container
      setCampaigns((prev) => {
        const items = [...prev[overContainer]];
        const activeIndex = items.findIndex((item) => item.id === active.id);
        const overIndex = items.findIndex((item) => item.id === over.id);
        
        return {
          ...prev,
          [overContainer]: arrayMove(items, activeIndex, overIndex)
        };
      });
    }

    setActiveId(null);
  };

  // Find which container an item belongs to
  const findContainer = (id) => {
    if (id in campaigns) {
      return id;
    }

    // Check all sub-status containers
    return Object.keys(campaigns).find((key) =>
      campaigns[key].some((item) => item.id === id)
    );
  };
  
  // Find main column from sub-status ID
  const getColumnFromSubStatus = (subStatusId) => {
    for (const column of COLUMNS) {
      if (column.subStatuses.find(sub => sub.id === subStatusId)) {
        return column;
      }
    }
    return null;
  };

  // Get active campaign for drag overlay
  const getActiveCampaign = () => {
    if (!activeId) return null;
    
    for (const column of Object.keys(campaigns)) {
      const campaign = campaigns[column].find(c => c.id === activeId);
      if (campaign) return campaign;
    }
    return null;
  };

  // Get all campaigns for a main column (grouped by sub-status)
  const getCampaignsForColumn = (columnId) => {
    const column = COLUMNS.find(col => col.id === columnId);
    if (!column) return [];
    
    const allCampaignsInColumn = [];
    column.subStatuses.forEach(subStatus => {
      const subStatusCampaigns = campaigns[subStatus.id] || [];
      allCampaignsInColumn.push(...subStatusCampaigns);
    });
    
    return allCampaignsInColumn;
  };

  // Add new campaign
  const handleAddCampaign = (newCampaign) => {
    const campaignWithDefaults = {
      ...newCampaign,
      id: Date.now().toString(),
      reviewRound: null,
      sentDate: null,
      launchDate: null,
      sendDateTime: null,
      subStatus: "brief_new" // Always start in the first sub-status
    };
    
    setCampaigns(prev => ({
      ...prev,
      brief_new: [...prev.brief_new, campaignWithDefaults]
    }));
    
    toast({
      title: "Campaign added",
      description: `${newCampaign.campaign} has been added to Brief`,
    });
  };

  // Toggle sub-status filter visibility
  const toggleSubStatus = (columnId, subStatusId, forceShow = null) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        [subStatusId]: forceShow !== null ? forceShow : !prev[columnId]?.[subStatusId]
      }
    }));
  };

  // Handle status change in table view
  const handleStatusChange = (campaignId, currentStatus, newStatus) => {
    setCampaigns(prev => {
      // Find and remove campaign from current status
      const campaign = prev[currentStatus].find(c => c.id === campaignId);
      if (!campaign) return prev;

      // Update campaign's subStatus
      const updatedCampaign = { ...campaign, subStatus: newStatus };
      const updatedCurrentStatus = prev[currentStatus].filter(c => c.id !== campaignId);
      const updatedNewStatus = [...prev[newStatus], updatedCampaign];

      return {
        ...prev,
        [currentStatus]: updatedCurrentStatus,
        [newStatus]: updatedNewStatus
      };
    });

    // Find the column name from sub-status
    let columnName = 'Unknown';
    for (const column of COLUMNS) {
      if (column.subStatuses.find(sub => sub.id === newStatus)) {
        columnName = column.title;
        break;
      }
    }
    
    toast({
      title: "Status updated",
      description: `Campaign moved to ${columnName}`,
    });
  };

  // Filter campaigns based on search and selected stores
  const filterCampaigns = (columnCampaigns) => {
    let filtered = columnCampaigns;
    
    // Filter by selected stores
    if (selectedStores.length > 0 && selectedStores.length < (stores?.length || 0)) {
      filtered = filtered.filter(campaign => 
        selectedStores.includes(campaign.storeId)
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(campaign => 
        campaign.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.campaign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.assignee?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Toggle store selection
  const toggleStore = (storeId) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
  };

  // Select/Deselect all stores
  const toggleAllStores = () => {
    if (selectedStores.length === stores?.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(stores.map(s => s.public_id));
    }
  };

  // Calculate stats
  const stats = {
    total: Object.values(campaigns).flat().length,
    urgent: Object.values(campaigns).flat().filter(c => c.priority === "urgent").length,
    dueToday: Object.values(campaigns).flat().filter(c => {
      const due = new Date(c.dueDate);
      const today = new Date();
      return due.toDateString() === today.toDateString();
    }).length,
    inProgress: (campaigns.design_concept?.length || 0) + (campaigns.design_creation?.length || 0) + (campaigns.brief_new?.length || 0) + (campaigns.brief_in_progress?.length || 0),
    inReview: (campaigns.review_internal?.length || 0) + (campaigns.review_client?.length || 0),
    completed: (campaigns.klaviyo_live?.length || 0) + (campaigns.klaviyo_scheduled?.length || 0)
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-sky-blue to-vivid-violet flex items-center justify-center">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-gray dark:text-white">
                  Campaign Planner
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "h-8 px-3 text-xs",
                    viewMode === "kanban" 
                      ? "bg-white dark:bg-gray-700 shadow-sm" 
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "h-8 px-3 text-xs",
                    viewMode === "table" 
                      ? "bg-white dark:bg-gray-700 shadow-sm" 
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <List className="h-3 w-3 mr-1" />
                  Table
                </Button>
              </div>

              {/* Store Filter Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                  className="flex items-center gap-2 min-w-[200px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span className="text-sm">
                      {selectedStores.length === 0 
                        ? "No stores" 
                        : selectedStores.length === stores?.length 
                        ? "All stores" 
                        : `${selectedStores.length} store${selectedStores.length > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    showStoreDropdown && "rotate-90"
                  )} />
                </Button>
                
                {showStoreDropdown && (
                  <Card className="absolute top-full mt-2 left-0 w-72 z-50 shadow-xl border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-gray dark:text-white">
                          Filter by Store
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleAllStores}
                          className="text-xs h-7 px-2"
                        >
                          {selectedStores.length === stores?.length ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {stores?.map((store) => (
                            <div
                              key={store.public_id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                              onClick={() => toggleStore(store.public_id)}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded border-2 flex items-center justify-center",
                                selectedStores.includes(store.public_id)
                                  ? "bg-sky-blue border-sky-blue"
                                  : "border-gray-300 dark:border-gray-600"
                              )}>
                                {selectedStores.includes(store.public_id) && (
                                  <CheckCircle className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-gray dark:text-white truncate">
                                  {store.name}
                                </p>
                                <p className="text-xs text-neutral-gray dark:text-gray-400 truncate">
                                  {store.url || 'No URL'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-gray" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 h-9"
                />
              </div>

              {/* Add Campaign Button */}
              <Button
                onClick={() => setShowAddModal(true)}
                size="sm"
                className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="border-l-4 border-l-sky-blue">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Total Active</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">{stats.total}</p>
                </div>
                <Target className="h-8 w-8 text-sky-blue/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Urgent</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">{stats.urgent}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Due Today</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">{stats.dueToday}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">In Progress</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">{stats.inProgress}</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Completed</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Views */}
        {viewMode === "kanban" ? (
          /* Kanban Board */
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToWindowEdges]}
            >
              <div className="flex gap-4 min-w-max">
                {COLUMNS.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    campaigns={filterCampaigns(getCampaignsForColumn(column.id))}
                    campaignTypes={CAMPAIGN_TYPES}
                    priorityLevels={PRIORITY_LEVELS}
                    columnFilters={columnFilters}
                    onToggleSubStatus={toggleSubStatus}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeId && (
                  <CampaignCard
                    campaign={getActiveCampaign()}
                    campaignTypes={CAMPAIGN_TYPES}
                    priorityLevels={PRIORITY_LEVELS}
                    columns={COLUMNS}
                    isDragging
                  />
                )}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          /* Table View */
          <TableView
            campaigns={Object.fromEntries(
              Object.entries(campaigns).map(([status, campaignList]) => [
                status,
                filterCampaigns(campaignList)
              ])
            )}
            campaignTypes={CAMPAIGN_TYPES}
            priorityLevels={PRIORITY_LEVELS}
            columns={COLUMNS}
            onStatusChange={handleStatusChange}
            stores={stores}
          />
        )}

        {/* Add Campaign Modal */}
        {showAddModal && (
          <AddCampaignModal
            onAdd={handleAddCampaign}
            onClose={() => setShowAddModal(false)}
            campaignTypes={CAMPAIGN_TYPES}
            priorityLevels={PRIORITY_LEVELS}
            stores={stores}
          />
        )}
      </div>
    </div>
  );
}