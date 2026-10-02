export type UserRole = "member" | "leader" | "admin";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  loginId: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
}

export interface BirdSpecies {
  id: string;
  koreanName: string;
  scientificName: string;
  englishName?: string;
  orderName?: string;
  familyName?: string;
}

export type SightingStatus = "draft" | "pending" | "approved" | "revision";

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO
}

export type MediaType = "image" | "video" | "audio";

export interface SightingMedia {
  id: string;
  type: MediaType;
  name: string;
  mimeType: string;
  size: number;
  // 서버에 저장된 뒤에는 Storage signed URL, 로컬에서 막 선택한 직후에는 미리보기용 data/object URL.
  url: string;
  // 제출 전 로컬 상태에서만 존재 — Storage 업로드할 실제 바이트. 서버에서 읽어온 항목에는 없다.
  blob?: Blob;
}

export interface Sighting {
  id: string;
  authorId: string;
  participantUserIds: string[]; // 함께 탐조한 멤버 (작성자 제외)
  date: string; // YYYY-MM-DD
  location: string;
  memo: string;
  speciesIds: string[];
  media: SightingMedia[];
  status: SightingStatus;
  leaderNote?: string; // 회장이 승인 시 남기는 짧은 메모 (선택)
  createdAt: string; // ISO
  likedBy: string[]; // user ids, local-only
  comments: Comment[];
}

export interface NewSightingInput {
  authorId: string;
  participantUserIds: string[];
  date: string;
  location: string;
  memo: string;
  speciesIds: string[];
  media: SightingMedia[];
}

// authorId 또는 participantUserIds에 포함되면 해당 기록에 기여한 것으로 본다 (EXP/도감/개인 활동 반영 기준).
export function isContributor(sighting: Sighting, userId: string): boolean {
  return sighting.authorId === userId || sighting.participantUserIds.includes(userId);
}

export interface EncyclopediaEntry {
  species: BirdSpecies;
  unlocked: boolean;
  observationCount: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
}

// Repository interfaces — kept minimal, only what current UI needs.
// Swappable with a Supabase-backed implementation later.
export interface SightingRepository {
  list(): Sighting[];
  submit(input: NewSightingInput): Sighting;
  approve(sightingId: string, speciesIds: string[], leaderNote?: string): Sighting;
}

export interface BirdRepository {
  list(): BirdSpecies[];
}
