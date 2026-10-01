"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppData } from "@/lib/app-data-context";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { calculateUserExp, countApprovedSightings, getLevel } from "@/lib/exp";
import { buildEncyclopedia } from "@/lib/encyclopedia";
import { ROLE_LABELS } from "@/lib/status";
import { validateLoginId } from "@/lib/auth/login-id";

export default function MyPage() {
  const router = useRouter();
  const { logout, changePassword } = useAuth();
  const { currentUser, sightings, birds, updateNickname, updateLoginId } = useAppData();
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthEmail(data.user?.email ?? null));
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const myExp = calculateUserExp(currentUser.id, sightings);
  const { level, currentExp, expToNextLevel } = getLevel(myExp);

  const sightingCount = countApprovedSightings(currentUser.id, sightings);
  const observedSpeciesCount = buildEncyclopedia(currentUser.id, sightings, birds).filter(
    (e) => e.unlocked
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col pb-8">
      <section>
        <p className="text-[34px] font-bold tracking-[-0.03em]">{currentUser.nickname}</p>
        <p className="mt-1.5 text-[15px] text-muted">{ROLE_LABELS[currentUser.role]}</p>

        <div className="mt-8">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-accent">Lv.{level}</span>
            <span className="text-muted">
              {currentExp} / {expToNextLevel} EXP
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(currentExp / expToNextLevel) * 100}%` }}
            />
          </div>
        </div>

        <p className="mt-6 text-[15px] text-muted">
          {observedSpeciesCount}종 발견 · 탐조 {sightingCount}회
        </p>
      </section>

      <section className="mt-14">
        <h2 className="mb-1 text-[19px] font-semibold">계정</h2>
        <NicknameRow nickname={currentUser.nickname} onSave={updateNickname} />
        <LoginIdRow loginId={currentUser.loginId} onSave={updateLoginId} />
        <PasswordRow onSave={changePassword} highlight={currentUser.mustChangePassword} />
        {authEmail && (
          <div className="flex min-h-[56px] items-center justify-between gap-4 border-b border-border py-3">
            <span className="w-20 shrink-0 text-sm text-muted">회사 이메일</span>
            <span className="flex-1 truncate text-[15px] font-medium">{authEmail}</span>
            <span className="shrink-0 text-xs text-success">인증 완료</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 py-3 text-left text-[15px] font-medium text-danger"
        >
          로그아웃
        </button>
      </section>
    </div>
  );
}

function NicknameRow({
  nickname,
  onSave,
}: {
  nickname: string;
  onSave: (nickname: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(nickname);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const result = await onSave(draft);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3">
      {editing && <span className="text-xs text-muted">닉네임</span>}
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={20}
            autoFocus
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[56px] items-center justify-between gap-4">
          <span className="w-20 shrink-0 text-sm text-muted">닉네임</span>
          <span className="flex-1 text-[15px] font-medium">{nickname}</span>
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 px-2 py-3 text-sm font-medium text-accent"
          >
            변경
          </button>
        </div>
      )}
    </div>
  );
}

function LoginIdRow({
  loginId,
  onSave,
}: {
  loginId: string;
  onSave: (loginId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(loginId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(loginId);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    const validation = validateLoginId(draft);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSaving(true);
    const result = await onSave(validation.value);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3">
      {editing && <span className="text-xs text-muted">아이디</span>}
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={20}
            autoFocus
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[56px] items-center justify-between gap-4">
          <span className="w-20 shrink-0 text-sm text-muted">아이디</span>
          <span className="flex-1 text-[15px] font-medium">{loginId}</span>
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 px-2 py-3 text-sm font-medium text-accent"
          >
            변경
          </button>
        </div>
      )}
    </div>
  );
}

function PasswordRow({
  onSave,
  highlight,
}: {
  onSave: (current: string, next: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  highlight?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startEdit = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setSuccess(false);
    setEditing(true);
  };

  const save = async () => {
    if (next !== confirm) {
      setError("새 비밀번호가 일치하지 않아요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onSave(current, next);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setSuccess(true);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 py-3">
      {editing && <span className="text-xs text-muted">비밀번호</span>}
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="현재 비밀번호"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="새 비밀번호 (8자 이상)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="새 비밀번호 확인"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={submitting || !current || !next || !confirm}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[56px] items-center justify-between gap-4">
          <span className="w-20 shrink-0 text-sm text-muted">비밀번호</span>
          <span className="flex-1 text-[15px] font-medium">••••••••</span>
          <button
            type="button"
            onClick={startEdit}
            className={`shrink-0 px-2 py-3 text-sm font-medium ${
              highlight ? "rounded-full bg-accent text-white" : "text-accent"
            }`}
          >
            변경
          </button>
        </div>
      )}
      {success && <p className="text-xs text-success">비밀번호가 변경되었습니다.</p>}
    </div>
  );
}
