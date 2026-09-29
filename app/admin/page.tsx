"use client";

import { useState } from "react";
import { useAppData } from "@/lib/app-data-context";
import { ROLE_LABELS } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import type { UserRole, UserStatus } from "@/lib/types";

export default function AdminPage() {
  const { currentUser, users, updateUserRole, updateUserStatus } = useAppData();
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (currentUser.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        관리자만 접근할 수 있는 화면입니다.
      </div>
    );
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const result = await updateUserRole(userId, role);
    setErrors((prev) => ({ ...prev, [userId]: result.ok ? "" : result.error }));
  };

  const handleStatusToggle = async (userId: string, nextStatus: UserStatus) => {
    const result = await updateUserStatus(userId, nextStatus);
    setErrors((prev) => ({ ...prev, [userId]: result.ok ? "" : result.error }));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 lg:max-w-4xl">
      <PageHeader eyebrow="관리자" title="사용자 관리" subtitle={`총 ${users.length}명`} />

      <ul className="flex flex-col gap-3">
        {users.map((u) => (
          <li key={u.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.nickname}</p>
                <p className="truncate text-xs text-muted">@{u.loginId}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-surface-secondary text-muted"
                }`}
              >
                {u.status === "active" ? "활성" : "비활성"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`role-${u.id}`}>
                {u.nickname} 역할
              </label>
              <select
                id={`role-${u.id}`}
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleStatusToggle(u.id, u.status === "active" ? "inactive" : "active")}
                className="ml-auto h-11 rounded-full border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-background"
              >
                {u.status === "active" ? "비활성화" : "활성화"}
              </button>
            </div>

            {errors[u.id] && <p className="mt-2 text-xs text-danger">{errors[u.id]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
