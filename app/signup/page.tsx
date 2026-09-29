"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-provider";
import { isCorporateEmail } from "@/lib/auth/corporate-email";
import { validateLoginId } from "@/lib/auth/login-id";

type PageState = "idle" | "submitting" | "verification-sent";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<PageState>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "submitting") return;

    const nextFieldError: Record<string, string> = {};
    if (!isCorporateEmail(email)) {
      nextFieldError.email = "@tanabe-pharma.com 회사 이메일만 가입할 수 있습니다.";
    }
    const loginIdValidation = validateLoginId(loginId);
    if (!loginIdValidation.ok) nextFieldError.loginId = loginIdValidation.error;
    if (!nickname.trim()) nextFieldError.nickname = "닉네임을 입력해 주세요.";
    if (password.length < 8) nextFieldError.password = "비밀번호는 8자 이상이어야 해요.";
    if (password !== confirmPassword) nextFieldError.confirmPassword = "비밀번호가 일치하지 않아요.";
    setFieldError(nextFieldError);
    if (Object.keys(nextFieldError).length > 0) return;

    setFormError(null);
    setState("submitting");
    const result = await signUp(email, loginId, nickname, password);
    if (!result.ok) {
      setFormError(result.error);
      setState("idle");
      return;
    }
    setState("verification-sent");
  };

  if (state === "verification-sent") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[400px] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">회사 이메일을 확인해 주세요</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          입력하신 회사 이메일로 인증 메일을 보냈습니다.
          <br />
          메일의 인증 링크를 눌러 가입을 완료해 주세요.
        </p>
        <Link href="/login" className="mt-4 text-sm font-medium text-accent">
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col px-4 py-[6vh]">
      <div className="mb-8 text-center">
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-foreground">조동아리 가입</h1>
        <p className="mt-1.5 text-[15px] text-muted">회사 구성원 인증 후 이용할 수 있어요.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">회사 이메일</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldError.email)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
          {fieldError.email && <span className="text-xs text-danger">{fieldError.email}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">아이디</span>
          <input
            type="text"
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            aria-invalid={Boolean(fieldError.loginId)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
          {fieldError.loginId && <span className="text-xs text-danger">{fieldError.loginId}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">닉네임</span>
          <input
            type="text"
            autoComplete="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            aria-invalid={Boolean(fieldError.nickname)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
          {fieldError.nickname && <span className="text-xs text-danger">{fieldError.nickname}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">비밀번호</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldError.password)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
          {fieldError.password && <span className="text-xs text-danger">{fieldError.password}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">비밀번호 확인</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(fieldError.confirmPassword)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
          {fieldError.confirmPassword && <span className="text-xs text-danger">{fieldError.confirmPassword}</span>}
        </label>

        {formError && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white shadow-elevated transition-opacity active:opacity-80 disabled:opacity-60 disabled:shadow-none"
        >
          {state === "submitting" ? "가입 중…" : "가입하고 이메일 인증하기"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-muted">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-accent">
          로그인
        </Link>
      </p>
    </div>
  );
}
