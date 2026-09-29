"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-provider";
import { isCorporateEmail } from "@/lib/auth/corporate-email";

type Step = "email" | "otp";

export default function SignUpPage() {
  const router = useRouter();
  const { requestEmailOtp, verifyEmailOtp } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!isCorporateEmail(email)) {
      setEmailError("@tanabe-pharma.com 회사 이메일만 가입할 수 있습니다.");
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    const result = await requestEmailOtp(email);
    setSubmitting(false);
    if (!result.ok) {
      setEmailError(result.error);
      return;
    }
    setStep("otp");
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!token.trim()) {
      setOtpError("인증번호를 입력해 주세요.");
      return;
    }
    setOtpError(null);
    setSubmitting(true);
    const result = await verifyEmailOtp(email, token);
    setSubmitting(false);
    if (!result.ok) {
      setOtpError(result.error);
      return;
    }
    router.replace("/signup/profile");
  };

  const handleResend = async () => {
    setResendMessage(null);
    setOtpError(null);
    const result = await requestEmailOtp(email);
    setResendMessage(result.ok ? "인증번호를 다시 보냈어요." : result.error);
  };

  if (step === "otp") {
    return (
      <div className="mx-auto flex w-full max-w-[400px] flex-col px-4 py-[6vh]">
        <div className="mb-8 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-foreground">이메일 인증</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            {email}로 인증번호를 보냈어요.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">인증번호</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-invalid={Boolean(otpError)}
              className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] tracking-[0.2em] outline-none transition-colors focus-visible:border-accent"
            />
            {otpError && <span className="text-xs text-danger">{otpError}</span>}
          </label>

          {resendMessage && <p className="text-xs text-muted">{resendMessage}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white shadow-elevated transition-opacity active:opacity-80 disabled:opacity-60 disabled:shadow-none"
          >
            {submitting ? "확인 중…" : "인증하기"}
          </button>
        </form>

        <div className="mt-6 flex justify-center gap-4 text-xs">
          <button type="button" onClick={handleResend} className="font-medium text-accent">
            인증번호 다시 받기
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setToken("");
              setOtpError(null);
              setResendMessage(null);
            }}
            className="font-medium text-muted"
          >
            이메일 수정
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col px-4 py-[6vh]">
      <div className="mb-8 text-center">
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-foreground">조동아리 가입</h1>
        <p className="mt-1.5 text-[15px] text-muted">회사 이메일로 구성원 인증을 시작해요.</p>
      </div>

      <form onSubmit={handleRequestOtp} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">회사 이메일</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(emailError)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition-colors focus-visible:border-accent"
          />
          {emailError && <span className="text-xs text-danger">{emailError}</span>}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white shadow-elevated transition-opacity active:opacity-80 disabled:opacity-60 disabled:shadow-none"
        >
          {submitting ? "발송 중…" : "인증번호 받기"}
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
