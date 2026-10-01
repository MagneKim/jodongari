import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isCorporateEmail } from "@/lib/auth/corporate-email";
import { validateLoginId } from "@/lib/auth/login-id";
import { validateNickname } from "@/lib/auth/nickname";
import { validatePassword } from "@/lib/auth/password";
import type { UserRole } from "@/lib/types";

// 신규 회원 생성 — admin/leader만 호출 가능한 server-only privileged endpoint(Phase 4B-7).
// browser는 service role을 절대 쓸 수 없으므로 이 route가 유일한 provisioning 경로다.
// leader는 member만 생성 가능 — client select뿐 아니라 여기서도 다시 막는다(session role은 신뢰하지 않음).

const ROLES: UserRole[] = ["member", "leader", "admin"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  if (!actor) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });

  const { data: actorProfile } = await supabase.from("profiles").select("role").eq("user_id", actor.id).single();
  const actorRole = actorProfile?.role as UserRole | undefined;
  if (actorRole !== "leader" && actorRole !== "admin") {
    return NextResponse.json({ ok: false, error: "회원을 추가할 권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const temporaryPassword = typeof body?.temporaryPassword === "string" ? body.temporaryPassword : "";
  const role = body?.role as UserRole;

  if (!isCorporateEmail(email)) {
    return NextResponse.json({ ok: false, error: "@tanabe-pharma.com 회사 이메일만 등록할 수 있습니다." }, { status: 400 });
  }
  const loginIdValidation = validateLoginId(typeof body?.loginId === "string" ? body.loginId : "");
  if (!loginIdValidation.ok) return NextResponse.json({ ok: false, error: loginIdValidation.error }, { status: 400 });
  const nicknameValidation = validateNickname(typeof body?.nickname === "string" ? body.nickname : "");
  if (!nicknameValidation.ok) return NextResponse.json({ ok: false, error: nicknameValidation.error }, { status: 400 });
  const passwordValidation = validatePassword(temporaryPassword);
  if (!passwordValidation.ok) return NextResponse.json({ ok: false, error: passwordValidation.error }, { status: 400 });
  if (!ROLES.includes(role)) return NextResponse.json({ ok: false, error: "역할을 선택해 주세요." }, { status: 400 });
  if (actorRole === "leader" && role !== "member") {
    return NextResponse.json({ ok: false, error: "회장은 멤버만 생성할 수 있습니다." }, { status: 403 });
  }

  const loginId = loginIdValidation.value;
  const nickname = nicknameValidation.value;
  const admin = createAdminClient();

  const { count: loginIdCount } = await admin
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .ilike("login_id", loginId);
  if ((loginIdCount ?? 0) > 0) {
    return NextResponse.json({ ok: false, error: "이미 사용 중인 아이디입니다." }, { status: 409 });
  }

  const { count: nicknameCount } = await admin
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .ilike("nickname", nickname);
  if ((nicknameCount ?? 0) > 0) {
    return NextResponse.json({ ok: false, error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    if (/already.*registered|email_exists|duplicate/i.test(createError?.message ?? "")) {
      return NextResponse.json({ ok: false, error: "이미 등록된 회사 이메일입니다." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "회원 등록에 실패했어요. 다시 시도해 주세요." }, { status: 500 });
  }

  const newUserId = created.user.id;
  const { error: profileError } = await admin
    .from("profiles")
    .update({ login_id: loginId, nickname, role, onboarding_completed: true, must_change_password: true })
    .eq("user_id", newUserId);

  if (profileError) {
    await admin.auth.admin.deleteUser(newUserId);
    console.error("[manage/users] profile provisioning 실패, auth user rollback", {
      actorId: actor.id,
      attemptedUserId: newUserId,
    });
    const friendly = /아이디|닉네임/.test(profileError.message) ? profileError.message : "회원 등록에 실패했어요. 다시 시도해 주세요.";
    return NextResponse.json({ ok: false, error: friendly }, { status: 500 });
  }

  console.log("[manage/users] 신규 회원 생성", { actorId: actor.id, createdUserId: newUserId, role });
  return NextResponse.json({ ok: true, nickname, loginId, role });
}
