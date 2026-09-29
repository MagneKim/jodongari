import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 미인증 계정을 위한 인증 메일 재발송. loginId → email resolve가 필요해 server-only.
// enumeration 방지를 위해 loginId 존재 여부와 무관하게 항상 같은 성공 응답을 준다.
const GENERIC_MESSAGE = "인증 메일을 다시 보냈어요. 받은편지함을 확인해 주세요.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const loginId = typeof body?.loginId === "string" ? body.loginId.trim() : "";
  if (!loginId) return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("user_id").ilike("login_id", loginId).maybeSingle();
  if (profile) {
    const { data: authUserResp } = await admin.auth.admin.getUserById(profile.user_id);
    const email = authUserResp?.user?.email;
    if (email) {
      await admin.auth.resend({ type: "signup", email });
    }
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}
