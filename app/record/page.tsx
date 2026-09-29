"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppData } from "@/lib/app-data-context";
import { buildSightingMedia, formatFileSize, revokeSightingMedia, MEDIA_LIMITS } from "@/lib/media";
import type { SightingMedia } from "@/lib/types";
import { QuickDateField, toLocalISODate } from "@/components/QuickDateField";
import { MediaSourcePicker } from "@/components/MediaSourcePicker";

export default function RecordPage() {
  const router = useRouter();
  const { currentUser, users, birds, submitSighting } = useAppData();
  const mediaTriggerRef = useRef<HTMLButtonElement>(null);
  const mediaRef = useRef<SightingMedia[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [date, setDate] = useState(() => toLocalISODate(new Date()));
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [speciesIds, setSpeciesIds] = useState<string[]>([]);
  const [speciesQuery, setSpeciesQuery] = useState("");
  const [participantUserIds, setParticipantUserIds] = useState<string[]>([]);
  const [media, setMedia] = useState<SightingMedia[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  // video/audio는 object URL이라 페이지를 벗어날 때(제출 없이) 명시적으로 해제해야 한다.
  useEffect(() => {
    return () => {
      mediaRef.current.forEach(revokeSightingMedia);
    };
  }, []);

  const selectedSpecies = speciesIds
    .map((id) => birds.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  const searchResults = useMemo(() => {
    const q = speciesQuery.trim().toLowerCase();
    if (!q) return [];
    return birds
      .filter(
        (b) =>
          !speciesIds.includes(b.id) &&
          (b.koreanName.includes(speciesQuery.trim()) ||
            b.scientificName.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [birds, speciesQuery, speciesIds]);

  const addSpecies = (id: string) => {
    setSpeciesIds((prev) => [...prev, id]);
    setSpeciesQuery("");
  };

  const removeSpecies = (id: string) => {
    setSpeciesIds((prev) => prev.filter((s) => s !== id));
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const inputEl = e.target;
    if (!files || files.length === 0) return;
    setMediaError(null);

    const remaining = MEDIA_LIMITS.maxCount - media.length;
    const candidates = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setMediaError(`미디어는 최대 ${MEDIA_LIMITS.maxCount}개까지 첨부할 수 있어요.`);
    }

    const built: SightingMedia[] = [];
    for (const file of candidates) {
      try {
        built.push(await buildSightingMedia(file));
      } catch (err) {
        setMediaError(err instanceof Error ? err.message : "파일을 처리할 수 없어요.");
      }
    }
    setMedia((prev) => [...prev, ...built]);
    inputEl.value = "";
  };

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) revokeSightingMedia(target);
      return prev.filter((m) => m.id !== id);
    });
  };

  const canSubmit = location.trim().length > 0 && speciesIds.length > 0;

  const toggleParticipant = (userId: string) => {
    setParticipantUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitSighting({ date, location, memo, speciesIds, media, participantUserIds });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-2xl text-accent">
          ✓
        </div>
        <p className="text-base font-medium">탐조 기록이 회장 검토를 기다리고 있어요.</p>
        <button
          onClick={() => router.push("/sightings")}
          className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white"
        >
          탐조 화면으로
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 lg:max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">탐조 기록</p>
        <h1 className="mt-1 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
          오늘 본 것을
          <br />
          남겨보세요.
        </h1>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-6">
            <QuickDateField label="언제" value={date} onChange={setDate} />

            <label className="flex flex-col gap-1.5 border-t border-border pt-6 text-sm">
              <span className="font-medium">어디서</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예) 공릉천"
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>

            <div className="flex flex-col gap-1.5 border-t border-border pt-6 text-sm">
              <span className="font-medium">어떤 새를 봤나요?</span>
              <input
                type="text"
                value={speciesQuery}
                onChange={(e) => setSpeciesQuery(e.target.value)}
                placeholder="새 이름 검색"
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
              {speciesQuery.trim().length > 0 &&
                (searchResults.length > 0 ? (
                  <ul className="overflow-hidden rounded-lg border border-border">
                    {searchResults.map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => addSpecies(b.id)}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent-soft"
                        >
                          {b.koreanName}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-1 text-xs text-foreground/50">검색 결과가 없어요.</p>
                ))}
              {selectedSpecies.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedSpecies.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => removeSpecies(b.id)}
                      className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"
                    >
                      {b.koreanName}
                      <span aria-hidden="true">✕</span>
                      <span className="sr-only">제거</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-6 text-sm">
              <span className="font-medium">함께 탐조한 멤버</span>
              <p className="text-xs text-muted">같이 관찰한 멤버를 선택하면 함께 EXP를 받아요.</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {users
                  .filter((u) => u.id !== currentUser.id)
                  .map((u) => {
                    const selected = participantUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleParticipant(u.id)}
                        aria-pressed={selected}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected ? "bg-accent text-white" : "bg-surface-secondary text-muted"
                        }`}
                      >
                        {u.nickname}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-6 text-sm">
              <span className="font-medium">사진 · 영상 · 녹음</span>
              <p className="text-xs text-muted">사진, 영상 또는 녹음 파일을 추가할 수 있어요.</p>

              <div className="relative w-fit">
                <button
                  ref={mediaTriggerRef}
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  disabled={media.length >= MEDIA_LIMITS.maxCount}
                  className="inline-flex h-11 w-fit items-center rounded-full bg-accent-soft px-4 text-xs font-medium text-accent disabled:pointer-events-none disabled:opacity-40"
                >
                  미디어 추가
                </button>
                {mediaPickerOpen && (
                  <MediaSourcePicker
                    triggerRef={mediaTriggerRef}
                    onClose={() => setMediaPickerOpen(false)}
                    onFileChange={handleMediaSelect}
                  />
                )}
              </div>
              {mediaError && <p className="text-xs text-danger">{mediaError}</p>}
              {media.length > 0 && (
                <ul className="mt-1 flex flex-col gap-2">
                  {media.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                      <MediaThumb item={m} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{m.name}</p>
                        <p className="text-[11px] text-muted">{formatFileSize(m.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(m.id)}
                        aria-label={`${m.name} 삭제`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="flex flex-col gap-1.5 border-t border-border pt-6 text-sm">
              <span className="font-medium">한마디</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="간단한 탐조 이야기를 남겨주세요"
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          {submitError && <p className="text-sm text-danger">{submitError}</p>}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="rounded-full bg-accent py-3.5 text-sm font-medium text-white shadow-elevated transition-opacity disabled:opacity-40 disabled:shadow-none"
          >
            {submitting ? "저장 중…" : "검토 요청"}
          </button>
        </div>

        <aside
          className="hidden shrink-0 flex-col gap-4 rounded-2xl bg-surface-secondary p-5 lg:sticky lg:flex lg:w-64"
          style={{ top: "calc(var(--nav-height-desktop) + 24px)" }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">작성 요약</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">날짜</dt>
              <dd className="font-medium">{new Date(`${date}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">장소</dt>
              <dd className="font-medium">{location.trim() || "-"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">선택 종</dt>
              <dd className="font-medium text-accent">{speciesIds.length}종</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">함께한 멤버</dt>
              <dd className="font-medium">{participantUserIds.length}명</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">미디어</dt>
              <dd className="font-medium">{media.length}개</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function MediaThumb({ item }: { item: SightingMedia }) {
  if (item.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />;
  }
  if (item.type === "video") {
    return <video src={item.url} muted className="h-11 w-11 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-lg">
      🎧
    </span>
  );
}
