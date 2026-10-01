"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppData } from "@/lib/app-data-context";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { validatePassword } from "@/lib/auth/password";

interface ResetRequest {
  id: string;
  createdAt: string;
  userId: string;
  nickname: string;
  loginId: string;
}

export default function RecoveryRequestsPage() {
  const { currentUser } = useAppData();
  const [supabase] = useState(() => createClient());
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("password_reset_requests")
      .select("id, created_at, user_id, profiles(nickname, login_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setRequests(
      ((data ?? []) as unknown as {
        id: string;
        created_at: string;
        user_id: string;
        profiles: { nickname: string; login_id: string } | null;
      }[]).map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        userId: r.user_id,
        nickname: r.profiles?.nickname ?? "(알 수 없음)",
        loginId: r.profiles?.login_id ?? "-",
      }))
    );
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (currentUser.role === "admin") void load();
  }, [currentUser.role, load]);

  if (currentUser.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        관리자만 접근할 수 있는 화면입니다.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHeader eyebrow="관리" title="비밀번호 재설정 요청" subtitle={`대기 중 ${requests.length}건`} />

      {isLoading ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          대기 중인 요청이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.nickname}</p>
                  <p className="truncate text-xs text-muted">
                    @{r.loginId} · {new Date(r.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                {processingId !== r.id && (
                  <button
                    type="button"
                    onClick={() => setProcessingId(r.id)}
                    className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-background"
                  >
                    임시 비밀번호 설정
                  </button>
                )}
              </div>
              {processingId === r.id && (
                <ResetForm
                  userId={r.userId}
                  resetRequestId={r.id}
                  onDone={() => {
                    setProcessingId(null);
                    void load();
                  }}
                  onCancel={() => setProcessingId(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResetForm({
  userId,
  resetRequestId,
  onDone,
  onCancel,
}: {
  userId: string;
  resetRequestId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { resetUserPassword } = useAppData();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const save = async () => {
    const validation = validatePassword(password);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await resetUserPassword(userId, password, resetRequestId);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  };

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="새 임시 비밀번호 (8자 이상)"
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="확인"
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={submitting || !password || !confirm}
          className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {submitting ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted"
        >
          취소
        </button>
      </div>
    </div>
  );
}
