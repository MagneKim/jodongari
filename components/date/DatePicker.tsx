"use client";

import { useRef, useState } from "react";
import { Calendar } from "./Calendar";
import { CalendarPopover } from "./CalendarPopover";
import { toLocalISODate } from "@/components/QuickDateField";

function formatTrigger(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "날짜 선택";
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
}

export function DatePicker({
  value,
  onChange,
  max,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-[15px] transition-colors hover:border-accent/50"
      >
        <CalendarIcon />
        <span>{formatTrigger(value)}</span>
      </button>

      {open && (
        <CalendarPopover title="날짜 선택" onClose={() => setOpen(false)} triggerRef={triggerRef}>
          <Calendar
            mode="single"
            selected={value}
            maxDate={max ?? toLocalISODate(new Date())}
            initialMonth={value}
            onSelect={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        </CalendarPopover>
      )}
    </div>
  );
}

export function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0 text-muted"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
