import { NextResponse } from "next/server";
import { resolveAccountByEmailAndNickname } from "@/lib/supabase/account-lookup";
import { isRateLimited, getClientKey } from "@/lib/auth/rate-limit";

// 아이디 찾기 — public endpoint, SMTP 없이 운영(Phase 4B-9 section 6/7/8).
// email + nickname이 모두 일치해야만 login_id를 반환한다. 실패 원인은 구분하지 않는다.

const GENERIC_ERROR = "입력한 정보와 일치하는 계정을 찾을 수 없습니다.";

export async function POST(request: Request) {
  if (isRateLimited(`find-login-id:${getClientKey(request)}`)) {
    return NextResponse.json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const nickname = typeof body?.nickname === "string" ? body.nickname : "";
  if (!email.trim() || !nickname.trim()) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const resolved = await resolveAccountByEmailAndNickname(email, nickname);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 404 });
  }

  return NextResponse.json({ ok: true, loginId: resolved.loginId });
}
