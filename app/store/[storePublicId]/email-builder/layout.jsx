"use client";

import { StoreProvider } from "@/app/contexts/store-context";
import { PermissionsProvider } from "@/app/contexts/permissions-context";
import { ThemeProvider } from "@/app/contexts/theme-context";
import { SidebarProvider } from "@/app/contexts/sidebar-context";
import { Toaster } from "@/app/components/ui/toaster";

export default function EmailBuilderLayout({ children }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <PermissionsProvider>
          <StoreProvider>
            <div className="min-h-screen">
              {children}
              <Toaster />
            </div>
          </StoreProvider>
        </PermissionsProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}