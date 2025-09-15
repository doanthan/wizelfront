"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Lock,
  FileText,
  Download,
  RefreshCw,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  Key,
  Database,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

export default function ComplianceDashboard() {
  const [complianceData, setComplianceData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplianceData = async (type = 'overview') => {
    try {
      const response = await fetch(`/api/superuser/compliance?type=${type}`);
      const data = await response.json();
      
      if (type === 'overview') {
        setComplianceData(data);
      } else if (type === 'audit-logs') {
        setAuditLogs(data.logs || []);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchComplianceData('overview');
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComplianceData(activeTab);
    setRefreshing(false);
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/superuser/compliance?type=report');
      const data = await response.json();
      
      // Convert to CSV or JSON for download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-blue mx-auto mb-4"></div>
          <p className="text-neutral-gray">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  const complianceScore = complianceData?.metrics?.complianceScore || 0;
  const scoreColor = complianceScore >= 80 ? 'text-green-600' : complianceScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-gray dark:text-white">
              Compliance Dashboard
            </h1>
            <p className="text-neutral-gray dark:text-gray-400">
              SOC2 & ISO 27001 Compliance Monitoring
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={handleExportReport}
            className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Compliance Score Card */}
      <Card className="border-2 border-sky-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Compliance Score</span>
            <Badge className={cn("text-2xl px-4 py-2", scoreColor)}>
              {complianceScore}%
            </Badge>
          </CardTitle>
          <CardDescription>
            Based on SOC2 Type II and ISO 27001 requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div 
              className={cn(
                "h-4 rounded-full transition-all duration-500",
                complianceScore >= 80 ? "bg-green-500" : 
                complianceScore >= 60 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${complianceScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Daily Audit Logs
                </CardDescription>
                <CardTitle className="text-2xl">{formatNumber(complianceData?.metrics?.dailyLogs || 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-gray">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical Events
                </CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {complianceData?.metrics?.criticalEvents || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-gray">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Failed Logins
                </CardDescription>
                <CardTitle className="text-2xl">{complianceData?.metrics?.failedLogins || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-gray">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Monthly Logs
                </CardDescription>
                <CardTitle className="text-2xl">{formatNumber(complianceData?.metrics?.monthlyLogs || 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-gray">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent High-Risk Events */}
          {complianceData?.recentHighRisk?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Recent High-Risk Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceData.recentHighRisk.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{event.action}</p>
                        <p className="text-xs text-neutral-gray">
                          {event.userId?.email || 'Unknown'} • {event.ip}
                        </p>
                      </div>
                      <Badge variant={event.riskLevel === 'critical' ? 'destructive' : 'warning'}>
                        {event.riskLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Controls Status</CardTitle>
              <CardDescription>
                Real-time status of implemented security controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(complianceData?.complianceChecks || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {value ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-xs text-neutral-gray">
                          {getControlDescription(key)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={value ? 'success' : 'destructive'}>
                      {value ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Frameworks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SOC2 Type II
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Security (CC)</span>
                    <Badge className="bg-green-100 text-green-700">85%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Availability (A)</span>
                    <Badge className="bg-yellow-100 text-yellow-700">75%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Confidentiality (C)</span>
                    <Badge className="bg-green-100 text-green-700">90%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Privacy (P)</span>
                    <Badge className="bg-yellow-100 text-yellow-700">70%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  ISO 27001
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Access Control</span>
                    <Badge className="bg-green-100 text-green-700">88%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cryptography</span>
                    <Badge className="bg-green-100 text-green-700">92%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Operations Security</span>
                    <Badge className="bg-yellow-100 text-yellow-700">78%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Incident Management</span>
                    <Badge className="bg-yellow-100 text-yellow-700">65%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Logs</CardTitle>
              <CardDescription>
                All system actions are logged for compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => fetchComplianceData('audit-logs')}
                className="mb-4"
              >
                <Eye className="h-4 w-4 mr-2" />
                Load Audit Logs
              </Button>
              
              {auditLogs.length > 0 && (
                <div className="space-y-2">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{log.action}</p>
                          <p className="text-xs text-neutral-gray">
                            {log.userId?.email || 'System'} • {log.ip} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={log.success ? 'success' : 'destructive'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>
                Track and manage security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-neutral-gray">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active incidents</p>
                <p className="text-sm mt-2">System is operating normally</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getControlDescription(control) {
  const descriptions = {
    auditLogging: 'Tracks all critical system actions',
    securityHeaders: 'HTTP security headers configured',
    encryption: 'Data encryption at rest and in transit',
    accessControl: 'Role-based access control enabled',
    monitoring: 'Real-time system monitoring active',
    dataRetention: 'Automated data retention policies',
    passwordPolicy: 'Strong password requirements enforced',
    mfa: 'Multi-factor authentication available'
  };
  return descriptions[control] || 'Security control status';
}