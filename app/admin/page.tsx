"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import { ROLE_LABELS } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { validatePassword } from "@/lib/auth/password";
import type { UserRole, UserStatus } from "@/lib/types";

const ROLE_OPTIONS: UserRole[] = ["member", "leader", "admin"];

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
      className="h-4 w-4 shrink-0 text-muted"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-accent"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

// native <select>는 macOS에서 popup font/크기를 스타일링할 수 없어 role 3개짜리 custom listbox로 대체한다.
function RoleSelect({
  value,
  label,
  disabled,
  onChange,
}: {
  value: UserRole;
  label: string;
  disabled?: boolean;
  onChange: (role: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block min-w-[96px]">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm transition-opacity disabled:opacity-60"
      >
        {ROLE_LABELS[value]}
        <ChevronDownIcon />
      </button>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-full overflow-hidden rounded-xl border border-border bg-white py-1 shadow-elevated"
        >
          {ROLE_OPTIONS.map((role) => (
            <li key={role}>
              <button
                type="button"
                role="option"
                aria-selected={role === value}
                onClick={() => {
                  setOpen(false);
                  if (role !== value) onChange(role);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-secondary"
              >
                {ROLE_LABELS[role]}
                {role === value && <CheckIcon />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { currentUser, users, updateUserRole, updateUserStatus } = useAppData();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  if (currentUser.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        관리자만 접근할 수 있는 화면입니다.
      </div>
    );
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setUpdatingRoleId(userId);
    const result = await updateUserRole(userId, role);
    setUpdatingRoleId(null);
    setErrors((prev) => ({ ...prev, [userId]: result.ok ? "" : "역할을 변경하지 못했습니다." }));
  };

  const handleStatusToggle = async (userId: string, nextStatus: UserStatus) => {
    const result = await updateUserStatus(userId, nextStatus);
    setErrors((prev) => ({ ...prev, [userId]: result.ok ? "" : result.error }));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 lg:max-w-4xl">
      <PageHeader
        eyebrow="관리자"
        title="사용자 관리"
        subtitle={`총 ${users.length}명`}
        action={
          <Link
            href="/manage/users/new"
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            새 회원 추가
          </Link>
        }
      />

      <ul className="flex flex-col gap-3">
        {users.map((u) => (
          <li key={u.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.nickname}</p>
                <p className="truncate text-xs text-muted">@{u.loginId}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {u.mustChangePassword && (
                  <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                    초기 비밀번호
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-surface-secondary text-muted"
                  }`}
                >
                  {u.status === "active" ? "활성" : "비활성"}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RoleSelect
                value={u.role}
                label={`${u.nickname} 역할`}
                disabled={updatingRoleId === u.id}
                onChange={(role) => handleRoleChange(u.id, role)}
              />

              <button
                type="button"
                onClick={() => setResettingId(resettingId === u.id ? null : u.id)}
                className="h-11 rounded-full border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-background"
              >
                임시 비밀번호 재설정
              </button>

              <button
                type="button"
                onClick={() => handleStatusToggle(u.id, u.status === "active" ? "inactive" : "active")}
                className="ml-auto h-11 rounded-full border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-background"
              >
                {u.status === "active" ? "비활성화" : "활성화"}
              </button>
            </div>

            {resettingId === u.id && <ResetPasswordRow userId={u.id} onDone={() => setResettingId(null)} />}

            {errors[u.id] && <p className="mt-2 text-xs text-danger">{errors[u.id]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResetPasswordRow({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { resetUserPassword } = useAppData();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const save = async () => {
    const validation = validatePassword(password);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await resetUserPassword(userId, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setPassword("");
  };

  if (success) {
    return <p className="mt-2 text-xs text-success">임시 비밀번호가 설정되었습니다.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="새 임시 비밀번호 (8자 이상)"
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={submitting || !password}
          className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {submitting ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted"
        >
          취소
        </button>
      </div>
    </div>
  );
}
