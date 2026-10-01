"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABELS } from "@/lib/status";
import type { UserRole } from "@/lib/types";

type DupState = "idle" | "checking" | "available" | "taken";

async function checkDuplicate(endpoint: string, key: "loginId" | "nickname", value: string): Promise<DupState> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [key]: value }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) return "idle";
  return body.available ? "available" : "taken";
}

export default function NewUserPage() {
  const { currentUser } = useAppData();

  if (currentUser.role !== "leader" && currentUser.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        회장 또는 관리자만 접근할 수 있는 화면입니다.
      </div>
    );
  }

  return <NewUserForm canAssignAnyRole={currentUser.role === "admin"} />;
}

function NewUserForm({ canAssignAnyRole }: { canAssignAnyRole: boolean }) {
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("member");
  const [loginIdDup, setLoginIdDup] = useState<DupState>("idle");
  const [nicknameDup, setNicknameDup] = useState<DupState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ nickname: string; loginId: string; role: UserRole } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (password !== confirmPassword) {
      setError("초기 비밀번호가 일치하지 않아요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/manage/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, loginId, nickname, temporaryPassword: password, role }),
    });
    const body = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok || !body?.ok) {
      setError(body?.error ?? "회원 등록에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    setCreated({ nickname: body.nickname, loginId: body.loginId, role: body.role });
  };

  if (created) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6">
        <PageHeader title="회원 등록이 완료되었습니다" />
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between">
              <dt className="text-muted">닉네임</dt>
              <dd className="font-medium">{created.nickname}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">아이디</dt>
              <dd className="font-medium">{created.loginId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">역할</dt>
              <dd className="font-medium">{ROLE_LABELS[created.role]}</dd>
            </div>
          </dl>
        </div>
        <p className="text-sm text-muted">초기 아이디와 비밀번호를 회원에게 안전하게 전달해 주세요.</p>
        <div className="flex gap-2">
          <Link
            href="/manage/users/new"
            onClick={() => setCreated(null)}
            className="flex-1 rounded-xl border border-border py-3 text-center text-sm font-medium text-muted"
          >
            회원 추가
          </Link>
          <Link
            href="/manage"
            className="flex-1 rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white"
          >
            관리로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6">
      <PageHeader title="새 회원 추가" />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">회사 이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@tanabe-pharma.com"
            className="h-12 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
          />
        </label>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">로그인 아이디</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value);
                setLoginIdDup("idle");
              }}
              className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={async () => {
                setLoginIdDup("checking");
                setLoginIdDup(await checkDuplicate("/api/onboarding/check-login-id", "loginId", loginId));
              }}
              className="shrink-0 rounded-xl border border-border px-4 text-sm font-medium text-muted"
            >
              중복 확인
            </button>
          </div>
          {loginIdDup === "available" && <span className="text-xs text-success">사용할 수 있는 아이디예요.</span>}
          {loginIdDup === "taken" && <span className="text-xs text-danger">이미 사용 중인 아이디예요.</span>}
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">닉네임</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameDup("idle");
              }}
              className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={async () => {
                setNicknameDup("checking");
                setNicknameDup(await checkDuplicate("/api/onboarding/check-nickname", "nickname", nickname));
              }}
              className="shrink-0 rounded-xl border border-border px-4 text-sm font-medium text-muted"
            >
              중복 확인
            </button>
          </div>
          {nicknameDup === "available" && <span className="text-xs text-success">사용할 수 있는 닉네임이에요.</span>}
          {nicknameDup === "taken" && <span className="text-xs text-danger">이미 사용 중인 닉네임이에요.</span>}
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">초기 비밀번호</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-16 text-[15px] outline-none focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-0 flex h-full min-w-11 items-center justify-center text-xs font-medium text-muted"
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">초기 비밀번호 확인</span>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">역할</span>
          {canAssignAnyRole ? (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-12 rounded-xl border border-border bg-background px-4 text-[15px]"
            >
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          ) : (
            <p className="h-12 rounded-xl border border-border bg-surface-secondary px-4 text-[15px] leading-[48px] text-muted">
              {ROLE_LABELS.member}
            </p>
          )}
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white shadow-elevated transition-opacity active:opacity-80 disabled:opacity-60"
        >
          {submitting ? "등록 중…" : "회원 등록"}
        </button>
      </form>
    </div>
  );
}
