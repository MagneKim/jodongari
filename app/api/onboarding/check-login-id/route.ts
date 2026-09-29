import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateLoginId } from "@/lib/auth/login-id";

// onboarding 중인 authenticated user만 호출 가능. profiles read는 RLS(profiles_select_authenticated)가
// 이미 모든 authenticated user에게 허용하므로 admin client가 필요 없다. available만 반환한다.
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
