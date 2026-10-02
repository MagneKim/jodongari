import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateLoginId } from "@/lib/auth/login-id";

// 본인 profile 수정(MY)용 중복 확인 — authenticated user 본인 row는 제외하고 조회한다
// (현재 쓰고 있는 자기 자신의 값은 중복으로 보지 않음). 신규 회원 생성 중복 확인과는
// 의미가 다르므로 절대 공유하지 않는다 — /api/manage/users/check-login-id 참고(Phase 4B-13).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const loginId = typeof body?.loginId === "string" ? body.loginId : "";
  const validation = validateLoginId(loginId);
  if (!validation.ok) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });

  const { count } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .ilike("login_id", validation.value)
    .neq("user_id", user.id);

  return NextResponse.json({ ok: true, available: (count ?? 0) === 0 });
}
