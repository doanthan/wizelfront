"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Calendar } from '@/app/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewCampaignModal({ onClose, stores }) {
  const [campaignData, setCampaignData] = useState({
    name: '',
    store: '',
    channel: 'email',
    subject: '',
    previewText: '',
    scheduledDate: null,
    scheduledTime: '09:00'
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement campaign creation
    console.log('Creating campaign:', campaignData);
    onClose();
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Create New Campaign</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Campaign Name</Label>
              <Input
                id="name"
                value={campaignData.name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter campaign name"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="store" className="text-gray-900 dark:text-gray-100">Store</Label>
              <Select
                value={campaignData.store}
                onValueChange={(value) => setCampaignData(prev => ({ ...prev, store: value }))}
                required
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  {stores.map(store => (
                    <SelectItem key={store.public_id} value={store.public_id} className="text-gray-900 dark:text-white">
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="channel" className="text-gray-900 dark:text-gray-100">Channel</Label>
            <Select
              value={campaignData.channel}
              onValueChange={(value) => setCampaignData(prev => ({ ...prev, channel: value }))}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="email" className="text-gray-900 dark:text-white">Email</SelectItem>
                <SelectItem value="sms" className="text-gray-900 dark:text-white">SMS</SelectItem>
                <SelectItem value="push-notification" className="text-gray-900 dark:text-white">Push Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {campaignData.channel === 'email' && (
            <>
              <div>
                <Label htmlFor="subject" className="text-gray-900 dark:text-gray-100">Subject Line</Label>
                <Input
                  id="subject"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter subject line"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div>
                <Label htmlFor="previewText" className="text-gray-900 dark:text-gray-100">Preview Text</Label>
                <Textarea
                  id="previewText"
                  value={campaignData.previewText}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, previewText: e.target.value }))}
                  placeholder="Enter preview text"
                  rows={2}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
            </>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-900 dark:text-gray-100">Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                      !campaignData.scheduledDate ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {campaignData.scheduledDate ? (
                      format(campaignData.scheduledDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Calendar
                    mode="single"
                    selected={campaignData.scheduledDate}
                    onSelect={(date) => setCampaignData(prev => ({ ...prev, scheduledDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="time" className="text-gray-900 dark:text-gray-100">Schedule Time</Label>
              <Input
                id="time"
                type="time"
                value={campaignData.scheduledTime}
                onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-md hover:shadow-lg transition-all"
            >
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}