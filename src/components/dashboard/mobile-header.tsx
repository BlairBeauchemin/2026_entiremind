"use client";

import { Menu } from "lucide-react";
import { mockUser } from "@/lib/mock-data";

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  const initials = mockUser.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/30 backdrop-blur-xl border-b border-white/60">
      <div className="flex items-center justify-between px-5 h-16">
        <button
          onClick={onOpenSidebar}
          className="text-teal-900/70 hover:text-teal-900 transition-colors"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <span className="font-serif text-xl font-medium tracking-[2px] text-navy">
          Entiremind
        </span>

        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-[10px] font-medium text-navy">
          {initials}
        </div>
      </div>
    </header>
  );
}
