import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateLoginId } from "@/lib/auth/login-id";

// 신규 회원 생성(/manage/users/new)용 중복 확인 — leader/admin 전용, 호출자(관리자) 자신의 row를
// 포함해 전체 profiles를 대상으로 검사한다(제외 없음). /api/profile/check-login-id(MY, 본인 제외)와
// 절대 공유하지 않는다 — Phase 4B-12에서 두 화면이 같은 endpoint를 쓰면서 admin 자신의 login_id가
// "사용 가능"으로 오판되던 버그의 원인이었다(Phase 4B-13 수정).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });

  const { data: actorProfile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (actorProfile?.role !== "leader" && actorProfile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const loginId = typeof body?.loginId === "string" ? body.loginId : "";
  const validation = validateLoginId(loginId);
  if (!validation.ok) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });

  const { count } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .ilike("login_id", validation.value);

  return NextResponse.json({ ok: true, available: (count ?? 0) === 0 });
}
