"use client";

import Sidebar from "@/app/components/dashboard/sidebar";
import { ThemeProvider } from "@/app/contexts/theme-context";
import { StoreProvider } from "@/app/contexts/store-context";
import { PermissionsProvider } from "@/app/contexts/permissions-context";
import { SidebarProvider, useSidebar } from "@/app/contexts/sidebar-context";

function DashboardContent({ children }) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <main className={`flex-1 p-4 lg:p-6 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      <PermissionsProvider>
        <StoreProvider>
          <SidebarProvider>
            <DashboardContent>{children}</DashboardContent>
          </SidebarProvider>
        </StoreProvider>
      </PermissionsProvider>
    </ThemeProvider>
  );
}