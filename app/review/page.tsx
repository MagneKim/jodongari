"use client";

import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { formatShortKoreanDate } from "@/lib/period";

export default function ReviewPage() {
  const { currentUser, users, sightings, birds } = useAppData();

  if (currentUser.role !== "leader" && currentUser.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        회장 또는 관리자만 접근할 수 있는 화면입니다.
      </div>
    );
  }

  const pending = sightings.filter((s) => s.status === "pending").sort((a, b) => a.date.localeCompare(b.date));

  const authorName = (id: string) => users.find((u) => u.id === id)?.nickname ?? id;
  const speciesName = (id: string) => birds.find((b) => b.id === id)?.koreanName ?? id;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 lg:max-w-[900px]">
      <PageHeader eyebrow="회장 전용" title="검토" subtitle={`검토 대기 ${pending.length}건`} />

      {pending.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
          검토 대기 중인 기록이 없습니다.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {pending.map((s) => {
          const speciesSummary =
            s.speciesIds.length === 0
              ? "선택된 종 없음"
              : s.speciesIds.length === 1
                ? speciesName(s.speciesIds[0])
                : `${speciesName(s.speciesIds[0])} 외 ${s.speciesIds.length - 1}종`;
          const companions = s.participantUserIds.map(authorName);

          return (
            <Link
              key={s.id}
              href={`/review/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-[16px] border border-border bg-surface p-4 transition-colors hover:bg-surface-hover sm:p-5"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{authorName(s.authorId)}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {formatShortKoreanDate(s.date)} · {s.location}
                </p>
                <p className="mt-1 text-sm font-medium text-accent">{speciesSummary}</p>
                {companions.length > 0 && (
                  <p className="mt-1 text-xs text-muted">함께한 멤버: {companions.join(", ")}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
                검토 대기
                <span aria-hidden="true">›</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
