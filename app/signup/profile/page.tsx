"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { validateLoginId } from "@/lib/auth/login-id";
import { validateNickname } from "@/lib/auth/nickname";

type CheckState = "unchecked" | "checking" | "available" | "unavailable";

async function checkAvailability(path: string, field: string, value: string): Promise<CheckState> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) return "unchecked";
  return body.available ? "available" : "unavailable";
}

export default function SignUpProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const [loginId, setLoginId] = useState("");
  const [loginIdCheck, setLoginIdCheck] = useState<CheckState>("unchecked");
  const [loginIdError, setLoginIdError] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [nicknameCheck, setNicknameCheck] = useState<CheckState>("unchecked");
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runLoginIdCheck = async () => {
    const validation = validateLoginId(loginId);
    if (!validation.ok) {
      setLoginIdError(validation.error);
      return;
    }
    setLoginIdError(null);
    setLoginIdCheck("checking");
    const result = await checkAvailability("/api/onboarding/check-login-id", "loginId", validation.value);
    setLoginIdCheck(result);
    if (result === "unavailable") setLoginIdError("이미 사용 중인 아이디입니다.");
  };

  const runNicknameCheck = async () => {
    const validation = validateNickname(nickname);
    if (!validation.ok) {
      setNicknameError(validation.error);
      return;
    }
    setNicknameError(null);
    setNicknameCheck("checking");
    const result = await checkAvailability("/api/onboarding/check-nickname", "nickname", validation.value);
    setNicknameCheck(result);
    if (result === "unavailable") setNicknameError("이미 사용 중인 닉네임입니다.");
  };

  const passwordValid = password.length >= 8 && password === confirmPassword;
  const canSubmit =
    loginIdCheck === "available" && nicknameCheck === "available" && passwordValid && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setFormError(null);

    const supabase = createClient();
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      setSubmitting(false);
      setFormError("가입 정보를 저장하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      setFormError("가입 정보를 저장하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ login_id: loginId.trim(), nickname: nickname.trim(), onboarding_completed: true })
      .eq("user_id", user.id);
    setSubmitting(false);
    if (profileError) {
      setFormError(profileError.message || "가입 정보를 저장하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    router.replace("/");
  };

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col px-4 py-[6vh]">
      <div className="mb-8 text-center">
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-foreground">가입 정보 설정</h1>
        <p className="mt-1.5 text-[15px] text-muted">이메일 인증이 완료됐어요. 마지막 단계예요.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">아이디</span>
          <div className="flex gap-2">
            <input
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value);
                setLoginIdCheck("unchecked");
                setLoginIdError(null);
              }}
              className="h-12 flex-1 min-w-0 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={runLoginIdCheck}
              disabled={loginIdCheck === "checking"}
              className="h-12 shrink-0 rounded-xl border border-border px-3 text-[13px] font-medium text-accent disabled:opacity-50"
            >
              중복 확인
            </button>
          </div>
          {loginIdError && <span className="text-xs text-danger">{loginIdError}</span>}
          {!loginIdError && loginIdCheck === "available" && (
            <span className="text-xs text-success">✓ 사용 가능한 아이디입니다.</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">닉네임</span>
          <div className="flex gap-2">
            <input
              type="text"
              autoComplete="nickname"
              value={nickname}
              maxLength={12}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameCheck("unchecked");
                setNicknameError(null);
              }}
              className="h-12 flex-1 min-w-0 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={runNicknameCheck}
              disabled={nicknameCheck === "checking"}
              className="h-12 shrink-0 rounded-xl border border-border px-3 text-[13px] font-medium text-accent disabled:opacity-50"
            >
              중복 확인
            </button>
          </div>
          {nicknameError && <span className="text-xs text-danger">{nicknameError}</span>}
          {!nicknameError && nicknameCheck === "available" && (
            <span className="text-xs text-success">✓ 사용 가능한 닉네임입니다.</span>
          )}
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">비밀번호</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">비밀번호 확인</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
          {password && confirmPassword && !passwordValid && (
            <span className="text-xs text-danger">
              {password.length < 8 ? "비밀번호는 8자 이상이어야 해요." : "비밀번호가 일치하지 않아요."}
            </span>
          )}
        </label>

        {formError && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white shadow-elevated transition-opacity active:opacity-80 disabled:opacity-60 disabled:shadow-none"
        >
          {submitting ? "가입 중…" : "가입 완료"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          logout();
          router.replace("/signup");
        }}
        className="mt-8 text-center text-xs text-muted"
      >
        다른 이메일로 다시 시작하기
      </button>
    </div>
  );
}
