"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Target,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { useUserContext } from "@/components/dashboard/user-context";
import { signOut } from "@/lib/auth/actions";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Intentions", href: "/dashboard/intentions", icon: Target },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function getPlanLabel(plan: string | undefined): string {
  switch (plan) {
    case "monthly":
      return "Monthly Plan";
    case "yearly":
      return "Yearly Plan";
    case "free":
    default:
      return "Free Plan";
  }
}

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, subscription } = useUserContext();

  const displayName = user?.name || user?.email || "User";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "?";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-white/30 backdrop-blur-xl border-r border-white/60 transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-7 pt-8 pb-6">
          <Link href="/" className="font-serif text-2xl font-medium tracking-[2px] text-navy">
            Entiremind
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-teal-900/40 hover:text-teal-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-4">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 py-2.5 px-4 rounded-full transition-colors ${
                      isActive
                        ? "bg-white/60 text-navy font-medium"
                        : "text-teal-900/60 hover:text-teal-900 hover:bg-white/30"
                    }`}
                  >
                    <item.icon
                      className="w-[18px] h-[18px]"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile */}
        <div className="px-6 py-6 border-t border-white/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-xs font-medium text-navy">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-teal-900/50">
                {user?.status === "paused"
                  ? "Paused"
                  : getPlanLabel(subscription?.plan)}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="p-2 text-teal-900/40 hover:text-teal-900 hover:bg-white/30 rounded-full transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
