"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Tab = "find-id" | "reset-password";

const NETWORK_ERROR = "요청을 처리하지 못했습니다. 다시 시도해 주세요.";

export default function AccountHelpPage() {
  const [tab, setTab] = useState<Tab>("find-id");

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col px-4 py-[6vh]">
      <h1 className="text-center text-[24px] font-bold tracking-[-0.02em] text-foreground">계정 찾기</h1>

      <div className="mt-6 flex rounded-xl bg-surface-secondary p-1">
        <TabButton active={tab === "find-id"} onClick={() => setTab("find-id")}>
          아이디 찾기
        </TabButton>
        <TabButton active={tab === "reset-password"} onClick={() => setTab("reset-password")}>
          비밀번호 재설정
        </TabButton>
      </div>

      <div className="mt-6">{tab === "find-id" ? <FindLoginIdForm /> : <PasswordResetRequestForm />}</div>

      <Link href="/login" className="mt-8 text-center text-sm font-medium text-accent">
        로그인으로 돌아가기
      </Link>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
        active ? "bg-surface text-foreground shadow-sm" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function FindLoginIdForm() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginId, setLoginId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setLoginId(null);
    try {
      const res = await fetch("/api/account/find-login-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setError(body?.error ?? NETWORK_ERROR);
        return;
      }
      setLoginId(body.loginId);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  if (loginId) {
    return (
      <div className="rounded-xl bg-surface-secondary px-4 py-6 text-center text-[15px]">
        회원님의 아이디는 <span className="font-semibold text-accent">{loginId}</span> 입니다.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">회사 이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none focus-visible:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">닉네임</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none focus-visible:border-accent"
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !email || !nickname}
        className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "확인 중…" : "아이디 확인"}
      </button>
    </form>
  );
}

function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account/password-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setError(body?.error ?? NETWORK_ERROR);
        return;
      }
      setMessage(body.message ?? "비밀번호 재설정 요청을 보냈습니다.");
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  if (message) {
    return <div className="rounded-xl bg-surface-secondary px-4 py-6 text-center text-[15px] leading-relaxed">{message}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">회사 이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none focus-visible:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">닉네임</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none focus-visible:border-accent"
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !email || !nickname}
        className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "요청 중…" : "재설정 요청"}
      </button>
    </form>
  );
}
