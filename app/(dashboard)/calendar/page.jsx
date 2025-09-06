'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Filter, Plus, Mail, MessageSquare, Bell, Users, Eye, MousePointer, ShoppingCart, DollarSign, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { useStores } from '@/app/contexts/store-context';
import { cn } from '@/lib/utils';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { stores } = useStores();

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

  useEffect(() => {
    loadCampaigns();
  }, [selectedAccount, selectedChannel, date]);

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
        // day view
        endDate.setDate(date.getDate() + 1);
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedAccount !== 'all') {
        params.append('storeId', selectedAccount);
      }

      if (selectedChannel !== 'all') {
        params.append('channel', selectedChannel);
      }

      const response = await fetch(`/api/calendar/campaigns?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
      
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (value) => {
    if (isFuture(value) || isToday(value)) {
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
    setDate(newDate);
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
    setDate(newDate);
  };

  const handleToday = () => {
    setDate(new Date());
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
    return campaigns.filter(campaign => {
      const campaignDate = new Date(campaign.date);
      return (
        campaignDate.getDate() === date.getDate() &&
        campaignDate.getMonth() === date.getMonth() &&
        campaignDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetails(true);
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
            {dateCampaigns.slice(0, 2).map((campaign, index) => (
              <div
                key={campaign.id}
                className={`text-xs px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 ${getChannelColor(campaign.channel)}`}
                title={`${campaign.name} - ${campaign.channel} - Open Rate: ${(campaign.performance.openRate * 100).toFixed(1)}%`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCampaignClick(campaign);
                }}
              >
                <div className="truncate font-medium">{campaign.name}</div>
                <div className="flex justify-between items-center">
                  <span className="uppercase text-xs opacity-70">{campaign.channel}</span>
                  <span className={`text-xs font-medium ${getPerformanceColor(campaign.performance.openRate)}`}>
                    {(campaign.performance.openRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            {dateCampaigns.length > 2 && (
              <div className="text-xs text-gray-600 text-center py-1">
                +{dateCampaigns.length - 2} more
              </div>
            )}
          </div>
        );
      }
    }
    return null;
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
                <p className="text-xs text-gray-600 dark:text-gray-400">Scheduled</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {campaigns.filter(c => new Date(c.send_time) > new Date()).length}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">Upcoming</p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-vivid-violet/20 rounded-lg">
                <CalendarClock className="h-4 w-4 text-vivid-violet" />
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
                    ? `${(campaigns.reduce((acc, c) => acc + (c.performance?.openRate || 0), 0) / campaigns.length * 100).toFixed(1)}%`
                    : '0%'}
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400">+2.5% vs last</p>
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
                <p className="text-xs text-gray-600 dark:text-gray-400">Active Stores</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {stores.length}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">Connected</p>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-600/20 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-4">
            <div className="min-w-[180px]">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">Store</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="h-10 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-sky-blue focus:border-sky-blue transition-colors">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">View All Stores</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.public_id || store.id || store._id} value={store.public_id || store.id || store._id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <div className="min-w-[160px]">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1.5 block">Channel</label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="h-10 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-sky-blue focus:border-sky-blue transition-colors">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    SMS
                  </div>
                </SelectItem>
                <SelectItem value="push-notification">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-purple-600" />
                    Push
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-sky-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <div className="h-4 w-4 border-2 border-sky-blue border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Loading campaigns...</span>
            </div>
          )}

          <div className="ml-auto">
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
        
        {campaigns.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            Showing {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} for {format(date, 'MMMM yyyy')}
          </div>
        )}
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
                onClick={() => setView('month')}
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
                onClick={() => setView('week')}
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
                onClick={() => setView('day')}
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
          <div className="custom-calendar" style={{ minHeight: '500px' }}>
            <Calendar
              onChange={setDate}
              value={date}
              onClickDay={handleDateClick}
              view={view}
              tileContent={tileContent}
              showNeighboringMonth={true}
              locale="en-US"
              minDetail="month"
              maxDetail="month"
              className="h-full w-full"
            />
          </div>
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

      {/* Campaign Details Modal */}
      <Dialog open={showCampaignDetails} onOpenChange={setShowCampaignDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCampaign?.channel === 'email' && <Mail className="h-5 w-5 text-blue-600" />}
              {selectedCampaign?.channel === 'sms' && <MessageSquare className="h-5 w-5 text-green-600" />}
              {selectedCampaign?.channel === 'push-notification' && <Bell className="h-5 w-5 text-purple-600" />}
              {selectedCampaign?.name}
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sent on {selectedCampaign?.date && format(new Date(selectedCampaign.date), 'MMMM d, yyyy')}
            </p>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-6">
              {/* Campaign Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject Line</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCampaign.subject || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Address</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCampaign.fromAddress || 'N/A'}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipients</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{selectedCampaign.performance.recipients.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Rate</span>
                    </div>
                    <p className={`text-2xl font-bold ${getPerformanceColor(selectedCampaign.performance.openRate)}`}>
                      {(selectedCampaign.performance.openRate * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointer className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click Rate</span>
                    </div>
                    <p className={`text-2xl font-bold ${getPerformanceColor(selectedCampaign.performance.clickRate)}`}>
                      {(selectedCampaign.performance.clickRate * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversion Rate</span>
                    </div>
                    <p className={`text-2xl font-bold ${getPerformanceColor(selectedCampaign.performance.conversionRate)}`}>
                      {(selectedCampaign.performance.conversionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue */}
              {selectedCampaign.performance.revenue > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Revenue Generated</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    ${selectedCampaign.performance.revenue.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Tags */}
              {selectedCampaign.tags?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaign.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Audiences */}
              {(selectedCampaign.audiences?.included?.length > 0 || selectedCampaign.audiences?.excluded?.length > 0) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audiences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCampaign.audiences.included?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Included</h5>
                        <div className="space-y-1">
                          {selectedCampaign.audiences.included.map((audience, index) => (
                            <div key={index} className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800/30">
                              <span className="font-medium">{audience.name}</span>
                              <span className="text-green-600 ml-2">({audience.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedCampaign.audiences.excluded?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Excluded</h5>
                        <div className="space-y-1">
                          {selectedCampaign.audiences.excluded.map((audience, index) => (
                            <div key={index} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800/30">
                              <span className="font-medium">{audience.name}</span>
                              <span className="text-red-600 ml-2">({audience.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}