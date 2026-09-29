"use client";

import { useState } from "react";
import { toLocalISODate } from "@/components/QuickDateField";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export interface CalendarProps {
  mode: "single" | "range";
  selected?: string | null;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  onSelect: (iso: string) => void;
  maxDate?: string;
  initialMonth?: string;
}

export function Calendar({
  mode,
  selected,
  rangeStart,
  rangeEnd,
  onSelect,
  maxDate,
  initialMonth,
}: CalendarProps) {
  const anchor = initialMonth || selected || rangeStart || undefined;
  const [month, setMonth] = useState(() =>
    startOfMonth(anchor ? new Date(`${anchor}T00:00:00`) : new Date())
  );

  const today = toLocalISODate(new Date());
  const days = buildGrid(month);

  return (
    <div className="mx-auto w-[300px] max-w-full select-none p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover"
        >
          <ChevronIcon direction="left" />
        </button>
        <p className="text-[15px] font-semibold">
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="flex h-8 items-center justify-center text-xs font-medium text-label-tertiary">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d) => {
          const iso = toLocalISODate(d);
          const inMonth = d.getMonth() === month.getMonth();
          const disabled = Boolean(maxDate && iso > maxDate);
          const isToday = iso === today;
          const isSelected = mode === "single" && iso === selected;
          const isRangeStart = mode === "range" && Boolean(rangeStart) && iso === rangeStart;
          const isRangeEnd = mode === "range" && Boolean(rangeEnd) && iso === rangeEnd;
          const isRangeBetween =
            mode === "range" &&
            Boolean(rangeStart) &&
            Boolean(rangeEnd) &&
            iso > (rangeStart as string) &&
            iso < (rangeEnd as string);
          const isEdge = isRangeStart || isRangeEnd;

          return (
            <div key={iso} className="flex items-center justify-center py-0.5">
              <button
                type="button"
                disabled={disabled}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected || isEdge}
                onClick={() => onSelect(iso)}
                className={[
                  "relative flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors",
                  !inMonth ? "text-label-tertiary/60" : "text-foreground",
                  disabled ? "cursor-not-allowed text-label-tertiary/40" : "hover:bg-surface-hover",
                  isRangeBetween ? "bg-calendar-range" : "",
                  isEdge ? "bg-calendar-range-edge text-white hover:bg-calendar-range-edge" : "",
                  isSelected ? "bg-surface-selected text-white hover:bg-surface-selected" : "",
                  isToday && !isSelected && !isEdge ? "font-semibold text-accent" : "",
                ].join(" ")}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}
