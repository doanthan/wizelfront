"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Map,
  Mail,
  Menu,
  X,
  ChevronLeft,
  Shield,
  Users,
  FileCheck,
  Store,
  Server,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    name: "Dashboard",
    href: "/superuser",
    icon: LayoutDashboard,
    description: "Overview & metrics"
  },
  {
    name: "Users",
    href: "/superuser/users",
    icon: Users,
    description: "Manage & impersonate"
  },
  {
    name: "Compliance",
    href: "/superuser/compliance",
    icon: FileCheck,
    description: "SOC2 & ISO 27001"
  },
  {
    name: "Support",
    href: "/superuser/support",
    icon: MessageSquare,
    description: "Tickets & feedback"
  },
  {
    name: "Stores",
    href: "/superuser/stores",
    icon: Store,
    description: "Analytics & monitoring"
  },
  {
    name: "System",
    href: "/superuser/system",
    icon: Server,
    description: "Health & performance"
  },
  {
    name: "ClickHouse",
    href: "/superuser/test/clickhouse",
    icon: Database,
    description: "Database console"
  },
  {
    name: "Map",
    href: "/superuser/map",
    icon: Map,
    description: "Data connections"
  },
  {
    name: "Email Builder",
    href: "/superuser/email-builder",
    icon: Mail,
    description: "Template builder"
  }
];

export default function SuperuserLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActivePath = (href) => {
    if (href === "/superuser") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-blue to-vivid-violet rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-slate-gray dark:text-white">
                  Super Admin
                </h2>
                <p className="text-xs text-neutral-gray dark:text-gray-400">
                  Administrative Control Panel
                </p>
              </div>
            )}
          </div>
          
          {/* Collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-4 hidden lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              sidebarCollapsed ? "rotate-180" : ""
            )} />
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-4 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.href);
            
            return (
              <Button
                key={item.href}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 px-3",
                  active && "bg-sky-tint dark:bg-sky-blue/20 text-sky-blue border-sky-blue/20",
                  sidebarCollapsed && "px-0 justify-center"
                )}
                onClick={() => {
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  active ? "text-sky-blue" : "text-neutral-gray dark:text-gray-400",
                  sidebarCollapsed ? "" : "mr-3"
                )} />
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left">
                    <div className={cn(
                      "font-medium text-sm",
                      active ? "text-sky-blue" : "text-slate-gray dark:text-white"
                    )}>
                      {item.name}
                    </div>
                    <div className="text-xs text-neutral-gray dark:text-gray-400 line-clamp-1">
                      {item.description}
                    </div>
                  </div>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Back to Dashboard */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && "Back to Dashboard"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-sky-blue to-vivid-violet rounded flex items-center justify-center">
                  <Shield className="h-3 w-3 text-white" />
                </div>
                <h1 className="font-semibold text-slate-gray dark:text-white">
                  Super Admin
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}