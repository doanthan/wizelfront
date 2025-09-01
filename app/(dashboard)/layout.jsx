"use client";

import Sidebar from "@/app/components/dashboard/sidebar";
import { ThemeProvider } from "@/app/contexts/theme-context";
import { StoreProvider } from "@/app/contexts/store-context";
import { PermissionsProvider } from "@/app/contexts/permissions-context";

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      <PermissionsProvider>
        <StoreProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar />
            <main className="lg:ml-64 p-4 lg:p-8">
              {children}
            </main>
          </div>
        </StoreProvider>
      </PermissionsProvider>
    </ThemeProvider>
  );
}