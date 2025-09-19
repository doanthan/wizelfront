"use client";

import React, { useState, useEffect } from "react";
import MorphingLoader from "@/app/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useToast } from "@/app/hooks/use-toast";
import { Progress } from "@/app/components/ui/progress";
import {
  Database,
  Server,
  HardDrive,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Table,
  Play,
  RefreshCw,
  Download,
  Copy,
  ChevronRight,
  Terminal,
  Zap,
  BarChart3,
  FileText,
  Search,
  Info,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatCurrency } from "@/lib/utils";

export default function ClickHouseTestPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [data, setData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableStats, setTableStats] = useState(null);
  const [customQuery, setCustomQuery] = useState("SELECT * FROM system.tables LIMIT 10");
  const [queryResult, setQueryResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchClickHouseData();
  }, []);

  const fetchClickHouseData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/superuser/clickhouse?action=overview");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
      setConnectionStatus(result.connection?.success ? "connected" : "error");
      
      if (result.connection?.success) {
        toast({
          title: "ClickHouse Connected",
          description: `Successfully connected to ${process.env.NEXT_PUBLIC_CLICKHOUSE_HOST || 'ClickHouse server'}`,
        });
      }
    } catch (error) {
      console.error("Failed to fetch ClickHouse data:", error);
      setConnectionStatus("error");
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to ClickHouse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchClickHouseData();
    setRefreshing(false);
  };

  const fetchTableStats = async (database, tableName) => {
    try {
      const response = await fetch(
        `/api/superuser/clickhouse?action=table-stats&database=${database}&table=${tableName}`
      );
      const result = await response.json();
      
      if (result.success) {
        setTableStats(result);
        setSelectedTable({ database, tableName });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Failed to load table stats",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const executeQuery = async () => {
    if (!customQuery.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a query to execute",
        variant: "destructive",
      });
      return;
    }

    setExecuting(true);
    try {
      const response = await fetch("/api/superuser/clickhouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: customQuery }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setQueryResult(result.data);
        toast({
          title: "Query Executed",
          description: `Returned ${result.data?.length || 0} rows`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MorphingLoader size="small" showThemeText={false} />
          <p className="text-neutral-gray">Connecting to ClickHouse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-gray dark:text-white">
                  ClickHouse Test Console
                </h1>
                <p className="text-sm text-neutral-gray">
                  Superuser database monitoring and testing interface
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <Badge
                className={cn(
                  "px-3 py-1",
                  connectionStatus === "connected"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {connectionStatus === "connected" ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
              
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Databases</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">
                    {data?.summary?.totalDatabases || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-orange-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Tables</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">
                    {data?.summary?.totalTables || 0}
                  </p>
                </div>
                <Table className="h-8 w-8 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Total Rows</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">
                    {formatNumber(data?.summary?.totalRows || 0)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-gray">Total Size</p>
                  <p className="text-2xl font-bold text-slate-gray dark:text-white">
                    {formatBytes(data?.summary?.totalSize || 0)}
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="query">Query Console</TabsTrigger>
            <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Overview</CardTitle>
                <CardDescription>
                  Summary of all databases and their sizes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.databases?.map((db) => (
                    <div
                      key={db.database}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Database className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-slate-gray dark:text-white">
                            {db.database}
                          </p>
                          <p className="text-sm text-neutral-gray">
                            {db.table_count} tables • {db.total_rows_readable} rows
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{db.total_size_readable}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Server Info */}
            <Card>
              <CardHeader>
                <CardTitle>Server Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-gray">Version</p>
                    <p className="font-medium text-slate-gray dark:text-white">
                      {data?.uptime?.version || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-gray">Uptime</p>
                    <p className="font-medium text-slate-gray dark:text-white">
                      {data?.uptime?.uptime_readable || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-gray">Server Time</p>
                    <p className="font-medium text-slate-gray dark:text-white">
                      {data?.uptime?.server_time ? new Date(data.uptime.server_time).toLocaleString() : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-gray">Active Queries</p>
                    <p className="font-medium text-slate-gray dark:text-white">
                      {data?.activeQueries?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
                <CardDescription>
                  Click on a table to view detailed statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {data?.tables?.map((table) => (
                      <div
                        key={`${table.database}.${table.table_name}`}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                        onClick={() => fetchTableStats(table.database, table.table_name)}
                      >
                        <div className="flex items-center gap-3">
                          <Table className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-slate-gray dark:text-white">
                              {table.database}.{table.table_name}
                            </p>
                            <p className="text-xs text-neutral-gray">
                              Engine: {table.engine} • {table.rows_readable} rows
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{table.size_readable}</Badge>
                          <ChevronRight className="h-4 w-4 text-neutral-gray" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Table Details */}
            {selectedTable && tableStats && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedTable.database}.{selectedTable.tableName}
                  </CardTitle>
                  <CardDescription>Table structure and sample data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="columns">
                    <TabsList>
                      <TabsTrigger value="columns">Columns</TabsTrigger>
                      <TabsTrigger value="partitions">Partitions</TabsTrigger>
                      <TabsTrigger value="sample">Sample Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="columns">
                      <div className="space-y-2">
                        {tableStats.columns?.map((col) => (
                          <div
                            key={col.name}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <div>
                              <p className="font-mono text-sm text-slate-gray dark:text-white">
                                {col.name}
                              </p>
                              <p className="text-xs text-neutral-gray">{col.type}</p>
                            </div>
                            <Badge variant="secondary">{col.compressed_size}</Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="partitions">
                      <div className="space-y-2">
                        {tableStats.partitions?.length > 0 ? (
                          tableStats.partitions.map((partition) => (
                            <div
                              key={partition.partition_id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <div>
                                <p className="font-mono text-sm text-slate-gray dark:text-white">
                                  {partition.partition}
                                </p>
                                <p className="text-xs text-neutral-gray">
                                  {partition.rows_readable} rows
                                </p>
                              </div>
                              <Badge variant="secondary">{partition.size_readable}</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-neutral-gray">No partitions</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="sample">
                      <div className="overflow-x-auto">
                        <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          {JSON.stringify(tableStats.sampleData, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Query Console Tab */}
          <TabsContent value="query" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Console</CardTitle>
                <CardDescription>
                  Execute SELECT, SHOW, and DESCRIBE queries (read-only mode)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-gray dark:text-white">
                      SQL Query
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomQuery("SELECT * FROM system.tables LIMIT 10")}
                      >
                        Tables
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomQuery("SELECT * FROM system.databases")}
                      >
                        Databases
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomQuery("SELECT * FROM system.metrics ORDER BY value DESC LIMIT 20")}
                      >
                        Metrics
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Enter your SQL query..."
                    className="font-mono min-h-[150px]"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-gray">
                      Only SELECT, SHOW, and DESCRIBE queries are allowed
                    </p>
                    <Button
                      onClick={executeQuery}
                      disabled={executing}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                    >
                      {executing ? (
                        <>
                          <MorphingLoader size="small" showThemeText={false} />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute Query
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Query Results */}
                {queryResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-gray dark:text-white">
                        Results ({queryResult.length} rows)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(queryResult, null, 2))}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy JSON
                      </Button>
                    </div>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
                      <pre className="text-xs">
                        {JSON.stringify(queryResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>
                  Real-time system performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.metrics?.map((metric) => (
                    <div
                      key={metric.metric}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium text-slate-gray dark:text-white">
                            {metric.metric}
                          </p>
                          <p className="text-xs text-neutral-gray">
                            {metric.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{metric.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Queries */}
            {data?.activeQueries?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Queries</CardTitle>
                  <CardDescription>
                    Currently executing queries on the server
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.activeQueries.map((query) => (
                      <div
                        key={query.query_id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-gray dark:text-white">
                              {query.user}
                            </span>
                          </div>
                          <Badge variant="outline">{query.elapsed_readable}</Badge>
                        </div>
                        <p className="text-xs font-mono text-neutral-gray truncate">
                          {query.query}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-gray">
                          <span>Rows: {query.rows_readable}</span>
                          <span>Bytes: {query.bytes_readable}</span>
                          <span>Memory: {query.memory_readable}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}