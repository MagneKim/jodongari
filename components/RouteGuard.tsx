"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";

const ADMIN_PATHS = ["/admin"];
const MANAGE_PATHS = ["/manage"];
const PUBLIC_PATHS = ["/login", "/signup"];
const ONBOARDING_PATH = "/signup/profile";

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, onboardingIncomplete } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const isOnboardingPage = pathname === ONBOARDING_PATH;
  const canReview = user?.role === "leader" || user?.role === "admin";
  const isReviewOnly = (pathname === "/review" || pathname.startsWith("/review/")) && !canReview;
  const isAdminOnly = ADMIN_PATHS.includes(pathname) && user?.role !== "admin";
  const isManageOnly = MANAGE_PATHS.includes(pathname) && !canReview;

  // 회사 이메일 인증은 마쳤지만 아이디/닉네임/비밀번호를 아직 설정하지 않은 계정은
  // onboarding 완료 화면 외 모든 곳에서 차단한다.
  const blocked =
    !isLoading &&
    (onboardingIncomplete
      ? !isOnboardingPage
      : (!user && !isPublicPage) ||
        (user && isPublicPage) ||
        (user && isOnboardingPage) ||
        (user && isReviewOnly) ||
        (user && isAdminOnly) ||
        (user && isManageOnly));

  useEffect(() => {
    if (isLoading) return;
    if (onboardingIncomplete) {
      if (!isOnboardingPage) router.replace(ONBOARDING_PATH);
      return;
    }
    if (!user && !isPublicPage) router.replace("/login");
    else if (user && (isPublicPage || isOnboardingPage)) router.replace("/");
    else if (user && isReviewOnly) router.replace("/");
    else if (user && isAdminOnly) router.replace("/");
    else if (user && isManageOnly) router.replace("/");
  }, [
    user,
    isLoading,
    onboardingIncomplete,
    isPublicPage,
    isOnboardingPage,
    isReviewOnly,
    isAdminOnly,
    isManageOnly,
    router,
  ]);

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
