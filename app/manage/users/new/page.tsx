"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import { useNewMemberDraft } from "@/lib/new-member-draft-context";
import { checkDuplicate, dupButtonLabel } from "@/lib/duplicate-check";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABELS } from "@/lib/status";
import type { UserRole } from "@/lib/types";

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
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
  const { draft, setDraft, clearDraft } = useNewMemberDraft();
  const { email, loginId, nickname, password, confirmPassword, role, loginIdDup, nicknameDup } = draft;
  const [showPassword, setShowPassword] = useState(false);
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
    clearDraft();
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
            className="flex-1 rounded-xl border border-border py-3 text-center text-sm font-medium text-muted transition-opacity active:scale-[0.98]"
          >
            회원 추가
          </Link>
          <Link
            href="/manage"
            className="flex-1 rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white transition-opacity active:scale-[0.98]"
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
            onChange={(e) => setDraft({ email: e.target.value })}
            placeholder="name@tanabe-pharma.com"
            autoComplete="off"
            className="h-12 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
          />
        </label>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">로그인 아이디</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={loginId}
              onChange={(e) => setDraft({ loginId: e.target.value, loginIdDup: "idle" })}
              autoComplete="off"
              className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
            />
            <button
              type="button"
              disabled={loginIdDup === "checking"}
              aria-busy={loginIdDup === "checking"}
              onClick={async () => {
                setDraft({ loginIdDup: "checking" });
                setDraft({ loginIdDup: await checkDuplicate("/api/manage/users/check-login-id", "loginId", loginId) });
              }}
              className="w-24 shrink-0 rounded-xl border border-border px-3 text-sm font-medium text-muted transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
            >
              {dupButtonLabel(loginIdDup)}
            </button>
          </div>
          {loginIdDup === "available" && <span className="text-xs text-success">사용할 수 있는 아이디예요.</span>}
          {loginIdDup === "taken" && <span className="text-xs text-danger">이미 사용 중인 아이디입니다.</span>}
          {loginIdDup === "error" && <span className="text-xs text-danger">확인하지 못했습니다. 다시 시도해 주세요.</span>}
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">닉네임</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setDraft({ nickname: e.target.value, nicknameDup: "idle" })}
              autoComplete="off"
              className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
            />
            <button
              type="button"
              disabled={nicknameDup === "checking"}
              aria-busy={nicknameDup === "checking"}
              onClick={async () => {
                setDraft({ nicknameDup: "checking" });
                setDraft({ nicknameDup: await checkDuplicate("/api/manage/users/check-nickname", "nickname", nickname) });
              }}
              className="w-24 shrink-0 rounded-xl border border-border px-3 text-sm font-medium text-muted transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
            >
              {dupButtonLabel(nicknameDup)}
            </button>
          </div>
          {nicknameDup === "available" && <span className="text-xs text-success">사용할 수 있는 닉네임이에요.</span>}
          {nicknameDup === "taken" && <span className="text-xs text-danger">이미 사용 중인 닉네임입니다.</span>}
          {nicknameDup === "error" && <span className="text-xs text-danger">확인하지 못했습니다. 다시 시도해 주세요.</span>}
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">초기 비밀번호</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setDraft({ password: e.target.value })}
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-16 text-[15px] outline-none focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-0 flex h-full min-w-11 items-center justify-center text-xs font-medium text-muted transition-transform duration-150 active:scale-[0.98]"
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
            onChange={(e) => setDraft({ confirmPassword: e.target.value })}
            autoComplete="new-password"
            className="h-12 rounded-xl border border-border bg-background px-4 text-[15px] outline-none focus-visible:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">역할</span>
          {canAssignAnyRole ? (
            <div className="relative">
              <select
                aria-label="역할"
                value={role}
                onChange={(e) => setDraft({ role: e.target.value as UserRole })}
                className="h-12 w-full appearance-none rounded-xl border border-border bg-background pl-4 pr-10 text-[15px] outline-none focus-visible:border-accent"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>
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
          aria-busy={submitting}
          className="mt-2 h-[50px] rounded-xl bg-accent text-[15px] font-semibold text-white shadow-elevated transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "등록 중…" : "회원 등록"}
        </button>
      </form>
    </div>
  );
}
