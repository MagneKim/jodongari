"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import { useAppData } from "@/lib/app-data-context";
import { useAuth } from "@/lib/supabase/auth-provider";

function Icon({
  d,
  ...props
}: { d: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  home: "M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9",
  binoculars:
    "M9 4h2v4h2V4h2v5a3 3 0 1 1-3 3 3 3 0 1 1-3-3V4Zm-3 6a3 3 0 1 0 6 0M12 10a3 3 0 1 0 6 0M7 13v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4M16 13v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-4",
  book: "M4 5.5A1.5 1.5 0 0 1 5.5 4H12v16H5.5A1.5 1.5 0 0 0 4 21.5v-16Zm16 0A1.5 1.5 0 0 0 18.5 4H12v16h6.5a1.5 1.5 0 0 1 1.5 1.5v-16Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  check: "m5 13 4 4L19 7",
  members: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19a6 6 0 0 1 12 0M15 14.5a5 5 0 0 1 6 4.5",
  admin: "M12 3.5 5 6.5v5c0 4.7 3 8.2 7 9.5 4-1.3 7-4.8 7-9.5v-5l-7-3Z",
};

// "기록"은 top-level nav에서 제거됐다 — /sightings(Sighting Hub)의 "기록하기" CTA로 진입한다.
const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/sightings", label: "탐조", icon: "binoculars" },
  { href: "/encyclopedia", label: "도감", icon: "book" },
  { href: "/members", label: "멤버", icon: "members" },
  { href: "/my", label: "MY", icon: "user" },
] as const;

const REVIEW_ITEM = { href: "/review", label: "검토", icon: "check" } as const;
const ADMIN_ITEM = { href: "/admin", label: "관리자", icon: "admin" } as const;
const MANAGE_ITEM = { href: "/manage", label: "관리", icon: "admin" } as const;

function useNavItems(includeRoleMenus: boolean, includeManageTab: boolean) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { currentUser } = useAppData();

  const visible = !isLoading && Boolean(user) && pathname !== "/login";
  const canReview = currentUser.role === "leader" || currentUser.role === "admin";
  const items = [
    ...NAV_ITEMS,
    ...(includeRoleMenus && canReview ? [REVIEW_ITEM] : []),
    ...(includeRoleMenus && currentUser.role === "admin" ? [ADMIN_ITEM] : []),
    ...(includeManageTab && canReview ? [MANAGE_ITEM] : []),
  ];

  return { visible, items, pathname };
}

export function BottomNav() {
  const { visible, items, pathname } = useNavItems(false, true);
  if (!visible) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-separator bg-[rgba(255,255,255,0.82)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-3xl">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon d={ICONS[item.icon]} className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TopNav() {
  const { visible, items, pathname } = useNavItems(true, false);
  if (!visible) return null;

  return (
    <nav className="sticky top-0 z-10 hidden border-b border-separator bg-[rgba(255,255,255,0.82)] backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-[52px] w-full max-w-[1320px] items-center gap-10 px-10">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
          <Image
            src="/img/jodongari-illustration.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          조동아리
        </Link>
        <ul className="flex flex-1 items-center gap-7">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-2 text-[13px] font-medium transition-colors ${
                    active ? "text-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-accent" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
