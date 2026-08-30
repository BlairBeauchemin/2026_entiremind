"use client";

import Link from "next/link";
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
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-surface border-b border-rule">
      <div className="flex items-center justify-between px-5 h-16">
        <button
          onClick={onOpenSidebar}
          className="text-muted hover:text-cobalt transition-colors"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <Link href="/" className="font-serif text-xl tracking-[2px] text-ink">
          Entiremind
        </Link>

        <div className="w-8 h-8 rounded-full bg-cobalt-wash flex items-center justify-center text-[10px] font-medium text-ink">
          {initials}
        </div>
      </div>
    </header>
  );
}
