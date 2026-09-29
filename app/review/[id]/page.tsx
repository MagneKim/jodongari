"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppData } from "@/lib/app-data-context";
import { MediaViewer } from "@/components/MediaViewer";
import { formatShortKoreanDate } from "@/lib/period";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, users, sightings, birds, approveSighting } = useAppData();

  const sighting = sightings.find((s) => s.id === id && s.status === "pending");

  const [speciesIds, setSpeciesIds] = useState<string[]>(sighting?.speciesIds ?? []);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return birds
      .filter(
        (b) =>
          !speciesIds.includes(b.id) &&
          (b.koreanName.includes(query.trim()) || b.scientificName.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [birds, query, speciesIds]);

  if (currentUser.role !== "leader" && currentUser.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        회장 또는 관리자만 접근할 수 있는 화면입니다.
      </div>
    );
  }

  if (!sighting) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">검토할 기록을 찾을 수 없어요.</p>
        <Link href="/review" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white">
          검토로 돌아가기
        </Link>
      </div>
    );
  }

  const authorName = (uid: string) => users.find((u) => u.id === uid)?.nickname ?? uid;
  const speciesName = (sid: string) => birds.find((b) => b.id === sid)?.koreanName ?? sid;

  const addSpecies = (bid: string) => {
    setSpeciesIds((prev) => [...prev, bid]);
    setQuery("");
  };
  const removeSpecies = (bid: string) => setSpeciesIds((prev) => prev.filter((s) => s !== bid));

  const handleApprove = async () => {
    if (approving) return;
    setApproving(true);
    setApproveError(null);
    const result = await approveSighting(sighting.id, speciesIds, note);
    setApproving(false);
    if (!result.ok) {
      setApproveError(result.error);
      return;
    }
    router.push("/review");
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link href="/review" className="flex w-fit items-center gap-1 text-sm font-medium text-muted">
        <span aria-hidden="true">←</span> 검토
      </Link>

      <header>
        <p className="text-sm text-muted">
          {formatShortKoreanDate(sighting.date)} · {sighting.location}
        </p>
        <h1 className="mt-1 text-[24px] font-bold tracking-[-0.02em]">{authorName(sighting.authorId)}</h1>
      </header>

      {sighting.participantUserIds.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted">함께한 멤버</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {sighting.participantUserIds.map((uid) => (
              <span key={uid} className="rounded-full bg-surface-secondary px-3 py-1 text-sm">
                {authorName(uid)}
              </span>
            ))}
          </div>
        </section>
      )}

      {sighting.memo && (
        <section>
          <h2 className="text-sm font-semibold text-muted">한마디</h2>
          <p className="mt-2 text-[15px] leading-relaxed">{sighting.memo}</p>
        </section>
      )}

      <MediaViewer media={sighting.media} altPrefix={sighting.location} />

      <section className="border-t border-separator pt-5">
        <h2 className="text-sm font-semibold text-muted">작성자가 기록한 종</h2>
        <div className="mt-2 flex flex-wrap gap-1">
          {sighting.speciesIds.length === 0 && <span className="text-xs text-muted">없음</span>}
          {sighting.speciesIds.map((sid) => (
            <span key={sid} className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-muted">
              {speciesName(sid)}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t border-separator pt-5">
        <h2 className="text-sm font-semibold text-muted">최종 종 편집</h2>
        <div className="mt-2 flex flex-wrap gap-1">
          {speciesIds.length === 0 && <span className="text-xs text-muted">선택된 종이 없습니다.</span>}
          {speciesIds.map((sid) => (
            <button
              key={sid}
              type="button"
              onClick={() => removeSpecies(sid)}
              className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
            >
              {speciesName(sid)}
              <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="종 추가 검색"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {query.trim().length > 0 && (
          <ul className="mt-1 overflow-hidden rounded-lg border border-border">
            {searchResults.length === 0 && <li className="px-3 py-2 text-xs text-muted">검색 결과가 없어요.</li>}
            {searchResults.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => addSpecies(b.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent-soft"
                >
                  {b.koreanName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-separator pt-5">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="회장 메모 (선택)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {approveError && <p className="mt-2 text-sm text-danger">{approveError}</p>}
        <button
          onClick={handleApprove}
          disabled={speciesIds.length === 0 || approving}
          className="mt-3 w-full rounded-full bg-accent py-3 text-sm font-medium text-white shadow-elevated disabled:opacity-40 disabled:shadow-none"
        >
          {approving ? "승인 중…" : "승인하기"}
        </button>
      </section>
    </div>
  );
}
