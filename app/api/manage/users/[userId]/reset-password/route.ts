import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/auth/password";

// 임시 비밀번호 재설정 — admin 전용(Phase 4B-7 section 48). SMTP 없이도 Admin이 fallback으로
// 계정을 복구할 수 있게 한다. leader는 호출할 수 없다.

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  if (!actor) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });

  const { data: actorProfile } = await supabase.from("profiles").select("role").eq("user_id", actor.id).single();
  if (actorProfile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "관리자만 임시 비밀번호를 재설정할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const temporaryPassword = typeof body?.temporaryPassword === "string" ? body.temporaryPassword : "";
  const resetRequestId = typeof body?.resetRequestId === "string" ? body.resetRequestId : null;
  const validation = validatePassword(temporaryPassword);
  if (!validation.ok) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(userId, { password: temporaryPassword });
  if (authError) {
    return NextResponse.json({ ok: false, error: "임시 비밀번호 재설정에 실패했어요. 다시 시도해 주세요." }, { status: 500 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("user_id", userId);
  if (profileError) {
    return NextResponse.json({ ok: false, error: "임시 비밀번호 재설정에 실패했어요. 다시 시도해 주세요." }, { status: 500 });
  }

  if (resetRequestId) {
    await admin
      .from("password_reset_requests")
      .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: actor.id })
      .eq("id", resetRequestId)
      .eq("status", "pending");
  }

  console.log("[manage/users] 임시 비밀번호 재설정", { actorId: actor.id, targetUserId: userId });
  return NextResponse.json({ ok: true });
}
