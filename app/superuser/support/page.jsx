"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  MessageSquare,
  Archive,
  Send,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/app/hooks/use-toast";

export default function SuperuserSupportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  // Fetch tickets
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      
      const response = await fetch(`/api/support/ticket?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      setTickets(data.tickets || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterType]);

  // Handle ticket response
  const handleResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;
    
    setResponding(true);
    try {
      const response = await fetch(`/api/support/ticket/${selectedTicket.ticket_id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseMessage })
      });
      
      if (response.ok) {
        toast({
          title: "Response sent",
          description: "Your response has been sent to the user"
        });
        setResponseMessage('');
        fetchTickets();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive"
      });
    } finally {
      setResponding(false);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`/api/support/ticket/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        toast({
          title: "Status updated",
          description: `Ticket marked as ${newStatus}`
        });
        fetchTickets();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  // Filter tickets based on search
  const filteredTickets = tickets.filter(ticket => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.ticket_id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.message.toLowerCase().includes(query) ||
        ticket.user.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature': return <Lightbulb className="h-4 w-4" />;
      case 'question': return <HelpCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'archived': return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-500';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white mb-2">
          Support Tickets
        </h1>
        <p className="text-neutral-gray dark:text-gray-400">
          Manage user feedback, bug reports, and feature requests
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open Tickets</CardDescription>
              <CardTitle className="text-2xl">{stats.open || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-2xl">{stats.in_progress || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bug Reports</CardDescription>
              <CardTitle className="text-2xl">{stats.bugs || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Feature Requests</CardDescription>
              <CardTitle className="text-2xl">{stats.features || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-gray" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={filterType} onValueChange={setFilterType} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All Types</TabsTrigger>
            <TabsTrigger value="bug">Bugs</TabsTrigger>
            <TabsTrigger value="feature">Features</TabsTrigger>
            <TabsTrigger value="question">Questions</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={fetchTickets} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <Card className="h-[calc(100vh-400px)]">
            <CardHeader>
              <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-480px)]">
                {loading ? (
                  <div className="p-4 text-center text-neutral-gray">Loading...</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-4 text-center text-neutral-gray">No tickets found</div>
                ) : (
                  <div className="space-y-1">
                    {filteredTickets.map((ticket) => (
                      <button
                        key={ticket._id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={cn(
                          "w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          selectedTicket?._id === ticket._id && "bg-sky-tint dark:bg-gray-800"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(ticket.type)}
                            <span className="font-mono text-xs text-neutral-gray">
                              {ticket.ticket_id}
                            </span>
                          </div>
                          <Badge className={cn("text-xs", getPriorityColor(ticket.priority))}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <p className="font-medium text-sm text-slate-gray dark:text-white line-clamp-1">
                            {ticket.subject}
                          </p>
                          <p className="text-xs text-neutral-gray dark:text-gray-400 line-clamp-2">
                            {ticket.message}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-neutral-gray" />
                            <span className="text-xs text-neutral-gray truncate max-w-[150px]">
                              {ticket.user.email}
                            </span>
                          </div>
                          <Badge className={cn("text-xs", getStatusColor(ticket.status))}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-neutral-gray">
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-[calc(100vh-400px)]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTypeIcon(selectedTicket.type)}
                      {selectedTicket.subject}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4">
                        <span className="font-mono">{selectedTicket.ticket_id}</span>
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {selectedTicket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedTicket.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketStatus(selectedTicket.ticket_id, 'in_progress')}
                      >
                        Start Working
                      </Button>
                    )}
                    {selectedTicket.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketStatus(selectedTicket.ticket_id, 'resolved')}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    {selectedTicket.status === 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketStatus(selectedTicket.ticket_id, 'closed')}
                      >
                        Close Ticket
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-600px)]">
                  {/* User Info */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">User Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-neutral-gray">Email:</span>
                        <span className="ml-2 text-slate-gray dark:text-white">
                          {selectedTicket.user.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-gray">Name:</span>
                        <span className="ml-2 text-slate-gray dark:text-white">
                          {selectedTicket.user.name}
                        </span>
                      </div>
                      {selectedTicket.store && (
                        <div>
                          <span className="text-neutral-gray">Store:</span>
                          <span className="ml-2 text-slate-gray dark:text-white">
                            {selectedTicket.store.store_name}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-neutral-gray">Submitted:</span>
                        <span className="ml-2 text-slate-gray dark:text-white">
                          {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-2">Message</h4>
                    <div className="p-4 bg-white dark:bg-gray-900 border rounded-lg">
                      <p className="text-sm text-slate-gray dark:text-white whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-sm mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {selectedTicket.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                            <span className="text-sm">{attachment.filename}</span>
                            <span className="text-xs text-neutral-gray">
                              ({(attachment.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responses */}
                  {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-sm mb-2">Responses</h4>
                      <div className="space-y-3">
                        {selectedTicket.responses.map((response, index) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {response.responder.name}
                              </span>
                              <span className="text-xs text-neutral-gray">
                                {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-gray dark:text-white">
                              {response.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Form */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">Send Response</h4>
                    <Textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="mb-3"
                      rows={4}
                    />
                    <Button
                      onClick={handleResponse}
                      disabled={responding || !responseMessage.trim()}
                      className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </Button>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-400px)] flex items-center justify-center">
              <div className="text-center text-neutral-gray">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}