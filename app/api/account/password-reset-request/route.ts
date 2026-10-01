import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAccountByEmailAndNickname } from "@/lib/supabase/account-lookup";
import { isRateLimited, getClientKey } from "@/lib/auth/rate-limit";

// 비밀번호 재설정 요청 — public endpoint, SMTP 없이 운영(Phase 4B-9 section 10~13).
// anonymous self-service reset은 만들지 않는다. 요청만 DB에 남기고 Admin이 처리한다.
// 성공/중복/실패(email·nickname 불일치, inactive, 미존재) 모두 동일한 메시지를 반환한다.

const GENERIC_ERROR = "입력한 정보와 일치하는 계정을 찾을 수 없습니다.";
const SUCCESS_MESSAGE = "비밀번호 재설정 요청을 보냈습니다. 관리자가 확인한 후 임시 비밀번호를 안내해 드립니다.";

export async function POST(request: Request) {
  if (isRateLimited(`password-reset-request:${getClientKey(request)}`)) {
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

  const admin = createAdminClient();
  const { count: pendingCount } = await admin
    .from("password_reset_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", resolved.userId)
    .eq("status", "pending");

  if (!pendingCount) {
    const { error } = await admin.from("password_reset_requests").insert({ user_id: resolved.userId });
    if (error) {
      return NextResponse.json({ ok: false, error: "요청을 처리하지 못했어요. 다시 시도해 주세요." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
}
