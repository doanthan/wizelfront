"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';
import { 
  Mail, MessageSquare, Bell, Users, Calendar, Clock, 
  TrendingUp, DollarSign, Eye, MousePointer, ShoppingCart,
  CheckCircle, XCircle
} from 'lucide-react';
import { EmailPreviewPanel } from './EmailPreviewPanel';

export default function CampaignDetailsModal({ 
  campaign, 
  onClose, 
  stores,
  audienceCache 
}) {
  if (!campaign) return null;
  
  const store = stores?.find(s => 
    s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
  );
  
  const performance = campaign.performance || {};
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {campaign.channel === 'email' && <Mail className="h-5 w-5 text-blue-600" />}
              {campaign.channel === 'sms' && <MessageSquare className="h-5 w-5 text-green-600" />}
              {campaign.channel === 'push-notification' && <Bell className="h-5 w-5 text-purple-600" />}
              <div>
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <p className="text-sm text-gray-500">
                  {store?.name || 'Unknown Store'} • {format(new Date(campaign.date), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <Badge variant={campaign.isScheduled ? 'secondary' : 'default'}>
              {campaign.isScheduled ? 'Scheduled' : 'Sent'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="performance" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="audiences">Audiences</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Recipients"
                value={performance.recipients || 0}
                icon={Users}
                format="number"
              />
              <MetricCard
                label="Open Rate"
                value={performance.openRate || 0}
                icon={Eye}
                format="percent"
                color="text-blue-600"
              />
              <MetricCard
                label="Click Rate"
                value={performance.clickRate || 0}
                icon={MousePointer}
                format="percent"
                color="text-green-600"
              />
              <MetricCard
                label="Revenue"
                value={performance.revenue || 0}
                icon={DollarSign}
                format="currency"
                color="text-purple-600"
              />
            </div>
            
            {/* Add more performance metrics here */}
          </TabsContent>
          
          <TabsContent value="preview" className="h-[500px]">
            <EmailPreviewPanel
              messageId={campaign.messageId}
              storeId={campaign.klaviyo_public_id || store?.klaviyo_integration?.public_id || campaign.storeIds?.[0]}
            />
          </TabsContent>
          
          <TabsContent value="audiences" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Included Audiences
                </h4>
                {campaign.audiences?.included?.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.audiences.included.map((audience, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-sky-blue" />
                          <span className="text-sm">{audience}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No audiences selected</p>
                )}
              </div>
              
              {campaign.audiences?.excluded?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Excluded Audiences
                  </h4>
                  <div className="space-y-2">
                    {campaign.audiences.excluded.map((audience, idx) => (
                      <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-red-600" />
                          <span className="text-sm">{audience}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Campaign ID" value={campaign.id} />
              <DetailItem label="Message ID" value={campaign.messageId || 'N/A'} />
              <DetailItem label="Channel" value={campaign.channel} />
              <DetailItem label="Status" value={campaign.status} />
              <DetailItem label="From Address" value={campaign.fromAddress || 'N/A'} />
              <DetailItem label="Subject" value={campaign.subject || 'N/A'} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ label, value, icon: Icon, format, color = "text-gray-600" }) {
  const formatValue = () => {
    switch (format) {
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'number':
        return value.toLocaleString();
      default:
        return value;
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold">{formatValue()}</div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}