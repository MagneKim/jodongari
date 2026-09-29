"use client";

import { useRef, useState } from "react";
import { Calendar } from "./Calendar";
import { CalendarPopover } from "./CalendarPopover";
import { toLocalISODate } from "@/components/QuickDateField";
import { formatShortKoreanDate } from "@/lib/period";

export function DateRangePicker({
  start,
  end,
  onChange,
  triggerLabel,
  active,
}: {
  start?: string;
  end?: string;
  onChange: (start: string, end: string) => void;
  triggerLabel: string;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<string | null>(start ?? null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(end ?? null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const today = toLocalISODate(new Date());

  const openPicker = () => {
    setPendingStart(start ?? null);
    setPendingEnd(end ?? null);
    setOpen(true);
  };

  const handleSelect = (iso: string) => {
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(iso);
      setPendingEnd(null);
      return;
    }
    const nextStart = iso < pendingStart ? iso : pendingStart;
    const nextEnd = iso < pendingStart ? pendingStart : iso;
    setPendingStart(nextStart);
    setPendingEnd(nextEnd);
    onChange(nextStart, nextEnd);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
          active ? "bg-surface text-accent shadow-soft" : "text-muted"
        }`}
      >
        {triggerLabel}
      </button>

      {open && (
        <CalendarPopover title="기간 선택" onClose={() => setOpen(false)} triggerRef={triggerRef}>
          <Calendar
            mode="range"
            rangeStart={pendingStart}
            rangeEnd={pendingEnd}
            maxDate={today}
            initialMonth={pendingStart ?? today}
            onSelect={handleSelect}
          />
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
            <span className="text-xs text-muted">
              {pendingStart
                ? `${formatShortKoreanDate(pendingStart)}${pendingEnd ? ` ~ ${formatShortKoreanDate(pendingEnd)}` : ""}`
                : "시작일을 선택하세요"}
            </span>
            <div className="flex gap-1">
              {(
                [
                  [7, "7일"],
                  [30, "30일"],
                ] as const
              ).map(([days, label]) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - (days - 1));
                    onChange(toLocalISODate(d), today);
                    setOpen(false);
                  }}
                  className="rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover"
                >
                  최근 {label}
                </button>
              ))}
            </div>
          </div>
        </CalendarPopover>
      )}
    </div>
  );
}
