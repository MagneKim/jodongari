"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import { isContributor } from "@/lib/types";
import { filterByScope, type SightingScope } from "@/lib/sighting-access";
import { formatParticipants } from "@/lib/participants";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/status";
import { DateRangePicker } from "@/components/date/DateRangePicker";
import {
  isWithinRange,
  rangeForPreset,
  formatShortKoreanDate,
  type PeriodPreset,
} from "@/lib/period";

const PRESETS: [PeriodPreset, string][] = [
  ["all", "전체"],
  ["7d", "7일"],
  ["30d", "30일"],
];

const SCOPES: [SightingScope, string][] = [
  ["mine", "내 기록"],
  ["all", "전체 기록"],
];

export default function SightingsPage() {
  const { currentUser, users, sightings, birds } = useAppData();
  const [deleted] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("deleted") === "1"
  );
  const [scope, setScope] = useState<SightingScope>("mine");
  const [preset, setPreset] = useState<PeriodPreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range =
    preset === "custom" ? { start: customStart || undefined, end: customEnd || undefined } : rangeForPreset(preset);

  const myTotalCount = sightings.filter((s) => isContributor(s, currentUser.id)).length;

  const scoped = filterByScope(sightings, scope, currentUser.id);
  const list = scoped
    .filter((s) => isWithinRange(s.date, range))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const authorName = (id: string) => users.find((u) => u.id === id)?.nickname ?? id;
  const speciesName = (id: string) => birds.find((b) => b.id === id)?.koreanName ?? id;

  const periodLabel =
    preset === "custom" && customStart && customEnd
      ? `${formatShortKoreanDate(customStart)} – ${formatShortKoreanDate(customEnd)}`
      : null;

  const hasDateFilter = preset !== "all";
  const emptyMessage = hasDateFilter
    ? "이 기간의 탐조 기록이 없어요."
    : scope === "mine"
      ? "아직 탐조 기록이 없어요.\n첫 기록을 남겨보세요."
      : "아직 등록된 탐조 기록이 없어요.";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 lg:max-w-[900px]">
      {deleted && (
        <p className="rounded-xl bg-surface-secondary px-4 py-3 text-sm text-muted">
          탐조 기록이 삭제되었습니다.
        </p>
      )}

      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.03em] sm:text-[40px]">탐조</h1>
          <p className="mt-1.5 text-[15px] text-muted">내가 참여한 탐조 {myTotalCount}건</p>
        </div>
        <Link
          href="/record"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-soft"
        >
          <span aria-hidden="true">+</span> 기록하기
        </Link>
      </header>

      <div className="inline-flex w-fit gap-1 rounded-[10px] bg-surface-secondary p-[3px]">
        {SCOPES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setScope(key)}
            className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
              scope === key ? "bg-surface text-accent shadow-soft" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit flex-wrap gap-1 rounded-[10px] bg-surface-secondary p-[3px]">
          {PRESETS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                preset === key ? "bg-surface text-accent shadow-soft" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
          <DateRangePicker
            triggerLabel={periodLabel ?? "기간"}
            active={preset === "custom"}
            start={customStart || undefined}
            end={customEnd || undefined}
            onChange={(start, end) => {
              setCustomStart(start);
              setCustomEnd(end);
              setPreset("custom");
            }}
          />
        </div>

        <p className="px-1 text-sm text-muted">{list.length}개의 기록</p>
      </div>

      {list.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          <p className="whitespace-pre-line">{emptyMessage}</p>
          {scope === "mine" && !hasDateFilter && (
            <Link
              href="/record"
              className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-white"
            >
              기록하기
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {list.map((s) => {
          const companions = s.participantUserIds.map(authorName);
          return (
            <Link
              key={s.id}
              href={`/sightings/${s.id}`}
              className="flex flex-col gap-2 rounded-[16px] border border-border bg-surface p-4 transition-colors hover:bg-surface-hover sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold">{authorName(s.authorId)}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE_CLASSES[s.status]}`}>
                  {STATUS_LABELS[s.status]}
                </span>
              </div>
              <p className="text-sm text-muted">
                {formatShortKoreanDate(s.date)} · {s.location}
              </p>
              {s.memo && <p className="line-clamp-2 text-sm text-foreground/80">{s.memo}</p>}
              {formatParticipants(companions) && (
                <p className="text-xs text-muted">{formatParticipants(companions)}</p>
              )}
              {s.speciesIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.speciesIds.map((id) => (
                    <span key={id} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                      {speciesName(id)}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted">
                <span>
                  {s.likedBy.includes(currentUser.id) ? "♥" : "♡"} {s.likedBy.length}
                </span>
                <span>댓글 {s.comments.length}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
