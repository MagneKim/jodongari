// Account recovery 공용 lookup — email + nickname이 모두 일치하는 active 계정만 찾는다.
// server-only (service_role 사용). 실패 원인(이메일/닉네임/비활성/미존재)을 구분해 반환하지 않는다
// — 호출자는 항상 동일한 generic failure 메시지를 쓴다 (enumeration 방지, Phase 4B-9 section 8/27/28).

import { createAdminClient } from "./admin";

export interface ResolvedAccount {
  userId: string;
  loginId: string;
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
    .ilike("nickname", normalizedNickname)
    .eq("status", "active")
    .eq("onboarding_completed", true)
    .maybeSingle();
  if (!profile?.login_id) return null;

  const { data: authUserResp } = await admin.auth.admin.getUserById(profile.user_id);
  const email2 = authUserResp?.user?.email?.toLowerCase();
  if (email2 !== normalizedEmail) return null;

  return { userId: profile.user_id, loginId: profile.login_id };
}
