import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateNickname } from "@/lib/auth/nickname";

// check-login-id/route.ts와 동일 패턴(leader/admin 전용, 제외 없음) — /api/profile/check-nickname과
// 절대 공유하지 않는다(Phase 4B-13).
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
  const nickname = typeof body?.nickname === "string" ? body.nickname : "";
  const validation = validateNickname(nickname);
  if (!validation.ok) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });

  const { count } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .ilike("nickname", validation.value);

  return NextResponse.json({ ok: true, available: (count ?? 0) === 0 });
}
