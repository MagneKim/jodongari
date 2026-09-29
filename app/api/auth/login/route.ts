import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// login_id + password 로그인의 server-only bridge.
// Supabase Auth 자체는 email/password identity를 쓰므로, client가 login_id → email을
// 직접 조회하지 못하도록(section 20/25) 이 route에서만 resolve하고 즉시 password sign-in한다.
// 존재하지 않는 ID / 틀린 비밀번호는 항상 같은 메시지로 응답한다(enumeration 방지).

const GENERIC_ERROR = "아이디 또는 비밀번호를 확인해 주세요.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const loginId = typeof body?.loginId === "string" ? body.loginId.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!loginId || !password) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const admin = createAdminClient();

  // ilike without wildcard chars = case-insensitive exact match. 별도 normalized column 없이 처리.
  const { data: profile } = await admin.from("profiles").select("user_id, status").ilike("login_id", loginId).maybeSingle();
  if (!profile) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const { data: authUserResp, error: authUserError } = await admin.auth.admin.getUserById(profile.user_id);
  const email = authUserResp?.user?.email;
  if (authUserError || !email) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    const code = (signInError as { code?: string }).code;
    if (code === "email_not_confirmed" || /email not confirmed/i.test(signInError.message)) {
      return NextResponse.json(
        { ok: false, error: "회사 이메일 인증을 완료해 주세요.", code: "email_not_confirmed" },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  if (profile.status === "inactive") {
    await supabase.auth.signOut();
    return NextResponse.json(
      { ok: false, error: "비활성화된 계정입니다. 관리자에게 문의해 주세요." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
