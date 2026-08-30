"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-linen text-ink font-sans relative selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}

      {/* Sidebar */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile header */}
      <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Main content */}
      <main className="relative z-10 lg:pl-64">
        <div className="max-w-3xl mx-auto px-6 pt-24 pb-16 lg:pt-12 lg:pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
