"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";

const ADMIN_PATHS = ["/admin"];
const PUBLIC_PATHS = ["/login", "/signup", "/account-help"];

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, onboardingIncomplete } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const canReview = user?.role === "leader" || user?.role === "admin";
  const isReviewOnly = (pathname === "/review" || pathname.startsWith("/review/")) && !canReview;
  const isAdminOnly = ADMIN_PATHS.includes(pathname) && user?.role !== "admin";
  const isManageOnly = (pathname === "/manage" || pathname.startsWith("/manage/")) && !canReview;

  // admin provisioning이 아직 끝나지 않은(onboarding_completed=false) legacy shell 계정은
  // 더 이상 완료할 방법이 없으므로(self-signup 폐지) 로그인하지 않은 것으로 취급한다.
  const blocked =
    !isLoading &&
    (onboardingIncomplete
      ? !isPublicPage
      : (!user && !isPublicPage) ||
        (user && isPublicPage) ||
        (user && isReviewOnly) ||
        (user && isAdminOnly) ||
        (user && isManageOnly));

  useEffect(() => {
    if (isLoading) return;
    if (onboardingIncomplete) {
      if (!isPublicPage) router.replace("/login");
      return;
    }
    if (!user && !isPublicPage) router.replace("/login");
    else if (user && isPublicPage) router.replace("/");
    else if (user && isReviewOnly) router.replace("/");
    else if (user && isAdminOnly) router.replace("/");
    else if (user && isManageOnly) router.replace("/");
  }, [user, isLoading, onboardingIncomplete, isPublicPage, isReviewOnly, isAdminOnly, isManageOnly, router]);

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
