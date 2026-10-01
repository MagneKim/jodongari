"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "./supabase/client";
import { useAuth } from "./supabase/auth-provider";
import { mapProfileRow, mapSightingRow, type RawSightingRow } from "./supabase/mappers";
import { validateLoginId } from "./auth/login-id";
import type { BirdSpecies, NewSightingInput, Sighting, User, UserRole, UserStatus } from "./types";
import birdsData from "@/data/birds.json";

const BIRDS = birdsData as BirdSpecies[];
const NICKNAME_MAX_LENGTH = 20;
const SIGNED_URL_TTL_SECONDS = 3600;
const EMPTY_USER: User = {
  id: "",
  loginId: "",
  nickname: "",
  role: "member",
  status: "active",
  mustChangePassword: false,
};

const SIGHTING_SELECT = `id, author_id, observed_date, place, note, status, leader_note, created_at,
  sighting_participants(user_id),
  sighting_species(species_id),
  sighting_media(id, type, storage_path, mime_type, original_name, size_bytes, sort_order),
  sighting_likes(user_id),
  sighting_comments(id, author_id, body, created_at)`;

type ActionResult = { ok: true } | { ok: false; error: string };

interface AppDataContextValue {
  currentUser: User;
  users: User[];
  birds: BirdSpecies[];
  sightings: Sighting[];
  submitSighting: (input: Omit<NewSightingInput, "authorId">) => Promise<ActionResult>;
  approveSighting: (sightingId: string, speciesIds: string[], leaderNote?: string) => Promise<ActionResult>;
  toggleLike: (sightingId: string) => Promise<void>;
  addComment: (sightingId: string, text: string) => Promise<ActionResult>;
  updateNickname: (nickname: string) => Promise<ActionResult>;
  updateLoginId: (loginId: string) => Promise<ActionResult>;
  updateUserRole: (userId: string, role: UserRole) => Promise<ActionResult>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<ActionResult>;
  resetUserPassword: (userId: string, temporaryPassword: string) => Promise<ActionResult>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [supabase] = useState(() => createClient());
  const [users, setUsers] = useState<User[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSightings = useCallback(async () => {
    const { data, error } = await supabase
      .from("sightings")
      .select(SIGHTING_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as unknown as RawSightingRow[];
    const paths = Array.from(new Set(rows.flatMap((r) => r.sighting_media.map((m) => m.storage_path))));
    const signedUrlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("sighting-media")
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      for (const s of signed ?? []) {
        if (s.signedUrl && s.path) signedUrlByPath.set(s.path, s.signedUrl);
      }
    }
    setSightings(rows.map((r) => mapSightingRow(r, signedUrlByPath)));
  }, [supabase]);

  const loadUsers = useCallback(async () => {
    // onboarding 미완료(회사 이메일만 인증하고 아이디/닉네임/비밀번호를 아직 설정하지 않은) shell 계정은
    // 멤버 목록/참여자 선택기 등 일반 사용자 목록에 노출하지 않는다.
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, login_id, nickname, role, status, must_change_password")
      .eq("onboarding_completed", true);
    if (error) throw error;
    setUsers((data ?? []).map(mapProfileRow));
  }, [supabase]);

  useEffect(() => {
    if (!authUser) {
      // 로그아웃 시 이전 세션의 데이터가 남아있지 않도록 정리한다 (external auth state 동기화, 파생 업데이트 아님).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers([]);
      setSightings([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    Promise.all([loadUsers(), loadSightings()])
      .catch(() => {
        if (!cancelled) setLoadError("데이터를 불러오지 못했어요. 다시 시도해 주세요.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authUser, loadUsers, loadSightings]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === authUser?.id) ?? EMPTY_USER,
    [users, authUser]
  );

  const submitSighting: AppDataContextValue["submitSighting"] = async (input) => {
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    const { data: inserted, error: insertError } = await supabase
      .from("sightings")
      .insert({
        author_id: authUser.id,
        observed_date: input.date,
        place: input.location,
        note: input.memo,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      return { ok: false, error: "탐조 기록 저장에 실패했어요. 다시 시도해 주세요." };
    }
    const sightingId = inserted.id;
    const rollback = () => supabase.from("sightings").delete().eq("id", sightingId);

    const participantIds = input.participantUserIds.filter((id) => id !== authUser.id);
    if (participantIds.length > 0) {
      const { error } = await supabase
        .from("sighting_participants")
        .insert(participantIds.map((user_id) => ({ sighting_id: sightingId, user_id })));
      if (error) {
        await rollback();
        return { ok: false, error: "함께한 멤버 저장에 실패했어요. 다시 시도해 주세요." };
      }
    }

    if (input.speciesIds.length > 0) {
      const { error } = await supabase
        .from("sighting_species")
        .insert(input.speciesIds.map((species_id) => ({ sighting_id: sightingId, species_id })));
      if (error) {
        await rollback();
        return { ok: false, error: "종 정보 저장에 실패했어요. 다시 시도해 주세요." };
      }
    }

    let mediaFailed = false;
    for (let i = 0; i < input.media.length; i++) {
      const item = input.media[i];
      if (!item.blob) continue;
      const storagePath = `${authUser.id}/${sightingId}/${crypto.randomUUID()}-${safeFileName(item.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("sighting-media")
        .upload(storagePath, item.blob, { contentType: item.mimeType });
      if (uploadError) {
        mediaFailed = true;
        continue;
      }
      const { error: mediaRowError } = await supabase.from("sighting_media").insert({
        sighting_id: sightingId,
        type: item.type,
        storage_path: storagePath,
        mime_type: item.mimeType,
        original_name: item.name,
        size_bytes: item.size,
        sort_order: i,
      });
      if (mediaRowError) mediaFailed = true;
    }

    await loadSightings();
    return mediaFailed
      ? { ok: false, error: "기록은 저장됐지만 일부 미디어 업로드에 실패했어요." }
      : { ok: true };
  };

  const approveSighting: AppDataContextValue["approveSighting"] = async (sightingId, speciesIds, leaderNote) => {
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    const { error: updateError } = await supabase
      .from("sightings")
      .update({
        status: "approved",
        leader_note: leaderNote?.trim() || null,
        approved_at: new Date().toISOString(),
        approved_by: authUser.id,
      })
      .eq("id", sightingId);
    if (updateError) return { ok: false, error: "승인 처리에 실패했어요. 다시 시도해 주세요." };

    const { error: deleteError } = await supabase.from("sighting_species").delete().eq("sighting_id", sightingId);
    if (deleteError) return { ok: false, error: "종 정보 갱신에 실패했어요. 다시 시도해 주세요." };

    if (speciesIds.length > 0) {
      const { error: speciesInsertError } = await supabase
        .from("sighting_species")
        .insert(speciesIds.map((species_id) => ({ sighting_id: sightingId, species_id })));
      if (speciesInsertError) return { ok: false, error: "종 정보 갱신에 실패했어요. 다시 시도해 주세요." };
    }

    await loadSightings();
    return { ok: true };
  };

  const toggleLike: AppDataContextValue["toggleLike"] = async (sightingId) => {
    if (!authUser) return;
    const uid = authUser.id;
    const target = sightings.find((s) => s.id === sightingId);
    const liked = target?.likedBy.includes(uid) ?? false;

    setSightings((prev) =>
      prev.map((s) =>
        s.id === sightingId
          ? { ...s, likedBy: liked ? s.likedBy.filter((id) => id !== uid) : [...s.likedBy, uid] }
          : s
      )
    );

    const { error } = liked
      ? await supabase.from("sighting_likes").delete().eq("sighting_id", sightingId).eq("user_id", uid)
      : await supabase.from("sighting_likes").insert({ sighting_id: sightingId, user_id: uid });

    if (error) {
      setSightings((prev) =>
        prev.map((s) =>
          s.id === sightingId
            ? { ...s, likedBy: liked ? [...s.likedBy, uid] : s.likedBy.filter((id) => id !== uid) }
            : s
        )
      );
    }
  };

  const addComment: AppDataContextValue["addComment"] = async (sightingId, text) => {
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, error: "댓글을 입력해 주세요." };

    const { data, error } = await supabase
      .from("sighting_comments")
      .insert({ sighting_id: sightingId, author_id: authUser.id, body: trimmed })
      .select("id, created_at")
      .single();
    if (error || !data) return { ok: false, error: "댓글 등록에 실패했어요. 다시 시도해 주세요." };

    setSightings((prev) =>
      prev.map((s) =>
        s.id === sightingId
          ? {
              ...s,
              comments: [
                ...s.comments,
                { id: data.id, authorId: authUser.id, text: trimmed, createdAt: data.created_at },
              ],
            }
          : s
      )
    );
    return { ok: true };
  };

  const updateNickname: AppDataContextValue["updateNickname"] = async (nickname) => {
    const trimmed = nickname.trim();
    if (!trimmed) return { ok: false, error: "닉네임을 입력해 주세요." };
    if (trimmed.length > NICKNAME_MAX_LENGTH) {
      return { ok: false, error: `닉네임은 ${NICKNAME_MAX_LENGTH}자 이내로 입력해 주세요.` };
    }
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    const { error } = await supabase.from("profiles").update({ nickname: trimmed }).eq("user_id", authUser.id);
    if (error) return { ok: false, error: "닉네임 변경에 실패했어요. 다시 시도해 주세요." };

    setUsers((prev) => prev.map((u) => (u.id === authUser.id ? { ...u, nickname: trimmed } : u)));
    return { ok: true };
  };

  const updateLoginId: AppDataContextValue["updateLoginId"] = async (loginId) => {
    const validation = validateLoginId(loginId);
    if (!validation.ok) return { ok: false, error: validation.error };
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    const { error } = await supabase.from("profiles").update({ login_id: validation.value }).eq("user_id", authUser.id);
    if (error) return { ok: false, error: error.message || "아이디 변경에 실패했어요." };

    setUsers((prev) => prev.map((u) => (u.id === authUser.id ? { ...u, loginId: validation.value } : u)));
    return { ok: true };
  };

  const updateUserRole: AppDataContextValue["updateUserRole"] = async (userId, role) => {
    const { error } = await supabase.from("profiles").update({ role }).eq("user_id", userId);
    if (error) return { ok: false, error: error.message || "역할 변경에 실패했어요." };
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    return { ok: true };
  };

  const updateUserStatus: AppDataContextValue["updateUserStatus"] = async (userId, status) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
    if (error) return { ok: false, error: error.message || "상태 변경에 실패했어요." };
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    return { ok: true };
  };

  const resetUserPassword: AppDataContextValue["resetUserPassword"] = async (userId, temporaryPassword) => {
    const res = await fetch(`/api/manage/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temporaryPassword }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) return { ok: false, error: body?.error ?? "임시 비밀번호 재설정에 실패했어요." };
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, mustChangePassword: true } : u)));
    return { ok: true };
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center text-sm text-muted">불러오는 중…</div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto mt-10 flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const value: AppDataContextValue = {
    currentUser,
    users,
    birds: BIRDS,
    sightings,
    submitSighting,
    approveSighting,
    toggleLike,
    addComment,
    updateNickname,
    updateLoginId,
    updateUserRole,
    updateUserStatus,
    resetUserPassword,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
