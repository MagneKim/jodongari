// 탐조 기간 조회 계산 logic. UI(app/sightings)에서 분리해두면 Supabase 전환 시
// 이 함수들을 query 조건(where date between ...)으로 그대로 옮길 수 있다.
import { toLocalISODate } from "@/components/QuickDateField";

export type PeriodPreset = "all" | "7d" | "30d" | "custom";

export interface PeriodRange {
  start?: string; // YYYY-MM-DD, inclusive
  end?: string; // YYYY-MM-DD, inclusive
}

function daysAgoISO(days: number, today: Date): string {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return toLocalISODate(d);
}

export function rangeForPreset(preset: PeriodPreset, today: Date = new Date()): PeriodRange {
  if (preset === "7d") return { start: daysAgoISO(6, today), end: toLocalISODate(today) };
  if (preset === "30d") return { start: daysAgoISO(29, today), end: toLocalISODate(today) };
  return {};
}

export function isWithinRange(date: string, range: PeriodRange): boolean {
  if (range.start && date < range.start) return false;
  if (range.end && date > range.end) return false;
  return true;
}

export function formatKoreanDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function formatShortKoreanDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}
