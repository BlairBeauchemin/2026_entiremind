"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-teal-900 font-sans relative selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/8 rounded-full blur-[100px] pointer-events-none z-0" />

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
