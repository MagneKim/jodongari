"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/app-data-context";
import { buildEncyclopedia } from "@/lib/encyclopedia";

type Filter = "all" | "unlocked" | "locked";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "unlocked", label: "관찰" },
  { value: "locked", label: "미관찰" },
];

export default function EncyclopediaPage() {
  const { currentUser, sightings, birds } = useAppData();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const entries = useMemo(
    () => buildEncyclopedia(currentUser.id, sightings, birds),
    [currentUser.id, sightings, birds]
  );

  const q = query.trim();
  const filtered = entries
    .filter((e) => {
      if (filter === "unlocked" && !e.unlocked) return false;
      if (filter === "locked" && e.unlocked) return false;
      if (q && !e.species.koreanName.includes(q) && !e.species.scientificName.toLowerCase().includes(q.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (filter === "all" ? Number(b.unlocked) - Number(a.unlocked) : 0));

  const unlockedCount = entries.filter((e) => e.unlocked).length;

  return (
    <div className="flex flex-col gap-6 lg:mx-auto lg:max-w-[1240px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">내 도감</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[56px] font-extrabold leading-none tracking-[-0.03em] text-accent">
            {unlockedCount}
          </span>
          <span className="text-[17px] text-muted">/ {entries.length}종 발견</span>
        </div>
        <div className="mt-3 h-1 w-full max-w-xs overflow-hidden rounded-full bg-surface-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(unlockedCount / entries.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="국명 또는 학명 검색"
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm sm:w-64"
        />
        <div className="flex w-fit gap-1 rounded-[10px] bg-surface-secondary p-[3px]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value ? "bg-surface text-foreground shadow-soft" : "text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted">{filtered.length}종 표시 중</p>

      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {filtered.map((entry) =>
          entry.unlocked ? (
            <div key={entry.species.id} className="relative flex flex-col items-center gap-1.5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-2xl shadow-soft">
                🐦
              </div>
              <span className="text-[13px] font-semibold">{entry.species.koreanName}</span>
              <span className="text-[11px] text-muted">{entry.observationCount}회 관찰</span>
            </div>
          ) : (
            <div key={entry.species.id} className="flex flex-col items-center gap-1 text-center opacity-40">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-base grayscale">
                🐦
              </div>
              <span className="text-[11px] text-muted">{entry.species.koreanName}</span>
            </div>
          )
        )}
      </div>

      <p className="pt-2 text-center text-xs text-muted">
        조류 목록 출처: 국립생물자원관 국가생물종목록
      </p>
    </div>
  );
}
