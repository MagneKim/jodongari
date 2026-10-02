import type { SightingStatus, UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  member: "멤버",
  leader: "회장",
  admin: "관리자",
};

export const STATUS_LABELS: Record<SightingStatus, string> = {
  draft: "임시저장",
  pending: "검토 중",
  approved: "승인",
  revision: "수정 필요",
};

export const STATUS_BADGE_CLASSES: Record<SightingStatus, string> = {
  draft: "bg-surface-secondary text-muted",
  pending: "bg-surface-secondary text-muted",
  approved: "bg-emerald-50 text-emerald-700",
  revision: "bg-amber-50 text-amber-700",
};
