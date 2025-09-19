"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  Users,
  Store,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  Database,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercentage } from "@/lib/utils";

export default function SuperuserDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock dashboard data
        setDashboardData({
          overview: {
            totalUsers: 1247,
            totalStores: 89,
            activeStores: 76,
            supportTickets: 23,
            systemHealth: 99.8
          },
          metrics: {
            monthlyRevenue: 124750,
            monthlyGrowth: 12.5,
            userGrowth: 8.3,
            storeGrowth: 15.2,
            avgResponseTime: "2.4h"
          },
          recent: {
            newUsers: 12,
            newStores: 3,
            resolvedTickets: 8,
            systemAlerts: 2
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-blue mx-auto mb-4"></div>
          <p className="text-neutral-gray">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header - Compact style matching dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Super Admin Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            System overview, metrics, and administrative controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardDescription>
            <CardTitle className="text-3xl">{formatNumber(dashboardData?.overview.totalUsers)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+{dashboardData?.metrics.userGrowth}%</span>
              <span className="text-neutral-gray">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Active Stores
            </CardDescription>
            <CardTitle className="text-3xl">{dashboardData?.overview.activeStores}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+{dashboardData?.metrics.storeGrowth}%</span>
              <span className="text-neutral-gray">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Support Tickets
            </CardDescription>
            <CardTitle className="text-3xl">{dashboardData?.overview.supportTickets}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600">{dashboardData?.metrics.avgResponseTime}</span>
              <span className="text-neutral-gray">avg response</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatPercentage(dashboardData?.overview.systemHealth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-600">All systems operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => router.push('/superuser/users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users & Impersonation
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => router.push('/superuser/support')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View Support Tickets
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/superuser/system')}
            >
              <Activity className="h-4 w-4 mr-2" />
              System Health Monitor
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/superuser/map')}
            >
              <Database className="h-4 w-4 mr-2" />
              Data Mapping Console
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-gray dark:text-white">
                  {dashboardData?.recent.newUsers} new users registered
                </p>
                <p className="text-xs text-neutral-gray">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Store className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-gray dark:text-white">
                  {dashboardData?.recent.newStores} stores connected
                </p>
                <p className="text-xs text-neutral-gray">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-gray dark:text-white">
                  {dashboardData?.recent.resolvedTickets} tickets resolved
                </p>
                <p className="text-xs text-neutral-gray">6 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}