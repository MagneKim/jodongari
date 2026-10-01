"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";

// 관리자가 생성한 계정(임시 비밀번호)에게 비밀번호 변경을 유도하는 soft reminder.
// 강제 변경은 하지 않는다(Phase 4B-7 section 21).
export function PasswordReminderBanner() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user?.mustChangePassword || pathname === "/my") return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-secondary px-4 py-2 text-[13px] sm:px-6 lg:px-10">
      <span className="text-muted">초기 비밀번호를 사용 중입니다. 보안을 위해 비밀번호를 변경해 주세요.</span>
      <Link href="/my" className="shrink-0 font-semibold text-accent">
        비밀번호 변경
      </Link>
    </div>
  );
}
