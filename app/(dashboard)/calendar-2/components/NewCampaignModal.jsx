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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={campaignData.name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter campaign name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="store">Store</Label>
              <Select
                value={campaignData.store}
                onValueChange={(value) => setCampaignData(prev => ({ ...prev, store: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.public_id} value={store.public_id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="channel">Channel</Label>
            <Select
              value={campaignData.channel}
              onValueChange={(value) => setCampaignData(prev => ({ ...prev, channel: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="push-notification">Push Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {campaignData.channel === 'email' && (
            <>
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter subject line"
                />
              </div>
              
              <div>
                <Label htmlFor="previewText">Preview Text</Label>
                <Textarea
                  id="previewText"
                  value={campaignData.previewText}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, previewText: e.target.value }))}
                  placeholder="Enter preview text"
                  rows={2}
                />
              </div>
            </>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !campaignData.scheduledDate && "text-muted-foreground"
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
                <PopoverContent className="w-auto p-0">
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
              <Label htmlFor="time">Schedule Time</Label>
              <Input
                id="time"
                type="time"
                value={campaignData.scheduledTime}
                onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple">
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}