"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { 
  Activity,
  CheckCircle,
  AlertTriangle,
  Zap,
  RefreshCw
} from "lucide-react";

export default function SuperuserSystemPage() {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock system health data
    const fetchSystemHealth = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSystemData({
          services: [
            { name: "API Services", status: "operational", uptime: "99.98%" },
            { name: "Database", status: "operational", uptime: "99.95%" },
            { name: "Email Service", status: "operational", uptime: "99.87%" },
            { name: "Storage", status: "maintenance", uptime: "98.12%" },
            { name: "Analytics", status: "operational", uptime: "99.92%" },
            { name: "Authentication", status: "operational", uptime: "99.99%" }
          ],
          metrics: [
            { name: "Response Time", value: "142ms", status: "good" },
            { name: "Uptime", value: "99.98%", status: "excellent" },
            { name: "Memory Usage", value: "68%", status: "warning" },
            { name: "CPU Usage", value: "23%", status: "good" },
            { name: "Disk Usage", value: "45%", status: "good" },
            { name: "Active Users", value: "1,247", status: "good" }
          ],
          alerts: [
            { 
              type: "warning", 
              message: "Memory usage is approaching 70% threshold",
              timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
            },
            { 
              type: "info", 
              message: "Storage maintenance scheduled for tonight",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching system health:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': 
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'maintenance': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'degraded': 
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'outage': 
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getMetricColor = (status) => {
    switch (status) {
      case 'excellent': 
        return 'text-green-600 dark:text-green-400';
      case 'good': 
        return 'text-blue-600 dark:text-blue-400';
      case 'warning': 
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': 
        return 'text-red-600 dark:text-red-400';
      default: 
        return 'text-slate-gray dark:text-white';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white mb-2">
          System Health
        </h1>
        <p className="text-neutral-gray dark:text-gray-400">
          Monitor system performance and service status
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-blue mx-auto mb-4"></div>
          <p className="text-neutral-gray">Loading system status...</p>
        </div>
      ) : (
        <>
          {/* System Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemData.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-gray dark:text-white">
                        {service.name}
                      </span>
                      <div className="text-xs text-neutral-gray">
                        Uptime: {service.uptime}
                      </div>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status === 'operational' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {service.status === 'maintenance' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemData.metrics.map((metric, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm text-neutral-gray">{metric.name}</span>
                    <span className={`text-sm font-medium ${getMetricColor(metric.status)}`}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemData.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-neutral-gray">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {systemData.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'warning' ? 'bg-yellow-500' : 
                        alert.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-gray dark:text-white">
                          {alert.message}
                        </p>
                        <p className="text-xs text-neutral-gray mt-1">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
              <CardDescription>Common system administration tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <RefreshCw className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-2">Refresh Status</h3>
                  <p className="text-sm text-neutral-gray mb-3">
                    Update all system health checks
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Refresh Now
                  </button>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-2">Performance Report</h3>
                  <p className="text-sm text-neutral-gray mb-3">
                    Generate detailed performance analysis
                  </p>
                  <button className="text-sm text-green-600 hover:text-green-800">
                    Generate Report
                  </button>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-2">System Logs</h3>
                  <p className="text-sm text-neutral-gray mb-3">
                    View detailed system logs and errors
                  </p>
                  <button className="text-sm text-purple-600 hover:text-purple-800">
                    View Logs
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}