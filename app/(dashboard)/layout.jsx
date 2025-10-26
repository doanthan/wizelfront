"use client";

import Sidebar from "@/app/components/dashboard/sidebar";
import WizelChat from "@/app/components/ai/wizel-chat";
import { Toaster } from "@/app/components/ui/toaster";
import { ThemeProvider } from "@/app/contexts/theme-context";
import { StoreProvider } from "@/app/contexts/store-context";
import { PermissionsProvider } from "@/app/contexts/permissions-context";
import { SidebarProvider, useSidebar } from "@/app/contexts/sidebar-context";
import { AIProvider } from "@/app/contexts/ai-context";
import { ChatProvider } from "@/app/contexts/chat-context";
import { usePathname } from "next/navigation";

function DashboardContent({ children }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const isBrandPage = pathname?.includes('/brand/');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <main className={`flex-1 p-4 lg:p-6 ${isBrandPage ? 'flex' : 'flex flex-col'} transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {children}
      </main>
      <WizelChat />
      <Toaster />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      <PermissionsProvider>
        <StoreProvider>
          <AIProvider>
            <ChatProvider>
              <SidebarProvider>
                <DashboardContent>{children}</DashboardContent>
              </SidebarProvider>
            </ChatProvider>
          </AIProvider>
        </StoreProvider>
      </PermissionsProvider>
    </ThemeProvider>
  );
}
