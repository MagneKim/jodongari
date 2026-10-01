// Account recovery 공용 lookup — email + nickname이 모두 일치하는 active 계정만 찾는다.
// server-only (service_role 사용). 실패 원인(이메일/닉네임/비활성/미존재)을 구분해 반환하지 않는다
// — 호출자는 항상 동일한 generic failure 메시지를 쓴다 (enumeration 방지, Phase 4B-9 section 8/27/28).

import { createAdminClient } from "./admin";

export interface ResolvedAccount {
  userId: string;
  loginId: string;
}

// ilike는 %/_을 wildcard로 해석한다 — nickname을 패턴으로 그대로 넘기면 "두 값이 모두 정확히
// 일치해야 한다"는 보장이 깨진다(예: "%"가 아무 닉네임이나 매칭). 리터럴 비교가 되도록 escape한다.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function resolveAccountByEmailAndNickname(
  email: string,
  nickname: string
): Promise<ResolvedAccount | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedNickname = nickname.trim();
  if (!normalizedEmail || !normalizedNickname) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, login_id")
    .ilike("nickname", escapeLikePattern(normalizedNickname))
    .eq("status", "active")
    .eq("onboarding_completed", true)
    .maybeSingle();
  if (!profile?.login_id) return null;

  const { data: authUserResp } = await admin.auth.admin.getUserById(profile.user_id);
  const email2 = authUserResp?.user?.email?.toLowerCase();
  if (email2 !== normalizedEmail) return null;

  return { userId: profile.user_id, loginId: profile.login_id };
}
