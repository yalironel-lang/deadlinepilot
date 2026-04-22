"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LayoutDashboard, BookOpen, Inbox, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function TopBar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-zinc-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 text-sm">DeadlinePilot</span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-black/20" onClick={() => setMobileOpen(false)}>
          <nav
            className="bg-white w-56 min-h-screen pt-16 px-3 py-4 flex flex-col gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname.startsWith(href)
                    ? "bg-zinc-100 text-zinc-900 font-medium"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="mt-auto pt-4 border-t border-zinc-100">
              {userName && <p className="px-3 py-1 text-xs text-zinc-400">{userName}</p>}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-900 w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
