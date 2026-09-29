"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";

const ADMIN_PATHS = ["/admin"];
const PUBLIC_PATHS = ["/login", "/signup"];

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const canReview = user?.role === "leader" || user?.role === "admin";
  const isReviewOnly = (pathname === "/review" || pathname.startsWith("/review/")) && !canReview;
  const isAdminOnly = ADMIN_PATHS.includes(pathname) && user?.role !== "admin";
  const blocked =
    !isLoading &&
    ((!user && !isPublicPage) || (user && isPublicPage) || (user && isReviewOnly) || (user && isAdminOnly));

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublicPage) router.replace("/login");
    else if (user && isPublicPage) router.replace("/");
    else if (user && isReviewOnly) router.replace("/");
    else if (user && isAdminOnly) router.replace("/");
  }, [user, isLoading, isPublicPage, isReviewOnly, isAdminOnly, router]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center text-sm text-muted">
        불러오는 중…
      </div>
    );
  }
  if (blocked) return null;

  return <>{children}</>;
}
