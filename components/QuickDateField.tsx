"use client";

import { useState } from "react";
import { DatePicker } from "./date/DatePicker";

export function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayISO(): string {
  return toLocalISODate(new Date());
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalISODate(d);
}

const WEEKDAYS_KR = ["일", "월", "화", "수", "목", "금", "토"];

function formatDisplay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 · ${WEEKDAYS_KR[date.getDay()]}요일`;
}

type Mode = "today" | "yesterday" | "custom";

export function QuickDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const today = todayISO();
  const yesterday = yesterdayISO();
  const initialMode: Mode = value === today ? "today" : value === yesterday ? "yesterday" : "custom";
  const [customOpen, setCustomOpen] = useState(initialMode === "custom");

  const mode: Mode = customOpen ? "custom" : value === today ? "today" : value === yesterday ? "yesterday" : "custom";

  const select = (next: Mode) => {
    if (next === "today") {
      onChange(today);
      setCustomOpen(false);
    } else if (next === "yesterday") {
      onChange(yesterday);
      setCustomOpen(false);
    } else {
      setCustomOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <span className="text-[15px] text-foreground">{formatDisplay(value)}</span>
      </div>

      <div className="inline-flex w-fit gap-1 rounded-[10px] bg-surface-secondary p-[3px]">
        {(
          [
            ["today", "오늘"],
            ["yesterday", "어제"],
            ["custom", "직접 선택"],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => select(key)}
            className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
              mode === key ? "bg-surface text-accent shadow-soft" : "text-muted"
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {customOpen && <DatePicker value={value} onChange={onChange} max={today} />}
    </div>
  );
}
