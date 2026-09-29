"use client";

import { useAppData } from "@/lib/app-data-context";
import { calculateUserExp, countApprovedSightings, getLevel } from "@/lib/exp";
import { buildEncyclopedia } from "@/lib/encyclopedia";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABELS } from "@/lib/status";

export default function MembersPage() {
  const { currentUser, users, sightings, birds } = useAppData();

  const rows = users
    .map((user) => {
      const exp = calculateUserExp(user.id, sightings);
      const { level, currentExp, expToNextLevel } = getLevel(exp);
      const observedSpeciesCount = buildEncyclopedia(user.id, sightings, birds).filter(
        (e) => e.unlocked
      ).length;
      const sightingCount = countApprovedSightings(user.id, sightings);
      return { user, exp, level, currentExp, expToNextLevel, observedSpeciesCount, sightingCount };
    })
    .sort((a, b) => b.exp - a.exp);

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6">
      <PageHeader eyebrow="동호회" title="멤버" subtitle="회원들의 탐조 활동을 한눈에 확인해요" />

      <ul className="flex flex-col divide-y divide-separator">
        {rows.map(({ user, level, currentExp, expToNextLevel, observedSpeciesCount, sightingCount }) => {
          const isMe = user.id === currentUser.id;
          return (
            <li key={user.id} className={`py-5 ${isMe ? "bg-accent-soft/40 -mx-4 px-4 rounded-2xl sm:-mx-6 sm:px-6" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-[17px] font-semibold">{user.nickname}</p>
                  <span className="text-[13px] font-semibold text-accent">Lv.{level}</span>
                  {isMe && <span className="text-xs font-medium text-accent">· 나</span>}
                </div>
                <span className="shrink-0 text-[11px] text-label-tertiary">{ROLE_LABELS[user.role]}</span>
              </div>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(currentExp / expToNextLevel) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {currentExp} / {expToNextLevel} EXP
                </span>
              </div>

              <p className="mt-2 text-[13px] text-muted">
                {observedSpeciesCount}종 발견 · 탐조 {sightingCount}회
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
