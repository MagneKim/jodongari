"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "./supabase/client";
import { useAuth } from "./supabase/auth-provider";
import { mapProfileRow, mapSightingRow, type RawSightingRow } from "./supabase/mappers";
import { validateLoginId } from "./auth/login-id";
import { validateNickname } from "./auth/nickname";
import type { BirdSpecies, NewSightingInput, Sighting, User, UserRole, UserStatus } from "./types";
import birdsData from "@/data/birds.json";

const BIRDS = birdsData as BirdSpecies[];
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
  rejectSighting: (sightingId: string, leaderNote: string) => Promise<ActionResult>;
  resubmitSighting: (sightingId: string, input: Omit<NewSightingInput, "authorId">) => Promise<ActionResult>;
  deleteSighting: (sightingId: string) => Promise<ActionResult>;
  toggleLike: (sightingId: string) => Promise<void>;
  addComment: (sightingId: string, text: string) => Promise<ActionResult>;
  updateNickname: (nickname: string) => Promise<ActionResult>;
  updateLoginId: (loginId: string) => Promise<ActionResult>;
  updateUserRole: (userId: string, role: UserRole) => Promise<ActionResult>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<ActionResult>;
  resetUserPassword: (userId: string, temporaryPassword: string, resetRequestId?: string) => Promise<ActionResult>;
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

  // pending → revision. 반려 사유(leaderNote)는 필수 — 기존 approved 기록에는 적용하지 않는다(status='pending' 가드).
  const rejectSighting: AppDataContextValue["rejectSighting"] = async (sightingId, leaderNote) => {
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };
    const trimmed = leaderNote.trim();
    if (!trimmed) return { ok: false, error: "반려 사유를 입력해 주세요." };

    const { error } = await supabase
      .from("sightings")
      .update({ status: "revision", leader_note: trimmed })
      .eq("id", sightingId)
      .eq("status", "pending");
    if (error) return { ok: false, error: "반려 처리에 실패했어요. 다시 시도해 주세요." };

    await loadSightings();
    return { ok: true };
  };

  // revision 상태 작성자의 수정 재제출. participants/species는 전체 교체, leaderNote는 새 review cycle을 위해 비운다.
  const resubmitSighting: AppDataContextValue["resubmitSighting"] = async (sightingId, input) => {
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    const { error: updateError } = await supabase
      .from("sightings")
      .update({
        observed_date: input.date,
        place: input.location,
        note: input.memo,
        status: "pending",
        leader_note: null,
      })
      .eq("id", sightingId);
    if (updateError) return { ok: false, error: "재제출에 실패했어요. 다시 시도해 주세요." };

    await supabase.from("sighting_participants").delete().eq("sighting_id", sightingId);
    const participantIds = input.participantUserIds.filter((id) => id !== authUser.id);
    if (participantIds.length > 0) {
      const { error } = await supabase
        .from("sighting_participants")
        .insert(participantIds.map((user_id) => ({ sighting_id: sightingId, user_id })));
      if (error) return { ok: false, error: "함께한 멤버 저장에 실패했어요. 다시 시도해 주세요." };
    }

    await supabase.from("sighting_species").delete().eq("sighting_id", sightingId);
    if (input.speciesIds.length > 0) {
      const { error } = await supabase
        .from("sighting_species")
        .insert(input.speciesIds.map((species_id) => ({ sighting_id: sightingId, species_id })));
      if (error) return { ok: false, error: "종 정보 저장에 실패했어요. 다시 시도해 주세요." };
    }

    let mediaFailed = false;
    for (let i = 0; i < input.media.length; i++) {
      const item = input.media[i];
      if (!item.blob) continue; // 기존에 올라간 media는 blob이 없다 — 재업로드하지 않는다.
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
      ? { ok: false, error: "재제출됐지만 일부 미디어 업로드에 실패했어요." }
      : { ok: true };
  };

  // sighting 삭제. storage object는 DB cascade로 지워지지 않으므로 row 삭제 전에 path를 확보해 별도로 지운다.
  // storage 삭제 실패는 DB 삭제를 롤백하지 않는다(완전한 transaction이 아님) — server log만 남긴다.
  const deleteSighting: AppDataContextValue["deleteSighting"] = async (sightingId) => {
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    const { data: mediaRows } = await supabase
      .from("sighting_media")
      .select("storage_path")
      .eq("sighting_id", sightingId);

    const { error } = await supabase.from("sightings").delete().eq("id", sightingId);
    if (error) return { ok: false, error: "삭제에 실패했어요. 다시 시도해 주세요." };

    const paths = (mediaRows ?? []).map((r) => r.storage_path);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from("sighting-media").remove(paths);
      // ponytail: storage cleanup 실패는 orphan 파일로 남고 재시도 로직 없음 — 운영 중 발견 시 수동 정리.
      if (storageError) console.error(`[deleteSighting] storage cleanup failed for ${sightingId}`, storageError);
    }

    setSightings((prev) => prev.filter((s) => s.id !== sightingId));
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
    const validation = validateNickname(nickname);
    if (!validation.ok) return { ok: false, error: validation.error };
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    // .select().single()로 실제 변경된 row를 돌려받아야만 성공 처리한다 — RLS/trigger가 조용히 0 rows를
    // 반환하는 경우(에러 없이 매칭 row가 없는 UPDATE) 저장 성공으로 오판하지 않기 위함.
    const { data, error } = await supabase
      .from("profiles")
      .update({ nickname: validation.value })
      .eq("user_id", authUser.id)
      .select("nickname")
      .single();
    if (error || !data) return { ok: false, error: error?.message || "닉네임 변경에 실패했어요. 다시 시도해 주세요." };

    setUsers((prev) => prev.map((u) => (u.id === authUser.id ? { ...u, nickname: data.nickname ?? "" } : u)));
    return { ok: true };
  };

  const updateLoginId: AppDataContextValue["updateLoginId"] = async (loginId) => {
    const validation = validateLoginId(loginId);
    if (!validation.ok) return { ok: false, error: validation.error };
    if (!authUser) return { ok: false, error: "로그인이 필요합니다." };

    const { data, error } = await supabase
      .from("profiles")
      .update({ login_id: validation.value })
      .eq("user_id", authUser.id)
      .select("login_id")
      .single();
    if (error || !data) return { ok: false, error: error?.message || "아이디 변경에 실패했어요." };

    setUsers((prev) => prev.map((u) => (u.id === authUser.id ? { ...u, loginId: data.login_id ?? "" } : u)));
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

  const resetUserPassword: AppDataContextValue["resetUserPassword"] = async (userId, temporaryPassword, resetRequestId) => {
    const res = await fetch(`/api/manage/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temporaryPassword, resetRequestId }),
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
    rejectSighting,
    resubmitSighting,
    deleteSighting,
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
