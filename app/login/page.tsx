"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-provider";

export default function LoginPage() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<{ loginId?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextFieldError: typeof fieldError = {};
    if (!loginId.trim()) nextFieldError.loginId = "아이디를 입력해 주세요.";
    if (!password) nextFieldError.password = "비밀번호를 입력해 주세요.";
    setFieldError(nextFieldError);
    if (nextFieldError.loginId || nextFieldError.password) return;

    setFormError(null);
    setSubmitting(true);
    const result = await login(loginId, password);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    // 서버가 발급한 세션 cookie를 client가 다시 읽도록 전체 새로고침한다.
    window.location.href = "/";
  };

  return (
    <div className="-mx-4 -mt-6 min-h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-10 lg:-mt-10 lg:grid lg:min-h-screen lg:grid-cols-[45%_55%]">
      <div
        className="hidden flex-col justify-center overflow-hidden bg-surface-blue px-16 py-16 lg:flex"
        style={{
          backgroundImage: "radial-gradient(circle at 70% 35%, rgba(0,113,227,0.08), transparent 50%)",
        }}
      >
        <h1 className="text-[48px] font-extrabold leading-[1.05] tracking-[-0.04em] text-foreground">조동아리</h1>
        <p className="mt-3 max-w-xs text-[19px] leading-relaxed text-muted">
          우리끼리 기록하는
          <br />
          탐조 생활.
        </p>
        <Image
          src="/img/jodongari-illustration.png"
          alt=""
          width={1210}
          height={1122}
          priority
          sizes="30vw"
          className="mt-10 w-[60%] max-w-[380px] self-end"
        />
      </div>

      <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 pt-[8vh] sm:px-6 lg:min-h-screen lg:items-center lg:px-16 lg:pt-0">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center lg:hidden">
            <Image
              src="/img/jodongari-illustration.png"
              alt=""
              width={1210}
              height={1122}
              priority
              sizes="60vw"
              className="mx-auto mb-5 w-[60%] max-w-[220px]"
            />
            <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-foreground">조동아리</h1>
            <p className="mt-2 text-[15px] text-muted">우리끼리 기록하는 탐조 생활</p>
          </div>

          <div className="mb-6 hidden text-center lg:block">
            <h2 className="text-[24px] font-bold tracking-[-0.02em] text-foreground">로그인</h2>
            <p className="mt-1 text-[15px] text-muted">조동아리 멤버 계정으로 계속하세요.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
              <span className="font-medium">비밀번호</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(fieldError.password)}
                  className="h-12 w-full rounded-xl border border-border bg-surface px-4 pr-16 text-[15px] outline-none transition-colors focus-visible:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="absolute right-2 top-0 flex h-full min-w-11 items-center justify-center text-xs font-medium text-muted"
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
              {fieldError.password && <span className="text-xs text-danger">{fieldError.password}</span>}
            </label>

            {formError && (
              <div role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                <p>{formError}</p>
              </div>
            )}

            <Link href="/account-help" className="text-right text-xs font-medium text-accent">
              아이디 또는 비밀번호를 잊으셨나요?
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white shadow-elevated transition-opacity active:opacity-80 disabled:opacity-60 disabled:shadow-none"
            >
              {submitting ? "로그인 중…" : "로그인"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            처음이신가요?{" "}
            <Link href="/signup" className="font-medium text-accent">
              가입 안내 보기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
