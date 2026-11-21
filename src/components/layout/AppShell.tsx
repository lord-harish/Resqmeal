"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { Avatar, Button } from "@/components/ui";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { logout } from "@/services/auth.service";
import { logTechnicalError } from "@/lib/utils/errors";
import { ROUTES } from "@/constants/routes";

interface NavItem {
  href: string;
  label: string;
  icon: ReactElement;
}

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: ROUTES.home,
    label: "Home",
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: ROUTES.explore,
    label: "Explore",
    icon: (
      <svg {...iconProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    ),
  },
  {
    href: ROUTES.chats,
    label: "Chats",
    icon: (
      <svg {...iconProps}>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      </svg>
    ),
  },
  {
    href: ROUTES.profile,
    label: "Profile",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
    ),
  },
];

function isActive(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const displayName = profile?.name ?? user?.displayName ?? undefined;
  const photo = profile?.profileImage ?? undefined;

  const { run: runLogout, pending: loggingOut } = useAsyncAction(
    async (): Promise<void> => {
      try {
        await logout();
      } catch (err) {
        logTechnicalError("logout", err);
      }
    },
  );

  return (
    <div className="min-h-dvh bg-[#FAFDF9]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#E2E8F0] bg-white lg:flex">
        <div className="px-6 py-6">
          <Logo variant="full" />
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-[44px] items-center gap-3 rounded-xl px-3 font-medium transition-colors " +
                  (active
                    ? "bg-[#DCFCE7] text-[#12372A]"
                    : "text-[#64748B] hover:bg-[#DCFCE7]/50 hover:text-[#12372A]")
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <Link
            href="/donate"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#15803D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
          >
            Donate Food
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white px-4 py-3 sm:px-6">
          <div className="lg:hidden">
            <Logo variant="full" />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Avatar name={displayName} src={photo} size="sm" />
            <span className="hidden text-sm font-medium text-[#334155] sm:inline lg:inline">
              {displayName ?? ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              loading={loggingOut}
              loadingText="Logging out..."
              onClick={() => void runLogout()}
            >
              Log out
            </Button>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>

      {/* Mobile donate button */}
      <Link
        href="/donate"
        className="fixed bottom-20 right-4 z-40 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#15803D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 lg:hidden"
      >
        Donate Food
      </Link>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E2E8F0] bg-white lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-medium " +
                    (active ? "text-[#16A34A]" : "text-[#64748B]")
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
